/**
 * Banderas de funcionalidad para Cloud Functions de Stripe.
 *
 * Por ahora hay una sola: `STRIPE_CHECKOUT_ENABLED`. Cuando vale "false"
 * (string), TODOS los endpoints de checkout (público + portal alumnos)
 * devuelven 503 con un mensaje claro al usuario. Esto se usa mientras la
 * cuenta Stripe Live no está activada — los pagos reales fallarían si se
 * intentaran procesar con `sk_test_`.
 *
 * Reactivación: cambiar STRIPE_CHECKOUT_ENABLED=true en el .env y re-deploy.
 */

function isCheckoutEnabled() {
  // Default: enabled. Solo se desactiva con un valor explícito "false".
  return String(process.env.STRIPE_CHECKOUT_ENABLED || "true").toLowerCase() !== "false";
}

/**
 * Responde 503 con mensaje uniforme cuando el checkout está pausado.
 * @param {import('firebase-functions/v2/https').Response} res
 * @return {boolean} `true` si se respondió (caller debe `return`).
 */
function respondCheckoutDisabled(res) {
  res.status(503).json({
    error: "Los pagos en línea están temporalmente en mantenimiento. " +
           "Por favor inscríbete por transferencia bancaria en " +
           "/inscripcion/transferencia o escríbenos a " +
           "admin@certificacionmontessori.com.",
  });
  return true;
}

/**
 * Helper para handlers HTTP: si el checkout está deshabilitado, escribe
 * 503 y devuelve `true` (caller debe `return`).
 * @param {import('firebase-functions/v2/https').Response} res
 * @return {boolean}
 */
function rejectIfCheckoutDisabled(res) {
  if (!isCheckoutEnabled()) {
    respondCheckoutDisabled(res);
    return true;
  }
  return false;
}

module.exports = {isCheckoutEnabled, respondCheckoutDisabled, rejectIfCheckoutDisabled};
