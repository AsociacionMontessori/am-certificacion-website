// Build an allowlisted deployment package: no Stripe endpoints, triggers or .env.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = path.join(root, "functions-stripe");
const target = path.join(root, "functions-paypal-sandbox");
const files = ["paypal/functions.js", "paypal/sandbox.js", "paypal/checkout.js",
  "stripe/catalog.js", "stripe/programasCheckout.js", "stripe/rateLimit.js"];
fs.mkdirSync(target, {recursive: true});
for (const file of files) {
  fs.mkdirSync(path.dirname(path.join(target, file)), {recursive: true});
  fs.copyFileSync(path.join(source, file), path.join(target, file));
}
const pkg = JSON.parse(fs.readFileSync(path.join(source, "package.json")));
const lock = JSON.parse(fs.readFileSync(path.join(source, "package-lock.json")));
// Preserve the exact dependency lock; only the entry point/export surface changes.
fs.writeFileSync(path.join(target, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
fs.writeFileSync(path.join(target, "package-lock.json"), JSON.stringify(lock, null, 2) + "\n");
fs.writeFileSync(path.join(target, "index.js"), `const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();
const sandbox = require("./paypal/functions");
for (const name of ["createPayPalSandboxOrder", "capturePayPalSandboxOrder",
  "getPayPalSandboxStatus", "paypalSandboxWebhook"]) exports[name] = sandbox[name];
`);
console.log("Prepared isolated paypal-sandbox package (4 HTTPS endpoints; no business triggers).");
