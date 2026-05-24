const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {resolveSku, ALUMNOS_SITE_URL} = require("./catalog");
const {aplicarBecasServidor, calcularMontoConRecargo} = require("./applyBecas");

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

const PAGO_TIPO_TO_SKU = {
  "Inscripción": "inscripcion_diplomado",
  "Certificado": "certificado_fisico",
};

exports.createAlumnoCheckoutHandler = onRequest(
    {
      region: "us-central1",
      secrets: [stripeSecretKey],
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
        const authHeader = req.get("Authorization") || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!token) {
          res.status(401).json({error: "No autenticado"});
          return;
        }

        const decoded = await admin.auth().verifyIdToken(token);
        const uid = decoded.uid;
        const pagoId = String(req.body?.pagoId || "").trim();

        if (!pagoId) {
          res.status(400).json({error: "pagoId requerido"});
          return;
        }

        const db = admin.firestore();
        const pagoRef = db.collection("pagos").doc(pagoId);
        const pagoSnap = await pagoRef.get();

        if (!pagoSnap.exists) {
          res.status(404).json({error: "Pago no encontrado"});
          return;
        }

        const pago = {id: pagoSnap.id, ...pagoSnap.data()};

        if (pago.alumnoId !== uid) {
          res.status(403).json({error: "No autorizado"});
          return;
        }

        if (!["Pendiente", "Vencido"].includes(pago.estado)) {
          res.status(400).json({error: "Este pago ya no está pendiente"});
          return;
        }

        const configSnap = await db.collection("configuracionPagos").doc("general").get();
        const configuracion = configSnap.exists ? configSnap.data() : {};

        const becasSnap = await db.collection("becas")
            .where("alumnoId", "==", uid)
            .where("activa", "==", true)
            .get();
        const becas = becasSnap.docs.map((d) => ({id: d.id, ...d.data()}));

        const montoBase = Number(
            pago.montoOriginal !== undefined ? pago.montoOriginal : pago.monto,
        ) || 0;
        let montoFinal = aplicarBecasServidor(montoBase, becas, pago);
        montoFinal = calcularMontoConRecargo(montoFinal, pago, configuracion);

        const amountCentavos = Math.round(montoFinal * 100);
        if (amountCentavos < 1000) {
          res.status(400).json({error: "Monto mínimo no alcanzado"});
          return;
        }

        const stripe = new Stripe(stripeSecretKey.value());
        const alumnosSite = ALUMNOS_SITE_URL.value().replace(/\/$/, "");

        let sku = PAGO_TIPO_TO_SKU[pago.tipo];
        let lineItems;

        if (pago.tipo === "Colegiatura") {
          const alumnoSnap = await db.collection("alumnos").doc(uid).get();
          const nivel = alumnoSnap.data()?.nivel || pago.nivel || "";
          const {resolveColegiaturaSkuByNivel} = require("./catalog");
          sku = await resolveColegiaturaSkuByNivel(db, nivel);
          if (!sku) {
            res.status(400).json({error: "No hay precio de colegiatura configurado para tu nivel"});
            return;
          }
          const resolved = await resolveSku(db, sku);
          if (!resolved) {
            res.status(503).json({error: "Colegiatura no configurada en Stripe"});
            return;
          }
          if (montoFinal !== montoBase) {
            lineItems = [{
              price_data: {
                currency: "mxn",
                product_data: {name: pago.descripcion || `Colegiatura - ${nivel}`},
                unit_amount: amountCentavos,
              },
              quantity: 1,
            }];
          } else {
            lineItems = [{price: resolved.priceId, quantity: 1}];
          }
        } else {
          sku = sku || "inscripcion_diplomado";
          const resolved = await resolveSku(db, sku);
          if (montoFinal !== montoBase || !resolved) {
            lineItems = [{
              price_data: {
                currency: "mxn",
                product_data: {name: pago.descripcion || pago.tipo},
                unit_amount: amountCentavos,
              },
              quantity: 1,
            }];
          } else {
            lineItems = [{price: resolved.priceId, quantity: 1}];
          }
        }

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: decoded.email || undefined,
          line_items: lineItems,
          success_url: `${alumnosSite}/pagos?stripe=success&pago=${pagoId}`,
          cancel_url: `${alumnosSite}/pagos?stripe=cancel&pago=${pagoId}`,
          metadata: {
            pagoId,
            alumnoId: uid,
            origen: "portal_alumnos",
            tipo: "pago_unico",
          },
        });

        await pagoRef.update({
          stripeCheckoutSessionId: session.id,
          stripeMontoCheckout: montoFinal,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({url: session.url});
      } catch (error) {
        console.error("createAlumnoCheckout:", error);
        res.status(500).json({error: error.message || "Error al crear el pago"});
      }
    },
);
