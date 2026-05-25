const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {enforceRateLimit} = require("./rateLimit");
const {ESCOLARIDAD, DOCUMENTOS_PARTE2_REQUERIDOS, DOCUMENTOS_PARTE2_OPCIONALES} = require("./inscripcionCatalog");

async function fileExists(bucket, path) {
  try {
    const [exists] = await bucket.file(path).exists();
    return exists;
  } catch {
    return false;
  }
}

/**
 * Parte 2: expediente administrativo + documentos (sin comprobante de pago).
 */
exports.completeInscripcionParte2Handler = onRequest(
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
          key: "completeInscripcionParte2",
          limit: 12,
          windowSeconds: 600,
        })) return;

        const body = req.body || {};
        const ordenId = String(body.ordenId || "").trim();
        const escolaridad = String(body.escolaridad || "").trim();
        const domicilio = String(body.domicilio || "").trim();
        const curpPasaporte = String(body.curpPasaporte || "").trim();
        const ocupacion = String(body.ocupacion || "").trim();
        const empresa = String(body.empresa || "").trim();
        const telefonoEmpresa = String(body.telefonoEmpresa || "").trim();
        const documentos = body.documentos || {};

        if (!ordenId) {
          res.status(400).json({error: "Referencia de orden requerida"});
          return;
        }
        if (!ESCOLARIDAD.has(escolaridad)) {
          res.status(400).json({error: "Escolaridad no válida"});
          return;
        }
        if (!domicilio || domicilio.length < 5) {
          res.status(400).json({error: "Domicilio particular requerido"});
          return;
        }
        if (!curpPasaporte || curpPasaporte.length < 5) {
          res.status(400).json({error: "CURP o número de pasaporte requerido"});
          return;
        }
        if (!ocupacion) {
          res.status(400).json({error: "Ocupación actual requerida"});
          return;
        }

        const ordenSnap = await db.collection("ordenes").doc(ordenId).get();
        if (!ordenSnap.exists) {
          res.status(404).json({error: "Orden no encontrada"});
          return;
        }
        const orden = ordenSnap.data();
        if (orden.estado !== "pagado") {
          res.status(402).json({error: "Pago no confirmado"});
          return;
        }

        const inscripcionesSnap = await db.collection("inscripciones")
            .where("ordenId", "==", ordenId)
            .limit(1)
            .get();
        if (inscripcionesSnap.empty) {
          res.status(400).json({error: "Completa primero el formulario de cuenta (parte 1)"});
          return;
        }

        const inscripcionRef = inscripcionesSnap.docs[0].ref;
        const inscripcion = inscripcionesSnap.docs[0].data();
        if (!inscripcion.parte1Completa || !inscripcion.alumnoId) {
          res.status(400).json({error: "Completa primero el formulario de cuenta (parte 1)"});
          return;
        }

        // Bloquear re-submission del expediente. Si ya quedó completo, solo admin
        // puede corregir desde el portal interno. Evita que un atacante con el
        // ordenId sobrescriba documentos o datos legítimos (F-02).
        if (inscripcion.parte2Completa || inscripcion.expedienteCompleto) {
          res.status(409).json({
            error: "El expediente ya fue entregado. Para corregir datos contacta a la administración.",
          });
          return;
        }

        const alumnoId = inscripcion.alumnoId;
        const bucket = admin.storage().bucket();
        const documentosValidados = {};

        for (const docId of DOCUMENTOS_PARTE2_REQUERIDOS) {
          const meta = documentos[docId];
          const storagePath = meta?.storagePath ? String(meta.storagePath) : "";
          if (!storagePath || !storagePath.startsWith(`expediente/${alumnoId}/${docId}/`)) {
            res.status(400).json({error: `Falta el documento: ${docId}`});
            return;
          }
          const exists = await fileExists(bucket, storagePath);
          if (!exists) {
            res.status(400).json({error: `No se encontró el archivo subido: ${docId}`});
            return;
          }
          documentosValidados[docId] = {
            storagePath,
            fileName: meta.fileName || null,
            contentType: meta.contentType || null,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
        }

        for (const docId of DOCUMENTOS_PARTE2_OPCIONALES) {
          const meta = documentos[docId];
          const storagePath = meta?.storagePath ? String(meta.storagePath) : "";
          if (!storagePath) continue;
          if (!storagePath.startsWith(`expediente/${alumnoId}/${docId}/`)) {
            res.status(400).json({error: `Ruta de archivo no válida: ${docId}`});
            return;
          }
          const exists = await fileExists(bucket, storagePath);
          if (!exists) {
            res.status(400).json({error: `No se encontró el archivo subido: ${docId}`});
            return;
          }
          documentosValidados[docId] = {
            storagePath,
            fileName: meta.fileName || null,
            contentType: meta.contentType || null,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
        }

        const expedientePayload = {
          escolaridad,
          domicilio,
          curpPasaporte,
          ocupacion,
          empresa: empresa || null,
          telefonoEmpresa: telefonoEmpresa || null,
          documentos: documentosValidados,
          parte2Completa: true,
          expedienteCompleto: true,
          parte2CompletadaAt: admin.firestore.FieldValue.serverTimestamp(),
          estadoInscripcion: "Expediente completo",
        };

        await inscripcionRef.set(expedientePayload, {merge: true});
        await db.collection("alumnos").doc(alumnoId).set({
          escolaridad,
          domicilio,
          curpPasaporte,
          ocupacion,
          empresa: empresa || null,
          telefonoEmpresa: telefonoEmpresa || null,
          expedienteCompleto: true,
          inscripcionId: inscripcionesSnap.docs[0].id,
        }, {merge: true});
        await db.collection("ordenes").doc(ordenId).set({expedienteCompleto: true}, {merge: true});

        res.json({ok: true, inscripcionId: inscripcionesSnap.docs[0].id, alumnoId});
      } catch (err) {
        console.error("completeInscripcionParte2:", err);
        res.status(500).json({error: "Error al guardar el expediente"});
      }
    },
);
