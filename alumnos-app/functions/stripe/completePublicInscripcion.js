const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {isOrdenFlujoInscripcion} = require("./programasCheckout");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NIVELES_VALIDOS = new Set([
  "Propedéutico",
  "Nido & Comunidad infantil",
  "Casa de Niños",
  "Taller",
  "Neuroeducación",
]);

/**
 * @param {string} value
 * @return {admin.firestore.Timestamp|null}
 */
function parseDateField(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Completa datos administrativos de inscripción tras pago Stripe.
 */
exports.completePublicInscripcionHandler = onRequest(
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
        const body = req.body || {};
        const ordenId = String(body.ordenId || "").trim();
        const nombre = String(body.nombreCompleto || body.nombre || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const telefono = String(body.telefono || "").trim();
        const nivel = String(body.nivel || "").trim();
        const mailClassroom = String(body.mailClassroom || "").trim() || null;
        const passwordClassroom = String(body.passwordClassroom || "").trim() || null;

        if (!ordenId) {
          res.status(400).json({error: "Referencia de orden requerida"});
          return;
        }
        if (!nombre || nombre.length < 2) {
          res.status(400).json({error: "Nombre completo requerido"});
          return;
        }
        if (!EMAIL_REGEX.test(email)) {
          res.status(400).json({error: "Correo electrónico no válido"});
          return;
        }
        if (!telefono || telefono.length < 8) {
          res.status(400).json({error: "Teléfono de contacto requerido"});
          return;
        }
        if (!NIVELES_VALIDOS.has(nivel)) {
          res.status(400).json({error: "Nivel no válido"});
          return;
        }

        const fechaIngreso = parseDateField(body.fechaIngreso);
        const fechaEgresoEstimada = parseDateField(body.fechaEgresoEstimada);
        if (!fechaIngreso || !fechaEgresoEstimada) {
          res.status(400).json({error: "Fechas de ingreso y egreso requeridas"});
          return;
        }

        const db = admin.firestore();
        const ordenRef = db.collection("ordenes").doc(ordenId);
        const ordenSnap = await ordenRef.get();
        if (!ordenSnap.exists) {
          res.status(404).json({error: "Orden no encontrada"});
          return;
        }

        const orden = ordenSnap.data();
        if (!isOrdenFlujoInscripcion(orden.tipo)) {
          res.status(400).json({error: "Esta referencia no corresponde a una inscripción"});
          return;
        }
        if (orden.estado !== "pagado") {
          res.status(402).json({error: "El pago de inscripción aún no está confirmado"});
          return;
        }

        const payload = {
          nombre,
          email,
          telefono,
          nivel,
          fechaIngreso,
          fechaEgresoEstimada,
          mailClassroom,
          passwordClassroom,
          estadoInscripcion: "Datos completos",
          formularioCompleto: true,
          datosCompletadosAt: admin.firestore.FieldValue.serverTimestamp(),
          ordenId,
          metodoPago: "stripe",
          origen: "sitio_publico_stripe",
        };

        const inscripcionesSnap = await db.collection("inscripciones")
            .where("ordenId", "==", ordenId)
            .limit(1)
            .get();

        let inscripcionId;
        if (inscripcionesSnap.empty) {
          const ref = await db.collection("inscripciones").add({
            ...payload,
            stripeCheckoutSessionId: orden.stripeCheckoutSessionId || null,
            fechaInscripcion: admin.firestore.FieldValue.serverTimestamp(),
          });
          inscripcionId = ref.id;
        } else {
          const docRef = inscripcionesSnap.docs[0].ref;
          inscripcionId = docRef.id;
          await docRef.set(payload, {merge: true});
        }

        await ordenRef.set({inscripcionId, formularioCompleto: true}, {merge: true});

        res.json({ok: true, inscripcionId, ordenId});
      } catch (err) {
        console.error("completePublicInscripcion:", err);
        res.status(500).json({error: "Error al guardar la inscripción"});
      }
    },
);
