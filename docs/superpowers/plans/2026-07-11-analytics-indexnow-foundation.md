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

const calls = []
const target = {
  gtag: (...args) => calls.push(args),
  sessionStorage: {
    values: new Map(),
    getItem(key) { return this.values.get(key) || null },
    setItem(key, value) { this.values.set(key, value) },
  },
}

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

const SAFE_VALUE_MAX_LENGTH = 120
const SOURCE_CONTENT_ID_PATTERN = /^post_[0-9a-f]{16}$/

const normalizeValue = value => {
  if (typeof value === "number" || typeof value === "boolean") return value
  if (typeof value !== "string") return undefined
  const clean = value.trim()
  return clean ? clean.slice(0, SAFE_VALUE_MAX_LENGTH) : undefined
}

const buildSafeParams = params =>
  Object.entries(params || {}).reduce((safe, [key, value]) => {
    if (!ALLOWED_PARAMS.has(key)) return safe
    const normalized = normalizeValue(value)
    if (normalized !== undefined) safe[key] = normalized
    return safe
  }, {})

const getTarget = target =>
  target || (typeof window !== "undefined" ? window : undefined)

const trackEvent = (eventName, params = {}, target) => {
  if (!ALLOWED_EVENTS.has(eventName)) return false
  const runtime = getTarget(target)
  if (!runtime || typeof runtime.gtag !== "function") return false
  runtime.gtag("event", eventName, buildSafeParams(params))
  return true
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
  const sourceContentId = params.get("utm_content")
  if (!SOURCE_CONTENT_ID_PATTERN.test(sourceContentId || "")) return null
  return buildSafeParams({
    source_hostname: params.get("utm_source"),
    source_content_id: sourceContentId,
    program_id: params.get("utm_term"),
  })
}

const trackAttributedArrival = (location, target) => {
  const attribution = getAttribution(location?.search)
  if (!attribution) return false
  const runtime = getTarget(target)
  if (!runtime?.sessionStorage) return false
  const dedupeKey = [
    "ammac-cta-arrival",
    location.pathname,
    attribution.source_content_id,
    attribution.program_id,
  ].join(":")
  if (runtime.sessionStorage.getItem(dedupeKey)) return false
  const sent = trackEvent(
    "click_program_cta",
    { ...attribution, landing_path: location.pathname, cta_position: "article" },
    runtime
  )
  if (sent) runtime.sessionStorage.setItem(dedupeKey, "1")
  return sent
}

module.exports = {
  ALLOWED_EVENTS,
  ALLOWED_PARAMS,
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
- Modify: `src/components/inscripcion/InscripcionParte1Form.js:4-77`
- Modify: `src/components/checkout/InscriptionCheckoutForm.js:145-207`
- Modify: `src/components/checkout/ApartarInscripcionForm.js:1-68`

**Interfaces:**
- Produces React component: `TrackedActionLink({ eventName, eventParams, href, children, onClick, ...anchorProps })`.
- Emits `generate_lead` only after the API accepted part one.
- Emits `begin_checkout` only after Stripe returned a checkout URL.

- [ ] **Step 1: Add the reusable tracked anchor**

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

- [ ] **Step 2: Instrument the floating and footer WhatsApp links**

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

- [ ] **Step 3: Instrument the contact page by method key**

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
        landing_path: "/contact/",
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

- [ ] **Step 4: Emit a lead only after part-one acceptance**

In `InscripcionParte1Form.js`, import `getProgramaByCheckoutLabel`, `useLocalization` and `trackEvent`; add `const { language } = useLocalization()`. Immediately after `submitInscripcionParte1(...)` resolves and before `onSuccess`:

```javascript
const programId = getProgramaByCheckoutLabel(nivelElegido)?.id || "unknown"
trackEvent("generate_lead", {
  language,
  program_id: programId,
  landing_path: typeof window === "undefined" ? "" : window.location.pathname,
  cta_position: "inscripcion_part_1",
  lead_channel: "form",
})
```

Never pass any field from `form`.

- [ ] **Step 5: Emit checkout only after Stripe returns a URL**

In `InscriptionCheckoutForm.js`, immediately after a successful `createPublicCheckoutSession` response:

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

- [ ] **Step 6: Verify no disallowed parameter reaches source calls**

```bash
rg -n "trackEvent\(" src
rg -n "trackEvent\([^\n]*(email|telefono|nombre|message|orden)" src
npm run test:analytics
npm run build
```

Expected: the first command lists intended call sites; the second prints nothing; tests and build pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/TrackedActionLink.js src/components/layout.js src/components/footer.js src/pages/contact.js src/components/inscripcion/InscripcionParte1Form.js src/components/checkout/InscriptionCheckoutForm.js src/components/checkout/ApartarInscripcionForm.js
git commit -m "feat(analytics): measure contact and enrollment intent"
```

---

### Task 3: Gate Gatsby Analytics Behind Reversible Consent

**Files:**
- Create: `src/utils/analyticsConsent.js`
- Create: `src/components/AnalyticsConsent.js`
- Create: `scripts/test-analytics-consent.js`
- Create: `docs/SEO_ANALYTICS_OPERATIONS.md`
- Create: `docs/i18n/PRIVACY_REVIEW_2026-07-11.md`
- Modify: `src/utils/analytics.js`
- Modify: `scripts/test-analytics.js`
- Modify: `gatsby-browser.js`
- Modify: `gatsby-config.js`
- Modify: `src/components/layout.js`
- Modify: `src/components/footer.js`
- Modify: `src/pages/privacy.js`
- Modify: `src/i18n/locales/es/common.json`
- Modify: `src/i18n/locales/en/common.json`
- Modify: `src/i18n/locales/pt-br/common.json`
- Modify: `src/i18n/locales/es/legal.json`
- Modify: `src/i18n/locales/en/legal.json`
- Modify: `src/i18n/locales/pt-br/legal.json`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces `getAnalyticsConsent(target?) -> "unknown" | "granted" | "denied"`.
- Produces `setAnalyticsConsent(state, target?) -> boolean`, `initializeAnalyticsConsent(target?) -> boolean` and `openAnalyticsConsent(target?) -> boolean`.
- Uses basic Consent Mode: no Google tag request occurs before `granted`.
- A denial is reversible from the footer and never blocks a functional flow.

- [ ] **Step 1: Write the failing consent lifecycle test**

```javascript
// scripts/test-analytics-consent.js
const assert = require("assert")
const {
  CONSENT_KEY,
  getAnalyticsConsent,
  initializeAnalyticsConsent,
  setAnalyticsConsent,
} = require("../src/utils/analyticsConsent")

const values = new Map()
const scripts = []
const dispatched = []
const target = {
  dataLayer: [],
  localStorage: {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  },
  document: {
    querySelector: selector => scripts.find(script => `#${script.id}` === selector) || null,
    createElement: tagName => ({ tagName }),
    head: { appendChild: script => scripts.push(script) },
  },
  CustomEvent: class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail }
  },
  dispatchEvent: event => dispatched.push(event),
}

assert.strictEqual(getAnalyticsConsent(target), "unknown")
assert.strictEqual(initializeAnalyticsConsent(target), false)
assert.strictEqual(scripts.length, 0)

assert.strictEqual(setAnalyticsConsent("denied", target), true)
assert.strictEqual(values.get(CONSENT_KEY), "denied")
assert.strictEqual(scripts.length, 0)

assert.strictEqual(setAnalyticsConsent("granted", target), true)
assert.strictEqual(getAnalyticsConsent(target), "granted")
assert.strictEqual(scripts.length, 1)
assert.strictEqual(scripts[0].src, "https://www.googletagmanager.com/gtag/js?id=G-P0CNEGW276")

const commands = target.dataLayer.map(args => Array.from(args))
const defaultConsent = commands.find(args => args[0] === "consent" && args[1] === "default")
const grantedConsent = commands.find(args => args[0] === "consent" && args[1] === "update")
assert.strictEqual(defaultConsent[2].analytics_storage, "denied")
assert.strictEqual(grantedConsent[2].analytics_storage, "granted")
assert.strictEqual(grantedConsent[2].ad_storage, "denied")
assert(commands.some(args => args[0] === "config" && args[1] === "G-P0CNEGW276"))

initializeAnalyticsConsent(target)
assert.strictEqual(scripts.length, 1)
setAnalyticsConsent("denied", target)
assert.strictEqual(getAnalyticsConsent(target), "denied")
assert.strictEqual(dispatched.at(-1).detail.state, "denied")
console.log("analytics consent contract ok")
```

- [ ] **Step 2: Verify the missing module failure**

```bash
node scripts/test-analytics-consent.js
```

Expected: missing `analyticsConsent` module.

- [ ] **Step 3: Implement the basic Consent Mode loader**

```javascript
// src/utils/analyticsConsent.js
const CONSENT_KEY = "ammac-analytics-consent-v1"
const MEASUREMENT_ID = "G-P0CNEGW276"
const SCRIPT_ID = "ammac-google-tag"
const CONSENT_CHANGE_EVENT = "ammac:analytics-consent-change"
const CONSENT_OPEN_EVENT = "ammac:analytics-consent-open"

const getRuntime = target => target || (typeof window !== "undefined" ? window : undefined)

const getAnalyticsConsent = target => {
  const runtime = getRuntime(target)
  try {
    const value = runtime?.localStorage?.getItem(CONSENT_KEY)
    return value === "granted" || value === "denied" ? value : "unknown"
  } catch {
    return "unknown"
  }
}

const isAnalyticsGranted = target => getAnalyticsConsent(target) === "granted"

const ensureGtagQueue = runtime => {
  runtime.dataLayer = runtime.dataLayer || []
  runtime.gtag = runtime.gtag || function gtag() { runtime.dataLayer.push(arguments) }
}

const consentPayload = analyticsStorage => ({
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: analyticsStorage,
})

const loadGoogleTag = target => {
  const runtime = getRuntime(target)
  if (!runtime?.document || !isAnalyticsGranted(runtime)) return false
  if (runtime.__ammacGoogleTagInitialized) return true

  ensureGtagQueue(runtime)
  runtime.gtag("consent", "default", consentPayload("denied"))
  runtime.gtag("consent", "update", consentPayload("granted"))
  runtime.gtag("js", new Date())
  runtime.gtag("config", MEASUREMENT_ID, { send_page_view: false })

  if (!runtime.document.querySelector(`#${SCRIPT_ID}`)) {
    const script = runtime.document.createElement("script")
    script.id = SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
    runtime.document.head.appendChild(script)
  }
  runtime.__ammacGoogleTagInitialized = true
  return true
}

const dispatch = (runtime, type, detail = {}) => {
  if (typeof runtime?.dispatchEvent !== "function" || typeof runtime?.CustomEvent !== "function") {
    return false
  }
  runtime.dispatchEvent(new runtime.CustomEvent(type, { detail }))
  return true
}

const setAnalyticsConsent = (state, target) => {
  if (state !== "granted" && state !== "denied") return false
  const runtime = getRuntime(target)
  if (!runtime?.localStorage) return false
  try {
    runtime.localStorage.setItem(CONSENT_KEY, state)
  } catch {
    return false
  }
  if (state === "granted") {
    loadGoogleTag(runtime)
  } else if (typeof runtime.gtag === "function") {
    runtime.gtag("consent", "update", consentPayload("denied"))
  }
  dispatch(runtime, CONSENT_CHANGE_EVENT, { state })
  return true
}

const initializeAnalyticsConsent = target =>
  isAnalyticsGranted(target) ? loadGoogleTag(target) : false

const openAnalyticsConsent = target =>
  dispatch(getRuntime(target), CONSENT_OPEN_EVENT)

module.exports = {
  CONSENT_CHANGE_EVENT,
  CONSENT_KEY,
  CONSENT_OPEN_EVENT,
  getAnalyticsConsent,
  initializeAnalyticsConsent,
  isAnalyticsGranted,
  loadGoogleTag,
  openAnalyticsConsent,
  setAnalyticsConsent,
}
```

- [ ] **Step 4: Remove eager gtag injection and gate all events**

Run:

```bash
npm uninstall gatsby-plugin-google-gtag
```

Remove the complete `gatsby-plugin-google-gtag` block from `gatsby-config.js`. In `src/utils/analytics.js`, import:

```javascript
const { isAnalyticsGranted } = require("./analyticsConsent")
```

After resolving `runtime` in `trackEvent`, add:

```javascript
if (!isAnalyticsGranted(runtime)) return false
```

Add this internal SPA page-view function and export it:

```javascript
const trackPageView = (location, target) => {
  const runtime = getTarget(target)
  if (!runtime || typeof runtime.gtag !== "function" || !isAnalyticsGranted(runtime)) return false
  const pathname = String(location?.pathname || "/")
  const origin = String(location?.origin || runtime.location?.origin || "https://certificacionmontessori.com")
  runtime.gtag("event", "page_view", {
    page_path: pathname,
    page_location: `${origin}${pathname}`,
  })
  return true
}
```

Update the target in `scripts/test-analytics.js` with this separate store and import `trackPageView`:

```javascript
const consentValues = new Map([["ammac-analytics-consent-v1", "granted"]])
target.localStorage = {
  getItem: key => consentValues.get(key) || null,
  setItem: (key, value) => consentValues.set(key, value),
}
```

After the attributed-arrival dedupe assertions, add:

```javascript
assert.strictEqual(
  trackPageView({ origin: "https://certificacionmontessori.com", pathname: "/diplomados/casa-de-ninos/" }, target),
  true
)
assert.strictEqual(calls.at(-1)[1], "page_view")
assert.strictEqual(calls.at(-1)[2].page_location, "https://certificacionmontessori.com/diplomados/casa-de-ninos/")
consentValues.set("ammac-analytics-consent-v1", "denied")
assert.strictEqual(trackEvent("click_whatsapp", {}, target), false)
assert.strictEqual(trackPageView({ pathname: "/contact/" }, target), false)
```

- [ ] **Step 5: Initialize on Gatsby navigation and add a reversible localized banner**

In `gatsby-browser.js`, add these CommonJS imports and call `initializeAnalyticsConsent()` in `onClientEntry` before the language redirect:

```javascript
const { initializeAnalyticsConsent } = require("./src/utils/analyticsConsent")
const { trackAttributedArrival, trackPageView } = require("./src/utils/analytics")
```

```javascript
export const onClientEntry = () => {
  initializeAnalyticsConsent()
  maybeRedirectToBrowserLanguage()
}
```

Replace `onRouteUpdate` with:

```javascript
export const onRouteUpdate = ({ location }) => {
  trackPageView(location)
  trackAttributedArrival(location)
}
```

Create:

```javascript
// src/components/AnalyticsConsent.js
import * as React from "react"
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../i18n"
const {
  CONSENT_OPEN_EVENT,
  getAnalyticsConsent,
  setAnalyticsConsent,
} = require("../utils/analyticsConsent")
const { trackAttributedArrival, trackPageView } = require("../utils/analytics")

const AnalyticsConsent = () => {
  const { t } = useTranslation("common")
  const { localizedPath } = useLocalization()
  const [choice, setChoice] = React.useState("unknown")
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const current = getAnalyticsConsent()
    setChoice(current)
    setOpen(current === "unknown")
    const reopen = () => setOpen(true)
    window.addEventListener(CONSENT_OPEN_EVENT, reopen)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen)
  }, [])

  const choose = next => {
    if (!setAnalyticsConsent(next)) return
    setChoice(next)
    setOpen(false)
    if (next === "granted") {
      trackPageView(window.location)
      trackAttributedArrival(window.location)
    }
  }

  if (!open) return null
  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="analytics-consent-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-blue/20 bg-white px-5 py-4 shadow-2xl"
      data-consent-state={choice}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <h2 id="analytics-consent-title" className="text-base font-bold text-blue">
            {t("analyticsConsent.title")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray">
            {t("analyticsConsent.body")} {" "}
            <Link to={localizedPath("/privacy/")} className="font-semibold text-blue underline">
              {t("analyticsConsent.privacy")}
            </Link>
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2">
          <button type="button" onClick={() => choose("denied")} className="min-h-[44px] border border-blue px-4 py-2 font-semibold text-blue">
            {t("analyticsConsent.reject")}
          </button>
          <button type="button" onClick={() => choose("granted")} className="min-h-[44px] bg-blue px-4 py-2 font-semibold text-white">
            {t("analyticsConsent.accept")}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default AnalyticsConsent
```

Render `<AnalyticsConsent />` once in `Layout`, outside the content `<main>`. In `Footer`, add `const { t: tc } = useTranslation("common")`, import `openAnalyticsConsent`, and place this button in the existing Legal column:

```jsx
<button
  type="button"
  onClick={() => openAnalyticsConsent()}
  className="mt-2 text-left underline decoration-red"
>
  {tc("analyticsConsent.settings")}
</button>
```

Merge these localized keys into `common.json`:

```json
// es
"analyticsConsent": {
  "title": "Privacidad y analítica",
  "body": "Usamos Google Analytics solo si lo aceptas para entender qué contenido resulta útil. Tu decisión no limita el sitio.",
  "privacy": "Aviso de privacidad",
  "reject": "No aceptar",
  "accept": "Aceptar analítica",
  "settings": "Preferencias de privacidad"
}
```

Add a visible `privacy.analytics` section after `privacy.uso` in `src/pages/privacy.js`. Merge these records into each `legal.json`:

```json
// es
"analytics": {
  "titulo": "Analítica opcional y tu elección",
  "p1": "Google Analytics (medición G-P0CNEGW276) se carga únicamente cuando eliges Aceptar analítica. Puede procesar información técnica y de uso, como páginas visitadas, fecha y hora, navegador, dispositivo, referencia y ubicación aproximada. AMMAC no envía a GA4 nombres, correos, teléfonos, mensajes, direcciones ni identificadores de orden.",
  "p2": "La elección se conserva en el almacenamiento local del navegador con la clave ammac-analytics-consent-v1. Puedes cambiarla en cualquier momento desde Preferencias de privacidad en el pie del sitio; rechazar o revocar no limita los programas, formularios, pagos ni contacto.",
  "proveedor": "Consulta la política de privacidad de Google.",
  "proveedorUrl": "https://policies.google.com/privacy"
}
```

```json
// en
"analytics": {
  "titulo": "Optional analytics and your choice",
  "p1": "Google Analytics (measurement G-P0CNEGW276) loads only when you choose Allow analytics. It may process technical and usage information such as pages visited, date and time, browser, device, referrer, and approximate location. AMMAC does not send names, email addresses, telephone numbers, messages, addresses, or order identifiers to GA4.",
  "p2": "Your choice is stored in browser local storage under ammac-analytics-consent-v1. You can change it at any time through Privacy preferences in the site footer; declining or revoking does not limit programs, forms, payments, or contact.",
  "proveedor": "Read Google's privacy policy.",
  "proveedorUrl": "https://policies.google.com/privacy"
}
```

```json
// pt-br
"analytics": {
  "titulo": "Análise opcional e sua escolha",
  "p1": "O Google Analytics (medição G-P0CNEGW276) é carregado somente quando você escolhe Aceitar análise. Ele pode tratar informações técnicas e de uso, como páginas visitadas, data e hora, navegador, dispositivo, referência e localização aproximada. A AMMAC não envia ao GA4 nomes, e-mails, telefones, mensagens, endereços nem identificadores de pedido.",
  "p2": "Sua escolha é armazenada no armazenamento local do navegador com a chave ammac-analytics-consent-v1. Você pode alterá-la a qualquer momento em Preferências de privacidade no rodapé; recusar ou revogar não limita programas, formulários, pagamentos nem contato.",
  "proveedor": "Consulte a política de privacidade do Google.",
  "proveedorUrl": "https://policies.google.com/privacy"
}
```

Render the provider URL with `target="_blank"` and `rel="noopener noreferrer"`. Correct the existing malformed Spanish modifications URL from `https://www.https://certificacionmontessori.com/` to `https://certificacionmontessori.com/`. Record a new last-updated date in all three notices. Create `docs/i18n/PRIVACY_REVIEW_2026-07-11.md` with one row for `es`, `en` and `pt-BR`, the reviewer name/date and status; production requires all three statuses to be `approved` by AMMAC's privacy owner.

```json
// en
"analyticsConsent": {
  "title": "Privacy and analytics",
  "body": "We use Google Analytics only with your permission to understand which content is useful. Your choice does not limit the site.",
  "privacy": "Privacy notice",
  "reject": "Decline",
  "accept": "Allow analytics",
  "settings": "Privacy preferences"
}
```

```json
// pt-br
"analyticsConsent": {
  "title": "Privacidade e análise",
  "body": "Usamos o Google Analytics somente com sua permissão para entender quais conteúdos são úteis. Sua escolha não limita o site.",
  "privacy": "Aviso de privacidade",
  "reject": "Não aceitar",
  "accept": "Aceitar análise",
  "settings": "Preferências de privacidade"
}
```

- [ ] **Step 6: Test no-request-before-consent and document the policy boundary**

Add package script:

```json
"test:analytics-consent": "node scripts/test-analytics-consent.js"
```

Run:

```bash
npm run test:analytics-consent
npm run test:analytics
npm run build
! rg -n '<script[^>]+googletagmanager.com/gtag/js' public/index.html
```

Expected: consent and analytics contracts pass; built HTML has no eager Google tag script.

In a clean browser profile verify: unknown and denied choices produce no request to `googletagmanager.com` or `google-analytics.com`; accepting creates one tag request and one `page_view`; the footer reopens preferences; revoking prevents later SPA events. Record the exact evidence and state that AMMAC's privacy/legal owner must approve banner wording and regional policy before production. Include these official technical references in `docs/SEO_ANALYTICS_OPERATIONS.md`:

```text
https://developers.google.com/tag-platform/security/guides/consent
https://support.google.com/analytics/answer/10000067
https://developers.google.com/tag-platform/security/guides/consent-debugging
```

- [ ] **Step 7: Commit**

```bash
git add gatsby-browser.js gatsby-config.js package.json package-lock.json src/utils/analytics.js src/utils/analyticsConsent.js src/components/AnalyticsConsent.js src/components/layout.js src/components/footer.js src/pages/privacy.js src/i18n/locales/es/common.json src/i18n/locales/en/common.json src/i18n/locales/pt-br/common.json src/i18n/locales/es/legal.json src/i18n/locales/en/legal.json src/i18n/locales/pt-br/legal.json scripts/test-analytics.js scripts/test-analytics-consent.js docs/SEO_ANALYTICS_OPERATIONS.md docs/i18n/PRIVACY_REVIEW_2026-07-11.md
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
