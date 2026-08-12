const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {enforceRateLimit} = require("./rateLimit");
const {
  DOCUMENTOS_PARTE2,
  MAX_FILE_BYTES,
  ALLOWED_MIME,
} = require("./inscripcionCatalog");

/**
 * URL firmada para subir un documento del expediente desde el portal, ya
 * con sesión iniciada.
 *
 * Se diferencia de `getInscripcionUploadUrl` en el titular del permiso: aquel
 * sirve al formulario público de inscripción y se autoriza con el accessToken
 * de la orden; este sirve al portal y se autoriza con el ID token de Firebase.
 * Gracias a eso un alumno puede completar su expediente después, sin depender
 * del enlace de un correo viejo, y administración puede subir por él.
 *
 * - Administradores: pueden subir el documento de cualquier alumno.
 * - El propio alumno: solo el suyo.
 * - Directivos: no. Consultar el expediente es lectura (getExpedienteDocsUrls
 *   sí los admite); modificarlo es edición y queda con administración, igual
 *   que el resto del portal interno.
 */
function sanitizeFileName(name) {
  return String(name || "archivo")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 120);
}

async function isCallerAdmin(db, uid) {
  const snap = await db.collection("admins").doc(uid).get();
  return snap.exists;
}

exports.getExpedienteUploadUrlHandler = onRequest(
    {region: "us-central1", cors: false, invoker: "public"},
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
          key: "getExpedienteUploadUrl",
          limit: 40,
          windowSeconds: 600,
        })) return;

        const authHeader = req.get("Authorization") || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!token) {
          res.status(401).json({error: "No autenticado"});
          return;
        }
        const decoded = await admin.auth().verifyIdToken(token);
        const callerUid = decoded.uid;

        const body = req.body || {};
        const alumnoId = String(body.alumnoId || "").trim();
        const docType = String(body.docType || "").trim();
        const fileName = sanitizeFileName(body.fileName);
        const contentType = String(body.contentType || "").trim().toLowerCase();
        const fileSize = Number(body.fileSize || 0);

        if (!alumnoId || !DOCUMENTOS_PARTE2.has(docType)) {
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

        const isOwner = callerUid === alumnoId;
        const isAdmin = isOwner ? false : await isCallerAdmin(db, callerUid);
        if (!isOwner && !isAdmin) {
          res.status(403).json({error: "No autorizado"});
          return;
        }

        // El alumno debe existir: evita sembrar carpetas sueltas en Storage
        // con un alumnoId inventado.
        const alumnoSnap = await db.collection("alumnos").doc(alumnoId).get();
        if (!alumnoSnap.exists) {
          res.status(404).json({error: "Alumno no encontrado"});
          return;
        }

        // Misma convención que el formulario público: ruta estable por tipo,
        // de modo que volver a subir SOBRESCRIBE en lugar de acumular copias.
        const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : "bin";
        const storagePath = `expediente/${alumnoId}/${docType}/${docType}.${ext}`;
        const bucket = admin.storage().bucket();

        // Reemplazar NO destruye la versión anterior: se archiva en
        // `historial/`. Son documentos legales —contratos firmados, actas— y
        // conviene poder demostrar qué se tenía en cada momento.
        //
        // Se copia (no se mueve) antes de emitir la URL: si la subida falla a
        // medias, el documento vigente sigue en su lugar. El nombre lleva la
        // fecha de la versión archivada, así que reintentar copia encima de la
        // misma entrada en lugar de acumular basura.
        const [previos] = await bucket.getFiles({
          prefix: `expediente/${alumnoId}/${docType}/`,
        });
        const vigentes = previos.filter((f) => !f.name.includes("/historial/"));
        for (const anterior of vigentes) {
          const meta = anterior.metadata || {};
          const sello = String(meta.updated || meta.timeCreated || meta.generation || "previo")
              .replace(/[:.]/g, "-");
          const base = anterior.name.split("/").pop();
          const destino = `expediente/${alumnoId}/${docType}/historial/${sello}-${base}`;
          try {
            await anterior.copy(bucket.file(destino));
            // Si la versión nueva llega con otra extensión, el archivo vigente
            // anterior debe retirarse o el requisito quedaría con dos vigentes.
            if (anterior.name !== storagePath) await anterior.delete();
          } catch (errArchivo) {
            console.warn("getExpedienteUploadUrl:no_se_archivo", {
              archivo: anterior.name,
              error: errArchivo.message,
            });
          }
        }

        const [uploadUrl] = await bucket.file(storagePath).getSignedUrl({
          version: "v4",
          action: "write",
          expires: Date.now() + 15 * 60 * 1000,
          contentType,
        });

        console.log("getExpedienteUploadUrl:emitida", {
          alumnoId,
          docType,
          callerUid,
          comoAlumno: isOwner,
          comoAdmin: isAdmin,
        });

        res.json({ok: true, uploadUrl, storagePath, docType});
      } catch (err) {
        console.error("getExpedienteUploadUrl:", err);
        if (err.code === "auth/id-token-expired" || err.code === "auth/argument-error") {
          res.status(401).json({error: "Sesión inválida o expirada"});
          return;
        }
        res.status(500).json({error: "No se pudo preparar la subida del archivo"});
      }
    },
);
