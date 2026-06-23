# Configurar Stripe Live (recibir dinero real)

Procedimiento operativo para pasar Certificación Montessori de **modo test**
(donde estamos hoy, con `sk_test_*`) a **modo Live** (cobros reales con tarjetas
de cliente y depósito en cuenta bancaria de AMMAC).

**Estado actual:** todo el código de seguridad está desplegado y probado en
test. La cuenta Stripe sigue en `sk_test_*`. Las inscripciones nuevas pagan
con tarjetas de prueba (4242…) y no transfieren dinero real.

**Objetivo:** habilitar pagos reales sin sorpresas. Llevar la cuenta de
"activar Live" a "primer pago real validado" en una sola ventana operativa
de ~2-3 horas.

---

## 0) Resumen de qué cambia entre test y Live

| Aspecto | Test | Live |
|---|---|---|
| Secreto API | `sk_test_…` | `sk_live_…` (otro valor, igual de secreto) |
| Webhook secret | `whsec_test_…` | `whsec_live_…` (otro endpoint en dashboard) |
| Productos / precios | `price_1Tai…` (los actuales en `.env.certificacionmontessori`) | **Otros IDs** — Stripe Live tiene catálogo separado |
| Dashboard | `dashboard.stripe.com/test/...` | `dashboard.stripe.com/...` (sin `/test`) |
| Tarjetas | `4242 4242 4242 4242` | tarjetas reales del cliente |
| Dinero | No se mueve | Se cobra y deposita en tu cuenta bancaria |
| Reembolsos | Instantáneos | Reales, sujetos a política de Stripe |

El **código** no cambia. Solo cambian los **secrets** y los **IDs de precio**.

---

## 1) Pre-requisitos administrativos (lo hace Carlos / AMMAC)

Antes de tocar nada técnico:

- [ ] **Cuenta Stripe activada en modo Live.** Entrar a
  [dashboard.stripe.com](https://dashboard.stripe.com), no usar el toggle de
  test. Si dice "Activar cuenta": completar el formulario de KYC.
  Stripe pide:
  - Razón social: *Asociación Montessori de México A.C.*
  - RFC, dirección fiscal
  - Representante legal (datos personales)
  - Sitio web (ya existe: `https://certificacionmontessori.com`)
  - Descripción del producto: *Cuotas de inscripción y colegiaturas
    para diplomados Montessori (educación)*
  - Volumen estimado mensual
- [ ] **Cuenta bancaria mexicana** en MXN para recibir depósitos:
  - CLABE de 18 dígitos
  - Nombre exacto del titular (debe coincidir con razón social)
  - Verificación bancaria de Stripe (suele tardar 1-2 días hábiles)
- [ ] **Documentación legal** lista en el sitio (Stripe la revisa en disputas):
  - Aviso de privacidad — ya existe en `/privacy`
  - Política de reembolsos — **falta agregar al sitio**, ver §7
  - Términos y condiciones — ya implícito en el reglamento del diplomado
- [ ] **Stripe Radar y prevención de fraude** habilitado por defecto en Live
  (Stripe lo activa solo). Conviene revisar reglas en
  Dashboard → Radar → Rules.

**Sin estos requisitos, Stripe rechaza pagos Live y bloquea la cuenta.**

---

## 2) Secrets Live en Firebase

### 2.1 Obtener `sk_live_…`

1. Dashboard Stripe (sin `/test`) → **Developers → API keys**.
2. **Secret key** Live — botón "Reveal live key". Cópiala a un gestor seguro
   (1Password / Bitwarden). **No** la pegues en archivos del repo.

### 2.2 Subir a Firebase Secrets

```bash
cd /home/carlos/Documentos/Repositorios/certificacionMontessori

# Sobrescribe la versión actual (test) con la versión Live.
# Cuando el comando pida el valor, pégalo y termina con Ctrl+D
npx firebase functions:secrets:set STRIPE_SECRET_KEY --project certificacionmontessori
```

Verificar:

```bash
npx firebase functions:secrets:access STRIPE_SECRET_KEY --project certificacionmontessori | head -c 10
# Debe imprimir "sk_live_..."
```

---

## 3) Catálogo de productos Live

Los `price_…` test que tenemos hoy **no existen en Live**. Hay que crearlos.

### 3.1 Crear precios con el script

```bash
cd alumnos-app

# IMPORTANTE: el script lee la clave del entorno. Usa la sk_live_ directamente,
# no la guardes en .env.stripe.local (que está pensado para test).
STRIPE_SECRET_KEY=sk_live_REEMPLAZAR node scripts/stripe-setup-catalog.js
```

El script imprime los `price_…` Live creados. Cópialos a una nota temporal
fuera del repo.

### 3.2 Verificar productos en el dashboard Live

Dashboard Stripe (sin `/test`) → **Productos**. Confirma que aparecen los
productos del catálogo (inscripción, diplomados, colegiaturas, libros, ebooks)
con sus precios MXN correctos.

### 3.3 Sincronizar con Cloud Functions

Las Functions leen los precios desde la colección Firestore `stripeCatalog`
(ver `resolveSku` en `alumnos-app/functions-stripe/stripe/catalog.js`). Hay dos
caminos para que tomen los nuevos `price_…`:

**Opción A — Catálogo en Firestore** (recomendada):

```bash
# Editar manualmente `stripeCatalog/default` en Firebase Console con los
# nuevos price_ live. La estructura es:
# { skus: { inscripcion_diplomado: { priceId: "price_..." }, ... } }
```

O usar un script ad-hoc con Admin SDK que reemplaza el documento.

**Opción B — `.env.certificacionmontessori`** (alternativa):

`alumnos-app/functions-stripe/.env.certificacionmontessori` tiene los
`STRIPE_PRICE_*` de test. Reemplazar por los Live y re-deploy.

Recomiendo A porque permite cambiar precios sin re-deploy de Functions.

---

## 4) Webhook Live

### 4.1 Crear endpoint en Stripe Live

Dashboard Stripe (sin `/test`) → **Developers → Webhooks → Add endpoint**.

- URL: `https://us-central1-certificacionmontessori.cloudfunctions.net/stripeWebhook`
- Eventos a escuchar (los mismos que ya están en test):
  - `checkout.session.completed`
  - `checkout.session.expired`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`

### 4.2 Copiar el signing secret

Después de crear el endpoint, Stripe muestra **Signing secret** (`whsec_…`).
Cópialo.

### 4.3 Subir a Firebase Secrets

```bash
npx firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project certificacionmontessori
# Pega el whsec_ Live
```

Verificar:

```bash
npx firebase functions:secrets:access STRIPE_WEBHOOK_SECRET --project certificacionmontessori | head -c 10
# Debe imprimir "whsec_..."
```

---

## 5) Re-deploy de Functions

Para que tomen los nuevos secrets:

```bash
cd alumnos-app
npx firebase deploy --only functions:stripe --project certificacionmontessori
```

Cloud Functions hace blue/green: el deploy nuevo arranca con los secrets
nuevos; el anterior sigue corriendo hasta que el nuevo está listo. Si el
deploy falla, la versión test sigue activa.

---

## 6) Smoke test con dinero real

### 6.1 Pago bajo controlado

Hacer una **inscripción real** con tarjeta del equipo y un programa de
precio bajo (por ejemplo, un ebook de $99 MXN si tienes uno disponible, o
la inscripción individual).

Pasos:

1. Entrar a `https://certificacionmontessori.com/diplomados`.
2. Comprar uno de los productos.
3. Pagar con tarjeta real.
4. Confirmar que llega al `success_url` con `?orden=…&t=…`.
5. En el dashboard Stripe Live → Payments — debe aparecer el pago.
6. En Firestore → `ordenes/{ordenId}` — debe estar `estado: pagado`.
7. En `inscripciones` — debe existir el registro con `metodoPago: stripe`.

### 6.2 Webhook funcional

```bash
npx firebase functions:log --only stripeWebhook --project certificacionmontessori | tail -50
```

Buscar `Webhook signature error` — si aparece, el `STRIPE_WEBHOOK_SECRET`
no coincide. Verificar paso 4.

### 6.3 Reembolso de prueba

Reembolsar el pago de prueba desde Stripe Dashboard. Confirmar que el
dinero vuelve a la tarjeta de origen (24-48h hábiles).

---

## 7) Política de reembolsos visible en el sitio

Stripe pide visibilidad pública. Agregar al footer del sitio (o como ruta
`/reembolsos`) un texto similar a:

> **Política de reembolsos — Asociación Montessori de México A.C.**
>
> Las inscripciones a diplomados son reembolsables al 100 % si se solicitan
> dentro de los 7 días naturales siguientes al pago **y antes** de la fecha
> de inicio del programa. Pasada esa fecha, la inscripción no es reembolsable
> pero puede transferirse a la siguiente generación, sujeto a disponibilidad.
>
> Las colegiaturas mensuales se cobran por adelantado y no se reembolsan una
> vez iniciado el mes en curso.
>
> Para iniciar un reembolso, escribe a `admin@certificacionmontessori.com`
> con el número de orden o el correo de la inscripción.

Implementación: crear `src/pages/reembolsos.js` (Gatsby) o agregar al pie
del `privacy.js`. Re-build + deploy.

---

## 8) Validación post-lanzamiento (primera semana)

| Verificar | Cómo |
|---|---|
| Pagos exitosos llegan a Firestore | Cualquier nueva entrada en `ordenes` con `estado: pagado` |
| Webhook responde rápido (<3s) | `firebase functions:log --only stripeWebhook` |
| Sin firmas de webhook fallidas | Buscar `Webhook signature error` en logs |
| Idempotencia funciona | Buscar `received: true, duplicate: true` |
| Inscripciones se crean | Nueva entrada en `inscripciones` por cada `ordenes` pagada |
| Correo a admin sale | Nueva entrada en `emails_pendientes` con `estado: enviado` |
| Sin disputas / chargebacks | Dashboard Stripe → Payments → Disputed |

Si algún punto falla, revisar `firebase functions:log` y la documentación de
`STRIPE_OPERACION.md`.

---

## 9) Rollback en caso de problemas

Si Live empieza a fallar después del deploy:

```bash
# Restaurar secrets test
npx firebase functions:secrets:set STRIPE_SECRET_KEY --project certificacionmontessori
# pegar sk_test_ original (debes tenerlo guardado)

npx firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project certificacionmontessori
# pegar whsec_ test original

# Restaurar precios test en stripeCatalog/default

# Re-deploy
cd alumnos-app
npx firebase deploy --only functions:stripe --project certificacionmontessori

# Dashboard Stripe Live: desactivar el webhook si está causando problemas
```

Los pagos ya cobrados quedan en tu cuenta Stripe Live — el rollback no los
revierte. Los reembolsos se procesan caso por caso en el dashboard.

---

## 10) Riesgos operativos a vigilar

1. **Disputas (chargebacks):** un cliente que reclama un cargo no autorizado.
   Si la tasa supera ~0.75 % de las transacciones, Stripe puede bloquear la
   cuenta. Mitigación: confirmación por correo después de cada pago (ya
   está), soporte rápido por WhatsApp visible (ya está).
2. **Velocity rules:** Stripe Radar bloquea automáticamente patrones
   sospechosos (muchas tarjetas en pocas horas, montos altos, países de alto
   riesgo). En general no afecta a una cuenta legítima como AMMAC.
3. **Webhook caído > 1h:** Stripe reintenta hasta 3 días. Pero las
   inscripciones recientes quedan en `estado: pendiente` hasta que el
   webhook se procese. Mitigación: monitorear logs de Functions, alertar
   por correo si el rate de webhooks falla.
4. **Fondos congelados temporalmente:** la primera vez que recibes pagos,
   Stripe puede retener fondos 7-14 días para verificar legitimidad. Es
   normal. El dashboard lo indica.
5. **Datos fiscales (factura):** el sitio ya distingue `requiereFacturaFiscal`
   y `cuentaContable` en metadata. Esto se procesa fuera de Stripe (el
   equipo administrativo emite factura desde el sistema fiscal AMMAC).

---

## 11) Checklist final go-Live

Imprime esta lista y márcala antes de declarar Live operativo:

- [ ] Cuenta Stripe verificada en modo Live (no aparece "Activar cuenta")
- [ ] Cuenta bancaria MXN agregada y verificada
- [ ] KYC completado (representante legal, RFC, dirección)
- [ ] Política de reembolsos publicada en el sitio
- [ ] `STRIPE_SECRET_KEY` actualizada a `sk_live_…`
- [ ] `STRIPE_WEBHOOK_SECRET` actualizada a `whsec_…` Live
- [ ] Webhook Live creado con los 5 eventos correctos
- [ ] Productos / precios Live creados (script + dashboard)
- [ ] `stripeCatalog/default` (Firestore) actualizado con `price_…` Live
- [ ] Re-deploy `functions:stripe` exitoso
- [ ] Smoke test: pago real ($99-$500 MXN) con tarjeta del equipo
- [ ] Pago llegó a `ordenes/{id}` con `estado: pagado`
- [ ] Webhook procesó el evento (sin "signature error")
- [ ] Inscripción creada en `inscripciones`
- [ ] Correo a admin recibido
- [ ] Reembolso de prueba ejecutado correctamente
- [ ] Comunicación interna: equipo administrativo sabe que Live está activo

Una vez completo, retirar el banner "modo prueba" del sitio si lo hubiera.
