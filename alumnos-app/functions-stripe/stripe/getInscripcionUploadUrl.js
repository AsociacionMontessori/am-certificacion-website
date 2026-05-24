const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {
  DOCUMENTOS_PARTE2,
  MAX_FILE_BYTES,
  ALLOWED_MIME,
} = require("./inscripcionCatalog");

function sanitizeFileName(name) {
  return String(name || "archivo")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 120);
}

/**
 * URL firmada para subir un documento del expediente (parte 2).
 */
exports.getInscripcionUploadUrlHandler = onRequest(
    {region: "us-central1", cors: false, invoker: "public"},
    async (req, res) => {
      if (handleCors(req, res)) return;
      if (rejectIfOriginNotAllowed(req, res)) return;
      if (req.method !== "POST") {
        res.status(405).json({error: "Método no permitido"});
        return;
      }

      try {
        const body = req.body || {};
        const ordenId = String(body.ordenId || "").trim();
        const docType = String(body.docType || "").trim();
        const fileName = sanitizeFileName(body.fileName);
        const contentType = String(body.contentType || "").trim().toLowerCase();
        const fileSize = Number(body.fileSize || 0);

        if (!ordenId || !DOCUMENTOS_PARTE2.has(docType)) {
          res.status(400).json({error: "Solicitud de archivo no válida"});
          return;
        }
        if (!ALLOWED_MIME.test(contentType)) {
          res.status(400).json({error: "Solo se permiten PDF o imágenes (JPG, PNG, WEBP)"});
          return;
        }
        if (fileSize <= 0 || fileSize > MAX_FILE_BYTES) {
          res.status(400).json({error: "El archivo debe ser menor a 10 MB"});
          return;
        }

        const db = admin.firestore();
        const inscripcionesSnap = await db.collection("inscripciones")
            .where("ordenId", "==", ordenId)
            .limit(1)
            .get();
        if (inscripcionesSnap.empty) {
          res.status(400).json({error: "Completa primero el formulario de cuenta (parte 1)"});
          return;
        }
        const inscripcion = inscripcionesSnap.docs[0].data();
        if (!inscripcion.parte1Completa || !inscripcion.alumnoId) {
          res.status(400).json({error: "Completa primero el formulario de cuenta (parte 1)"});
          return;
        }

        const alumnoId = inscripcion.alumnoId;
        const storagePath = `expediente/${alumnoId}/${docType}/${Date.now()}-${fileName}`;
        const bucket = admin.storage().bucket();
        const file = bucket.file(storagePath);

        const [uploadUrl] = await file.getSignedUrl({
          version: "v4",
          action: "write",
          expires: Date.now() + 15 * 60 * 1000,
          contentType,
        });

        res.json({ok: true, uploadUrl, storagePath, docType});
      } catch (err) {
        console.error("getInscripcionUploadUrl:", err);
        res.status(500).json({error: "No se pudo preparar la subida del archivo"});
      }
    },
);
