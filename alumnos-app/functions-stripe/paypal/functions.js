const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const {enforceRateLimit} = require("../stripe/rateLimit");
const {createSandboxClient} = require("./sandbox");
const {createCheckout} = require("./checkout");
const clientId = defineSecret("PAYPAL_SANDBOX_CLIENT_ID");
const clientSecret = defineSecret("PAYPAL_SANDBOX_CLIENT_SECRET");

function sandboxConfig(env = process.env) {
  const project = env.GCLOUD_PROJECT || env.GOOGLE_CLOUD_PROJECT;
  if (env.PAYPAL_SANDBOX_ENDPOINTS !== "true" || !project ||
      (project === "certificacionmontessori" && env.PAYPAL_SANDBOX_SHARED_PROJECT !== project) ||
      project !== env.PAYPAL_SANDBOX_PROJECT_ID || !/^[A-Z0-9]{5,40}$/.test(env.PAYPAL_SANDBOX_MERCHANT_ID || "") ||
      !env.PAYPAL_SANDBOX_WEBHOOK_ID) throw new Error("Sandbox aislado no configurado");
  const url = new URL(env.PAYPAL_SANDBOX_RETURN_URL);
  const production = /(^|\.)certificacionmontessori\.com$/;
  if (production.test(url.hostname) || ["certificacionmontessori.web.app", "certificacionmontessori.firebaseapp.com",
      "alumnos-certificacionmontessori.web.app", "alumnos-certificacionmontessori.firebaseapp.com"].includes(url.hostname) || url.username || url.password || url.search || url.hash ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname)))) {
    throw new Error("Retorno Sandbox no permitido");
  }
  return {merchantId: env.PAYPAL_SANDBOX_MERCHANT_ID, webhookId: env.PAYPAL_SANDBOX_WEBHOOK_ID,
    returnUrl: url.href, origin: url.origin};
}
function handler(action) {
  return onRequest({region: "us-central1", secrets: [clientId, clientSecret],
    cors: false, invoker: "public", timeoutSeconds: 120, maxInstances: 2}, async (req, res) => {
    res.set("Cache-Control", "no-store");
    let config;
    try {config = sandboxConfig();} catch (_) {res.status(503).json({error: "Sandbox no configurado"}); return;}
    if (action !== "webhook") {
      res.set("Vary", "Origin");
      if (req.get("Origin") !== config.origin) {res.status(403).json({error: "Origen no permitido"}); return;}
      res.set("Access-Control-Allow-Origin", config.origin);
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      if (req.method === "OPTIONS") {res.status(204).send(""); return;}
    }
    if (req.method !== "POST") {res.status(405).json({error: "Método no permitido"}); return;}
    try {
      const db = admin.firestore();
      if (action !== "webhook" && await enforceRateLimit(db, req, res,
        {collection: "paypalSandboxRateLimits", key: `paypalSandbox-${action}`, limit: action === "status" ? 60 : 20, windowSeconds: 600})) return;
      const client = createSandboxClient({clientId: clientId.value(), clientSecret: clientSecret.value(),
        merchantId: config.merchantId});
      const checkout = createCheckout({db, client, ...config});
      const result = action === "webhook" ? await checkout.webhook(req.body, req.headers, config.webhookId) :
        await checkout[action](req.body || {});
      res.status(200).json(result);
    } catch (error) {
      // Do not log provider bodies, browser tokens, buyer data or credentials.
      res.status(error.status || 503).json({error: error.status ? error.message :
        "No se pudo confirmar la operación Sandbox. Consulta el estado antes de volver a intentar."});
    }
  });
}
exports.createPayPalSandboxOrder = handler("create");
exports.capturePayPalSandboxOrder = handler("capture");
exports.getPayPalSandboxStatus = handler("status");
exports.paypalSandboxWebhook = handler("webhook");
exports.sandboxConfig = sandboxConfig;
