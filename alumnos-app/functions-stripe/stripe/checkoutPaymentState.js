/** A completed Checkout is not necessarily a completed payment (OXXO). */
function isSessionPaid(session) {
  return (session.payment_status === "paid" ||
    (session.payment_status === "no_payment_required" && session.amount_total === 0)) &&
    Number.isSafeInteger(session.amount_total) && session.amount_total >= 0 &&
    typeof session.currency === "string" && /^[a-z]{3}$/i.test(session.currency);
}

async function updateUnpaidSession(db, session, estado) {
  const targets = [
    ["ordenes", session.metadata?.ordenId],
    ["pagos", session.metadata?.pagoId],
  ].filter(([, id]) => id);
  for (const [collection, id] of targets) {
    const ref = db.collection(collection).doc(id);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Referencia de pago no encontrada");
      const data = snap.data();
      if (data.stripeCheckoutSessionId !== session.id ||
          ["pagado", "Validado"].includes(data.estado)) return;
      // Late completion notifications must not resurrect a failed voucher.
      if (estado === "pendiente_pago" &&
          ["fallido", "expirado"].includes(data.stripeEstadoPago || data.estado)) return;
      tx.update(ref, collection === "ordenes" ?
        {estado, stripeEstadoPago: estado} : {stripeEstadoPago: estado});
    });
  }
}

function oxxoCheckoutOptions(env = process.env) {
  // Dynamic payment methods: the Dashboard is the activation gate.
  return env.STRIPE_OXXO_PREPARED === "true" ?
    {payment_method_options: {oxxo: {expires_after_days: 2}}} : {};
}

module.exports = {isSessionPaid, updateUnpaidSession, oxxoCheckoutOptions};
