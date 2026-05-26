const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const {handleCors, rejectIfOriginNotAllowed} = require("./cors");
const {ALUMNOS_SITE_URL} = require("./catalog");
const {rejectIfCheckoutDisabled} = require("./featureFlags");

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

exports.createCustomerPortalHandler = onRequest(
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

        const alumnoSnap = await db.collection("alumnos").doc(uid).get();
        const customerId = alumnoSnap.data()?.stripeCustomerId;

        if (!customerId) {
          res.status(400).json({error: "No tienes una suscripción activa en Stripe"});
          return;
        }

        const alumnosSite = ALUMNOS_SITE_URL.value().replace(/\/$/, "");
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${alumnosSite}/pagos`,
        });

        res.status(200).json({url: portalSession.url});
      } catch (error) {
        console.error("createCustomerPortal:", error);
        res.status(500).json({error: error.message || "Error al abrir el portal"});
      }
    },
);
