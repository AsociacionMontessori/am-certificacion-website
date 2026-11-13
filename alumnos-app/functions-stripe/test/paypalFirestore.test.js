const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const {createCheckout} = require("../paypal/checkout");

// Opt-in: never fall through to a real Firestore project or default credentials.
const enabled = process.env.PAYPAL_FIRESTORE_INTEGRATION === "true";
let db;
test.before(() => {
  if (!enabled) return;
  assert.match(process.env.FIRESTORE_EMULATOR_HOST || "", /^127\.0\.0\.1:\d+$/);
  const {Firestore} = require("@google-cloud/firestore");
  db = new Firestore({projectId: "demo-paypal-sandbox"});
});
test.after(async () => {if (db) await db.terminate();});

function fixture() {
  const body = {requestId: crypto.randomUUID(), accessToken: crypto.randomBytes(32).toString("base64url"), sku: "ebook_ammac_1"};
  const ref = db.collection("paypalSandboxOrders").doc(body.requestId);
  const remote = {id: crypto.randomBytes(12).toString("hex").toUpperCase(), status: "CREATED",
    purchase_units: [{custom_id: body.requestId, payee: {merchant_id: "TESTMERCHANT"},
      amount: {value: "213.00", currency_code: "MXN"}}]};
  remote.links = [{rel: "approve", href: `https://www.sandbox.paypal.com/checkoutnow?token=${remote.id}`}];
  let attempts = 0;
  let lostResponse = false;
  const requestKeys = new Set();
  const complete = () => {
    remote.status = "COMPLETED";
    remote.purchase_units[0].payments = {captures: [{id: `C${remote.id}`, status: "COMPLETED",
      amount: {value: "213.00", currency_code: "MXN"}}]};
  };
  const checkout = createCheckout({db, merchantId: "TESTMERCHANT",
    returnUrl: "http://127.0.0.1:9000/checkout/paypal-sandbox/", client: {
      async createOrder({requestId}) {requestKeys.add(requestId); return structuredClone(remote);},
      async getOrder() {return structuredClone(remote);},
      async verifyWebhook() {return true;},
      async captureOrder() {
        attempts++;
        complete();
        if (lostResponse) throw new Error("Simulated lost response");
      },
    }});
  const event = (event_type, id = `WH-${crypto.randomUUID()}`) => ({id, event_type,
    resource: {id: `C${remote.id}`, supplementary_data: {related_ids: {order_id: remote.id}}}});
  return {body, ref, remote, checkout, complete, event, requestKeys,
    get attempts() {return attempts;}, loseResponse() {lostResponse = true;}};
}
const options = {skip: !enabled, timeout: 60000};

test("Firestore emulado: creaciones concurrentes conservan una orden y clave idempotente", options, async () => {
  const f = fixture();
  const results = await Promise.all(Array.from({length: 6}, () => f.checkout.create(f.body)));
  assert.equal(new Set(results.map(r => r.url)).size, 1);
  assert.deepEqual([...f.requestKeys], [`create-${f.body.requestId}`]);
  const saved = (await f.ref.get()).data();
  assert.equal(saved.paypalOrderId, f.remote.id);
  assert.equal(saved.accessToken, undefined);
  assert.equal(saved.accessTokenHash.length, 64);
});

test("Firestore emulado: seis capturas concurrentes ejecutan un solo intento", options, async () => {
  const f = fixture(); await f.checkout.create(f.body);
  f.remote.status = "APPROVED";
  await Promise.all(Array.from({length: 6}, () => f.checkout.capture(f.body)));
  assert.equal(f.attempts, 1);
  assert.equal((await f.ref.get()).data().estado, "pagado");
  assert.equal((await f.ref.get()).data().entregaSimulada, true);
});

test("Firestore emulado: respuesta perdida se concilia sin recapturar", options, async () => {
  const f = fixture(); await f.checkout.create(f.body);
  f.remote.status = "APPROVED"; f.loseResponse();
  await assert.rejects(f.checkout.capture(f.body), /lost response/);
  const results = await Promise.all(Array.from({length: 4}, () => f.checkout.capture(f.body)));
  assert.ok(results.every(r => r.pagado));
  assert.equal(f.attempts, 1);
});

test("Firestore emulado: webhook duplicado y reembolso concurrente no reviven entrega", options, async () => {
  const f = fixture(); await f.checkout.create(f.body); f.complete();
  const paid = f.event("PAYMENT.CAPTURE.COMPLETED");
  await Promise.all(Array.from({length: 6}, () => f.checkout.webhook(paid, {}, "TEST-WH")));
  assert.equal((await db.collection("paypalSandboxEvents").where("ordenId", "==", f.ref.id).get()).size, 1);
  const refund = f.event("PAYMENT.CAPTURE.REFUNDED");
  await Promise.all([f.checkout.webhook(refund, {}, "TEST-WH"),
    ...Array.from({length: 4}, () => f.checkout.webhook(f.event("PAYMENT.CAPTURE.COMPLETED"), {}, "TEST-WH"))]);
  const saved = (await f.ref.get()).data();
  assert.equal(saved.estado, "revision");
  assert.equal(saved.entregaSimulada, false);
  const collections = await db.listCollections();
  assert.ok(collections.every(c => ["paypalSandboxOrders", "paypalSandboxEvents", "paypalSandboxCaptures"].includes(c.id)));
});
