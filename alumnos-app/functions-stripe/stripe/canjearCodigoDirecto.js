const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {enforceRateLimit} = require("./rateLimit");
const {generateAccessToken, hashAccessToken} = require("./accessToken");
const {SKU_INSCRIPCION} = require("./programasCheckout");

// El código de inscripción directa vive en Firestore (config/inscripcionDirecta)
// para poder rotarlo sin redeploy: { codigo: "1jH349mM", activo: true }.
const CONFIG_DOC = {coleccion: "config", id: "inscripcionDirecta"};

// Las órdenes creadas por canje viven 7 días (el alumno puede tardar en
// completar su expediente tras recibir el código del equipo).
const ACCESS_TOKEN_DIRECTO_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ID_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // sin 0/O/1/I/l

/**
 * ID corto aleatorio (estilo `1jH349mM`) para usar como referencia/doc id.
 * @param {number} length
 * @return {string}
 */
function generateShortId(length = 8) {
  const bytes = crypto.randomBytes(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  }
  return id;
}

/**
 * Comparación en tiempo constante de dos strings (evita timing attacks
 * sobre el código compartido). Distinta longitud ⇒ false.
 * @param {string} a
 * @param {string} b
 * @return {boolean}
 */
function safeEqualStr(a, b) {
  const ba = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Canjea el código de inscripción directa por una orden de inscripción
 * YA PAGADA (pago confirmado por el equipo fuera de línea: transferencia,
 * efectivo, terminal, etc.). Devuelve `ordenId` + `accessToken` con los que
 * el alumno continúa el flujo normal (Parte 1 y Parte 2).
 *
 * Un mismo código sirve para todos los alumnos: cada canje genera su propia
 * orden, así no colisionan entre sí.
 */
exports.canjearCodigoDirectoHandler = onRequest(
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
        // Límite estricto: el código es la única barrera, así que cerramos
        // la puerta a fuerza bruta.
        if (await enforceRateLimit(db, req, res, {
          key: "canjearCodigoDirecto",
          limit: 15,
          windowSeconds: 600,
        })) return;

        const codigoRecibido = String(req.body?.codigo || "").trim();
        if (!codigoRecibido) {
          res.status(400).json({error: "Indica tu referencia de pago"});
          return;
        }

        const configSnap = await db
            .collection(CONFIG_DOC.coleccion).doc(CONFIG_DOC.id).get();
        const config = configSnap.exists ? configSnap.data() : null;
        const codigoActivo = config?.activo === true ? String(config.codigo || "") : "";

        if (!codigoActivo || !safeEqualStr(codigoRecibido, codigoActivo)) {
          // Mensaje genérico: no revelamos si el código existe o está inactivo.
          res.status(403).json({error: "Referencia de pago no válida"});
          return;
        }

        // Generar un ordenId corto único (reintentos por colisión, muy raro).
        let ordenId = "";
        let ordenRef = null;
        for (let intento = 0; intento < 5; intento++) {
          const candidato = generateShortId(8);
          if (safeEqualStr(candidato, codigoActivo)) continue; // jamás == al código
          const ref = db.collection("ordenes").doc(candidato);
          const exists = (await ref.get()).exists;
          if (!exists) {
            ordenId = candidato;
            ordenRef = ref;
            break;
          }
        }
        if (!ordenRef) {
          res.status(500).json({error: "No se pudo generar la referencia. Intenta de nuevo."});
          return;
        }

        const accessToken = generateAccessToken();
        const accessTokenHash = hashAccessToken(accessToken);
        const accessTokenExpiresAt = admin.firestore.Timestamp.fromMillis(
            Date.now() + ACCESS_TOKEN_DIRECTO_TTL_MS,
        );

        await ordenRef.set({
          tipo: "inscripcion",
          estado: "pagado",
          stripeCheckoutSessionId: null,
          cliente: {nombre: "", email: "", telefono: null},
          lineItems: [{sku: SKU_INSCRIPCION, quantity: 1}],
          programa: null,
          nivelFormulario: null,
          modoPago: "pago_directo",
          promoInscripcionIncluida: false,
          codigoPromocional: null,
          montoEstimadoMxn: 0,
          requiereFacturaFiscal: false,
          cuentaContable: "",
          moneda: "mxn",
          monto: null,
          origen: "pago_directo",
          metodoPago: "directo",
          accessTokenHash,
          accessTokenExpiresAt,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          canjeCodigoDirecto: true,
        });

        // Auditoría: registrar cada canje para poder revisar usos del código.
        try {
          await db.collection("canjesCodigoDirecto").add({
            ordenId,
            ip: req.ip || req.get("x-forwarded-for") || null,
            userAgent: req.get("user-agent") || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (auditErr) {
          console.error("canjearCodigoDirecto:audit", auditErr);
        }

        res.json({ok: true, ordenId, accessToken});
      } catch (err) {
        console.error("canjearCodigoDirecto:", err);
        res.status(500).json({error: "No se pudo procesar la referencia"});
      }
    },
);
