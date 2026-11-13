const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const {isSessionPaid, updateUnpaidSession, oxxoCheckoutOptions} = require("../stripe/checkoutPaymentState");
const {createSandboxClient, validateCapture} = require("../paypal/sandbox");

function fakeDb(initial = {}) {
  const records = new Map(Object.entries(initial));
  let queue = Promise.resolve();
  function ref(path) {
    return {id: path.split("/").pop(), path,
      async get() {return {exists: records.has(path), data: () => records.get(path)};},
      async set(data) {records.set(path, data);},
      async update(data) {if (!records.has(path)) throw new Error("missing"); records.set(path, {...records.get(path), ...data});},
      async delete() {records.delete(path);},
    };
  }
  return {records, collection: (name) => ({doc: (id) => ref(`${name}/${id}`)}),
    runTransaction(callback) {
      const run = queue.then(async () => {
        const writes = [];
        const result = await callback({get: (r) => r.get(),
          set: (r, data) => writes.push(() => r.set(data)),
          update: (r, data) => writes.push(() => r.update(data)),
        });
        for (const write of writes) await write();
        return result;
      });
      queue = run.catch(() => {});
      return run;
    },
  };
}

const session = {id: "cs_test", amount_total: 10000, currency: "mxn", mode: "payment",
  payment_status: "unpaid", metadata: {ordenId: "order"}};

test("completed sin pago no entrega; tarjeta y cupón gratis sí", () => {
  assert.equal(isSessionPaid(session), false);
  assert.equal(isSessionPaid({...session, payment_status: "paid"}), true);
  assert.equal(isSessionPaid({...session, amount_total: 0, payment_status: "no_payment_required"}), true);
  assert.equal(isSessionPaid({...session, payment_status: "paid", amount_total: null}), false);
  assert.equal(isSessionPaid({...session, payment_status: "paid", amount_total: -1}), false);
});

test("estado tardío no degrada pagado ni revive referencia vencida; ignora otra sesión", async () => {
  for (const estado of ["pagado", "expirado", "fallido"]) {
    const db = fakeDb({"ordenes/order": {estado, stripeCheckoutSessionId: session.id}});
    await updateUnpaidSession(db, session, "pendiente_pago");
    assert.equal(db.records.get("ordenes/order").estado, estado);
  }
  const db = fakeDb({"ordenes/order": {estado: "pendiente", stripeCheckoutSessionId: "new_session"}});
  await updateUnpaidSession(db, session, "fallido");
  assert.equal(db.records.get("ordenes/order").estado, "pendiente");
});

test("OXXO de alumno mantiene Pendiente y almacena estado Stripe por separado", async () => {
  const db = fakeDb({"pagos/pago": {estado: "Pendiente", stripeCheckoutSessionId: session.id}});
  await updateUnpaidSession(db, {...session, metadata: {pagoId: "pago"}}, "fallido");
  assert.equal(db.records.get("pagos/pago").estado, "Pendiente");
  assert.equal(db.records.get("pagos/pago").stripeEstadoPago, "fallido");
});

test("opciones OXXO opt-in sin sustituir métodos dinámicos", () => {
  assert.deepEqual(oxxoCheckoutOptions({}), {});
  assert.equal(oxxoCheckoutOptions({STRIPE_OXXO_PREPARED: "true"}).payment_method_options.oxxo.expires_after_days, 2);
});

function webhookFixture() {
  const db = fakeDb({"ordenes/order": {tipo: "inscripcion", estado: "pendiente",
    cliente: {email: "test@example.invalid"}, stripeCheckoutSessionId: session.id}});
  const notices = new Set();
  let failNotification = false;
  const sandbox = {exports: {}, console: {error() {}}, Date, require(name) {
    if (name === "firebase-functions/v2/https") return {onRequest: (_, fn) => fn};
    if (name === "firebase-functions/params") return {defineSecret: () => ({value: () => "test-only"})};
    if (name === "firebase-admin") return {firestore: Object.assign(() => db,
      {FieldValue: {serverTimestamp: () => "now"}})};
    if (name === "stripe") return class {webhooks = {constructEvent: (event) => event};};
    if (name === "./checkoutPaymentState") return {isSessionPaid, updateUnpaidSession};
    if (name === "./programasCheckout") return {isOrdenFlujoInscripcion: () => true, getProgramaCheckout: () => null};
    if (name === "./escape") return {escapeHtml: String};
    if (name === "./notifications") return {notifyAdminPago: async () => {},
      notifyAdminOrdenPagada: async (_, order) => {
        if (failNotification) {failNotification = false; throw new Error("temporary failure");}
        notices.add(order.id);
      }};
    throw new Error(name);
  }};
  vm.runInNewContext(fs.readFileSync(require.resolve("../stripe/webhook"), "utf8"), sandbox);
  return {db, notices, failNextNotice: () => {failNotification = true;},
    async send(id, type, data = session) {
      const res = {code: 200, status(code) {this.code = code; return this;},
        json(body) {this.body = body;}, send() {}};
      await sandbox.exports.stripeWebhookHandler({method: "POST", get: () => "sig",
        rawBody: {id, type, data: {object: data}}}, res);
      return res;
    }};
}

test("webhook OXXO: ficha pendiente → pago confirmado → duplicados/tardíos sin doble inscripción", async () => {
  const f = webhookFixture();
  assert.equal((await f.send("evt1", "checkout.session.completed")).code, 200);
  assert.equal(f.db.records.get("ordenes/order").estado, "pendiente_pago");
  assert.equal(f.db.records.has("inscripciones/order"), false);
  const paid = {...session, payment_status: "paid"};
  await Promise.all([
    f.send("evt2", "checkout.session.async_payment_succeeded", paid),
    f.send("evt3", "checkout.session.completed", paid),
  ]);
  assert.equal(f.db.records.get("ordenes/order").estado, "pagado");
  assert.equal([...f.db.records.keys()].filter(k => k.startsWith("inscripciones/")).length, 1);
  assert.equal(f.notices.size, 1);
  assert.equal((await f.send("evt2", "checkout.session.async_payment_succeeded", paid)).body.duplicate, true);
  await f.send("evt4", "checkout.session.async_payment_failed");
  await f.send("evt5", "checkout.session.expired");
  assert.equal(f.db.records.get("ordenes/order").estado, "pagado");
});

test("un fallo puede reintentarse sin perder el pago ni duplicar inscripción", async () => {
  const f = webhookFixture();
  f.failNextNotice();
  const paid = {...session, payment_status: "paid"};
  assert.equal((await f.send("evt1", "checkout.session.completed", paid)).code, 500);
  assert.equal(f.db.records.has("stripe_events/evt1"), false);
  assert.equal((await f.send("evt1", "checkout.session.completed", paid)).code, 200);
  assert.equal([...f.db.records.keys()].filter(k => k.startsWith("inscripciones/")).length, 1);
  assert.ok(f.db.records.get("stripe_events/evt1").processedAt);
});

const expected = {paypalOrderId: "ORDER1", ordenId: "local1", merchantId: "MERCHANT", amountCentavos: 12345};
function paypalOrder() {
  return {id: "ORDER1", status: "COMPLETED", purchase_units: [{custom_id: "local1",
    payee: {merchant_id: "MERCHANT"}, payments: {captures: [{id: "CAPTURE1", status: "COMPLETED",
      amount: {currency_code: "MXN", value: "123.45"}}]}}]};
}

test("PayPal exige captura completada, importe, moneda, orden y beneficiario", () => {
  assert.equal(validateCapture(paypalOrder(), expected).captureId, "CAPTURE1");
  for (const mutation of [
    o => {o.status = "APPROVED";},
    o => {o.purchase_units[0].payments.captures[0].status = "PENDING";},
    o => {o.purchase_units[0].payments.captures[0].amount.value = "1.00";},
    o => {o.purchase_units[0].payments.captures[0].amount.currency_code = "USD";},
    o => {o.purchase_units[0].payee.merchant_id = "OTHER";},
    o => {o.purchase_units[0].custom_id = "OTHER";},
    o => {o.id = "OTHER";},
  ]) {const o = paypalOrder(); mutation(o); assert.throws(() => validateCapture(o, expected));}
});

test("PayPal sólo sandbox y claves estables de creación/captura; no red real", async () => {
  const calls = [];
  const client = createSandboxClient({clientId: "dummy", clientSecret: "dummy", merchantId: "MERCHANT",
    fetchImpl: async (url, options) => {
      calls.push({url, options});
      return {ok: true, json: async () => url.endsWith("/token") ? {access_token: "dummy"} : paypalOrder()};
    }});
  await client.createOrder({ordenId: "local1", amountCentavos: 12345, requestId: "create-local1"});
  await client.captureOrder({...expected, requestId: "capture-local1"});
  assert.ok(calls.every(c => c.url.startsWith("https://api-m.sandbox.paypal.com/")));
  assert.equal(calls[1].options.headers["PayPal-Request-Id"], "create-local1");
  assert.equal(JSON.parse(calls[1].options.body).purchase_units[0].amount.value, "123.45");
  assert.equal(calls[3].options.headers["PayPal-Request-Id"], "capture-local1");
  await assert.rejects(client.createOrder({ordenId: "local1", amountCentavos: 12345}), /idempotente/);
});

test("status público requiere token y devuelve sólo estado, nunca PII", async () => {
  const db = fakeDb({"ordenes/order": {estado: "pendiente_pago", accessTokenHash: "hash",
    cliente: {email: "private@example.invalid"}}});
  const sandbox = {exports: {}, require(name) {
    if (name === "firebase-functions/v2/https") return {onRequest: (_, fn) => fn};
    if (name === "firebase-admin") return {firestore: () => db};
    if (name === "./cors") return {handleCors: () => false, rejectIfOriginNotAllowed: () => false};
    if (name === "./rateLimit") return {enforceRateLimit: async () => false};
    if (name === "./accessToken") return {requireAccessToken: (_, token, res) => {
      if (token === "valid") return true;
      res.status(403).json({error: "denied"}); return false;
    }};
    throw new Error(name);
  }};
  vm.runInNewContext(fs.readFileSync(require.resolve("../stripe/getCheckoutPaymentStatus"), "utf8"), sandbox);
  async function call(body) {
    const res = {code: 200, set() {}, status(code) {this.code = code; return this;},
      json(body) {this.body = body;}, end() {}};
    await sandbox.exports.getCheckoutPaymentStatusHandler({method: "POST", body}, res);
    return res;
  }
  assert.equal((await call({ordenId: "order"})).code, 403);
  assert.equal((await call({ordenId: "../order", accessToken: "valid"})).code, 400);
  const response = await call({ordenId: "order", accessToken: "valid"});
  assert.equal(response.code, 200);
  assert.equal(JSON.stringify(response.body), '{"estado":"pendiente_pago","pagado":false}');
  db.records.set("ordenes/order", {estado: "pagado"});
  assert.equal((await call({ordenId: "order", accessToken: "valid"})).code, 403);
});

test("cola de notificación usa create estable y no sobrescribe un correo ya enviado", async () => {
  const records = new Map();
  const db = {collection(name) {
    if (name === "admins") return {where: () => ({limit: () => ({get: async () => ({
      empty: false, forEach: fn => fn({id: "admin1", data: () => ({email: "test@example.invalid"})}),
    })})})};
    return {doc: id => ({create: async data => {
      if (records.has(id)) throw Object.assign(new Error("already exists"), {code: 6});
      records.set(id, data);
    }})};
  }};
  const sandbox = {module: {exports: {}}, console, require(name) {
    if (name === "firebase-admin") return {firestore: {FieldValue: {serverTimestamp: () => "now"}}};
    if (name === "./escape") return {escapeHtml: String};
    throw new Error(name);
  }};
  vm.runInNewContext(fs.readFileSync(require.resolve("../stripe/notifications"), "utf8"), sandbox);
  const notify = () => sandbox.module.exports.notifyAdminOrdenPagada(db, {id: "order", cliente: {}});
  await notify();
  records.get("orden_order_admin1").estado = "enviado";
  await notify();
  assert.equal(records.size, 1);
  assert.equal(records.get("orden_order_admin1").estado, "enviado");
});

test("suscripción pendiente conserva vínculo de cliente para las facturas, sin activación prematura", async () => {
  const f = webhookFixture();
  const subscription = {id: "cs_sub", mode: "subscription", payment_status: "unpaid",
    amount_total: 10000, currency: "mxn", customer: "cus_test", subscription: "sub_test",
    metadata: {alumnoId: "alumno"}};
  await f.send("evt_sub", "checkout.session.completed", subscription);
  const alumno = f.db.records.get("alumnos/alumno");
  assert.equal(alumno.stripeCustomerId, "cus_test");
  assert.equal(alumno.stripeSubscriptionId, "sub_test");
  assert.equal(alumno.suscripcionColegiaturaActiva, undefined);
});
