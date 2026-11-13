# Preparación OXXO y PayPal — 2026-11-13

## Estado real

Preparación local en rama `feat/oxxo-paypal-preparation`, sin desplegar, activar métodos en cuentas, crear compras reales ni modificar secretos.

| Componente | Preparado | Falta antes de ofrecerlo |
| --- | --- | --- |
| OXXO, checkout público | Confirmación diferida, fallos/expiración, recibos de evento reintentables, inscripción transaccional, notificaciones idempotentes, consulta autenticada de estado y pantalla ES/EN/PT | Prueba Stripe test de extremo a extremo, revisión de cuenta, despliegue coordinado y habilitación en Dashboard |
| PayPal | Adaptador **sólo sandbox** Orders v2 para crear/capturar, claves idempotentes, comprobación de captura/importe/MXN/orden/beneficiario | Cuenta Business y app sandbox; endpoints públicos autenticados, catálogo/precios/promociones/envío del servidor, botón, webhooks verificados, conciliación y pruebas sandbox. No es todavía una integración pública completa |
| Portal alumnos | Webhook ya diferencia pago diferido de validado; fallo no altera Pendiente/Vencido | UX de ficha/estado, bloqueo de sesiones duplicadas, expiración y pruebas; no habilitar allí todavía |
| Suscripciones | Conservan Checkout; vinculan cliente/suscripción aun antes de confirmar, sin declarar activo un pago pendiente | OXXO no es compatible con cargos recurrentes |

## Diseño / compatibilidad

- Mantener Checkout Sessions y métodos dinámicos de Stripe. No actualizar versión API/SDK en el mismo cambio: el SDK 18 existente soporta las opciones necesarias.
- `checkout.session.completed` sólo entrega si `payment_status` es `paid` o `no_payment_required` con importe cero. Una ficha creada queda `pendiente_pago`.
- `checkout.session.async_payment_succeeded` entrega; `async_payment_failed` marca fallo. Un evento tardío no degrada un pago confirmado ni revive una ficha fallida. La sesión debe coincidir para actualizaciones no pagadas.
- Confirmación e inscripción se escriben en una transacción; la inscripción nueva usa el ID de la orden. Se preserva el `inscripcionId` existente. Notificaciones por orden/admin con `create`, sin reescribir correos enviados.
- Recibos de eventos sólo quedan `processedAt` después del éxito. Lease 120 s frente a timeout HTTP 60 s; un duplicado en curso responde 503 para reintento. Los recibos históricos se conservan: este cambio no reconcilia fallos antiguos.
- `getCheckoutPaymentStatus` exige token de orden incluso para consultar; no admite bypass legacy ni devuelve PII. Tokens nuevos duran 8 días si `STRIPE_OXXO_PREPARED=true`, para cubrir la ficha de dos días y confirmación. No cambia tokens ya emitidos.
- La pantalla de retorno consulta estado real, nunca toma el query string como prueba de pago. Espera hasta 12 consultas cada 5 segundos, luego permite consulta manual. Descargas/cuenta no se muestran hasta confirmar. Los endpoints existentes siguen comprobando `pagado`.
- Enlaces antiguos sin token no pueden confirmar estado en la nueva pantalla; deben resolverse con administración. Revisar órdenes en curso antes del despliegue, sin abrir acceso anónimo ni ampliar tokens históricos masivamente.
- OXXO redirige a la ficha alojada en Stripe. No confundir la referencia interna de orden con el código de barras OXXO.
- `STRIPE_OXXO_PREPARED=true` sólo configura vencimiento de dos días y TTL de tokens. **No habilita ni deshabilita OXXO**: el gate efectivo son los métodos dinámicos del Dashboard. No activarlo en Dashboard antes del despliegue y pruebas.

## Activación OXXO (pendiente, no ejecutada)

1. Revisar métodos actuales de Stripe, cuenta mexicana y precios reales en MXN. OXXO permite $10–$10,000 por operación; Stripe decide elegibilidad sobre el total final, incluidos descuentos. Revisar promociones y envío, no sólo catálogo estimado.
2. En un proyecto de pruebas separado y Stripe test, configurar `STRIPE_OXXO_PREPARED=true`; desplegar `stripeWebhook`, `createPublicCheckout` y `getCheckoutPaymentStatus` de codebase `stripe`. Probar con datos ficticios, sin Gmail/Sheets/bienvenidas reales. No usar el entorno productivo con llaves test por comodidad.
3. Conservar eventos del webhook existente y añadir **ambos** `checkout.session.async_payment_succeeded` y `checkout.session.async_payment_failed`. No recrear el endpoint ni rotar su firma. El script `stripe-setup-webhook.js` incluye esos eventos para endpoints nuevos de test; no migra existentes.
4. Apuntar frontend de pruebas a los endpoints correctos (`GATSBY_CHECKOUT_API_URL`, `GATSBY_CHECKOUT_STATUS_API_URL` y demás APIs de inscripción/descarga). Compilar y servir ese frontend; probar inscripción, libro físico, ebook y cupón 100%.
5. Activar OXXO sólo en Stripe test. Usar emails documentados por Stripe: `succeed_immediately@example.com`, `expire_immediately@example.com`; verificar estado pendiente antes del evento final, confirmación/fallo, duplicados y reintentos. Comprobar importe/cuenta y ausencia de efectos reales.
6. Revisar las pruebas con Carlos. Desplegar backend y frontend juntos antes de habilitar OXXO live. Mantenerlo desactivado en el portal hasta resolver su UX y sesiones múltiples. No anunciar domiciliación OXXO ni reembolso automático por ese método.

Rollback: deshabilitar OXXO para **nuevas** compras en Dashboard, pero mantener el webhook/consulta funcionando para fichas emitidas pendientes. No volver al webhook antiguo mientras puedan llegar confirmaciones diferidas: validaría fichas sin pago. Quitar el flag no cancela fichas ni apaga el método. Registrar versiones desplegadas antes de cualquier publicación.

## Preparación PayPal (siguiente fase)

- Confirmar con Carlos que su cuenta es Business y que recibe pagos comerciales en MXN; revisar comisiones, retenciones y receptor. Sin asumir que PayPal se procesa dentro del Stripe mexicano.
- Crear app sandbox en PayPal Developer. Client ID/secret y merchant ID mediante entrada segura/gestor de secretos; nunca chat, Git o variables `GATSBY_*` para secretos. Esta fase no leyó ni creó credenciales.
- Se eligió Orders v2 oficial con `fetch` nativo, sin dependencia adicional; no se construye un procesador propio. Adaptador inyectable para pruebas y host sandbox fijo.
- `paypal/sandbox.js` no se exporta en `index.js`, no puede apuntar a live, no escribe en Firestore y **no se debe conectar directamente a req.body**. El padre debe resolver catálogo, monto, promociones, envío y beneficiario desde servidor y guardar orden antes de contactar PayPal.
- Implementar crear/capturar con token de orden, CORS, rate limit y claves `PayPal-Request-Id` persistidas. `APPROVED`, redirección exitosa o captura `PENDING` no equivalen a pago. Validar también orden vinculada, importe, MXN y merchant ID, como hace el adaptador.
- Ante timeout de captura, consultar/reconciliar orden remota con la misma clave; no lanzar una segunda captura a ciegas.
- Añadir webhook con verificación oficial de firma y recibos idempotentes; compartir la entrega transaccional entre PayPal/Stripe sin falsificar sesiones Stripe. Cubrir captura completada, pendiente/denegada, reembolso y reversión; aprobación sola nunca libera libros ni cuentas.
- Añadir selector/botón real, URL allowlist PayPal y retorno por estado local verificado, no por parámetros del navegador. Probar sandbox buyer/seller, cancelación, doble clic, red interrumpida, montos distintos y webhook retrasado antes de preparar live.

## Verificación realizada

- `npm test --prefix alumnos-app/functions-stripe`: 21/21 (10 existentes, 11 nuevas).
- `node scripts/test-checkout-i18n.js`: OK.
- `npm run build`: OK.
- Playwright Chromium local, `http://127.0.0.1:9000/checkout/success/`, 1440×1000 y 390×844: espera → fallo → consulta manual → confirmado. API de estado **simulada**, sin proveedores reales. Sin errores `pageerror`, sin desbordamiento horizontal. Página no vacía, identidad correcta y capturas locales revisadas. Browser plugin ausente; fallback Playwright local instalado.
- Sin pruebas contra Stripe/PayPal reales, Firebase desplegado o envíos reales. El mock de Firestore verifica transacciones/rollback lógicos; no sustituye pruebas de concurrencia con Firestore real o emulador.

## Fuentes oficiales

- https://docs.stripe.com/payments/oxxo/accept-a-payment?payment-ui=checkout
- https://docs.stripe.com/payments/oxxo
- https://docs.stripe.com/payments/paypal
- https://developer.paypal.com/docs/api/orders/v2/
- https://developer.paypal.com/api/rest/webhooks/rest/
