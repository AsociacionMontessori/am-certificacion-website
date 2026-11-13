const test = require("node:test");
const assert = require("node:assert/strict");
const {enforceRateLimit} = require("../stripe/rateLimit");
const {execFileSync} = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

test("Sandbox rate limits never write the Stripe collection; default is unchanged", async () => {
  for (const collection of [undefined, "paypalSandboxRateLimits"]) {
    const used = [];
    const db = {collection(name) {used.push(name); return {doc() {return {};}};},
      async runTransaction(fn) {return fn({get: async () => ({exists: false}), set() {}});}};
    const req = {get: () => "", ip: "127.0.0.1"};
    const res = {set() {throw new Error("Unexpected throttling");}};
    assert.equal(await enforceRateLimit(db, req, res, {key: "test", limit: 20, collection}), false);
    assert.deepEqual(used, [collection || "rate_limits"]);
  }
});

test("isolated deployment exports only four Sandbox functions, with no business triggers", () => {
  const root = path.resolve(__dirname, "../..");
  execFileSync(process.execPath, [path.join(root, "scripts/prepare-paypal-sandbox.cjs")]);
  const staging = path.join(root, "functions-paypal-sandbox");
  const config = JSON.parse(fs.readFileSync(path.join(root, "firebase.paypal-sandbox.json")));
  assert.deepEqual(Object.keys(config), ["functions", "hosting"]);
  assert.equal(config.hosting.site, "certimontessori-sandbox");
  assert.equal(config.functions.length, 1);
  assert.equal(config.functions[0].codebase, "paypal-sandbox");
  assert.equal(config.functions[0].source, "functions-paypal-sandbox");
  // Load the generated entry using the already-installed dependencies, not another install.
  const exported = JSON.parse(execFileSync(process.execPath, ["-e",
    "console.log(JSON.stringify(Object.keys(require(process.argv[1]))))", path.join(staging, "index.js")],
  {env: {...process.env, NODE_PATH: path.join(root, "functions-stripe/node_modules")}, encoding: "utf8"}).trim());
  assert.deepEqual(exported.sort(), ["capturePayPalSandboxOrder", "createPayPalSandboxOrder",
    "getPayPalSandboxStatus", "paypalSandboxWebhook"].sort());
  assert.equal(fs.existsSync(path.join(staging, "stripe/webhook.js")), false);
  const fixture = require(path.join(staging, "stripe/catalog.js"));
  assert.deepEqual(Object.keys(fixture), ["CATALOG_META"]);
  assert.deepEqual(fixture.CATALOG_META, require("../stripe/catalog").CATALOG_META);
  assert.equal(fs.readFileSync(path.join(staging, "stripe/catalog.js"), "utf8").includes("defineString"), false);
});
