/**
 * Banderas de funcionalidad para el portal de alumnos.
 *
 * `stripeCheckoutEnabled`: cuando es `false`, la UI oculta los botones de
 * "Pagar con tarjeta" y muestra un banner explicativo. La opción de subir
 * comprobante de transferencia sigue disponible.
 *
 * Por defecto está DESHABILITADO (sin env var). Para activarlo, definir
 * `VITE_STRIPE_CHECKOUT_ENABLED=true` en `alumnos-app/.env` y rebuildear.
 *
 * Backend acompañante: `alumnos-app/functions-stripe/stripe/featureFlags.js`
 * con `STRIPE_CHECKOUT_ENABLED`. Ambas deben estar sincronizadas.
 */
export const stripeCheckoutEnabled =
  String(import.meta.env.VITE_STRIPE_CHECKOUT_ENABLED || '').toLowerCase() === 'true';
