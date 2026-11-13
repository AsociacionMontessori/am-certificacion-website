# Preparación OXXO y PayPal — 2026-11-13

## Estado real

Preparación en rama `feat/oxxo-paypal-preparation`, sin desplegar, activar métodos en cuentas ni crear compras reales. Las credenciales Sandbox se guardaron posteriormente mediante entrada protegida de OpenClaw; no están en este repositorio ni en Firebase.

| Componente | Preparado | Falta antes de ofrecerlo |
| --- | --- | --- |
| OXXO, checkout público | Confirmación diferida, fallos/expiración, recibos de evento reintentables, inscripción transaccional, notificaciones idempotentes, consulta autenticada de estado y pantalla ES/EN/PT | Prueba Stripe test de extremo a extremo, revisión de cuenta, despliegue coordinado y habilitación en Dashboard |
| PayPal | Cuenta Business y Default Application Sandbox confirmadas por Carlos; credenciales protegidas; adaptador Orders v2 y comprobador OAuth sin exposición de tokens | Validación OAuth real pendiente de aplicar canal protegido; merchant ID de pruebas; endpoints públicos autenticados, catálogo/precios/promociones/envío del servidor, botón, webhooks verificados, conciliación y pruebas sandbox. No es todavía una integración pública completa |
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

- Carlos confirmó cuenta Business y la app automática Default Application en Sandbox. Aún hay que revisar recepción en MXN, comisiones, retenciones y receptor; no asumir que PayPal se procesa dentro del Stripe mexicano.
- Client ID/Secret se guardaron mediante entrada protegida de OpenClaw como `PAYPAL_SANDBOX_CLIENT_ID` y `PAYPAL_SANDBOX_CLIENT_SECRET`, ligados sólo a `api-m.sandbox.paypal.com`. No se leyeron valores ni se copiaron a Git, Firebase o archivos `.env`. El merchant ID Sandbox sigue pendiente.
- Se eligió Orders v2 oficial con `fetch` nativo, sin dependencia adicional; no se construye un procesador propio. Adaptador inyectable para pruebas y host sandbox fijo.
- `paypal/sandbox.js` no se exporta en `index.js`, no puede apuntar a live, no escribe en Firestore y **no se debe conectar directamente a req.body**. El padre debe resolver catálogo, monto, promociones, envío y beneficiario desde servidor y guardar orden antes de contactar PayPal.
- Implementar crear/capturar con token de orden, CORS, rate limit y claves `PayPal-Request-Id` persistidas. `APPROVED`, redirección exitosa o captura `PENDING` no equivalen a pago. Validar también orden vinculada, importe, MXN y merchant ID, como hace el adaptador.
- Ante timeout de captura, consultar/reconciliar orden remota con la misma clave; no lanzar una segunda captura a ciegas.
- Añadir webhook con verificación oficial de firma y recibos idempotentes; compartir la entrega transaccional entre PayPal/Stripe sin falsificar sesiones Stripe. Cubrir captura completada, pendiente/denegada, reembolso y reversión; aprobación sola nunca libera libros ni cuentas.
- Añadir selector/botón real, URL allowlist PayPal y retorno por estado local verificado, no por parámetros del navegador. Probar sandbox buyer/seller, cancelación, doble clic, red interrumpida, montos distintos y webhook retrasado antes de preparar live.

### Comprobación de conexión protegida

- `checkSandboxConnection` usa el mismo OAuth que el adaptador y devuelve únicamente `{ok: true, environment: "sandbox"}`; no crea órdenes, captura pagos, devuelve tokens ni sigue redirecciones.
- Ejecutar `node alumnos-app/scripts/paypal-sandbox-check.js` desde la raíz mediante **Gateway exec**, con Node 24+ y el canal HTTPS protegido de OpenClaw activo. El shell nativo no recibe esos secretos; no sustituir por credenciales en argumentos o archivos.
- La primera ejecución se detuvo localmente antes de contactar PayPal: el proxy protegido estaba desactivado. Se habilitó y validó la opción oficial, con reinicio controlado solicitado. La ejecución posterior sigue fallando cerrada; la autenticación **no está validada** todavía. Retomar desde un turno nuevo después de aplicar el reinicio, sin pedir las credenciales otra vez.
- Esta configuración local no registra secretos en Google Secret Manager ni despliega funciones. El comprobador no equivale a un checkout público o una prueba de compra completa.

## Verificación realizada

- `npm test --prefix alumnos-app/functions-stripe`: 25/25 (incluye OAuth Sandbox simulado, bloqueo de redirecciones y carga real del CLI con fallo cerrado sin canal protegido).
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
