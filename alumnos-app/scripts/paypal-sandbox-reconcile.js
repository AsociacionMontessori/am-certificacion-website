#!/usr/bin/env node
// Use protected Gateway exec. No dotenv, ADC, Firestore or arbitrary endpoint input.
import {parseArgs} from "node:util";
import sandbox from "../functions-stripe/paypal/sandbox.js";
import reconciliation from "../functions-stripe/paypal/reconciliation.js";

async function main() {
  const {values} = parseArgs({options: {
    "order-id": {type: "string"}, "paypal-order-id": {type: "string"},
    "capture-id": {type: "string"}, "event-id": {type: "string"},
    "amount-centavos": {type: "string"}, "merchant-id": {type: "string"},
  }, strict: true, allowPositionals: false});
  if (Number(process.versions.node.split(".")[0]) < 24 || process.env.NODE_USE_ENV_PROXY !== "1" ||
      !process.env.HTTPS_PROXY || !process.env.NODE_EXTRA_CA_CERTS) throw new Error("Protected transport required");
  const expected = {environment: "sandbox", currency: "MXN", ordenId: values["order-id"],
    paypalOrderId: values["paypal-order-id"], captureId: values["capture-id"],
    eventId: values["event-id"], merchantId: values["merchant-id"],
    amountCentavos: /^\d+$/.test(values["amount-centavos"] || "") ? Number(values["amount-centavos"]) : NaN};
  const client = sandbox.createSandboxClient({clientId: process.env.PAYPAL_SANDBOX_CLIENT_ID,
    clientSecret: process.env.PAYPAL_SANDBOX_CLIENT_SECRET, merchantId: expected.merchantId});
  const result = await reconciliation.reconcileSandboxOrder({client, expected});
  process.stdout.write(JSON.stringify(result) + "\n");
  if (!result.ok) process.exitCode = 2;
}
main().catch(() => {
  // Errors can contain protected transport details; never print the error or its cause.
  process.stderr.write("Conciliación Sandbox no disponible; revisar argumentos, canal protegido y acceso PayPal.\n");
  process.exitCode = 1;
});
