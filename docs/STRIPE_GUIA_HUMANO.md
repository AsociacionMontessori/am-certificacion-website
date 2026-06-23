# Guía paso a paso (humano) — Stripe en pruebas

**Contexto:** Rama `develop`, integración en curso. **No desplegar a producción** (`certificacionmontessori.com` / hosting principal) hasta cerrar QA.

**Objetivo de esta guía:** Lo que solo una persona con acceso a cuentas puede hacer. Lo demás (catálogo en Stripe test, script de mapeo) puede apoyar el agente **después** de conectar Stripe en Cursor.

---

## Resumen: quién hace qué

| Paso | Responsable | Modo |
|------|-------------|------|
| Cuenta Stripe y verificación legal | Humano | Test primero |
| Activar Stripe MCP en Cursor | Humano (1 clic) | Test |
| Productos y precios en Stripe | Agente (MCP) o Humano (Dashboard) | **Solo test** |
| Webhook endpoint | Humano (Dashboard) tras deploy de Functions | Test |
| Secretos Firebase (`STRIPE_*`) | Humano | Proyecto `certificacionmontessori` |
| Deploy Functions `stripe` + reglas | Humano / agente | **Solo prueba** |
| Variables `.env` locales / preview | Humano | URLs de preview |
| Build hosting producción | **NO** hasta go-live | — |

---

## Fase A — Stripe (modo prueba)

### A1. Cuenta

1. Entrar a [https://dashboard.stripe.com](https://dashboard.stripe.com).
2. Confirmar que el interruptor superior dice **「Test mode」** (fondo naranja/ámbar). Si dice “Live”, **no** uses esa vista para estas pruebas.
3. Si no hay cuenta: registrar **Asociación Montessori de México A.C.** (México, MXN).
4. Completar el perfil de negocio (puede quedar pendiente para test, pero conviene avanzarlo).

### A2. Conectar Stripe al agente en Cursor

1. En Cursor, cuando el agente pida autenticación del plugin **Stripe**, aceptar / iniciar sesión.
2. Autorizar acceso a la cuenta de **test** (mensaje “Authorization successful” en el navegador es normal).
3. Si Cursor abre una ventana vacía, ciérrala; lo importante es el mensaje de éxito en Stripe.
4. En Cursor: **Settings → MCP → Stripe** debe verse **Connected**.
5. **Developer: Reload Window** (recargar ventana) para que aparezcan las herramientas del MCP en el chat.
6. Escribe al agente: *“Stripe MCP listo”*.

**Si tras recargar el agente sigue sin herramientas Stripe** (solo `mcp_auth`), usa el script local (paso A2b) — es equivalente para crear el catálogo en test.

### A2b. Catálogo sin MCP (script local, recomendado si MCP falla)

```bash
cd alumnos-app
# Crear .env.stripe.local con: STRIPE_SECRET_KEY=sk_test_...
node scripts/stripe-setup-catalog.js
```

Copia los `firebase functions:params:set` que imprime el script. **No** subas `.env.stripe.local` al repo.

### A3. Claves de API (test)

1. Dashboard → **Developers → API keys**.
2. Copiar y guardar en un gestor de contraseñas (no en el repo):
   - **Publishable key** `pk_test_...` (para front si hiciera falta más adelante).
   - **Secret key** `sk_test_...` o preferible **Restricted key** `rk_test_...` con permisos: Checkout Sessions (write), Products/Prices (read), Customers, Subscriptions, Webhooks (read).
3. **No** commitear estas claves.

---

## Fase B — Firebase (solo entorno de prueba)

### B1. Login y proyecto

```bash
cd alumnos-app
npx firebase login
npx firebase use certificacionmontessori
```

### B2. Secretos (obligatorios)

```bash
# Pegar sk_test_... o rk_test_... cuando lo pida
firebase functions:secrets:set STRIPE_SECRET_KEY

# Lo obtienes en el paso C2 (webhook), después del primer deploy de functions
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

### B3. Parámetros de precios

Tras `npm run stripe:setup-catalog`, genera el archivo de entorno para Functions:

```bash
node scripts/stripe-write-functions-env.js
```

Crea `functions-stripe/.env.certificacionmontessori` (gitignored) con los `price_...` de test.

Referencia guardada en [STRIPE_CATALOG_TEST.md](STRIPE_CATALOG_TEST.md).

**Opcional:** documento Firestore `stripeCatalog/default` (solo admin) con el mismo mapa JSON; tiene prioridad sobre el `.env`.

### B4. URLs de sitio para pruebas (no producción)

Usar hosts de **preview**, no los dominios finales:

```bash
# Ejemplo: canal preview de hosting o URL .web.app
firebase functions:params:set SITE_URL=https://certificacionmontessori--develop-xxxxx.web.app
firebase functions:params:set ALUMNOS_SITE_URL=https://alumnos-certificacionmontessori--develop-xxxxx.web.app
```

Ajusta las URLs reales que te dé Firebase Hosting Preview o tu canal de prueba.

---

## Fase C — Webhook (después del deploy de Functions)

### C1. Desplegar solo codebase Stripe (rama develop)

```bash
cd alumnos-app/functions-stripe && npm install
cd ..
npm run deploy:stripe
npm run deploy:rules
```

Comprobar en Firebase Console → Functions que existen: `createPublicCheckout`, `stripeWebhook`, etc.

### C2. Crear endpoint en Stripe (test)

1. Dashboard (test) → **Developers → Webhooks → Add endpoint**.
2. URL:

   `https://us-central1-certificacionmontessori.cloudfunctions.net/stripeWebhook`

3. Eventos a suscribir:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiar **Signing secret** `whsec_...` → `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`.
5. Volver a desplegar functions si Firebase lo pide tras cambiar secretos:

   ```bash
   npm run deploy:stripe
   ```

### C3. Prueba local alternativa (opcional)

```bash
stripe login
stripe listen --forward-to https://us-central1-certificacionmontessori.cloudfunctions.net/stripeWebhook
```

Usar el `whsec_...` que muestra el CLI solo en entorno local/emulador.

---

## Fase D — Frontends de prueba (sin producción)

### D1. Sitio Gatsby (raíz del repo)

Crear `.env.development` o variables del **canal preview** (no subir al repo):

```env
GATSBY_CHECKOUT_API_URL=https://us-central1-certificacionmontessori.cloudfunctions.net/createPublicCheckout
GATSBY_SITE_URL=https://TU-URL-PREVIEW.web.app
```

Build y deploy **solo al canal preview**:

```bash
# Ejemplo conceptual — usar el comando de preview de tu flujo
gatsby build
firebase hosting:channel:deploy develop-stripe --expires 30d
```

### D2. Portal alumnos (`alumnos-app/.env`)

```env
VITE_CHECKOUT_API_URL=https://us-central1-certificacionmontessori.cloudfunctions.net/createAlumnoCheckout
VITE_SUBSCRIPTION_API_URL=https://us-central1-certificacionmontessori.cloudfunctions.net/createSubscriptionCheckout
VITE_STRIPE_PORTAL_URL=https://us-central1-certificacionmontessori.cloudfunctions.net/createCustomerPortal
```

Deploy hosting al sitio `alumnos-certificacionmontessori` en **canal preview**, no al dominio custom de producción hasta go-live.

---

## Fase E — Prueba de punta a punta (humano)

Checklist rápido ([detalle](STRIPE_QA_CHECKLIST.md)):

1. Tarjeta test `4242 4242 4242 4242` en inscripción desde URL **preview**.
2. Ver orden `pagado` en Firestore → colección `ordenes`.
3. Ver correo en `emails_pendientes` (si email configurado).
4. Admin → `/admin/ordenes` en portal preview.
5. Alumno test → `/pagos` → “Pagar con tarjeta” en un cargo pendiente.
6. **No** ejecutar `firebase deploy --only hosting` sin `:channel:` hacia producción.

---

## Fase F — Go-live (futuro, no ahora)

Solo cuando `develop` esté validado:

1. Cambiar a **Live mode** en Stripe.
2. Recrear productos/precios en live (o copiar según proceso Stripe).
3. Nuevo webhook con URL de producción y `whsec_` live.
4. Secretos live en Firebase.
5. `SITE_URL` / `ALUMNOS_SITE_URL` a dominios finales.
6. Deploy hosting producción + comunicación a usuarios.

---

## Montos de referencia (test)

| SKU | MXN |
|-----|-----|
| `inscripcion_diplomado` | 4,900 |
| `libro_ammac_1` … `4` | 450 c/u (ajustar con la asociación) |
| `colegiatura_nido` | 3,100 |
| `colegiatura_casa` | 3,500 |
| `colegiatura_taller` | 3,500 |
| `certificado_fisico` | 2,700 |

---

## Si algo falla

| Síntoma | Revisar |
|---------|---------|
| “Producto no configurado” | Params `STRIPE_PRICE_*` o `stripeCatalog/default` |
| Pago OK en Stripe, no en Firestore | Webhook, `STRIPE_WEBHOOK_SECRET`, logs `stripeWebhook` |
| CORS / origen no permitido | URL del preview debe coincidir con orígenes en `functions/stripe/cors.js` |
| Build local EACCES | `sudo chown -R $USER alumnos-app/functions alumnos-app/dist` |

Documentación técnica: [STRIPE_SETUP.md](STRIPE_SETUP.md) · Operación: [STRIPE_OPERACION.md](STRIPE_OPERACION.md)
