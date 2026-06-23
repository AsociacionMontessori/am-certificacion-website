# Configuración Stripe — Certificación Montessori

Guía para conectar la cuenta Stripe con Firebase (`certificacionmontessori`) y el sitio público + portal de alumnos.

## 1. Cuenta Stripe (México)

1. Crear cuenta en [dashboard.stripe.com](https://dashboard.stripe.com) a nombre de **Asociación Montessori de México A.C.**
2. Completar verificación de identidad, cuenta bancaria en **MXN** y datos fiscales.
3. Trabajar en **modo prueba** hasta validar flujos completos.
4. Revisar el [Go Live Checklist](https://docs.stripe.com/get-started/checklist/go-live) antes de activar pagos reales.

## 2. Productos y precios en Dashboard

Crear en Stripe → **Product catalog** un producto por concepto y al menos un **Price** en MXN (montos en centavos: $4,900 MXN = `490000`).

| SKU (código interno) | Concepto | Monto referencia |
|----------------------|----------|------------------|
| `inscripcion_diplomado` | Inscripción diplomado | $4,900 MXN |
| `diplomado_neuroeducacion` | Diplomado Neuroeducación (checkout inicio) | $4,500 MXN |
| `diplomado_educacion_cosmica` | Educación Cósmica (checkout inicio) | $2,800 MXN |
| `colegiatura_nido_inicio` | Primera colegiatura Nido (checkout inicio) | $3,100 MXN |
| `colegiatura_casa_inicio` | Primera colegiatura Casa (checkout inicio) | $3,500 MXN |
| `colegiatura_taller_inicio` | Primera colegiatura Taller (checkout inicio) | $3,900 MXN |
| `libro_ammac_1` … `libro_ammac_4` | Libros serie Roxana | Definir con la asociación |
| `colegiatura_nido` | Colegiatura mensual Nido (portal) | $3,100 MXN |
| `colegiatura_casa` | Colegiatura Casa de Niños (portal) | $3,500 MXN |
| `colegiatura_taller` | Colegiatura Taller (portal) | $3,900 MXN |
| `certificado_fisico` | Certificado físico | $2,700 MXN |

El checkout público arma el carrito en el servidor según `programa` + `soloInscripcion`. Ver `docs/STRIPE_COMPLIANCE.md`.

Copiar cada `price_...` al configurar secretos (paso 3).

## 3. Secretos y parámetros Firebase

```bash
cd alumnos-app

# Obligatorios
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

# Parámetros de precio (recomendado: uno por SKU)
firebase functions:params:set STRIPE_PRICE_INSCRIPCION=price_xxx
firebase functions:params:set STRIPE_PRICE_DIPLOMADO_NEURO=price_xxx
firebase functions:params:set STRIPE_PRICE_DIPLOMADO_COSMICA=price_xxx
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_NIDO_INICIO=price_xxx
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_CASA_INICIO=price_xxx
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_TALLER_INICIO=price_xxx
firebase functions:params:set STRIPE_PRICE_LIBRO_1=price_xxx
firebase functions:params:set STRIPE_PRICE_LIBRO_2=price_xxx
firebase functions:params:set STRIPE_PRICE_LIBRO_3=price_xxx
firebase functions:params:set STRIPE_PRICE_LIBRO_4=price_xxx
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_NIDO=price_xxx
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_CASA=price_xxx
firebase functions:params:set STRIPE_PRICE_COLEGIATURA_TALLER=price_xxx
firebase functions:params:set STRIPE_PRICE_CERTIFICADO=price_xxx
```

Alternativa: documento Firestore `stripeCatalog/default` con el mismo mapa de SKUs → `priceId` (tiene prioridad sobre parámetros).

URLs del sitio (opcional, tienen valores por defecto):

```bash
firebase functions:params:set SITE_URL=https://certificacionmontessori.com
firebase functions:params:set ALUMNOS_SITE_URL=https://alumnos.certificacionmontessori.com
```

## 4. Webhook

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://us-central1-certificacionmontessori.cloudfunctions.net/stripeWebhook`
3. Eventos:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiar **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Desarrollo local

```bash
stripe listen --forward-to http://127.0.0.1:5001/certificacionmontessori/us-central1/stripeWebhook
```

## 5. Variables del sitio Gatsby

Crear `.env.production` en la raíz del repo (no commitear claves reales):

```env
GATSBY_CHECKOUT_API_URL=https://us-central1-certificacionmontessori.cloudfunctions.net/createPublicCheckout
GATSBY_SITE_URL=https://certificacionmontessori.com
```

## 6. Variables portal alumnos (Vite)

En `alumnos-app/.env`:

```env
VITE_CHECKOUT_API_URL=https://us-central1-certificacionmontessori.cloudfunctions.net/createAlumnoCheckout
VITE_SUBSCRIPTION_API_URL=https://us-central1-certificacionmontessori.cloudfunctions.net/createSubscriptionCheckout
VITE_STRIPE_PORTAL_URL=https://us-central1-certificacionmontessori.cloudfunctions.net/createCustomerPortal
```

## 7. Despliegue

Las funciones Stripe viven en el codebase **`stripe`** ([`alumnos-app/functions-stripe/`](../alumnos-app/functions-stripe/)), separado del codebase `default` (email), porque el directorio `functions/` original puede tener permisos restringidos.

```bash
cd alumnos-app/functions-stripe && npm install && cd ..
cd alumnos-app
firebase deploy --only functions:stripe
firebase deploy --only functions:default
firebase deploy --only firestore:rules

# Sitio público
npm run build && firebase deploy --only hosting

# Portal alumnos
cd alumnos-app && npm run build && npm run deploy
```

## 8. Tarjetas de prueba

| Resultado | Número |
|-----------|--------|
| Éxito | `4242 4242 4242 4242` |
| Rechazo | `4000 0000 0000 0002` |

Cualquier fecha futura y CVC de 3 dígitos.
