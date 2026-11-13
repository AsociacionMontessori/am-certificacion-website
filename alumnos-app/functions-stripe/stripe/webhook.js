const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const {notifyAdminOrdenPagada, notifyAdminPago} = require("./notifications");
const {isOrdenFlujoInscripcion, getProgramaCheckout} = require("./programasCheckout");
const {escapeHtml} = require("./escape");
const {isSessionPaid, updateUnpaidSession} = require("./checkoutPaymentState");

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {string} eventId
 * @return {Promise<string>}
 */
async function claimEvent(db, eventId) {
  const ref = db.collection("stripe_events").doc(eventId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() || {};
    // Legacy receipts were written before processing. Preserve them on upgrade.
    if (data.processedAt) return "done";
    if (data.leaseUntil > Date.now()) return "busy";
    tx.set(ref, {leaseUntil: Date.now() + 120000});
    return "claimed";
  });
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {string} ordenId
 * @param {object} session
 */
async function handleOrdenPublicaPagada(db, ordenId, session) {
  const ordenRef = db.collection("ordenes").doc(ordenId);
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ordenRef);
    if (!snap.exists) throw new Error("Orden no encontrada");
    const orden = snap.data();
    if (orden.estado === "pagado") return {id: ordenId, ...orden};
    const monto = session.amount_total / 100;
    const moneda = session.currency.toUpperCase();
    const paid = {
      estado: "pagado",
      stripePaymentIntentId: session.payment_intent || null,
      monto, moneda,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      envio: session.shipping_details || session.customer_details?.address || null,
    };
    if (isOrdenFlujoInscripcion(orden.tipo)) {
      const cliente = orden.cliente || {};
      const programa = orden.programa || session.metadata?.programa || "";
      const nivel = orden.nivelFormulario || session.metadata?.nivelFormulario ||
        getProgramaCheckout(programa)?.nivelFormulario || programa;
      // Stable ID and atomic linkage prevent duplicate enrolments on retries.
      const inscripcionRef = db.collection("inscripciones").doc(orden.inscripcionId || ordenId);
      const inscripcion = await tx.get(inscripcionRef);
      if (!inscripcion.exists) tx.set(inscripcionRef, {
        nombre: cliente.nombre || session.customer_details?.name || "",
        email: cliente.email || session.customer_email || "",
        telefono: cliente.telefono || null,
        nivel, nivelEspecializacion: nivel, programa,
        estadoInscripcion: "Pagado", metodoPago: "stripe", ordenId,
        stripeCheckoutSessionId: session.id,
        fechaInscripcion: admin.firestore.FieldValue.serverTimestamp(),
        origen: "sitio_publico_stripe", formularioCompleto: false,
        inicioCompleto: orden.tipo === "inicio_programa",
        inscripcionIncluidaEnPromo: Boolean(orden.promoInscripcionIncluida ||
          session.metadata?.promoInscripcionIncluida === "1"),
        lineItemsPagados: orden.lineItems || [],
      });
      paid.inscripcionId = inscripcionRef.id;
    }
    tx.update(ordenRef, paid);
    return {id: ordenId, ...orden, ...paid};
  });
  await notifyAdminOrdenPagada(db, result);
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {string} pagoId
 * @param {object} session
 */
async function handlePagoAlumnoPagado(db, pagoId, session) {
  const pagoRef = db.collection("pagos").doc(pagoId);
  const pagoSnap = await pagoRef.get();
  if (!pagoSnap.exists) throw new Error("Pago no encontrado");

  const montoPagado = session.amount_total / 100;

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
    html: `<p>El pago <strong>${escapeHtml(pagoId)}</strong> fue validado automáticamente por Stripe.</p>`,
    text: `Pago ${pagoId} validado por Stripe`,
    tipo: "stripe_pago_alumno",
    dedupKey: `pago_${pagoId}`,
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
    html: `<p>Falló el cobro de suscripción para el alumno <strong>${escapeHtml(alumno.data().nombre || alumno.id)}</strong>.</p>`,
    text: `Fallo suscripción alumno ${alumno.id}`,
    tipo: "stripe_suscripcion_fallo",
  });
}

exports.stripeWebhookHandler = onRequest(
    {
      region: "us-central1",
      secrets: [stripeSecretKey, stripeWebhookSecret],
      timeoutSeconds: 60, // Shorter than the event lease.
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
      let claimed = false;
      try {
        const claim = await claimEvent(db, event.id);
        if (claim === "done") {
          res.status(200).json({received: true, duplicate: true});
          return;
        }
        if (claim === "busy") {
          res.status(503).json({error: "Evento en proceso; reintentar"});
          return;
        }
        claimed = true;
        switch (event.type) {
          case "checkout.session.completed":
          case "checkout.session.async_payment_succeeded": {
            const session = event.data.object;
            const ordenId = session.metadata?.ordenId;
            const pagoId = session.metadata?.pagoId;

            if (session.mode === "subscription" && session.metadata?.alumnoId) {
              const alumnoRef = db.collection("alumnos").doc(session.metadata.alumnoId);
              await alumnoRef.set({
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                ...(isSessionPaid(session) ? {suscripcionColegiaturaActiva: true} : {}),
              }, {merge: true});
            }
            if (!isSessionPaid(session)) {
              await updateUnpaidSession(db, session, "pendiente_pago");
              break;
            }
            if (ordenId) {
              await handleOrdenPublicaPagada(db, ordenId, session);
            }
            if (pagoId) {
              await handlePagoAlumnoPagado(db, pagoId, session);
            }
            break;
          }
          case "checkout.session.expired":
          case "checkout.session.async_payment_failed": {
            await updateUnpaidSession(db, event.data.object,
              event.type === "checkout.session.expired" ? "expirado" : "fallido");
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

        await db.collection("stripe_events").doc(event.id).set({
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).json({received: true});
      } catch (error) {
        // Release only the lease owned by this request (busy returns above).
        if (claimed) await db.collection("stripe_events").doc(event.id).delete().catch(() => {});
        console.error("Webhook handler error:", error);
        res.status(500).json({error: "Error interno"});
      }
    },
);
