/**
 * F-02 — Token de acceso por orden.
 *
 * Hoy el `ordenId` se transmite por URL (`success_url`) y se filtra
 * fácilmente (historial de browser, referer headers, capturas, logs).
 * El `accessToken` separa ese identificador del derecho a actuar sobre
 * la inscripción: solo quien tenga ambos puede ver PII y completar
 * el expediente.
 *
 * Modelo:
 *   - `createPublicCheckout` genera `accessToken = randomBytes(32)`.
 *   - Guarda `accessTokenHash = sha256(accessToken)` y
 *     `accessTokenExpiresAt = now + 24h` en `ordenes/{id}`.
 *   - Devuelve el token solo en query string de `success_url`.
 *   - Los endpoints de inscripción exigen `accessToken` y lo comparan
 *     contra el hash en la orden con `timingSafeEqual`.
 *
 * Backward-compat: las órdenes anteriores a este cambio no tienen
 * `accessTokenHash`. `requireAccessToken` retorna ok para ellas con
 * `legacy: true`, de modo que el deploy no rompe órdenes en curso.
 * Después de un periodo de validación se elimina el modo legacy.
 */
const crypto = require("crypto");

const ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function generateAccessToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashAccessToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function timingSafeEqualHex(a, b) {
  const ba = Buffer.from(String(a || ""), "hex");
  const bb = Buffer.from(String(b || ""), "hex");
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Valida el accessToken contra el hash guardado en la orden.
 *
 * @param {object} orden — datos de la orden tal como están en Firestore.
 * @param {string|null|undefined} providedToken — token recibido del cliente.
 * @return {{ok: boolean, legacy?: boolean, reason?: string}}
 */
function validateAccessToken(orden, providedToken) {
  const storedHash = orden?.accessTokenHash || null;

  // Orden pre-existente al despliegue de F-02: no tiene hash. Para no
  // romper las inscripciones a medio camino, dejamos pasar. Cuando se
  // confirma que ya no quedan órdenes legacy en flujo, se elimina esta
  // rama (cambiando `LEGACY_GRACE_ENABLED` a `false`).
  if (!storedHash) {
    return {ok: true, legacy: true};
  }

  if (!providedToken) {
    return {ok: false, reason: "token_missing"};
  }

  // Expiración explícita (si la orden la trae).
  const expiresAt = orden?.accessTokenExpiresAt;
  if (expiresAt?.toMillis && expiresAt.toMillis() < Date.now()) {
    return {ok: false, reason: "token_expired"};
  }

  const providedHash = hashAccessToken(providedToken);
  if (!timingSafeEqualHex(providedHash, storedHash)) {
    return {ok: false, reason: "token_mismatch"};
  }

  return {ok: true, legacy: false};
}

/**
 * Helper para handlers HTTP. Si la orden existe y el token no valida,
 * escribe respuesta 403 y devuelve `false`. Si valida (incluso por
 * legacy), devuelve `true`.
 *
 * @param {object} orden
 * @param {string|null|undefined} providedToken
 * @param {import('firebase-functions/v2/https').Response} res
 * @return {boolean}
 */
function requireAccessToken(orden, providedToken, res) {
  const result = validateAccessToken(orden, providedToken);
  if (result.ok) return true;
  res.status(403).json({error: "Token de acceso inválido o expirado"});
  return false;
}

module.exports = {
  ACCESS_TOKEN_TTL_MS,
  generateAccessToken,
  hashAccessToken,
  validateAccessToken,
  requireAccessToken,
};
