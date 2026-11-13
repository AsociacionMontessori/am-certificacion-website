const test = require("node:test");
const assert = require("node:assert/strict");
const {reconcileSandboxOrder} = require("../paypal/reconciliation");
const {createSandboxClient} = require("../paypal/sandbox");
const expected = {environment: "sandbox", currency: "MXN",
  ordenId: "12345678-1234-4234-8234-123456789abc", paypalOrderId: "ORDER1",
  captureId: "CAPTURE1", eventId: "WH-1", merchantId: "MERCHANT", amountCentavos: 21300};
test("CLI falla cerrado sin canal protegido o con opciones desconocidas sin exponer detalles", () => {
  const {spawnSync} = require("node:child_process");
  const path = require("node:path");
  const cli = path.resolve(__dirname, "../../scripts/paypal-sandbox-reconcile.js");
  for (const args of [[], ["--endpoint", "https://example.invalid/private"]]) {
    const result = spawnSync(process.execPath, [cli, ...args], {env: {}, encoding: "utf8"});
    assert.equal(result.status, 1); assert.equal(result.stdout, "");
    assert.equal(result.stderr,
      "Conciliación Sandbox no disponible; revisar argumentos, canal protegido y acceso PayPal.\n");
  }
});
function fixture() {
  const amount = {currency_code: "MXN", value: "213.00"};
  const capture = {id: "CAPTURE1", status: "COMPLETED", amount: {...amount}};
  const unit = {custom_id: expected.ordenId, payee: {merchant_id: "MERCHANT"},
    amount: {...amount}, payments: {captures: [capture]}};
  const remote = {id: "ORDER1", status: "COMPLETED", purchase_units: [unit],
    payer: {email_address: "private@example.invalid"}};
  const event = {id: "WH-1", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: {
    ...structuredClone(capture), supplementary_data: {related_ids: {order_id: "ORDER1"}}}};
  const calls = [];
  const client = {getOrder: async id => {calls.push(["order", id]); return remote;},
    getWebhookEvent: async id => {calls.push(["event", id]); return event;}};
  return {remote, unit, capture, event, calls, client};
}
test("conciliación sólo lee orden y evento; salida mínima sin PII", async () => {
  const f = fixture();
  const result = await reconcileSandboxOrder({client: f.client, expected, now: () => 1000});
  assert.equal(result.ok, true); assert.equal(result.readOnly, true);
  assert.equal(result.checkedAtMs, 1000);
  assert.equal(result.comparison, "recorded_reference_not_current_firestore");
  assert.deepEqual(f.calls, [["order", "ORDER1"], ["event", "WH-1"]]);
  assert.equal(JSON.stringify(result).includes("private@example.invalid"), false);
  assert.equal(JSON.stringify(result).includes("MERCHANT"), false);
});
test("orden, vendedor, monto, moneda, captura y evento discrepantes requieren revisión", async () => {
  const changes = [f => {f.remote.id = "OTHER";}, f => {f.unit.custom_id = "OTHER";},
    f => {f.unit.payee.merchant_id = "OTHER";}, f => {f.unit.amount.value = "1.00";},
    f => {f.unit.amount.currency_code = "USD";}, f => {f.capture.id = "OTHER";},
    f => {f.capture.amount.value = "1.00";}, f => {f.capture.amount.currency_code = "USD";},
    f => {f.unit.payments.captures.push({...f.capture});},
    f => {f.event.id = "OTHER";}, f => {f.event.event_type = "PAYMENT.CAPTURE.REFUNDED";},
    f => {f.event.resource.id = "OTHER";}, f => {f.event.resource.status = "PENDING";},
    f => {delete f.event.resource.supplementary_data;},
    f => {f.event.resource.amount.value = "1.00";}, f => {f.event.resource.amount.currency_code = "USD";}];
  for (const change of changes) {
    const f = fixture(); change(f);
    const result = await reconcileSandboxOrder({client: f.client, expected});
    assert.equal(result.ok, false); assert.equal(result.result, "requiere_revision");
  }
});
test("evento completed histórico nunca oculta reembolso o captura aún pendiente", async () => {
  for (const status of ["REFUNDED", "PARTIALLY_REFUNDED", "PENDING", "DECLINED", "FAILED"]) {
    const f = fixture(); f.capture.status = status;
    const result = await reconcileSandboxOrder({client: f.client, expected});
    assert.equal(result.ok, false); assert.equal(result.checks.eventIdentity, true);
  }
  const f = fixture(); f.remote.status = "APPROVED"; delete f.unit.payments;
  assert.equal((await reconcileSandboxOrder({client: f.client, expected})).ok, false);
});
test("entradas inválidas se rechazan antes de contactar al proveedor", async () => {
  for (const change of [{environment: "live"}, {currency: "USD"}, {amountCentavos: 0},
    {amountCentavos: 213.1}, {paypalOrderId: "../../secret"}, {eventId: "WH/OTHER"},
    {captureId: ""}, {merchantId: ""}, {ordenId: "bad"}]) {
    const f = fixture();
    await assert.rejects(reconcileSandboxOrder({client: f.client, expected: {...expected, ...change}}));
    assert.deepEqual(f.calls, []);
  }
});
test("fallo de API no se interpreta como conciliación correcta ni provoca reintentos", async () => {
  const f = fixture(); let attempts = 0;
  f.client.getWebhookEvent = async () => {attempts++; throw new Error("unavailable");};
  await assert.rejects(reconcileSandboxOrder({client: f.client, expected}), /unavailable/);
  assert.equal(attempts, 1);
});
test("GET de evento usa sólo host Sandbox fijo y no sigue redirecciones", async () => {
  const calls = [];
  const client = createSandboxClient({clientId: "dummy", clientSecret: "dummy", merchantId: "MERCHANT",
    fetchImpl: async (url, options) => {calls.push({url, options});
      return {ok: true, json: async () => url.endsWith("/token") ? {access_token: "fake"} : {id: "WH-1"}};}});
  await client.getWebhookEvent("WH-1");
  assert.equal(calls[1].url, "https://api-m.sandbox.paypal.com/v1/notifications/webhooks-events/WH-1");
  assert.equal(calls[1].options.method, "GET"); assert.equal(calls[1].options.body, undefined);
  assert.ok(calls.every(call => call.options.redirect === "error"));
  await assert.rejects(client.getWebhookEvent("../bad")); assert.equal(calls.length, 2);
});
