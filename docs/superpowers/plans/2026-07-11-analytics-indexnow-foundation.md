# Analytics and IndexNow Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Medir el recorrido entre Montessori México y Certificación Montessori sin PII ni duplicados, y disponer de notificación IndexNow controlada para ambos dominios.

**Architecture:** Un módulo CommonJS pequeño valida nombres de eventos y parámetros antes de llamar a `gtag`. Gatsby usa Consent Mode básico y no carga la etiqueta hasta que la persona acepta analítica; después registra llegadas atribuidas desde WordPress y las interfaces reutilizan el mismo contrato. La propiedad comercial usa el mismo web stream en ambos dominios mediante la configuración administrativa recomendada por GA4. Una CLI Node genera la prueba pública de IndexNow y solo acepta rutas públicas del host comercial; WordPress usa la integración mantenida por Bing en el evento de publicación real.

**Tech Stack:** Gatsby 5, React 18, Google tag/GA4, Node.js built-ins, Firebase Hosting, IndexNow, WordPress, MonsterInsights.

## Global Constraints

- Repositorio Gatsby: `/home/carlos/Documentos/Repositorios/certificacionMontessori`.
- La propiedad comercial `G-P0CNEGW276` es la fuente de verdad del embudo.
- La propiedad editorial `G-075JTS42RZ` se conserva para continuidad histórica.
- La propiedad comercial debe cargarse una sola vez por página en cada dominio.
- La etiqueta de Google no se descarga antes de aceptar analítica; denegar no bloquea navegación, formularios, WhatsApp ni checkout.
- `ad_storage`, `ad_user_data` y `ad_personalization` permanecen en `denied` en este proyecto orgánico.
- GA4 no recibe nombre, email, teléfono, dirección, mensaje ni identificadores de orden.
- Los eventos permitidos son `click_article`, `view_program`, `click_program_cta`, `click_whatsapp`, `generate_lead`, `click_amazon`, `begin_checkout` y `purchase`.
- `purchase` solo se emite desde una confirmación de pago fiable; este plan no lo infiere desde una página de éxito.
- Tasks 1 and 2 are intermediate commits only; do not deploy them before Task 3 removes eager gtag loading and passes the consent gate.
- Una llegada UTM desde Montessori México prueba el clic, pero no prueba una conversación.
- IndexNow nunca recibe checkout, inscripción, 404, redirecciones, drafts o URLs externas.
- El archivo de validación IndexNow es público por diseño y no se trata como credencial privada.

---

### Task 1: Create the Analytics Contract and Attributed Arrival Event

**Files:**
- Create: `src/utils/analytics.js`
- Create: `scripts/test-analytics.js`
- Modify: `gatsby-browser.js:1-9`
- Modify: `package.json:43-58`

**Interfaces:**
- Produces: `trackEvent(eventName: string, params?: object, target?: object) -> boolean`.
- Produces: `getAttribution(search: string) -> object | null`.
- Produces: `trackAttributedArrival(location: LocationLike, target?: object) -> boolean`.
- Later components consume only `trackEvent`; no component calls `window.gtag` directly.

- [ ] **Step 1: Write the failing Node contract test**

```javascript
// scripts/test-analytics.js
const assert = require("assert")
const {
  buildSafeParams,
  getAttribution,
  trackAttributedArrival,
  trackEvent,
} = require("../src/utils/analytics")

assert.deepStrictEqual(
  buildSafeParams({
    language: "es",
    program_id: "casa",
    email: "persona@example.com",
    message: "texto privado",
    unknown: "discard",
  }),
  { language: "es", program_id: "casa" }
)

assert.deepStrictEqual(
  getAttribution(
    "?utm_source=montessorimexico.org&utm_medium=referral&utm_campaign=guia_montessori&utm_content=post_d95119f319861cea&utm_term=casa"
  ),
  {
    source_hostname: "montessorimexico.org",
    source_content_id: "post_d95119f319861cea",
    program_id: "casa",
  }
)

const createTarget = referrer => {
  const calls = []
  return {
    calls,
    target: {
      gtag: (...args) => calls.push(args),
      sessionStorage: {
        values: new Map(),
        getItem(key) { return this.values.get(key) || null },
        setItem(key, value) { this.values.set(key, value) },
      },
      document: { referrer },
    },
  }
}

const { calls, target } = createTarget(
  "https://montessorimexico.org/articulo-editorial/"
)

assert.strictEqual(
  trackAttributedArrival(
    {
      pathname: "/diplomados/casa-de-ninos/",
      search: "?utm_source=montessorimexico.org&utm_medium=referral&utm_campaign=guia_montessori&utm_content=post_d95119f319861cea&utm_term=casa",
    },
    target
  ),
  true
)
assert.strictEqual(calls.length, 1)
assert.strictEqual(calls[0][1], "click_program_cta")
assert.strictEqual(calls[0][2].source_content_id, "post_d95119f319861cea")

assert.strictEqual(
  trackAttributedArrival(
    {
      pathname: "/diplomados/casa-de-ninos/",
      search: "?utm_source=montessorimexico.org&utm_medium=referral&utm_campaign=guia_montessori&utm_content=post_d95119f319861cea&utm_term=casa",
    },
    target
  ),
  false
)
assert.strictEqual(calls.length, 1)

for (const referrer of ["", "http://montessorimexico.org/articulo-editorial/"]) {
  const { calls: rejectedCalls, target: rejectedTarget } = createTarget(referrer)
  assert.strictEqual(
    trackAttributedArrival(
      {
        pathname: "/diplomados/casa-de-ninos/",
        search: "?utm_source=montessorimexico.org&utm_medium=referral&utm_campaign=guia_montessori&utm_content=post_d95119f319861cea&utm_term=casa",
      },
      rejectedTarget
    ),
    false
  )
  assert.strictEqual(rejectedCalls.length, 0)
}

assert.strictEqual(trackEvent("invented_event", {}, target), false)
console.log("analytics contract ok")
```

- [ ] **Step 2: Run it and verify the missing module failure**

```bash
node scripts/test-analytics.js
```

Expected: `Cannot find module '../src/utils/analytics'`.

- [ ] **Step 3: Implement the strict analytics module**

```javascript
// src/utils/analytics.js
const {
  LANGUAGE_CODES,
  LOCALIZED_PATHS,
  localizePath,
  normalizePath,
} = require("../i18n/config")

const ALLOWED_EVENTS = new Set([
  "click_article",
  "view_program",
  "click_program_cta",
  "click_whatsapp",
  "generate_lead",
  "click_amazon",
  "begin_checkout",
  "purchase",
])

const ALLOWED_PARAMS = new Set([
  "language",
  "program_id",
  "source_hostname",
  "source_content_id",
  "landing_path",
  "cta_position",
  "lead_channel",
  "book_id",
])

const ALLOWED_LANGUAGES = new Set(LANGUAGE_CODES)
const ALLOWED_PROGRAM_IDS = new Set([
  "nido",
  "casa",
  "taller",
  "cosmica",
  "neuro",
  "general_training",
  "inscripcion",
  "unknown",
])
const ATTRIBUTION_PROGRAM_IDS = new Set([
  "nido",
  "casa",
  "taller",
  "cosmica",
  "neuro",
  "general_training",
])
const ALLOWED_CTA_POSITIONS = new Set([
  "article",
  "floating_widget",
  "footer",
  "contact_whatsapp",
  "inscripcion_part_1",
  "checkout_form",
  "enrollment_reservation_form",
  "article_card",
  "book_card",
  "program_offer",
  "program_page",
  "program_questions",
])
const ALLOWED_LEAD_CHANNELS = new Set(["whatsapp", "form", "stripe"])
const ALLOWED_SOURCE_HOSTNAMES = new Set([
  "montessorimexico.org",
  "certificacionmontessori.com",
])
const TRUSTED_REFERRER_HOSTNAMES = new Set([
  "montessorimexico.org",
  "www.montessorimexico.org",
])
const INTENT_LANDING_PATHS = Object.freeze({
  nido: "/diplomados/nido-comunidad-infantil/",
  casa: "/diplomados/casa-de-ninos/",
  taller: "/diplomados/taller-i-ii/",
  cosmica: "/diplomados/educacion-cosmica/",
  neuro: "/diplomados/neuroeducacion/",
  general_training: "/diplomados/",
})
const PROGRAM_LANDING_PATHS = Object.values(INTENT_LANDING_PATHS)
const LOCALIZED_STATIC_PATHS = new Set(
  [...new Set([...LOCALIZED_PATHS, ...PROGRAM_LANDING_PATHS])].flatMap(path =>
    LANGUAGE_CODES.map(language => localizePath(language, path))
  )
)
const ALLOWED_LANDING_PATHS = new Set([
  ...LOCALIZED_STATIC_PATHS,
  "/404/",
  "/certificate/",
  "/masterclasses/",
])
const SAFE_TOKEN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const EMAIL_PATTERN = /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i
const UUID_PATTERN =
  /(?:^|-)[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?:-|$)/i
const ORDER_ID_PATTERN =
  /(?:^|-)(?:transaction|transaccion|order|orden|pedido|checkout|payment|pago|stripe|session|pi|cs)(?:-id)?-[a-z0-9]{6,}(?:-|$)/i
const ORDER_MARKER_PATTERN =
  /(?:^|-)(?:transaction|transaccion|order|orden|pedido|checkout|payment|pago|stripe|session)(?:-|$)/i
const LONG_HEX_SEGMENT_PATTERN = /(?:^|-)[0-9a-f]{12,}(?:-|$)/i
const SOURCE_CONTENT_ID_PATTERN = /^post_[0-9a-f]{16}$/
const sessionDedupe = new Set()

const cleanString = value => {
  if (typeof value !== "string") return undefined
  const clean = value.trim()
  return clean || undefined
}

const validateClosedValue = (value, allowed) => {
  const clean = cleanString(value)
  return clean && allowed.has(clean) ? clean : undefined
}

const validateSafeToken = (value, maxLength) => {
  const clean = cleanString(value)
  if (!clean || clean.length > maxLength || !SAFE_TOKEN_PATTERN.test(clean)) {
    return undefined
  }
  const digitCount = (clean.match(/\d/g) || []).length
  if (
    EMAIL_PATTERN.test(clean) ||
    UUID_PATTERN.test(clean) ||
    LONG_HEX_SEGMENT_PATTERN.test(clean) ||
    ORDER_ID_PATTERN.test(clean) ||
    (digitCount > 0 && ORDER_MARKER_PATTERN.test(clean)) ||
    digitCount >= 7
  ) {
    return undefined
  }
  return clean
}

const validateSourceContentId = value =>
  typeof value === "string" && SOURCE_CONTENT_ID_PATTERN.test(value) ? value : undefined

const hasTrustedReferrer = runtime => {
  let referrer
  try {
    referrer = cleanString(runtime?.document?.referrer)
  } catch (_error) {
    return false
  }
  if (!referrer) return false

  try {
    const url = new URL(referrer)
    const authority = referrer.slice(referrer.indexOf("://") + 3).split(/[/?#]/, 1)[0]
    return (
      url.protocol === "https:" &&
      TRUSTED_REFERRER_HOSTNAMES.has(url.hostname) &&
      url.origin === `https://${url.hostname}` &&
      authority.toLowerCase() === url.hostname
    )
  } catch (_error) {
    return false
  }
}

const validateLandingPath = value => {
  const clean = cleanString(value)
  if (!clean || !clean.startsWith("/") || /[?#]/.test(clean)) return undefined
  const normalized = normalizePath(clean)
  return ALLOWED_LANDING_PATHS.has(normalized) ? normalized : undefined
}

const PARAM_VALIDATORS = {
  language: value => validateClosedValue(value, ALLOWED_LANGUAGES),
  program_id: value => validateClosedValue(value, ALLOWED_PROGRAM_IDS),
  source_hostname: value =>
    validateClosedValue(value, ALLOWED_SOURCE_HOSTNAMES),
  source_content_id: validateSourceContentId,
  landing_path: validateLandingPath,
  cta_position: value => validateClosedValue(value, ALLOWED_CTA_POSITIONS),
  lead_channel: value => validateClosedValue(value, ALLOWED_LEAD_CHANNELS),
  book_id: value => validateSafeToken(value, 64),
}

const buildSafeParams = params =>
  Object.entries(params || {}).reduce((safe, [key, value]) => {
    if (!ALLOWED_PARAMS.has(key)) return safe
    const validated = PARAM_VALIDATORS[key](value)
    if (validated !== undefined) safe[key] = validated
    return safe
  }, {})

const getTarget = target =>
  target || (typeof window !== "undefined" ? window : undefined)

const trackEvent = (eventName, params = {}, target) => {
  if (!ALLOWED_EVENTS.has(eventName)) return false
  const runtime = getTarget(target)
  if (!runtime || typeof runtime.gtag !== "function") return false
  try {
    runtime.gtag("event", eventName, buildSafeParams(params))
    return true
  } catch (_error) {
    return false
  }
}

const getAttribution = search => {
  const params = new URLSearchParams(search || "")
  if (
    params.get("utm_source") !== "montessorimexico.org" ||
    params.get("utm_medium") !== "referral" ||
    params.get("utm_campaign") !== "guia_montessori"
  ) {
    return null
  }
  const sourceContentId = validateSourceContentId(params.get("utm_content"))
  const programId = validateClosedValue(params.get("utm_term"), ATTRIBUTION_PROGRAM_IDS)
  if (!sourceContentId || !programId) return null

  return {
    source_hostname: "montessorimexico.org",
    source_content_id: sourceContentId,
    program_id: programId,
  }
}

const trackAttributedArrival = (location, target) => {
  const attribution = getAttribution(location?.search)
  if (!attribution) return false

  const landingPath = validateLandingPath(location?.pathname)
  const intendedPath = INTENT_LANDING_PATHS[attribution.program_id]
  if (
    !landingPath ||
    !intendedPath ||
    !LANGUAGE_CODES.some(language => localizePath(language, intendedPath) === landingPath)
  ) {
    return false
  }

  const runtime = getTarget(target)
  if (!runtime || !hasTrustedReferrer(runtime)) return false
  const dedupeKey = [
    "ammac-cta-arrival",
    landingPath,
    attribution.source_content_id,
    attribution.program_id,
  ].join(":")

  if (sessionDedupe.has(dedupeKey)) return false
  try {
    if (runtime.sessionStorage?.getItem(dedupeKey)) return false
  } catch (_error) {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  const sent = trackEvent(
    "click_program_cta",
    { ...attribution, landing_path: landingPath, cta_position: "article" },
    runtime
  )
  if (!sent) return false

  sessionDedupe.add(dedupeKey)
  try {
    runtime.sessionStorage?.setItem(dedupeKey, "1")
  } catch (_error) {
    // The in-memory marker still prevents duplicate route-update events.
  }
  return true
}

module.exports = {
  ALLOWED_EVENTS,
  ALLOWED_PARAMS,
  INTENT_LANDING_PATHS,
  buildSafeParams,
  getAttribution,
  trackAttributedArrival,
  trackEvent,
}
```

- [ ] **Step 4: Track attributed route arrivals in Gatsby**

Add to `gatsby-browser.js`:

```javascript
const { trackAttributedArrival } = require("./src/utils/analytics")

export const onRouteUpdate = ({ location }) => {
  trackAttributedArrival(location)
}
```

Add package script:

```json
"test:analytics": "node scripts/test-analytics.js"
```

- [ ] **Step 5: Run contract and production build**

```bash
npm run test:analytics
npm run build
```

Expected: `analytics contract ok`; Gatsby build exits `0`.

- [ ] **Step 6: Commit**

```bash
git add src/utils/analytics.js scripts/test-analytics.js gatsby-browser.js package.json package-lock.json
git commit -m "feat(analytics): add privacy-safe funnel events"
```

---

### Task 2: Instrument Existing Contact and Enrollment Actions

**Files:**
- Create: `src/components/TrackedActionLink.js`
- Modify: `src/components/layout.js:7-63`
- Modify: `src/components/footer.js:5-76`
- Modify: `src/pages/contact.js:17-126`
- Modify: `src/data/inscripcionForm.js`
- Modify: `src/components/inscripcion/InscripcionParte1Form.js:4-77`
- Modify: `src/components/checkout/InscriptionCheckoutForm.js:145-207`
- Modify: `src/components/checkout/ApartarInscripcionForm.js:1-68`
- Modify: `src/utils/stripeCheckout.js`
- Create: `scripts/test-analytics-instrumentation.js`
- Modify: `package.json`
- Modify: `docs/superpowers/plans/2026-07-11-analytics-indexnow-foundation.md`

**Interfaces:**
- Produces React component: `TrackedActionLink({ eventName, eventParams, href, children, onClick, ...anchorProps })`.
- Emits `generate_lead` only after the API accepted part one.
- Emits `begin_checkout` only after Stripe returned a validated hosted checkout URL.
- Validates public Checkout URLs as credential-free `https://checkout.stripe.com` URLs before returning them to either checkout consumer.

- [ ] **Step 1: Write the failing instrumentation and Checkout URL contract**

Create `scripts/test-analytics-instrumentation.js` and add the `test:analytics-instrumentation` package script. The executable Node contract must:

- Exercise `TrackedActionLink` and source-parse every Task 2 event call site.
- Require each payload expression to match its closed source: resolve each localization `language` identifier to its lexical binding, destructured directly from zero-argument `useLocalization()` in the component scope; the SSR-safe `typeof window === "undefined" ? "" : window.location.pathname`; exact CTA position and lead channel; the closed `getAnalyticsProgramIdByNivelLabel(nivelElegido)` lead mapping; the existing full-checkout catalog lookup with `"inscripcion"` fallback; and the reservation `"inscripcion"` literal.
- Require WhatsApp event names and layout, footer, and contact CTA positions exactly. Include negative source mutations proving user-derived `program_id` values such as `userValue`, `message`, `nombreCompleto`, and `emailContacto` fail.
- Mock `fetch` for `createPublicCheckoutSession` and cover one valid Stripe Checkout URL plus absent, non-string, relative, malformed, HTTP, credential-bearing, suffix-host, other-host, and non-standard-port responses.

- [ ] **Step 2: Run the contract and verify RED**

```bash
npm run test:analytics-instrumentation
```

Expected before implementation: exit `1` because the required source instrumentation and/or Checkout URL validation does not yet exist.

- [ ] **Step 3: Add the reusable tracked anchor**

```javascript
// src/components/TrackedActionLink.js
import * as React from "react"

const { trackEvent } = require("../utils/analytics")

const TrackedActionLink = ({
  eventName,
  eventParams = {},
  onClick,
  children,
  ...anchorProps
}) => {
  const handleClick = event => {
    trackEvent(eventName, eventParams)
    onClick?.(event)
  }

  return (
    <a {...anchorProps} onClick={handleClick}>
      {children}
    </a>
  )
}

export default TrackedActionLink
```

- [ ] **Step 4: Instrument the floating and footer WhatsApp links**

Replace the floating widget anchor in `layout.js` with `TrackedActionLink`:

Import `useLocalization` and add `const { language } = useLocalization()` inside `Layout`.

```jsx
<TrackedActionLink
  target="_blank"
  rel="noreferrer"
  href={whatsappInformesUrl}
  eventName="click_whatsapp"
  eventParams={{
    language,
    landing_path: typeof window === "undefined" ? "" : window.location.pathname,
    cta_position: "floating_widget",
    lead_channel: "whatsapp",
  }}
>
  {/* existing widget contents */}
</TrackedActionLink>
```

Apply the same component to the footer WhatsApp link with its existing `useLocalization().language` and `cta_position: "footer"`.

- [ ] **Step 5: Instrument the contact page by method key**

Pass `methodKey={method.key}` to `ContactMethod`. Import `useLocalization` and `TrackedActionLink`. Inside the component, keep a normal anchor for non-WhatsApp methods and instrument only WhatsApp:

```jsx
const ContactMethod = ({ icon, title, link, description, methodKey }) => {
  const { language } = useLocalization()
  const isWhatsApp = methodKey === "whatsapp"
  const contents = (
    <div className="flex flex-col items-center justify-center text-center selection:text-white selection:bg-green selection:bg-opacity-20">
      <span className={`md:p-3 text-blue-500 rounded-full bg-blue-100/80 dark:bg-gray-800 ${iconsSize}`}>{icon}</span>
      <h2 className="mt-4 text-sm sm:font-medium md:text-lg text-gray-800 dark:text-white">{title}</h2>
      <p className="mt-2">{description}</p>
    </div>
  )
  if (!isWhatsApp) {
    return <a href={link} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-center">{contents}</a>
  }
  return (
    <TrackedActionLink
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      eventName="click_whatsapp"
      eventParams={{
        language,
        landing_path: typeof window === "undefined" ? "" : window.location.pathname,
        cta_position: `contact_${methodKey}`,
        lead_channel: methodKey,
      }}
      className="flex flex-col items-center justify-center text-center selection:text-white selection:bg-green selection:bg-opacity-20"
    >
      {contents}
    </TrackedActionLink>
  )
}
```

Do not emit an event for email, map or telephone in this task because those actions do not match the approved funnel event meanings.

- [ ] **Step 6: Emit a lead only after part-one acceptance**

In `InscripcionParte1Form.js`, import `getAnalyticsProgramIdByNivelLabel`, `useLocalization` and `trackEvent`; add `const { language } = useLocalization()`. `getAnalyticsProgramIdByNivelLabel` resolves the form label through `getNivelByLabel`, accepts only `nido`, `casa`, `taller`, `cosmica` and `neuro`, and returns `unknown` for `filosofia`, `otro`, missing or unknown labels. Immediately after `submitInscripcionParte1(...)` resolves and before `onSuccess`:

```javascript
const programId = getAnalyticsProgramIdByNivelLabel(nivelElegido)
trackEvent("generate_lead", {
  language,
  program_id: programId,
  landing_path: typeof window === "undefined" ? "" : window.location.pathname,
  cta_position: "inscripcion_part_1",
  lead_channel: "form",
})
```

Never pass any field from `form`.

- [ ] **Step 7: Validate Checkout URLs and emit checkout only after Stripe returns one**

In `src/utils/stripeCheckout.js`, validate the successful `data.url` before returning it. Accept only a string that parses as an absolute HTTPS URL with no username or password, exact hostname `checkout.stripe.com`, and the default HTTPS origin. Reject absent, malformed, relative, HTTP, credential-bearing, suffix-host, other-host, and non-standard-port values with the existing `Respuesta de pago incompleta` boundary. Return the normalized validated URL so both existing Checkout consumers are protected without changing their payloads or navigation.

In `InscriptionCheckoutForm.js`, immediately after a successful validated `createPublicCheckoutSession` response:

```javascript
trackEvent("begin_checkout", {
  language,
  program_id: getProgramaByCheckoutLabel(programa)?.id || "inscripcion",
  landing_path: typeof window === "undefined" ? "" : window.location.pathname,
  cta_position: "checkout_form",
  lead_channel: "stripe",
})
```

In `ApartarInscripcionForm.js`, use the constants already present and emit:

```javascript
trackEvent("begin_checkout", {
  language,
  program_id: "inscripcion",
  landing_path: typeof window === "undefined" ? "" : window.location.pathname,
  cta_position: "enrollment_reservation_form",
  lead_channel: "stripe",
})
```

Do not pass `ordenId`, Stripe URL, name, email or telephone. Do not add `purchase` to `checkout/success.js`.

- [ ] **Step 8: Run the contract and verify GREEN**

```bash
npm run test:analytics-instrumentation
```

Expected: exit `0` with `analytics instrumentation contract ok`.

- [ ] **Step 9: Verify no disallowed parameter reaches source calls**

```bash
rg -n "trackEvent\(" src
rg -n "trackEvent\([^\n]*(email|telefono|nombre|message|orden)" src
npm run test:analytics
npm run test:analytics-instrumentation
npm run test:seo-redirects
npm run test:seo-sitemap
npm run build
```

Expected: the first command lists intended call sites; the second prints nothing; the source/AST instrumentation contract, analytics contract, SEO contracts and build pass.

- [ ] **Step 10: Commit**

```bash
git add docs/superpowers/plans/2026-07-11-analytics-indexnow-foundation.md package.json scripts/test-analytics-instrumentation.js src/components/TrackedActionLink.js src/components/layout.js src/components/footer.js src/pages/contact.js src/data/inscripcionForm.js src/components/inscripcion/InscripcionParte1Form.js src/components/checkout/InscriptionCheckoutForm.js src/components/checkout/ApartarInscripcionForm.js src/utils/stripeCheckout.js
git commit -m "feat(analytics): measure contact and enrollment intent"
```

---

### Task 3: Gate Gatsby Analytics Behind Reversible Consent

**Files:**
- Create: `src/utils/analyticsConsent.js`
- Create: `src/utils/analyticsPageContext.js`
- Create: `src/utils/analyticsConsentDom.js`
- Create: `src/components/AnalyticsConsent.js`
- Create: `scripts/test-analytics-consent.js`
- Create: `docs/SEO_ANALYTICS_OPERATIONS.md`
- Create: `docs/i18n/PRIVACY_REVIEW_2026-07-11.md`
- Modify: `src/utils/analytics.js`
- Modify: `scripts/test-analytics.js`
- Modify: `gatsby-browser.js`
- Modify: `gatsby-config.js`
- Modify: `src/components/layout.js`
- Modify: `src/styles/wa.css`
- Modify: `src/components/footer.js`
- Modify: `src/pages/privacy.js`
- Modify: `src/i18n/locales/{es,en,pt-br}/common.json`
- Modify: `src/i18n/locales/{es,en,pt-br}/legal.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docs/superpowers/plans/2026-07-11-analytics-indexnow-foundation.md`
- Verify: `scripts/test-analytics-instrumentation.js`

**Interfaces:**
- Produce `getAnalyticsConsent(target?) -> "unknown" | "granted" | "denied"`.
- Produce `setAnalyticsConsent(state, target?) -> boolean`, `initializeAnalyticsConsent(target?) -> boolean`, `openAnalyticsConsent(target?) -> boolean`, `isAnalyticsGranted(target?) -> boolean`, and `isAnalyticsReady(target?) -> boolean`.
- Produce `trackPageView(location, target?) -> boolean` using only a closed normalized certification pathname and `https://certificacionmontessori.com`.
- Produce the internal Gatsby boundary `registerAnalyticsNavigation(location, target?) -> boolean`; it registers a valid navigation before `trackPageView` attempts delivery.
- Keep all A1/A2 event, attribution, payment, and navigation contracts unchanged.

**Binding contract:**
- Use Basic Consent Mode globally. Unknown and fresh denial create no Google queue, tag script, request, event, or page view.
- First grant queues exactly: consent default denied, consent update with analytics granted, `js`, then `config` with `send_page_view: false`; append the script only afterward.
- Every successful explicit grant or denial is authoritative in memory for that page runtime. A no-op or throwing setter, stale or throwing getter, and absent storage cannot replace the current explicit choice; a new runtime may read valid persisted consent normally.
- Keep `ad_storage`, `ad_user_data`, and `ad_personalization` denied. Only `analytics_storage` may be granted.
- Revocation queues denied when `gtag` exists, blocks later app events, best-effort removes `_ga`/`_ga_*` cookies, and is documented as non-retroactive. A regrant sends a new granted update without duplicate script/config.
- Throwing storage, DOM, gtag, CustomEvent, dispatch, cookies, and script insertion never break functional flows. Storage failure uses in-memory session consent; script failure is retryable without a false initialized marker.
- No component calls `gtag` directly.
- One shared `analyticsPageContext.js` boundary supplies `page_path`, `page_location`, and `page_referrer` to GA config, every allowed custom event, and manual `page_view` events. These internal fields are appended only after public caller parameters are validated and are not public allowlisted parameters.
- Page context accepts only the existing closed normalized certification paths and fixed page origin. Invalid or missing runtime paths fall back to `/` for config/custom events; explicit invalid `trackPageView` paths fail closed.
- Safe referrers accept only HTTPS URLs on the exact closed funnel hostname allowlist, discard path/query/hash to `https://hostname/`, and reject credentials, explicit ports, HTTP, suffix-host attacks, and unlisted hosts to the fixed certification fallback.
- Partial initialization keeps default, granted-update, `js`, and config state separate. `isAnalyticsReady` is true only with current granted consent after all four commands have queued successfully. `trackEvent`, `trackPageView`, and attributed arrival require this fully queued initialization. A failed `js` or config blocks application events until retry; a later script/network failure does not undo already queued readiness. Revoke/regrant after a failed `js` or config queues a fresh granted update before unfinished initialization without duplicating successful one-time commands.
- Page views are deduplicated per navigation instance in runtime memory. Gatsby registers the current valid navigation before sending, using `location.key` when available and a normalized pathname fallback otherwise. First grant backfills the current unsent navigation once; reaffirm, revoke/regrant, and repeated sends do not duplicate it. A next route, same pathname with a new key, or browser-history return after an intervening navigation may send once. Invalid paths never register, failed `gtag` calls remain retryable, and navigation identities never enter GA payloads.
- Known-failed canonical scripts are ignored even if both id reassignment and removal throw. Pending or loaded replacements do not duplicate.
- Event subscription/removal, body-class toggling/removal, active-element capture, and focus calls use executable fail-safe helpers. Footer reopen captures its active element, entry focuses decline, and either choice restores the opener.

- [ ] **Step 1: Write the failing lifecycle and privacy-boundary tests**

Create `scripts/test-analytics-consent.js` before production code. It must assert unknown/deny/grant/revoke/regrant, no-op writes with stale opposite values, v2 payloads and command order, safe config context before script append, failures at both `js` and config followed by blocked immediate events and successful retry/regrant, one successful default/`js`/config, dual-failure script cleanup retry, pending replacement deduplication, in-memory consent, executable throwing/absent event/body/focus helpers, opener focus restoration, cookie cleanup, no eager plugin, Gatsby/UI wiring, Article 30 rectification details in every locale, legal review status, operations sources, and this binding Task 3.

Extend `scripts/test-analytics.js` before changing `src/utils/analytics.js`:

```javascript
assert.strictEqual(trackPageView({
  origin: "https://attacker.example",
  pathname: "/diplomados/casa-de-ninos/",
  search: "?email=persona@example.com&order=cs_secret",
  hash: "#access-token",
}, grantedTarget), true)
assert.deepStrictEqual(calls.at(-1)[2], {
  page_path: "/diplomados/casa-de-ninos/",
  page_location: "https://certificacionmontessori.com/diplomados/casa-de-ninos/",
})
assert.strictEqual(trackPageView({ pathname: "/checkout/success/?order=cs_secret" }, grantedTarget), false)
assert.strictEqual(trackEvent("click_whatsapp", {}, deniedTarget), false)
assert.strictEqual(trackPageView({ pathname: "/contact/" }, throwingStorageTarget), false)
```

Also assert that every allowed custom event receives non-overridable internal `page_path`, `page_location`, and `page_referrer`; invalid runtime paths fall back to `/`; manual page views include the same safe context; page context never exposes caller URL material; exact allowlisted HTTPS referrers such as `https://montessorimexico.org/articulo/?email=x#token` and `https://www.google.com.mx/search?q=montessori` reduce to their fixed origins; and HTTP, credentials, explicit ports, suffix-host attacks, and unlisted hosts use the certification fallback. Cover unknown-route registration then grant, same-route reaffirm, revoke/regrant, a next route, the same pathname with a new `location.key`, a browser-back key, invalid paths, and failed-send retry. Assert at most one app page view per navigation instance and no navigation key in any GA payload.

Run:

```bash
node scripts/test-analytics-consent.js
node scripts/test-analytics.js
```

Expected RED: missing `../src/utils/analyticsConsent`, then `trackPageView is not a function`; after core implementation, the consent test remains RED until UI/docs exist.

- [ ] **Step 2: Implement retryable Basic Consent Mode and analytics gating**

Use `ammac-analytics-consent-v1`, `G-P0CNEGW276`, script id `ammac-google-tag`, and events `ammac:analytics-consent-change` / `ammac:analytics-consent-open`. Keep memory and loader state per runtime. Advance each one-time command marker only after its successful call; track whether a fresh granted update is required independently. Mark failed script objects in memory so cleanup failure cannot block retry.

The first-grant sequence is binding:

```javascript
[
  ["consent", "default", consentPayload("denied")],
  ["consent", "update", consentPayload("granted")],
  ["js", new Date()],
  ["config", "G-P0CNEGW276", {
    send_page_view: false,
    page_path: safePath,
    page_location: safeLocation,
    page_referrer: safeReferrer,
  }],
]
```

Gate `trackEvent`, `trackAttributedArrival` through `trackEvent`, and `trackPageView` with `isAnalyticsReady`. Register and resolve the current navigation before the readiness check so an unknown or denied route remains available for first-grant backfill. Set its sent marker only after the page-view `gtag` call succeeds. Implement the payload as:

```javascript
const pathname = validateLandingPath(location?.pathname)
if (!pathname) return false
runtime.gtag("event", "page_view", {
  page_path: pathname,
  page_location: `https://certificacionmontessori.com${pathname}`,
})
```

Remove `gatsby-plugin-google-gtag` from config, package, and lock. Do not replace it with SSR or eager injection.

- [ ] **Step 3: Wire Gatsby and reversible localized UI**

Call `initializeAnalyticsConsent()` before browser-language redirect. On every route update call `registerAnalyticsNavigation(location)` before `trackPageView(location)`, then run attributed-arrival tracking. Render one `<AnalyticsConsent />` outside layout content. The banner must be non-modal, keyboard accessible, focus-visible, responsive, and provide equally functional decline/allow buttons. The footer preference button must reopen after either choice; revoke and later regrant must work without resending the current navigation. Only analytics utilities may queue events.

While the consent panel is open, reflect that state with an `analytics-consent-open` body class and use `src/styles/wa.css` to set `body.analytics-consent-open #wa { display: none; }`. This must remove the fixed WhatsApp widget from rendering, interaction, keyboard navigation, and the accessibility tree, restore it immediately after either consent choice, and clean up the class on unmount.

Add complete `analyticsConsent` records to ES/EN/PT-BR `common.json`. Declining must not block links, programs, forms, payments, or contact.

- [ ] **Step 4: Correct and render all privacy notices**

For ES/EN/PT-BR, visibly render last updated 11 July 2026, controller identity and full metadata address, current private-sector `Ley Federal de Protección de Datos Personales en Posesión de los Particulares` (DOF 20-03-2025; latest reform 14-11-2025), required versus optional purposes, GA4 ID/provider/categories, local-storage key, non-retroactive revocation, GA cookie cleanup limitation, and exclusion of names, email, phones, messages, postal addresses, order IDs, and access tokens.

ARCO text must provide `admin@certificacionmontessori.com` and office intake, summarize only the request information required by current law, identify requested changes and supporting documentation for rectification, state a 20 days decision period plus implementation within the following 15 days, and one justified equal extension. Publish changes at the same localized privacy URL. Render Google's policy with `target="_blank" rel="noopener noreferrer"`.

Create `docs/i18n/PRIVACY_REVIEW_2026-07-11.md` with exactly ES, EN, and PT-BR at `pending_owner_review`. Never record legal approval. Production stays blocked pending AMMAC privacy-owner approval.

- [ ] **Step 5: Add operations and package contract**

Add `test:analytics-consent` and document lifecycle, troubleshooting, query/hash/PII boundary, non-retroactive revocation, cookie cleanup, clean-profile QA, and release gate. Cite:

```text
https://developers.google.com/tag-platform/security/concepts/consent-mode
https://developers.google.com/tag-platform/security/guides/consent
https://support.google.com/analytics/answer/17016975
https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf
https://www.dof.gob.mx/nota_detalle.php?codigo=5752569&fecha=20/03/2025
https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais
https://developers.google.com/analytics/devguides/collection/ga4/reference/config
https://developers.google.com/analytics/devguides/collection/ga4/views
https://support.google.com/analytics/answer/9216061
https://developers.google.com/tag-platform/gtagjs/reference
```

Before production, disable every GA4 Enhanced Measurement option for the web stream, especially browser-history page views, and verify exactly one app-controlled `page_view` per navigation instance, including first-grant backfill, revoke/regrant, next-route, same-path/new-key, and browser-back cases.

- [ ] **Step 6: Verify GREEN and rendered behavior without live analytics**

```bash
npm run test:analytics-consent
npm run test:analytics
npm run test:analytics-instrumentation
npm run test:seo-redirects
npm run test:seo-sitemap
node -e 'for (const f of ["es","en","pt-br"]) JSON.parse(require("fs").readFileSync(`src/i18n/locales/${f}/common.json`));'
node -e 'for (const f of ["es","en","pt-br"]) JSON.parse(require("fs").readFileSync(`src/i18n/locales/${f}/legal.json`));'
npm run build
! rg -n '<script[^>]+googletagmanager.com/gtag/js|G-P0CNEGW276' public/index.html
! rg -n 'gatsby-plugin-google-gtag' package.json package-lock.json gatsby-config.js
git diff --check
```

Use Playwright CLI against the local Gatsby server. Before navigation, route and abort every request to `googletagmanager.com`, `google-analytics.com`, `analytics.google.com`, and `region1.google-analytics.com`; record attempted URLs without sending them. Record evidence for panel open/close, body class, computed WhatsApp visibility, interaction, accessible role/name, decline focus entry, opener focus restoration after both choices, ES/EN/PT-BR, desktop/mobile layout, console health, and safe queued GA config/custom/page-view context. Verify unknown -> zero, decline -> zero, denied reload -> zero, footer reopen, grant -> one tag-script attempt, revoke -> later events blocked, and regrant behavior. While open, verify `#wa` is not visible, interactive, keyboard reachable, or exposed in the accessibility tree; verify it returns after each choice. Store screenshots and temporary scripts outside tracked source.

Run secret/PII scans over the diff, verify `.superpowers` remains untracked, and do not deploy or read `.env`.

- [ ] **Step 7: Create one Gatsby commit**

```bash
git add gatsby-browser.js gatsby-config.js package.json package-lock.json \
  src/utils/analytics.js src/utils/analyticsConsent.js src/utils/analyticsPageContext.js \
  src/utils/analyticsConsentDom.js src/styles/wa.css \
  src/components/AnalyticsConsent.js src/components/layout.js src/components/footer.js \
  src/pages/privacy.js src/i18n/locales/es/common.json src/i18n/locales/en/common.json \
  src/i18n/locales/pt-br/common.json src/i18n/locales/es/legal.json \
  src/i18n/locales/en/legal.json src/i18n/locales/pt-br/legal.json \
  scripts/test-analytics.js scripts/test-analytics-consent.js \
  docs/SEO_ANALYTICS_OPERATIONS.md docs/i18n/PRIVACY_REVIEW_2026-07-11.md \
  docs/superpowers/plans/2026-07-11-analytics-indexnow-foundation.md
git commit -m "feat(privacy): gate analytics behind reversible consent"
```

---

### Task 4: Configure One Cross-Domain Funnel Stream Without Losing History

**Files:**
- Modify: `docs/SEO_ANALYTICS_OPERATIONS.md`

**Interfaces:**
- Produces the administrative contract required by `trackEvent`.
- Does not modify or delete the editorial GA4 property.

- [ ] **Step 1: Extend the operations document with the exact GA4 topology**

Add this table to `docs/SEO_ANALYTICS_OPERATIONS.md`:

```markdown
| Role | Measurement ID | Hosts |
| --- | --- | --- |
| Shared funnel source of truth | `G-P0CNEGW276` | `certificacionmontessori.com`, `montessorimexico.org` |
| Editorial historical property | `G-075JTS42RZ` | `montessorimexico.org` only |
```

State explicitly that each property may receive one `page_view`, but the same property must never receive two for one page load.

- [ ] **Step 2: Put WordPress analytics behind basic consent first**

In WordPress Admin for `montessorimexico.org`, install the official CookieYes WordPress plugin (`cookie-law-info`), connect the domain, enable Google Consent Mode v2 in **Basic** mode and configure Necessary plus Analytics categories. Keep advertising consent disabled. Configure Spanish as the primary banner language and enable the maintained English and Brazilian Portuguese translations.

Classify the existing MonsterInsights/Google tag under Analytics and verify in a clean profile:

```text
Before any choice: no request to googletagmanager.com or google-analytics.com.
After Reject: still no Google analytics/tag request.
After accepting Analytics: one Google tag loads and the editorial property receives one page_view.
Cookie settings can reopen and revoke Analytics.
```

Record CookieYes plugin version, scan date, consent configuration and AMMAC privacy/legal wording approval in the operations document. Consent is stored independently on the two registrable domains; do not claim that a choice on one domain automatically applies to the other.

- [ ] **Step 3: Add the commercial Google tag to WordPress**

Only after Step 2 passes, add `G-P0CNEGW276` as a second destination through MonsterInsights or the site's Google tag integration while preserving `G-075JTS42RZ`. Both destinations must remain classified as Analytics and blocked by CookieYes until acceptance. View source and Network after saving.

Expected source conditions:

```text
G-075JTS42RZ appears once as the editorial destination.
G-P0CNEGW276 appears once as the shared funnel destination.
```

If the installed MonsterInsights tier cannot add a second destination without duplicating scripts, use Google's native Google tag destination configuration rather than adding another page-level snippet. Repeat the pre-consent, reject, accept and revoke Network checks after adding the destination.

- [ ] **Step 4: Configure domains in GA4 Admin**

In the property containing `G-P0CNEGW276`:

```text
Admin -> Data streams -> Web -> Configure tag settings -> Configure your domains
```

Add exact-match conditions for:

```text
certificacionmontessori.com
montessorimexico.org
```

Save. This follows Google's preferred GA4 Admin method and avoids a conflicting manual linker override.

- [ ] **Step 5: Register the custom dimensions**

Create event-scoped dimensions for:

```text
program_id
source_hostname
source_content_id
landing_path
cta_position
lead_channel
book_id
language
```

- [ ] **Step 6: Verify the linker and event deduplication**

Open a Montessori México CTA link in a clean browser session, accept Analytics separately on both domains, and confirm:

```text
The destination URL retains all utm_* parameters.
The destination URL contains _gl immediately after the click.
GA4 DebugView shows one click_program_cta.
The shared property shows one page_view for each visited page.
The editorial property still receives the WordPress page_view.
```

Add the exact verification procedure and screenshots location to the operations document.

- [ ] **Step 7: Commit documentation**

```bash
git add docs/SEO_ANALYTICS_OPERATIONS.md
git commit -m "docs(analytics): document cross-domain funnel operations"
```

---

### Task 5: Add a Safe IndexNow CLI for the Commercial Site

**Files:**
- Create: `scripts/init-indexnow-key.js`
- Create: `scripts/submit-indexnow.js`
- Create: `scripts/test-indexnow.js`
- Generate: `static/indexnow-key.txt`
- Modify: `package.json:43-58`
- Modify: `docs/SEO_ANALYTICS_OPERATIONS.md`

**Interfaces:**
- Produces: `normalizePublicPaths(paths: string[]) -> string[]`.
- Produces: `buildIndexNowPayload(paths: string[], key: string) -> object`.
- CLI: `npm run indexnow:submit -- /public/path/`.
- `INDEXNOW_DRY_RUN=1` validates and prints without network.

- [ ] **Step 1: Write failing payload tests**

```javascript
// scripts/test-indexnow.js
const assert = require("assert")
const {
  buildIndexNowPayload,
  normalizePublicPaths,
  submitIndexNow,
} = require("./submit-indexnow")

assert.deepStrictEqual(
  normalizePublicPaths([
    "/publicaciones/",
    "/en/diplomados/casa-de-ninos/",
    "/checkout/success/",
    "/inscripcion/pagar/",
    "https://evil.example/page",
    "/publicaciones/",
  ]),
  [
    "/publicaciones/",
    "/en/diplomados/casa-de-ninos/",
  ]
)

assert.deepStrictEqual(
  buildIndexNowPayload(["/publicaciones/"], "abc123"),
  {
    host: "certificacionmontessori.com",
    key: "abc123",
    keyLocation: "https://certificacionmontessori.com/indexnow-key.txt",
    urlList: ["https://certificacionmontessori.com/publicaciones/"],
  }
)

async function testRetries() {
  let calls = 0
  const fetchImpl = async () => {
    calls += 1
    return { ok: calls === 3, status: calls === 3 ? 200 : 503 }
  }
  await submitIndexNow(fetchImpl, buildIndexNowPayload(["/publicaciones/"], "abc123"), 3, async () => {})
  assert.strictEqual(calls, 3)

  let networkCalls = 0
  const flakyNetwork = async () => {
    networkCalls += 1
    if (networkCalls < 3) throw new Error("temporary network failure")
    return { ok: true, status: 200 }
  }
  await submitIndexNow(flakyNetwork, buildIndexNowPayload(["/publicaciones/"], "abc123"), 3, async () => {})
  assert.strictEqual(networkCalls, 3)

  const neverResponds = (_url, options) => new Promise((_, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error("aborted")))
  })
  await assert.rejects(
    submitIndexNow(
      neverResponds,
      buildIndexNowPayload(["/publicaciones/"], "abc123"),
      1,
      async () => {},
      5,
    ),
    /network failure/
  )
}

testRetries().then(() => console.log("IndexNow contract ok")).catch(error => {
  console.error(error)
  process.exitCode = 1
})
```

- [ ] **Step 2: Verify the missing module failure**

```bash
node scripts/test-indexnow.js
```

Expected: missing `submit-indexnow` module.

- [ ] **Step 3: Implement key initialization**

```javascript
// scripts/init-indexnow-key.js
const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const keyPath = path.join(__dirname, "..", "static", "indexnow-key.txt")
if (fs.existsSync(keyPath)) {
  console.log("IndexNow key already exists")
  process.exit(0)
}
const key = crypto.randomBytes(16).toString("hex")
fs.writeFileSync(keyPath, `${key}\n`, { encoding: "utf8", mode: 0o644 })
console.log("Created static/indexnow-key.txt")
```

- [ ] **Step 4: Implement strict submission and dry-run behavior**

```javascript
// scripts/submit-indexnow.js
const fs = require("fs")
const path = require("path")

const HOST = "certificacionmontessori.com"
const ORIGIN = `https://${HOST}`
const BLOCKED = [
  "/404",
  "/certificate",
  "/masterclasses",
  "/otroscursos",
  "/checkout/",
  "/inscripcion/",
  "/alumnos-app/",
]

const normalizePublicPaths = paths => {
  const accepted = new Set()
  for (const raw of paths || []) {
    if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) continue
    const pathname = raw.split(/[?#]/, 1)[0]
    const normalized = pathname === "/" ? "/" : `${pathname.replace(/\/+$/, "")}/`
    if (BLOCKED.some(prefix => normalized === prefix || normalized.startsWith(prefix))) continue
    accepted.add(normalized)
  }
  return [...accepted].sort()
}

const buildIndexNowPayload = (paths, key) => ({
  host: HOST,
  key,
  keyLocation: `${ORIGIN}/indexnow-key.txt`,
  urlList: normalizePublicPaths(paths).map(pathname => `${ORIGIN}${pathname}`),
})

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

const submitIndexNow = async (
  fetchImpl,
  payload,
  attempts = 3,
  sleep = wait,
  timeoutMs = 10000,
) => {
  let lastStatus = 0
  let lastError = null
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      if (response.ok) return response
      lastStatus = response.status
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timer)
    }
    if (attempt < attempts - 1) await sleep(500 * (2 ** attempt))
  }
  if (lastError && !lastStatus) {
    throw new Error(`IndexNow network failure after ${attempts} attempts: ${lastError.message}`)
  }
  throw new Error(`IndexNow returned HTTP ${lastStatus} after ${attempts} attempts`)
}

const run = async () => {
  const keyPath = path.join(__dirname, "..", "static", "indexnow-key.txt")
  const key = fs.readFileSync(keyPath, "utf8").trim()
  const payload = buildIndexNowPayload(process.argv.slice(2), key)
  if (!payload.urlList.length) throw new Error("No valid public URLs supplied")
  if (process.env.INDEXNOW_DRY_RUN === "1") {
    console.log(JSON.stringify(payload, null, 2))
    return
  }
  await submitIndexNow(fetch, payload)
  console.log(`IndexNow accepted ${payload.urlList.length} URL(s)`)
}

module.exports = { buildIndexNowPayload, normalizePublicPaths, submitIndexNow }

if (require.main === module) {
  run().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
```

- [ ] **Step 5: Add scripts, generate the public key and test**

Add to `package.json`:

```json
"indexnow:init": "node scripts/init-indexnow-key.js",
"indexnow:submit": "node scripts/submit-indexnow.js",
"test:indexnow": "node scripts/test-indexnow.js"
```

Run:

```bash
npm run indexnow:init
npm run test:indexnow
INDEXNOW_DRY_RUN=1 npm run indexnow:submit -- /publicaciones/ /checkout/success/ https://evil.example/page
```

Expected: key file is created; payload, HTTP retry, network retry and timeout tests pass; dry run prints only `/publicaciones/`.

- [ ] **Step 6: Build and verify the public key location**

```bash
npm run build
cmp static/indexnow-key.txt public/indexnow-key.txt
```

Expected: files are identical.

- [ ] **Step 7: Document successful-deploy-only submission**

Add to the operations document:

```text
1. Run the complete build and SEO suite.
2. Deploy Firebase Hosting successfully.
3. Pass only changed public paths to npm run indexnow:submit.
4. Verify receipt in Bing Webmaster Tools.
5. Do not resubmit unchanged URLs or treat receipt as an indexing guarantee.
```

- [ ] **Step 8: Commit**

```bash
git add scripts/init-indexnow-key.js scripts/submit-indexnow.js scripts/test-indexnow.js static/indexnow-key.txt package.json package-lock.json docs/SEO_ANALYTICS_OPERATIONS.md
git commit -m "feat(seo): add controlled IndexNow submissions"
```

---

### Task 6: Enable Maintained IndexNow on WordPress and Add the Runbook

**Files:**
- Create: `docs/SEO_MONITORING_RUNBOOK.md`

**Interfaces:**
- WordPress publication transitions notify IndexNow.
- Draft creation remains disconnected from IndexNow.

- [ ] **Step 1: Install and verify the maintained Bing IndexNow integration**

In WordPress Admin for `montessorimexico.org`, install the maintained IndexNow integration published by Microsoft Bing. Enable automatic submission for published posts, updates and deletions.

Expected: its diagnostics page is available in WordPress and no automation `.env` credential is requested.

- [ ] **Step 2: Verify draft isolation**

Create a private test draft and inspect IndexNow history in Bing Webmaster Tools.

Expected: no URL is submitted while status is `draft`.

- [ ] **Step 3: Verify the final permalink**

Publish the reviewed test article, then inspect the received URL.

Expected pattern:

```text
https://montessorimexico.org/titulo-del-articulo/
```

Rejected pattern:

```text
https://montessorimexico.org/?p=123
```

Return the article to its intended editorial state only through WordPress's normal revision workflow; do not delete production content merely to repeat the test.

- [ ] **Step 4: Write the monitoring runbook**

`docs/SEO_MONITORING_RUNBOOK.md` must contain these checkpoints:

```text
Weekly: sitemap status, crawl/index errors, IndexNow receipt, broken event checks, and consent-mode diagnostics.
48 hours after release: processing state and production smoke test.
7 days: indexed URL samples and non-brand query movement.
28 days: language/program/article acquisition and intent events.
90 days: qualified-lead trend and decision on the separate marketing project.
```

Add a **Google Search Console controlled-completion checklist**:

```text
Sitemaps: sitemap-index.xml is Success and its child reports 42 submitted/discovered canonical URLs.
Production contract: all 42 submitted URLs still return 200, self-canonical, index, and reciprocal hreflang.
Page indexing: filter by the submitted sitemap; export and classify every non-indexed submitted URL by reason. Indexing itself is observed, not forced.
Existing validation: record the 2026-07-11 validation state for “Crawled - currently not indexed”; never restart it while active.
HTTPS: no submitted URL appears as non-HTTPS.
Core Web Vitals: record mobile/desktop status and p75 LCP, INP, CLS when field data exists; “insufficient data” is valid.
Enhancements/structured data: investigate every report Google actually exposes; absence of a Course report is not an error.
Manual actions: none.
Security issues: none.
Performance: export clicks, impressions, CTR and position by page, query, country and device; segment /en/, /pt-br/ and Spanish root plus brand/non-brand queries.
```

Add a **Bing Webmaster Tools controlled-completion checklist**:

```text
Sitemaps: index and child finish processing with no error and the expected public inventory.
URL Inspection: one hub/program URL per locale passes Index, SEO, Markup and Live URL checks.
Site Scan: run a Website-scope scan after deployment; target zero Errors and classify every Warning/Notice before changing code.
Site Explorer: review Indexed, Error, Warning, Excluded, redirects, noindex and robots filters; old redirect URLs are expected outside the canonical inventory.
IndexNow Insights: confirm the 17 changed commercial URLs and public WordPress transitions; drafts never appear.
Search performance: record query/page/country movement separately from Google.
```

Add a **crawler/AI access checklist** that fetches live `robots.txt`, verifies separate `OAI-SearchBot` and `GPTBot` rules plus `ChatGPT-User`, checks localized `llms.txt` files remain informational, and records that crawler access is not a ranking or citation guarantee.

Include the rule that Google/Bing processing must not be restarted by repeated submissions. Link the runbook to the official Page Indexing, Search Console operations, Bing URL Inspection, Site Explorer, Site Scan and IndexNow documentation used in the design.

- [ ] **Step 5: Commit runbook and run the foundation suite**

```bash
git add docs/SEO_MONITORING_RUNBOOK.md
git commit -m "docs(seo): add search and conversion monitoring runbook"
npm run test:analytics
npm run test:analytics-consent
npm run test:indexnow
npm run build
```

Expected: tests and build pass; the runbook is committed.

## Plan Completion Gate

Confirm in a clean browser profile:

```text
1. Before consent, neither domain requests Google tag or Analytics endpoints.
2. Rejecting analytics preserves every functional flow and sends no analytics event.
3. After separate acceptance on both domains, WordPress sends one page_view to G-075JTS42RZ and one to G-P0CNEGW276.
4. After acceptance, Certificación Montessori sends one page_view to G-P0CNEGW276.
5. A cross-domain click gains _gl and retains UTM only when source analytics consent permits the linker; UTM works regardless.
6. click_program_cta is emitted once at the attributed destination after destination consent.
7. No analytics event contains values from forms.
8. Both domains expose a working preference-reopen/revoke action.
9. IndexNow dry-run filters every private or external path.
10. A WordPress draft does not appear in IndexNow history.
```
