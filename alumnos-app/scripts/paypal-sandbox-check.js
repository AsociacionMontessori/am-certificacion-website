#!/usr/bin/env node
"use strict";

// Run only through Gateway exec with OpenClaw's protected HTTPS egress enabled.
// No dotenv loading, secret files, live endpoint, order creation or payment capture.
import sandbox from "../functions-stripe/paypal/sandbox.js";
const {checkSandboxConnection} = sandbox;

async function main() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 24 || process.env.NODE_USE_ENV_PROXY !== "1" ||
      !process.env.HTTPS_PROXY || !process.env.NODE_EXTRA_CA_CERTS) {
    throw new Error("Se requiere Node 24+ y el canal HTTPS protegido de Gateway exec");
  }
  const clientId = process.env.PAYPAL_SANDBOX_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SANDBOX_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Faltan las credenciales protegidas Sandbox");
  const result = await checkSandboxConnection({clientId, clientSecret});
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

main().catch(() => {
  // Transport errors may contain request options. Never print them or their cause.
  process.stderr.write("PayPal Sandbox: comprobación fallida; revisar canal protegido y credenciales.\n");
  process.exitCode = 1;
});
