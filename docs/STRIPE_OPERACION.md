# Operación Stripe — Certificación Montessori

## Pagos exitosos (sitio público)

1. El webhook marca la orden en Firestore (`ordenes`) como `pagado`.
2. Si es inscripción, se crea/actualiza un registro en `inscripciones` con `estadoInscripcion: Pagado`.
3. Se encola un correo a administración vía `emails_pendientes`.
4. Admin revisa en **Portal → Órdenes públicas** (`/admin/ordenes`) o **Inscripciones**.

## Pagos exitosos (portal alumnos)

- Pago único: el documento `pagos/{id}` pasa a `Validado` con `metodoPago: stripe`.
- Suscripción: cada `invoice.paid` valida la colegiatura del periodo o crea el cargo correspondiente.

## Si un alumno dice que pagó pero no se refleja

1. Buscar en [Stripe Dashboard](https://dashboard.stripe.com) por email o Payment Intent.
2. En Firestore, revisar `ordenes` o `pagos` por `stripeCheckoutSessionId`.
3. Revisar logs: `firebase functions:log --only stripeWebhook`
4. Si el webhook falló: en Stripe → evento → **Resend**; la función es idempotente (`stripe_events`).

## Reembolsos

Hacer el reembolso en Stripe Dashboard. Luego actualizar manualmente en Firestore el `pago` u `orden` (estado operativo acordado con administración).

## Suscripciones

- El alumno puede abrir el **Portal de cliente Stripe** desde `/pagos` (“Administrar suscripción”).
- Si `invoice.payment_failed`: revisar becas, tarjeta vencida y contactar al alumno.

## Respaldo manual

Mientras se valida producción, siguen disponibles el formulario Google de inscripción y la compra en Amazon para libros.
