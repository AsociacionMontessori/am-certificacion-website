const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {resolveSku, resolveColegiaturaSkuByNivel, ALUMNOS_SITE_URL} = require("./catalog");
const {rejectIfCheckoutDisabled} = require("./featureFlags");

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

exports.createSubscriptionCheckoutHandler = onRequest(
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
      if (rejectIfCheckoutDisabled(res)) return;

      try {
        const authHeader = req.get("Authorization") || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!token) {
          res.status(401).json({error: "No autenticado"});
          return;
        }

        const decoded = await admin.auth().verifyIdToken(token);
        const uid = decoded.uid;
        const db = admin.firestore();
        const stripe = new Stripe(stripeSecretKey.value());

        const alumnoRef = db.collection("alumnos").doc(uid);
        const alumnoSnap = await alumnoRef.get();
        if (!alumnoSnap.exists) {
          res.status(404).json({error: "Perfil de alumno no encontrado"});
          return;
        }

        const alumno = alumnoSnap.data();
        const nivel = alumno.nivel || "";
        const sku = await resolveColegiaturaSkuByNivel(db, nivel);

        if (!sku) {
          res.status(400).json({
            error: "Tu nivel no tiene una colegiatura configurada para suscripción automática",
          });
          return;
        }

        const resolved = await resolveSku(db, sku);
        if (!resolved) {
          res.status(503).json({error: "Precio de suscripción no configurado en Stripe"});
          return;
        }

        let customerId = alumno.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: decoded.email || alumno.email,
            name: alumno.nombre || decoded.name,
            metadata: {alumnoId: uid, firebaseUid: uid},
          });
          customerId = customer.id;
          await alumnoRef.update({stripeCustomerId: customerId});
        }

        const alumnosSite = ALUMNOS_SITE_URL.value().replace(/\/$/, "");
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer: customerId,
          line_items: [{price: resolved.priceId, quantity: 1}],
          success_url: `${alumnosSite}/pagos?stripe=subscription_success`,
          cancel_url: `${alumnosSite}/pagos?stripe=subscription_cancel`,
          metadata: {
            alumnoId: uid,
            origen: "portal_alumnos",
            tipo: "suscripcion_colegiatura",
            nivel,
            sku,
          },
        });

        res.status(200).json({url: session.url});
      } catch (error) {
        console.error("createSubscriptionCheckout:", error);
        res.status(500).json({error: error.message || "Error al crear suscripción"});
      }
    },
);
