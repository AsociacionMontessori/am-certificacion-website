/**
 * Banderas de funcionalidad para Cloud Functions de Stripe.
 *
 * - `STRIPE_CHECKOUT_ENABLED` (default "true"): kill-switch global. Cuando es
 *   "false", todos los handlers que llaman `rejectIfCheckoutDisabled` devuelven
 *   503 (alumnos portal, subscription, customer portal). Sigue siendo el
 *   freno duro mientras no toda la oferta esté en Stripe Live.
 *
 * - `STRIPE_CHECKOUT_BOOKS_ENABLED` (default "true"): override granular para
 *   libros/ebooks en el checkout público. Se evalúa SOLO con
 *   `rejectIfFlowDisabled(res, tipos)` después de resolver los SKUs. Permite
 *   cobrar libros en live aunque el flag global siga apagado para
 *   inscripciones/colegiaturas.
 */

const BOOK_TIPOS = new Set(["libro", "ebook"]);

function isCheckoutEnabled() {
  return String(process.env.STRIPE_CHECKOUT_ENABLED || "true").toLowerCase() !== "false";
}

function isBookCheckoutEnabled() {
  return String(process.env.STRIPE_CHECKOUT_BOOKS_ENABLED || "true").toLowerCase() !== "false";
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
 * Kill-switch global: usado por handlers que no manejan SKUs (alumnos portal,
 * suscripciones, customer portal). Si el flag global está en "false", responde
 * 503 sin considerar el override de libros.
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

/**
 * Check granular para el checkout público. Permite el flujo si:
 *  - el flag global está prendido, o
 *  - el flag global está apagado pero TODOS los `tipos` solicitados son
 *    libro/ebook y el flag de libros está prendido.
 * @param {import('firebase-functions/v2/https').Response} res
 * @param {string[]} tipos  Valores de `CATALOG_META[sku].tipo` ya resueltos.
 * @return {boolean} `true` si se respondió 503 (caller debe `return`).
 */
function rejectIfFlowDisabled(res, tipos) {
  if (isCheckoutEnabled()) return false;
  const safeTipos = Array.isArray(tipos) ? tipos.filter(Boolean) : [];
  if (
    safeTipos.length > 0 &&
    safeTipos.every((t) => BOOK_TIPOS.has(t)) &&
    isBookCheckoutEnabled()
  ) {
    return false;
  }
  respondCheckoutDisabled(res);
  return true;
}

module.exports = {
  isCheckoutEnabled,
  isBookCheckoutEnabled,
  respondCheckoutDisabled,
  rejectIfCheckoutDisabled,
  rejectIfFlowDisabled,
};
