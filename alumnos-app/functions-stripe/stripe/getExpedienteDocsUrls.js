const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {enforceRateLimit} = require("./rateLimit");
const {getDocumentosParte2} = require("./inscripcionCatalog");

/**
 * Lista los documentos del expediente de un alumno (Storage:
 * `expediente/{alumnoId}/{docType}/{archivo}`) y devuelve URLs de descarga
 * firmadas (v4, 15 min).
 *
 * - Requiere ID token Firebase (Bearer).
 * - Admin o directivo pueden ver el expediente de cualquier alumno.
 * - El propio alumno puede ver el suyo.
 */
async function isCallerAdminOrDirectivo(db, uid) {
  const [adminSnap, directivoSnap] = await Promise.all([
    db.collection("admins").doc(uid).get(),
    db.collection("directivos").doc(uid).get(),
  ]);
  return adminSnap.exists || directivoSnap.exists;
}

/**
 * Documentos que exige el expediente de un alumno. La constancia fiscal solo
 * aplica a quien pidió factura, así que se consulta su orden.
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} alumnoId
 * @return {Promise<{requeridos: Set<string>, opcionales: Set<string>}>}
 */
async function documentosDelAlumno(db, alumnoId) {
  let requiereFactura = false;
  try {
    const insc = await db.collection("inscripciones")
        .where("alumnoId", "==", alumnoId)
        .limit(1)
        .get();
    const ordenId = insc.empty ? null : insc.docs[0].data().ordenId;
    if (ordenId) {
      const orden = await db.collection("ordenes").doc(ordenId).get();
      requiereFactura = Boolean(orden.exists && orden.data().requiereFacturaFiscal);
    }
  } catch (err) {
    // Sin inscripción localizable se asume el expediente estándar: es mejor
    // pedir de más y que administración lo dispense, que dar por completo un
    // expediente al que le falta la constancia fiscal.
    console.warn("getExpedienteDocsUrls:sin_orden", {alumnoId, error: err.message});
  }
  return getDocumentosParte2(requiereFactura);
}

/**
 * Extrae docType y nombre legible de la ruta del archivo.
 * `expediente/{alumnoId}/{docType}/{timestamp}-{nombre}`
 * @param {string} fullPath
 * @return {{docType: string, fileName: string}}
 */
function parsePath(fullPath) {
  const parts = String(fullPath || "").split("/");
  const docType = parts.length >= 3 ? parts[2] : "";
  const last = parts[parts.length - 1] || "";
  // Quitar el prefijo "{timestamp}-" que añade getInscripcionUploadUrl.
  const fileName = last.replace(/^\d+-/, "");
  return {docType, fileName};
}

exports.getExpedienteDocsUrlsHandler = onRequest(
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
          key: "getExpedienteDocsUrls",
          limit: 60,
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
        const alumnoId = String(req.body?.alumnoId || "").trim();
        if (!alumnoId) {
          res.status(400).json({error: "alumnoId requerido"});
          return;
        }

        const isOwner = callerUid === alumnoId;
        const isPrivileged = isOwner ? false : await isCallerAdminOrDirectivo(db, callerUid);
        if (!isOwner && !isPrivileged) {
          res.status(403).json({error: "No autorizado"});
          return;
        }

        const bucket = admin.storage().bucket();
        const [files] = await bucket.getFiles({prefix: `expediente/${alumnoId}/`});

        const expiresAt = Date.now() + 15 * 60 * 1000;
        // Las versiones reemplazadas viven en `{docType}/historial/`. No son
        // el documento vigente, así que no cuentan para lo entregado ni
        // aparecen en la lista principal.
        const esHistorial = (f) => f.name.includes("/historial/");
        const docs = await Promise.all(
            files
                .filter((f) => !f.name.endsWith("/") && !esHistorial(f))
                .map(async (file) => {
                  const {docType, fileName} = parsePath(file.name);
                  const [url] = await file.getSignedUrl({
                    version: "v4",
                    action: "read",
                    expires: expiresAt,
                  });
                  const meta = file.metadata || {};
                  return {
                    docType,
                    fileName,
                    path: file.name,
                    contentType: meta.contentType || null,
                    sizeBytes: meta.size ? Number(meta.size) : null,
                    updated: meta.updated || null,
                    url,
                  };
                }),
        );

        // Más recientes primero.
        docs.sort((a, b) => String(b.updated || "").localeCompare(String(a.updated || "")));

        console.log("getExpedienteDocsUrls:lectura", {
          alumnoId,
          callerUid,
          asOwner: isOwner,
          asPrivileged: isPrivileged,
          count: docs.length,
        });

        // Qué exige el expediente de ESTE alumno y qué le falta todavía. Se
        // calcula aquí para que el portal (alumno y administración) muestre lo
        // mismo que valida el backend, sin duplicar la regla en el frontend.
        const {requeridos, opcionales} = await documentosDelAlumno(db, alumnoId);
        const entregados = new Set(docs.map((d) => d.docType).filter(Boolean));
        const faltantes = [...requeridos].filter((t) => !entregados.has(t));

        // El historial es material de auditoría: solo administración y
        // directivos. Al alumno le basta con su documento vigente.
        let historial = [];
        if (isPrivileged) {
          historial = await Promise.all(
              files
                  .filter((f) => !f.name.endsWith("/") && esHistorial(f))
                  .map(async (file) => {
                    const [url] = await file.getSignedUrl({
                      version: "v4",
                      action: "read",
                      expires: expiresAt,
                    });
                    const meta = file.metadata || {};
                    const partes = file.name.split("/");
                    return {
                      docType: partes[2] || "",
                      fileName: partes[partes.length - 1] || "",
                      path: file.name,
                      sizeBytes: meta.size ? Number(meta.size) : null,
                      reemplazadoEn: meta.timeCreated || null,
                      url,
                    };
                  }),
          );
          historial.sort((a, b) =>
            String(b.reemplazadoEn || "").localeCompare(String(a.reemplazadoEn || "")));
        }

        res.json({
          ok: true,
          alumnoId,
          docs,
          historial,
          requeridos: [...requeridos],
          opcionales: [...opcionales],
          faltantes,
          expedienteCompleto: faltantes.length === 0,
        });
      } catch (err) {
        console.error("getExpedienteDocsUrls:", err);
        if (err.code === "auth/id-token-expired" || err.code === "auth/argument-error") {
          res.status(401).json({error: "Sesión inválida o expirada"});
          return;
        }
        res.status(500).json({error: "No se pudieron obtener los documentos"});
      }
    },
);
