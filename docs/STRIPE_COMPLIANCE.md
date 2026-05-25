# Stripe — Seguridad, cumplimiento y buenas prácticas

Documento operativo para **Certificación Montessori** (Asociación Montessori de México A.C.). Objetivo: pagos confiables sin sorpresas con Stripe, Firebase, Google ni el hosting.

## Principios

1. **El servidor decide el precio** — Los `price_...` se resuelven en Cloud Functions (`createPublicCheckout`). El frontend solo envía `programa` y `soloInscripcion`; nunca confíes en montos enviados por el cliente.
2. **Webhook con firma** — Solo procesar eventos verificados con `STRIPE_WEBHOOK_SECRET` (`constructEvent`). Rechazar cuerpos sin firma válida.
3. **Idempotencia** — Colección `stripe_events` evita procesar dos veces el mismo `event.id`.
4. **Secretos fuera del repo** — `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` en Firebase Secrets; claves `sk_` / `whsec_` en `.gitignore`.
5. **CORS restringido** — `createPublicCheckout` y flujo de inscripción validan origen (`cors.js`); no usar `*` en producción.
6. **Datos mínimos en metadata** — En Checkout metadata: `ordenId`, `tipo`, `programa`, `skus`, flags fiscales. No RFC, CURP ni contraseñas.
7. **Firestore rules** — `ordenes` y `stripe_events` no escribibles por clientes; catálogo `stripeCatalog` solo administración.

## Checkout público (inscripción)

| Modo | SKUs en Stripe | Tipo de orden |
|------|----------------|---------------|
| Inicio completo (recomendado) | `inscripcion_diplomado` + programa | `inicio_programa` |
| Solo inscripción | `inscripcion_diplomado` | `inscripcion` |
| **Promo Neuro** (inscripción incluida) | solo `diplomado_neuroeducacion` | `inicio_programa` + `promoInscripcionIncluida` |

Activar/desactivar promo: `PROMO_NEURO_INSCRIPCION_INCLUIDA.activa` y `promoInscripcionIncluida` en `programasOferta.js` / `programasCheckout.js`.

Programas (alineados a `programasOferta.js` / `programasCheckout.js`):

| Programa | SKU programa |
|----------|----------------|
| Neuroeducación | `diplomado_neuroeducacion` |
| Educación Cósmica | `diplomado_educacion_cosmica` |
| Guía Nido | `colegiatura_nido_inicio` |
| Guía Casa | `colegiatura_casa_inicio` |
| Guía Taller | `colegiatura_taller_inicio` |

Las colegiaturas **mensuales recurrentes** (`colegiatura_*`) se usan en el portal de alumnos (suscripción), no en el checkout público inicial.

## Checklist antes de Live

- [ ] Cuenta Stripe verificada (MXN, datos fiscales, cuenta bancaria)
- [ ] Productos Live creados (script `stripe-setup-catalog.js` con `sk_live_` solo en entorno controlado)
- [ ] Parámetros Firebase Live actualizados o `stripeCatalog/default` en producción
- [ ] Webhook **Live** apuntando a `stripeWebhook` con los mismos eventos que test
- [ ] Probar tarjeta real con monto bajo y reembolso de prueba
- [ ] Política de reembolsos / términos visibles en el sitio (Stripe lo revisa en disputas)
- [ ] Descripción clara en Checkout (líneas separadas: inscripción + programa)
- [ ] `SITE_URL` apunta al dominio final (`https://certificacionmontessori.com`)

## Stripe — evitar suspensiones

- Usar descripciones de producto **educativas y reales** (no genéricos tipo “servicio”).
- No mezclar en la misma cuenta actividades prohibidas (apuestas, adultos, etc.).
- Responder **disputas/chargebacks** en el dashboard en &lt; 7 días.
- Mantener tasa de disputas baja: correos de confirmación y soporte WhatsApp visibles.
- Para factura fiscal: documentar en expediente; metadata solo indica `requiereFacturaFiscal`.

## Firebase / Google

- Reglas Firestore: sin lectura pública de `ordenes` pagadas ajenas; inscripción por `ordenId` solo vía Functions autenticadas por token de flujo donde aplique.
- No loguear `STRIPE_SECRET_KEY`, PaymentIntent completos ni datos de tarjeta.
- Functions Gen2 con `invoker: public` solo en endpoints que validan CORS + payload; el resto restringido.
- Hosting: sin exponer `.env` con claves; `GATSBY_*` solo URLs públicas de API.

## Operación

```bash
cd alumnos-app
# Crear/actualizar precios test
STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup-catalog.js
# Sincronizar y desplegar functions
npm run deploy:stripe
```

Tras cambiar precios, actualizar `docs/STRIPE_CATALOG_TEST.md` con los nuevos `price_...` (sin commitear claves secretas).

## Referencias

- [Stripe Go Live Checklist](https://docs.stripe.com/get-started/checklist/go-live)
- [PCI — Checkout hosted](https://docs.stripe.com/security/guide) (SAQ A con Checkout)
- `docs/STRIPE_SETUP.md` — configuración paso a paso
