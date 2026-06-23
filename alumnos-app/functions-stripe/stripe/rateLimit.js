const crypto = require("crypto");
const admin = require("firebase-admin");

function getRequestIp(req) {
  // En Cloud Functions v2 (Cloud Run), el cliente puede prefijar su propio
  // valor en X-Forwarded-For; GCP lo concatena después con la IP real y los
  // load balancers. Tomar el último valor del header — el añadido por GCP —
  // hace mucho más caro falsificar la huella de rate limit.
  const xff = String(req.get("x-forwarded-for") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return xff[xff.length - 1] || req.ip || req.socket?.remoteAddress || "unknown";
}

function getRateLimitFingerprint(req) {
  return crypto
      .createHash("sha256")
      .update(getRequestIp(req))
      .digest("hex")
      .slice(0, 32);
}

/**
 * Firestore-backed fixed-window rate limit for public HTTPS functions.
 * Stores only a hashed client fingerprint, never the raw IP address.
 *
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {import("firebase-functions/v2/https").Request} req
 * @param {import("firebase-functions/v2/https").Response} res
 * @param {{key: string, limit: number, windowSeconds?: number}} options
 * @return {Promise<boolean>} true when the request was rejected
 */
async function enforceRateLimit(db, req, res, options) {
  const key = String(options.key || "public").replace(/[^a-zA-Z0-9_-]/g, "_");
  const limit = Number(options.limit || 20);
  const windowSeconds = Number(options.windowSeconds || 600);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(nowSeconds / windowSeconds) * windowSeconds;
  const retryAfter = Math.max(1, windowStart + windowSeconds - nowSeconds);
  const fingerprint = getRateLimitFingerprint(req);
  const ref = db.collection("rate_limits").doc(`${key}_${windowStart}_${fingerprint}`);

  const allowed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? Number(snap.data().count || 0) : 0;
    if (current >= limit) return false;

    tx.set(ref, {
      key,
      fingerprint,
      windowStart,
      count: admin.firestore.FieldValue.increment(1),
      firstSeenAt: snap.exists ? snap.data().firstSeenAt : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis((windowStart + windowSeconds * 2) * 1000),
    }, {merge: true});
    return true;
  });

  if (allowed) return false;

  res.set("Retry-After", String(retryAfter));
  res.status(429).json({
    error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos.",
  });
  return true;
}

module.exports = {
  enforceRateLimit,
  getRateLimitFingerprint,
};
