const test = require("node:test");
const assert = require("node:assert/strict");
const {checkSandboxConnection, createSandboxClient} = require("../paypal/sandbox");

test("el CLI carga como ES module y falla cerrado fuera del canal protegido", () => {
  const {spawnSync} = require("node:child_process");
  const path = require("node:path");
  const cli = path.resolve(__dirname, "../../scripts/paypal-sandbox-check.js");
  const result = spawnSync(process.execPath, [cli], {env: {}, encoding: "utf8"});
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "PayPal Sandbox: comprobación fallida; revisar canal protegido y credenciales.\n");
});

test("la conexión usa OAuth sandbox y nunca devuelve token ni credenciales", async () => {
  let calls = 0;
  const result = await checkSandboxConnection({clientId: "test-client", clientSecret: "test-secret",
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, "https://api-m.sandbox.paypal.com/v1/oauth2/token");
      assert.equal(options.redirect, "error");
      assert.equal(options.method, "POST");
      assert.equal(options.body, "grant_type=client_credentials");
      assert.equal(options.headers.Authorization,
          `Basic ${Buffer.from("test-client:test-secret").toString("base64")}`);
      return {ok: true, json: async () => ({access_token: "do-not-return", extra: "do-not-return"})};
    }});
  assert.deepEqual(result, {ok: true, environment: "sandbox"});
  assert.equal(calls, 1);
});

test("credenciales ausentes y respuestas OAuth inválidas nunca crean una orden", async () => {
  let calls = 0;
  const fetchImpl = async () => {calls++; throw new Error("should not run");};
  await assert.rejects(checkSandboxConnection({clientId: "client", fetchImpl}), /configuración/);
  assert.equal(calls, 0);
  for (const data of [{}, {access_token: 123}, {access_token: ""}]) {
    await assert.rejects(checkSandboxConnection({clientId: "client", clientSecret: "secret",
      fetchImpl: async () => ({ok: true, json: async () => data})}), /incompleta/);
  }
  calls = 0;
  const client = createSandboxClient({clientId: "client", clientSecret: "secret", merchantId: "merchant",
    fetchImpl: async () => {calls++; return {ok: false, status: 401,
      json: async () => {throw new Error("must not expose provider body");}};}});
  await assert.rejects(client.createOrder({ordenId: "order", amountCentavos: 100, requestId: "request"}), /HTTP 401/);
  assert.equal(calls, 1);
});

test("ni OAuth ni las operaciones de pago siguen redirecciones", async () => {
  const client = createSandboxClient({clientId: "client", clientSecret: "secret", merchantId: "merchant",
    fetchImpl: async (url, options) => {
      assert.equal(options.redirect, "error");
      return {ok: true, json: async () => url.endsWith("/token") ? {access_token: "dummy"} : {id: "ORDER"}};
    }});
  await client.createOrder({ordenId: "order", amountCentavos: 100, requestId: "request"});
});
