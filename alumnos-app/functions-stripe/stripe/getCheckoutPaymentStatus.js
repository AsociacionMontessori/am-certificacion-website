const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {enforceRateLimit} = require("./rateLimit");
const {requireAccessToken} = require("./accessToken");

exports.getCheckoutPaymentStatusHandler = onRequest({
  region: "us-central1", cors: false, invoker: "public",
}, async (req, res) => {
  if (handleCors(req, res) || rejectIfOriginNotAllowed(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();
  res.set("Cache-Control", "no-store");
  try {
    const db = admin.firestore();
    if (await enforceRateLimit(db, req, res, {
      key: "getCheckoutPaymentStatus", limit: 80, windowSeconds: 600,
    })) return;
    const {ordenId, accessToken} = req.body || {};
    if (typeof ordenId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(ordenId)) {
      return res.status(400).json({error: "Referencia inválida"});
    }
    const snap = await db.collection("ordenes").doc(ordenId).get();
    if (!snap.exists) return res.status(404).json({error: "Orden no encontrada"});
    const orden = snap.data();
    // This new endpoint never grants the legacy tokenless bypass.
    if (!orden.accessTokenHash) return res.status(403).json({error: "Consulta no disponible"});
    if (!requireAccessToken(orden, accessToken, res)) return;
    return res.json({estado: orden.estado, pagado: orden.estado === "pagado"});
  } catch (_) {
    return res.status(500).json({error: "No se pudo consultar el pago"});
  }
});
