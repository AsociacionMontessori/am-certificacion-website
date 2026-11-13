const test = require("node:test");
const assert = require("node:assert/strict");
const {createCheckout, quote, approvalUrl} = require("../paypal/checkout");
const {sandboxConfig} = require("../paypal/functions");
const {hashAccessToken} = require("../stripe/accessToken");
const body = {requestId: "12345678-1234-4234-8234-123456789abc", accessToken: "a".repeat(43), sku: "ebook_ammac_1"};
function database() {
  const records = new Map();
  let queue = Promise.resolve();
  function doc(path) {
    return {path, id: path.split("/").pop(),
      get: async () => ({exists: records.has(path), data: () => structuredClone(records.get(path))})};
  }
  return {records, collection(name) {
    return {doc: id => doc(`${name}/${id}`), where: (field, op, val) => ({limit: () => ({get: async () => {
      const matches = [...records].filter(([k, v]) => k.startsWith(name + "/") && v[field] === val);
      return {empty: !matches.length, docs: matches.map(([k]) => ({ref: doc(k)}))};
    }})})};
  }, runTransaction(fn) {
    const promise = queue.then(async () => {
      const writes = [];
      const result = await fn({get: ref => ref.get(), set: (ref, value) => writes.push([ref.path, structuredClone(value)])});
      writes.forEach(([key, value]) => records.set(key, value)); return result;
    });
    queue = promise.catch(() => {}); return promise;
  }};
}
function fixture() {
  const db = database(); let clock = 1000; let attempts = 0; let creates = 0; let failCapture = false; let verified = true;
  const remote = {id: "PPORDER1", status: "CREATED", purchase_units: [{custom_id: body.requestId,
    payee: {merchant_id: "MERCHANT"}, amount: {value: "213.00", currency_code: "MXN"}}],
    links: [{rel: "payer-action", href: "https://www.sandbox.paypal.com/checkoutnow?token=PPORDER1"}]};
  const complete = () => {
    remote.status = "COMPLETED";
    remote.purchase_units[0].payments = {captures: [{id: "CAPTURE1", status: "COMPLETED", amount: {currency_code: "MXN", value: "213.00"}}]};
  };
  const client = {createOrder: async () => {creates++; return structuredClone(remote);},
    getOrder: async () => structuredClone(remote), verifyWebhook: async () => verified,
    captureOrder: async () => {attempts++; complete(); if (failCapture) throw new Error("timeout after remote success");}};
  const checkout = createCheckout({db, client, merchantId: "MERCHANT", returnUrl: "http://127.0.0.1:9000/checkout/paypal-sandbox/", now: () => clock});
  return {db, remote, checkout, complete, get attempts() {return attempts;}, get creates() {return creates;},
    failCapture() {failCapture = true;}, badSignature() {verified = false;}, tick(ms) {clock += ms;},
    saved() {return db.records.get(`paypalSandboxOrders/${body.requestId}`);},
    event(type, id = "WH-1") {return {id, event_type: type, resource: {id: "CAPTURE1",
      supplementary_data: {related_ids: {order_id: "PPORDER1", capture_id: "CAPTURE1"}}}};}};
}
test("catálogo de servidor; rechaza manipulación, envío, cupones y mensualidades", () => {
  assert.equal(quote(body).amountCentavos, 21300);
  assert.equal(quote({programa: "Diplomado en Neuroeducación"}).amountCentavos, 450000);
  for (const change of [{amountCentavos: 1}, {currency: "USD"}, {quantity: 0}, {quantity: 1.2}, {quantity: 11},
    {codigo: "FREE"}, {sku: "libro_ammac_1"}, {sku: "colegiatura_casa"}, {sku: "__proto__"}, {items: []}]) {
    assert.throws(() => quote({...body, ...change}));
  }
});
test("enlace de aprobación sólo Sandbox con token coincidente", () => {
  for (const href of ["https://www.paypal.com/checkoutnow?token=P", "https://www.sandbox.paypal.com.evil.com/checkoutnow?token=P",
    "https://user@www.sandbox.paypal.com/checkoutnow?token=P", "https://www.sandbox.paypal.com/checkoutnow?token=OTHER"]) {
    assert.throws(() => approvalUrl({id: "P", links: [{rel: "approve", href}]}));
  }
});
test("creación reintentable persiste hash y claves; no escribe órdenes ni entrega real", async () => {
  const f = fixture();
  await f.checkout.create(body); await f.checkout.create(body);
  assert.equal(f.creates, 1);
  assert.equal(f.saved().accessTokenHash, hashAccessToken(body.accessToken));
  assert.equal(f.saved().captureRequestId, `capture-${body.requestId}`);
  assert.ok([...f.db.records.keys()].every(k => k.startsWith("paypalSandbox")));
  await assert.rejects(f.checkout.status({...body, accessToken: "b".repeat(43)}), {status: 403});
  await assert.rejects(f.checkout.create({...body, quantity: 2}), {status: 409});
  f.tick(86400001);
  await assert.rejects(f.checkout.status(body), {status: 403});
});
test("APPROVED no entrega hasta captura validada; doble clic sólo captura una vez", async () => {
  const f = fixture(); await f.checkout.create(body);
  assert.equal((await f.checkout.capture(body)).pagado, false);
  f.remote.status = "APPROVED";
  const results = await Promise.all([f.checkout.capture(body), f.checkout.capture(body)]);
  assert.equal(f.attempts, 1);
  assert.ok(results.some(r => r.pagado));
  assert.equal(f.saved().entregaSimulada, true);
});
test("respuesta perdida se reconcilia mediante GET sin segunda captura", async () => {
  const f = fixture(); await f.checkout.create(body); f.remote.status = "APPROVED"; f.failCapture();
  await assert.rejects(f.checkout.capture(body), /timeout/);
  assert.equal((await f.checkout.capture(body)).pagado, true);
  assert.equal(f.attempts, 1);
});
test("captura incierta aún APPROVED nunca se repite; requiere revisión", async () => {
  const f = fixture(); await f.checkout.create(body);
  f.saved().captureAttempted = true; f.remote.status = "APPROVED";
  assert.equal((await f.checkout.capture(body)).pagado, false); assert.equal(f.attempts, 0);
});
test("receptor o importe distintos bloquean antes de capturar", async () => {
  for (const change of [unit => {unit.payee.merchant_id = "OTHER";}, unit => {unit.amount.value = "1.00";}]) {
    const f = fixture(); await f.checkout.create(body); f.remote.status = "APPROVED";
    change(f.remote.purchase_units[0]);
    await assert.rejects(f.checkout.capture(body), {status: 502}); assert.equal(f.attempts, 0);
  }
});
test("webhook firma obligatoria, consulta remota y duplicados idempotentes", async () => {
  const f = fixture(); await f.checkout.create(body); f.complete();
  const event = f.event("PAYMENT.CAPTURE.COMPLETED");
  await Promise.all([f.checkout.webhook(event, {}, "WH"), f.checkout.webhook(event, {}, "WH")]);
  assert.equal(f.saved().estado, "pagado");
  assert.equal([...f.db.records.keys()].filter(k => k.startsWith("paypalSandboxEvents/")).length, 1);
  const g = fixture(); await g.checkout.create(body); g.badSignature();
  await assert.rejects(g.checkout.webhook(event, {}, "WH"), {status: 400});
  assert.equal(g.saved().estado, "pendiente");
});
test("PENDING y APPROVED nunca se consideran pago confirmado", async () => {
  const f = fixture(); await f.checkout.create(body); f.complete();
  f.remote.purchase_units[0].payments.captures[0].status = "PENDING";
  assert.equal((await f.checkout.webhook(f.event("PAYMENT.CAPTURE.PENDING"), {}, "WH")).pagado, false);
  assert.deepEqual(await f.checkout.webhook({id: "APPROVED-1", event_type: "CHECKOUT.ORDER.APPROVED"}, {}, "WH"), {ignored: true});
});
test("reembolso parcial/reversión bloquean entrega simulada; evento completed tardío no revive", async () => {
  for (const type of ["PAYMENT.CAPTURE.REFUNDED", "PAYMENT.CAPTURE.REVERSED", "PAYMENT.CAPTURE.DENIED"]) {
    const f = fixture(); await f.checkout.create(body); f.complete();
    await f.checkout.webhook(f.event("PAYMENT.CAPTURE.COMPLETED"), {}, "WH");
    await f.checkout.webhook(f.event(type, "WH-2"), {}, "WH");
    await f.checkout.webhook(f.event("PAYMENT.CAPTURE.COMPLETED", "WH-3"), {}, "WH");
    assert.notEqual(f.saved().estado, "pagado"); assert.equal(f.saved().entregaSimulada, false);
  }
});
test("refund sin order_id se resuelve por captura vinculada", async () => {
  const f = fixture(); await f.checkout.create(body); f.complete();
  await f.checkout.webhook(f.event("PAYMENT.CAPTURE.COMPLETED"), {}, "WH");
  const event = f.event("PAYMENT.CAPTURE.REFUNDED", "WH-2");
  delete event.resource.supplementary_data.related_ids.order_id;
  await f.checkout.webhook(event, {}, "WH"); assert.equal(f.saved().estado, "revision");
});
test("snapshot reembolsado bloquea aun sin webhook; captura inválida no acredita", async () => {
  const f = fixture(); await f.checkout.create(body); f.complete();
  f.remote.purchase_units[0].payments.captures[0].status = "REFUNDED";
  assert.equal((await f.checkout.capture(body)).estado, "revision");
  const g = fixture(); await g.checkout.create(body); g.complete();
  g.remote.purchase_units[0].payments.captures[0].amount.currency_code = "USD";
  await assert.rejects(g.checkout.capture(body)); assert.notEqual(g.saved().estado, "pagado");
});
test("guard exige opt-in compartido y prohíbe retorno a producción", () => {
  const env = {PAYPAL_SANDBOX_ENDPOINTS: "true", GCLOUD_PROJECT: "test-isolated", PAYPAL_SANDBOX_PROJECT_ID: "test-isolated",
    PAYPAL_SANDBOX_MERCHANT_ID: "MERCHANT", PAYPAL_SANDBOX_WEBHOOK_ID: "WH", PAYPAL_SANDBOX_RETURN_URL: "http://127.0.0.1:9000/checkout/paypal-sandbox/"};
  assert.equal(sandboxConfig(env).origin, "http://127.0.0.1:9000");
  const shared = {...env, GCLOUD_PROJECT: "certificacionmontessori", PAYPAL_SANDBOX_PROJECT_ID: "certificacionmontessori"};
  assert.throws(() => sandboxConfig(shared));
  assert.throws(() => sandboxConfig({...shared, PAYPAL_SANDBOX_SHARED_PROJECT: "true"}));
  assert.equal(sandboxConfig({...shared, PAYPAL_SANDBOX_SHARED_PROJECT: "certificacionmontessori"}).origin,
    "http://127.0.0.1:9000");
  for (const host of ["certificacionmontessori.web.app", "certificacionmontessori.firebaseapp.com",
    "alumnos-certificacionmontessori.web.app", "alumnos-certificacionmontessori.firebaseapp.com"]) {
    assert.throws(() => sandboxConfig({...env, PAYPAL_SANDBOX_RETURN_URL: `https://${host}/checkout/paypal-sandbox/`}));
  }
  for (const change of [{PAYPAL_SANDBOX_ENDPOINTS: "false"}, {GCLOUD_PROJECT: "certificacionmontessori"},
    {PAYPAL_SANDBOX_MERCHANT_ID: ""}, {PAYPAL_SANDBOX_WEBHOOK_ID: ""},
    {PAYPAL_SANDBOX_RETURN_URL: "https://certificacionmontessori.com/checkout/paypal-sandbox/"}]) {
    assert.throws(() => sandboxConfig({...env, ...change}));
  }
});

test("adaptador verifica firma con PayPal, sin descargar cert_url localmente; GET sin cuerpo", async () => {
  const {createSandboxClient} = require("../paypal/sandbox");
  const calls = [];
  const client = createSandboxClient({clientId: "dummy", clientSecret: "dummy", merchantId: "MERCHANT",
    fetchImpl: async (url, options) => {
      calls.push({url, options});
      return {ok: true, json: async () => url.endsWith("/token") ? {access_token: "fake"} :
        url.endsWith("verify-webhook-signature") ? {verification_status: "SUCCESS"} : {id: "PPORDER1"}};
    }});
  const headers = {"paypal-auth-algo": "SHA256withRSA", "paypal-cert-url": "https://api.sandbox.paypal.com/cert",
    "paypal-transmission-id": "id", "paypal-transmission-sig": "sig", "paypal-transmission-time": "time"};
  assert.equal(await client.verifyWebhook({id: "WH-1"}, headers, "CONFIGURED-WH"), true);
  const request = JSON.parse(calls[1].options.body);
  assert.equal(request.webhook_id, "CONFIGURED-WH");
  assert.equal(request.transmission_sig, "sig");
  assert.deepEqual(request.webhook_event, {id: "WH-1"});
  assert.ok(calls.every(c => c.url.startsWith("https://api-m.sandbox.paypal.com/")));
  assert.equal(await client.verifyWebhook({id: "WH-1"}, {}, "CONFIGURED-WH"), false);
  assert.equal(calls.length, 2);
  await client.getOrder("PPORDER1");
  assert.equal(calls.at(-1).options.method, "GET");
  assert.equal(calls.at(-1).options.body, undefined);
});
