# Checklist QA — Stripe (Fase 1 y 2)

## Pre-requisitos

- [ ] Cuenta Stripe en modo **test**
- [ ] Secretos `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` configurados
- [ ] Parámetros `STRIPE_PRICE_*` con IDs reales de test
- [ ] Functions desplegadas
- [ ] Reglas Firestore desplegadas

## Fase 1 — Sitio público

- [ ] Inscripción: formulario → redirect Checkout → tarjeta `4242...` → `/checkout/success`
- [ ] Orden en Firestore `ordenes` con `estado: pagado`
- [ ] Inscripción en `inscripciones` con `estadoInscripcion: Pagado`
- [ ] Email admin en `emails_pendientes` → `enviado`
- [ ] Cancelar checkout → `/checkout/cancel`, orden `expirado` si aplica
- [ ] Comprar un libro → orden tipo `libro`, envío si está habilitado
- [ ] Enlace “Ver en Amazon” sigue funcionando (respaldo)

## Fase 2 — Portal alumnos

- [ ] Login alumno → `/pagos` visible en menú
- [ ] “Pagar con tarjeta” en pago pendiente → Checkout → pago `Validado`
- [ ] Subir comprobante manual sigue funcionando en pagos pendientes
- [ ] Activar suscripción colegiatura → Checkout subscription
- [ ] `invoice.paid` marca colegiatura del mes
- [ ] “Administrar suscripción” abre Customer Portal
- [ ] Admin `/admin/pagos` y `/admin/ordenes` accesibles

## Seguridad

- [ ] `sk_` no aparece en build Gatsby ni Vite (`grep -r sk_ dist public`)
- [ ] Endpoint público rechaza origen no permitido
- [ ] Endpoint público responde `429` al exceder rate limit
- [ ] Alumno no puede marcar su pago como `Validado` desde el cliente

## Go-live

- [ ] Cambiar a claves **live** y webhook de producción
- [ ] Actualizar `GATSBY_*` y `VITE_*` con URLs de producción
- [ ] Un pago real de monto bajo para validar depósito bancario
- [ ] `npm run version:minor` y deploy según flujo del proyecto
