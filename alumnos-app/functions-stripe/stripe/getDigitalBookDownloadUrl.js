const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {enforceRateLimit} = require("./rateLimit");
const {getDigitalAsset, getDigitalBook, orderIncludesDigitalSku} = require("./digitalBooks");

function hashDownloadToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function getRequestFingerprint(req) {
  const raw = [
    req.get("x-forwarded-for") || req.ip || "",
    req.get("user-agent") || "",
  ].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

function escapeFileName(fileName) {
  return String(fileName || "ebook")
      .replace(/[\\"]/g, "")
      .replace(/[\r\n]/g, "");
}

exports.getDigitalBookDownloadUrlHandler = onRequest(
    {
      region: "us-central1",
      cors: false,
      invoker: "public",
    },
    async (req, res) => {
      if (handleCors(req, res)) return;
      if (rejectIfOriginNotAllowed(req, res)) return;

      if (req.method !== "POST") {
        res.status(405).json({error: "Método no permitido"});
        return;
      }

      try {
        const db = admin.firestore();
        if (await enforceRateLimit(db, req, res, {
          key: "getDigitalBookDownloadUrl",
          limit: 30,
          windowSeconds: 600,
        })) return;

        const body = req.body || {};
        const ordenId = String(body.ordenId || "").trim();
        const token = String(body.token || "").trim();
        const sku = String(body.sku || "").trim();
        const format = String(body.format || "").trim().toLowerCase();

        if (!ordenId || !token || !sku || !format) {
          res.status(400).json({error: "Datos de descarga incompletos"});
          return;
        }

        const asset = getDigitalAsset(sku, format);
        const book = getDigitalBook(sku);
        if (!asset || !book) {
          res.status(400).json({error: "Formato digital no disponible"});
          return;
        }

        const ordenRef = db.collection("ordenes").doc(ordenId);
        const ordenSnap = await ordenRef.get();
        if (!ordenSnap.exists) {
          res.status(404).json({error: "Orden no encontrada"});
          return;
        }

        const orden = ordenSnap.data() || {};
        const lineItems = Array.isArray(orden.lineItems) ? orden.lineItems : [];
        if (!orderIncludesDigitalSku(lineItems, sku)) {
          res.status(403).json({error: "El ebook no pertenece a esta orden"});
          return;
        }

        if (orden.estado !== "pagado") {
          res.status(409).json({
            error: "El pago aún no está confirmado. Intenta de nuevo en unos segundos.",
          });
          return;
        }

        const delivery = orden.digitalDelivery || {};
        if (!delivery.tokenHash || delivery.tokenHash !== hashDownloadToken(token)) {
          res.status(403).json({error: "Token de descarga inválido"});
          return;
        }

        if (delivery.expiresAt?.toMillis && delivery.expiresAt.toMillis() < Date.now()) {
          res.status(403).json({error: "El acceso de descarga expiró"});
          return;
        }

        const counts = delivery.downloadCounts || {};
        const totalDownloads = Object.values(counts)
            .reduce((sum, value) => sum + Number(value || 0), 0);
        const maxDownloads = Number(delivery.maxDownloads || 40);
        if (totalDownloads >= maxDownloads) {
          res.status(429).json({
            error: "Se alcanzó el límite de descargas de esta orden",
          });
          return;
        }

        const bucket = admin.storage().bucket();
        const file = bucket.file(asset.storagePath);
        const [exists] = await file.exists();
        if (!exists) {
          console.error("Archivo digital no encontrado:", asset.storagePath);
          res.status(404).json({error: "Archivo digital no encontrado"});
          return;
        }

        const countKey = `digitalDelivery.downloadCounts.${sku}_${format}`;
        await ordenRef.update({
          [countKey]: admin.firestore.FieldValue.increment(1),
          "digitalDelivery.lastDownloadAt": admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await ordenRef.collection("descargas").add({
          sku,
          bookId: book.bookId,
          format,
          storagePath: asset.storagePath,
          fingerprint: getRequestFingerprint(req),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const fileName = escapeFileName(asset.fileName);
        res.set("Content-Type", asset.contentType);
        res.set("Content-Disposition", `attachment; filename="${fileName}"`);
        res.set("Cache-Control", "private, no-store, max-age=0");

        file.createReadStream()
            .on("error", (error) => {
              console.error("Error al leer archivo digital:", error);
              if (!res.headersSent) {
                res.status(500).json({error: "No se pudo preparar la descarga"});
              } else {
                res.end();
              }
            })
            .pipe(res);
      } catch (error) {
        console.error("getDigitalBookDownloadUrl:", error);
        res.status(500).json({error: "No se pudo preparar la descarga"});
      }
    },
);
