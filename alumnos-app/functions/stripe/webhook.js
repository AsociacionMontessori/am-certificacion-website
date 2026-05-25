const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const {notifyAdminOrdenPagada, notifyAdminPago} = require("./notifications");
const {isOrdenFlujoInscripcion, getProgramaCheckout} = require("./programasCheckout");

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {string} eventId
 * @return {Promise<boolean>}
 */
async function markEventProcessed(db, eventId) {
  const ref = db.collection("stripe_events").doc(eventId);
  const existing = await ref.get();
  if (existing.exists) return false;
  await ref.set({
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return true;
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {string} ordenId
 * @param {object} session
 */
async function handleOrdenPublicaPagada(db, ordenId, session) {
  const ordenRef = db.collection("ordenes").doc(ordenId);
  const ordenSnap = await ordenRef.get();
  if (!ordenSnap.exists) {
    console.warn("Orden no encontrada:", ordenId);
    return;
  }

  const amountTotal = session.amount_total ? session.amount_total / 100 : null;
  const moneda = (session.currency || "mxn").toUpperCase();

  await ordenRef.update({
    estado: "pagado",
    stripePaymentIntentId: session.payment_intent || null,
    monto: amountTotal,
    moneda,
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    envio: session.shipping_details || session.customer_details?.address || null,
  });

  const orden = {id: ordenId, ...ordenSnap.data(), monto: amountTotal, moneda};
  await notifyAdminOrdenPagada(db, orden);

  if (isOrdenFlujoInscripcion(orden.tipo)) {
    const cliente = orden.cliente || {};
    const programaLabel = orden.programa || session.metadata?.programa || "";
    const prog = getProgramaCheckout(programaLabel);
    const nivel =
      orden.nivelFormulario ||
      session.metadata?.nivelFormulario ||
      prog?.nivelFormulario ||
      programaLabel;

    const inscripcionRef = await db.collection("inscripciones").add({
      nombre: cliente.nombre || session.customer_details?.name || "",
      email: cliente.email || session.customer_email || "",
      telefono: cliente.telefono || null,
      nivel,
      nivelEspecializacion: nivel,
      programa: programaLabel,
      estadoInscripcion: "Pagado",
      metodoPago: "stripe",
      ordenId,
      stripeCheckoutSessionId: session.id,
      fechaInscripcion: admin.firestore.FieldValue.serverTimestamp(),
      origen: "sitio_publico_stripe",
      formularioCompleto: false,
      inicioCompleto: orden.tipo === "inicio_programa",
      inscripcionIncluidaEnPromo: Boolean(
          orden.promoInscripcionIncluida ||
          session.metadata?.promoInscripcionIncluida === "1",
      ),
      lineItemsPagados: orden.lineItems || [],
    });
    await ordenRef.update({inscripcionId: inscripcionRef.id});
  }
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {string} pagoId
 * @param {object} session
 */
async function handlePagoAlumnoPagado(db, pagoId, session) {
  const pagoRef = db.collection("pagos").doc(pagoId);
  const pagoSnap = await pagoRef.get();
  if (!pagoSnap.exists) return;

  const montoPagado = session.amount_total ? session.amount_total / 100 : (pagoSnap.data().stripeMontoCheckout || pagoSnap.data().monto);

  await pagoRef.update({
    estado: "Validado",
    metodoPago: "stripe",
    montoPagado,
    fechaPago: admin.firestore.FieldValue.serverTimestamp(),
    stripePaymentIntentId: session.payment_intent || null,
    validadoPor: "stripe_webhook",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await notifyAdminPago(db, {
    subject: `Pago Stripe validado — ${pagoSnap.data().tipo || "Pago"}`,
    html: `<p>El pago <strong>${pagoId}</strong> fue validado automáticamente por Stripe.</p>`,
    text: `Pago ${pagoId} validado por Stripe`,
    tipo: "stripe_pago_alumno",
  });
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {object} invoice
 */
async function handleInvoicePaid(db, invoice) {
  const customerId = invoice.customer;
  if (!customerId) return;

  const alumnosSnap = await db.collection("alumnos")
      .where("stripeCustomerId", "==", customerId)
      .limit(1)
      .get();

  if (alumnosSnap.empty) return;

  const alumnoDoc = alumnosSnap.docs[0];
  const alumnoId = alumnoDoc.id;
  const periodo = new Date((invoice.status_transitions?.paid_at || Date.now()) * 1000);
  const mesKey = `${periodo.getFullYear()}-${String(periodo.getMonth() + 1).padStart(2, "0")}`;

  const existente = await db.collection("pagos")
      .where("alumnoId", "==", alumnoId)
      .where("tipo", "==", "Colegiatura")
      .where("periodoSuscripcion", "==", mesKey)
      .limit(1)
      .get();

  const montoPagado = invoice.amount_paid ? invoice.amount_paid / 100 : 0;

  if (!existente.empty) {
    await existente.docs[0].ref.update({
      estado: "Validado",
      metodoPago: "stripe",
      montoPagado,
      fechaPago: admin.firestore.FieldValue.serverTimestamp(),
      stripeInvoiceId: invoice.id,
      validadoPor: "stripe_webhook",
    });
    return;
  }

  await db.collection("pagos").add({
    alumnoId,
    tipo: "Colegiatura",
    descripcion: `Colegiatura ${mesKey} (suscripción Stripe)`,
    monto: montoPagado,
    montoPagado,
    estado: "Validado",
    metodoPago: "stripe",
    periodoSuscripcion: mesKey,
    stripeInvoiceId: invoice.id,
    fechaPago: admin.firestore.FieldValue.serverTimestamp(),
    fechaVencimiento: admin.firestore.Timestamp.fromDate(periodo),
    validadoPor: "stripe_webhook",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await alumnoDoc.ref.update({
    stripeSubscriptionId: invoice.subscription || alumnoDoc.data().stripeSubscriptionId || null,
    suscripcionColegiaturaActiva: true,
  });
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {object} invoice
 */
async function handleInvoiceFailed(db, invoice) {
  const customerId = invoice.customer;
  if (!customerId) return;

  const alumnosSnap = await db.collection("alumnos")
      .where("stripeCustomerId", "==", customerId)
      .limit(1)
      .get();

  if (alumnosSnap.empty) return;

  const alumno = alumnosSnap.docs[0];
  await alumno.ref.update({
    pagoSuscripcionAtrasado: true,
    ultimoFalloSuscripcion: admin.firestore.FieldValue.serverTimestamp(),
  });

  await notifyAdminPago(db, {
    subject: "Fallo en cobro de colegiatura (Stripe)",
    html: `<p>Falló el cobro de suscripción para el alumno <strong>${alumno.data().nombre || alumno.id}</strong>.</p>`,
    text: `Fallo suscripción alumno ${alumno.id}`,
    tipo: "stripe_suscripcion_fallo",
  });
}

exports.stripeWebhookHandler = onRequest(
    {
      region: "us-central1",
      secrets: [stripeSecretKey, stripeWebhookSecret],
      cors: false,
      invoker: "public",
    },
    async (req, res) => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const stripe = new Stripe(stripeSecretKey.value());
      const sig = req.get("stripe-signature");
      let event;

      try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            stripeWebhookSecret.value(),
        );
      } catch (err) {
        console.error("Webhook signature error:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      const db = admin.firestore();
      const shouldProcess = await markEventProcessed(db, event.id);
      if (!shouldProcess) {
        res.status(200).json({received: true, duplicate: true});
        return;
      }

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object;
            const ordenId = session.metadata?.ordenId;
            const pagoId = session.metadata?.pagoId;

            if (ordenId) {
              await handleOrdenPublicaPagada(db, ordenId, session);
            }
            if (pagoId) {
              await handlePagoAlumnoPagado(db, pagoId, session);
            }
            if (session.mode === "subscription" && session.metadata?.alumnoId) {
              const alumnoRef = db.collection("alumnos").doc(session.metadata.alumnoId);
              await alumnoRef.set({
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                suscripcionColegiaturaActiva: true,
              }, {merge: true});
            }
            break;
          }
          case "checkout.session.expired": {
            const session = event.data.object;
            const ordenId = session.metadata?.ordenId;
            if (ordenId) {
              await db.collection("ordenes").doc(ordenId).update({
                estado: "expirado",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
            break;
          }
          case "invoice.paid":
            await handleInvoicePaid(db, event.data.object);
            break;
          case "invoice.payment_failed":
            await handleInvoiceFailed(db, event.data.object);
            break;
          case "customer.subscription.deleted": {
            const sub = event.data.object;
            const alumnosSnap = await db.collection("alumnos")
                .where("stripeSubscriptionId", "==", sub.id)
                .limit(1)
                .get();
            if (!alumnosSnap.empty) {
              await alumnosSnap.docs[0].ref.update({
                suscripcionColegiaturaActiva: false,
                stripeSubscriptionId: admin.firestore.FieldValue.delete(),
              });
            }
            break;
          }
          default:
            break;
        }

        res.status(200).json({received: true});
      } catch (error) {
        console.error("Webhook handler error:", error);
        res.status(500).json({error: "Error interno"});
      }
    },
);
