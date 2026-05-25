const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {enforceRateLimit} = require("./rateLimit");

/**
 * F-01 — Verificación pública de certificados como Cloud Function.
 *
 * Sustituye la consulta directa anónima
 *   getDocs(query(collection(db,'alumnos'), where('folioCertificado','==', folio)))
 * que hoy depende de `allow list: if true` en `alumnos`. Esa regla expone
 * la colección completa de alumnos a un dump anónimo (PII, CURP, etc.).
 *
 * Esta Function corre con Admin SDK, así que la rule de Firestore puede
 * endurecerse a `allow list: if canReadAdmin();` sin romper la verificación
 * pública. La Function devuelve solo los campos necesarios para presentar
 * el certificado al verificador externo: nombre, nivel, estado, fechas.
 *
 * Comparación de código con `timingSafeEqual` para evitar oráculos de tiempo.
 */
function normalize(value) {
  return String(value || "").trim().toUpperCase();
}

function timingSafeEqualStrings(a, b) {
  const ba = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function isoDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") {
    const d = value.toDate();
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

exports.verificarCertificadoPublicoHandler = onRequest(
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
          key: "verificarCertificadoPublico",
          limit: 60,
          windowSeconds: 600,
        })) return;

        const folio = normalize(req.body?.folio);
        const codigo = normalize(req.body?.codigoVerificacion || req.body?.codigo);

        if (!folio || !codigo) {
          res.status(400).json({valido: false, error: "Folio y código de verificación requeridos"});
          return;
        }

        // Búsqueda por folio. Como la Function corre con privilegios admin,
        // accede sin pasar por las rules de Firestore.
        const snap = await db.collection("alumnos")
            .where("folioCertificado", "==", folio)
            .limit(1)
            .get();

        if (snap.empty) {
          res.json({valido: false, error: "No se encontró un certificado con ese folio"});
          return;
        }

        const alumnoDoc = snap.docs[0];
        const alumnoData = alumnoDoc.data() || {};
        const codigoGuardado = normalize(alumnoData.codigoVerificacion);

        if (!codigoGuardado || !timingSafeEqualStrings(codigoGuardado, codigo)) {
          res.json({valido: false, error: "El código de verificación no coincide con el folio"});
          return;
        }

        if (alumnoData.estado === "Inactivo") {
          res.json({valido: false, error: "El certificado fue dado de baja"});
          return;
        }

        const graduacionSnap = await db.collection("graduacion").doc(alumnoDoc.id).get();
        const graduacionData = graduacionSnap.exists ? graduacionSnap.data() : null;
        const graduacionCompleta = Boolean(graduacionData?.progresoCompleto);
        const nivelGraduacion = graduacionData?.nivelGraduacion || alumnoData.nivel || null;

        // Respuesta mínima — solo lo necesario para la pantalla de verificación.
        // No incluye PII sensible (CURP, domicilio, email, teléfono, password).
        res.json({
          valido: true,
          alumno: {
            id: alumnoDoc.id,
            nombre: alumnoData.nombre || "",
            nivel: graduacionCompleta ? nivelGraduacion : alumnoData.nivel || null,
            nivelActual: alumnoData.nivel || null,
            nivelGraduacion,
            fechaIngreso: graduacionCompleta ?
              isoDate(graduacionData?.fechaIngresoNivel) || isoDate(alumnoData.fechaIngreso) :
              isoDate(alumnoData.fechaIngreso),
            fechaEgreso: graduacionCompleta ?
              isoDate(graduacionData?.fechaEgresoNivel) || isoDate(alumnoData.fechaEgresoEstimada || alumnoData.fechaEgreso) :
              isoDate(alumnoData.fechaEgresoEstimada || alumnoData.fechaEgreso),
            estado: graduacionCompleta ? "Graduado" : (alumnoData.estado || "Activo"),
            fechaGraduacion: isoDate(graduacionData?.fechaGraduacion),
          },
        });
      } catch (err) {
        console.error("verificarCertificadoPublico:", err);
        res.status(500).json({valido: false, error: "Error al verificar el certificado"});
      }
    },
);
