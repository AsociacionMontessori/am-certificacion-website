const assert = require("assert")
const fs = require("fs")
const path = require("path")
const {
  CONSENT_CHANGE_EVENT,
  CONSENT_KEY,
  CONSENT_OPEN_EVENT,
  getAnalyticsConsent,
  initializeAnalyticsConsent,
  isAnalyticsReady,
  openAnalyticsConsent,
  setAnalyticsConsent,
} = require("../src/utils/analyticsConsent")
const {
  createAnalyticsConsentDomController,
} = require("../src/utils/analyticsConsentDom")
const { trackEvent, trackPageView } = require("../src/utils/analytics")

const root = path.resolve(__dirname, "..")

const createTarget = (overrides = {}) => {
  const values = new Map()
  const scripts = []
  const dispatched = []
  const cookieWrites = []
  let cookieValue = "_ga=GA1.1.123; _ga_AMMAC=GS1.1.456; functional=yes"

  const document = {
    querySelector: selector =>
      scripts.find(script => `#${script.id}` === selector) || null,
    createElement: tagName => ({
      tagName,
      remove() {
        const index = scripts.indexOf(this)
        if (index >= 0) scripts.splice(index, 1)
      },
    }),
    head: { appendChild: script => scripts.push(script) },
  }
  Object.defineProperty(document, "cookie", {
    get: () => cookieValue,
    set: value => cookieWrites.push(value),
  })

  const target = {
    localStorage: {
      getItem: key => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    },
    document,
    CustomEvent: class CustomEvent {
      constructor(type, options) {
        this.type = type
        this.detail = options.detail
      }
    },
    dispatchEvent: event => dispatched.push(event),
    ...overrides,
  }

  return { cookieWrites, dispatched, scripts, target, values }
}

const commandsFor = target =>
  (target.dataLayer || []).map(args => Array.from(args))

{
  const listeners = new Map()
  const classCalls = []
  let openerFocus = 0
  let declineFocus = 0
  const opener = {
    focus: () => {
      openerFocus += 1
    },
  }
  const target = {
    addEventListener: (type, handler) => listeners.set(type, handler),
    removeEventListener: (type, handler) => {
      assert.strictEqual(listeners.get(type), handler)
      listeners.delete(type)
    },
    document: {
      activeElement: opener,
      body: {
        classList: {
          toggle: (...args) => classCalls.push(["toggle", ...args]),
          remove: (...args) => classCalls.push(["remove", ...args]),
        },
      },
    },
  }
  const controller = createAnalyticsConsentDomController(target)
  let reopened = 0
  const unsubscribe = controller.subscribeOpen(() => {
    reopened += 1
  })
  listeners.get(CONSENT_OPEN_EVENT)()
  assert.strictEqual(reopened, 1)
  controller.captureOpener()
  assert.strictEqual(
    controller.focusEntry({
      focus: () => {
        declineFocus += 1
      },
    }),
    true
  )
  assert.strictEqual(declineFocus, 1)
  const cleanupClass = controller.setPanelOpen(true)
  assert.deepStrictEqual(classCalls[0], [
    "toggle",
    "analytics-consent-open",
    true,
  ])
  cleanupClass()
  assert.deepStrictEqual(classCalls[1], ["remove", "analytics-consent-open"])
  assert.strictEqual(controller.restoreOpener(), true)
  assert.strictEqual(openerFocus, 1)
  unsubscribe()
  assert.strictEqual(listeners.has(CONSENT_OPEN_EVENT), false)
}

{
  const throwingTarget = {
    addEventListener() {
      throw new Error("subscription denied")
    },
    removeEventListener() {
      throw new Error("removal denied")
    },
    get document() {
      throw new Error("document denied")
    },
  }
  const controller = createAnalyticsConsentDomController(throwingTarget)
  assert.doesNotThrow(() => controller.subscribeOpen(() => {})())
  assert.doesNotThrow(() => controller.setPanelOpen(true)())
  assert.strictEqual(controller.captureOpener(), false)
  assert.strictEqual(
    controller.focusEntry({
      focus() {
        throw new Error("focus denied")
      },
    }),
    false
  )
  assert.strictEqual(controller.restoreOpener(), false)
}

{
  const controller = createAnalyticsConsentDomController({
    addEventListener() {},
    removeEventListener() {
      throw new Error("removal denied")
    },
    document: {
      body: {
        classList: {
          toggle() {
            throw new Error("toggle denied")
          },
          remove() {
            throw new Error("class removal denied")
          },
        },
      },
    },
  })
  assert.doesNotThrow(() => controller.subscribeOpen(() => {})())
  assert.doesNotThrow(() => controller.setPanelOpen(true)())
  const absentController = createAnalyticsConsentDomController({})
  assert.doesNotThrow(() => absentController.subscribeOpen(() => {})())
  assert.doesNotThrow(() => absentController.setPanelOpen(false)())
}

{
  const { cookieWrites, dispatched, scripts, target, values } = createTarget()
  target.location = {
    origin: "https://attacker.example",
    pathname: "/contact/?email=persona@example.com",
    search: "?order=cs_secret",
    hash: "#access-token",
  }
  target.document.referrer = "https://www.bing.com/"

  assert.strictEqual(getAnalyticsConsent(target), "unknown")
  assert.strictEqual(initializeAnalyticsConsent(target), false)
  assert.strictEqual(scripts.length, 0)

  assert.strictEqual(setAnalyticsConsent("denied", target), true)
  assert.strictEqual(values.get(CONSENT_KEY), "denied")
  assert.strictEqual(getAnalyticsConsent(target), "denied")
  assert.strictEqual(scripts.length, 0)
  assert.strictEqual(
    target.dataLayer,
    undefined,
    "fresh denial must not create gtag"
  )

  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(getAnalyticsConsent(target), "granted")
  assert.strictEqual(scripts.length, 1)
  assert.strictEqual(
    scripts[0].src,
    "https://www.googletagmanager.com/gtag/js?id=G-P0CNEGW276"
  )

  const commands = commandsFor(target)
  assert.deepStrictEqual(
    commands.slice(0, 4).map(args => args.slice(0, 2)),
    [
      ["consent", "default"],
      ["consent", "update"],
      ["js", commands[2][1]],
      ["config", "G-P0CNEGW276"],
    ]
  )
  assert.strictEqual(commands[0][2].analytics_storage, "denied")
  assert.strictEqual(commands[1][2].analytics_storage, "granted")
  for (const command of commands.slice(0, 2)) {
    assert.strictEqual(command[2].ad_storage, "denied")
    assert.strictEqual(command[2].ad_user_data, "denied")
    assert.strictEqual(command[2].ad_personalization, "denied")
  }
  assert.deepStrictEqual(commands[3][2], {
    send_page_view: false,
    page_path: "/",
    page_location: "https://certificacionmontessori.com/",
    page_referrer: "https://www.bing.com/",
  })
  assert.strictEqual(
    scripts.length,
    1,
    "config context must queue before script append"
  )

  assert.strictEqual(setAnalyticsConsent("denied", target), true)
  assert.strictEqual(getAnalyticsConsent(target), "denied")
  assert.strictEqual(commandsFor(target).at(-1)[2].analytics_storage, "denied")
  assert(cookieWrites.some(value => value.startsWith("_ga=")))
  assert(cookieWrites.some(value => value.startsWith("_ga_AMMAC=")))
  assert(!cookieWrites.some(value => value.startsWith("functional=")))

  const configCount = commandsFor(target).filter(
    args => args[0] === "config"
  ).length
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(scripts.length, 1)
  assert.strictEqual(
    commandsFor(target).filter(args => args[0] === "config").length,
    configCount
  )
  assert.strictEqual(commandsFor(target).at(-1)[2].analytics_storage, "granted")

  assert.strictEqual(initializeAnalyticsConsent(target), true)
  assert.strictEqual(scripts.length, 1)
  assert.strictEqual(dispatched.at(-1).type, CONSENT_CHANGE_EVENT)
  assert.strictEqual(dispatched.at(-1).detail.state, "granted")
  assert.strictEqual(openAnalyticsConsent(target), true)
  assert.strictEqual(dispatched.at(-1).type, CONSENT_OPEN_EVENT)
  assert.strictEqual(setAnalyticsConsent("invalid", target), false)
}

{
  const { scripts, target } = createTarget()
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  const firstScript = scripts[0]
  firstScript.onerror()
  assert.strictEqual(scripts.length, 0)
  assert.strictEqual(initializeAnalyticsConsent(target), true)
  assert.strictEqual(
    scripts.length,
    1,
    "failed script insertion must be retryable"
  )
  assert.strictEqual(
    commandsFor(target).filter(args => args[0] === "config").length,
    1,
    "retry must not duplicate config"
  )
  scripts[0].onload()
  assert.strictEqual(initializeAnalyticsConsent(target), true)
  assert.strictEqual(scripts.length, 1)
}

{
  const { scripts, target } = createTarget()
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  scripts[0].remove = () => {
    throw new Error("script removal denied")
  }
  scripts[0].onerror()
  assert.strictEqual(initializeAnalyticsConsent(target), true)
  assert.strictEqual(
    scripts.length,
    2,
    "failed script must be retryable when removal throws"
  )
}

for (const [failedCommand, expectedSequence] of [
  [
    "js",
    [
      "consent:denied",
      "consent:granted",
      "consent:denied",
      "consent:granted",
      "js",
      "config",
    ],
  ],
  [
    "config",
    [
      "consent:denied",
      "consent:granted",
      "js",
      "consent:denied",
      "consent:granted",
      "config",
    ],
  ],
]) {
  const successful = []
  let failedOnce = false
  const { scripts, target } = createTarget({
    gtag(...args) {
      if (args[0] === failedCommand && !failedOnce) {
        failedOnce = true
        throw new Error(`${failedCommand} queue failed`)
      }
      successful.push(args)
    },
  })

  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(setAnalyticsConsent("denied", target), true)
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.deepStrictEqual(
    successful.map(args =>
      args[0] === "consent"
        ? `${args[0]}:${args[2].analytics_storage}`
        : args[0]
    ),
    expectedSequence,
    `${failedCommand} retry must regrant before unfinished initialization`
  )
  assert.strictEqual(
    successful.filter(args => args[0] === "consent" && args[1] === "default")
      .length,
    1
  )
  assert.strictEqual(successful.filter(args => args[0] === "js").length, 1)
  assert.strictEqual(successful.filter(args => args[0] === "config").length, 1)
  assert.strictEqual(scripts.length, 1)
}

{
  const successful = []
  let defaultFailures = 0
  const { scripts, target } = createTarget({
    gtag(...args) {
      if (args[0] === "consent" && args[1] === "default" && defaultFailures < 1) {
        defaultFailures += 1
        throw new Error("default queue failed")
      }
      successful.push(args)
    },
  })

  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(setAnalyticsConsent("denied", target), true)
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.deepStrictEqual(
    successful.map(args =>
      args[0] === "consent"
        ? `${args[0]}:${args[1]}:${args[2].analytics_storage}`
        : args[0]
    ),
    [
      "consent:default:denied",
      "consent:update:denied",
      "consent:update:granted",
      "js",
      "config",
    ],
    "a revoke must retry a failed default before it queues denied update"
  )
  assert.strictEqual(scripts.length, 1)
}

{
  const successful = []
  let defaultFailures = 0
  const { scripts, target } = createTarget({
    gtag(...args) {
      if (args[0] === "consent" && args[1] === "default" && defaultFailures < 2) {
        defaultFailures += 1
        throw new Error("default queue failed")
      }
      successful.push(args)
    },
  })

  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(setAnalyticsConsent("denied", target), true)
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.deepStrictEqual(
    successful.map(args =>
      args[0] === "consent"
        ? `${args[0]}:${args[1]}:${args[2].analytics_storage}`
        : args[0]
    ),
    [
      "consent:default:denied",
      "consent:update:granted",
      "js",
      "config",
    ],
    "a failed revoke retry must not queue denied update before regrant retries default"
  )
  assert.strictEqual(scripts.length, 1)
}

for (const failedCommand of ["js", "config"]) {
  const successful = []
  let failedOnce = false
  const { target } = createTarget({
    gtag(...args) {
      if (args[0] === failedCommand && !failedOnce) {
        failedOnce = true
        throw new Error(`${failedCommand} queue failed`)
      }
      successful.push(args)
    },
  })

  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(
    isAnalyticsReady(target),
    false,
    `${failedCommand} failure must keep analytics unready`
  )
  assert.strictEqual(initializeAnalyticsConsent(target), true)
  assert.strictEqual(
    isAnalyticsReady(target),
    true,
    `${failedCommand} retry must complete analytics readiness`
  )
  assert.strictEqual(
    successful.filter(args => args[0] === "consent" && args[1] === "default")
      .length,
    1
  )
  assert.strictEqual(successful.filter(args => args[0] === "js").length, 1)
  assert.strictEqual(successful.filter(args => args[0] === "config").length, 1)
}

for (const failedCommand of ["js", "config"]) {
  const successful = []
  let failedOnce = false
  const { target } = createTarget({
    gtag(...args) {
      if (args[0] === failedCommand && !failedOnce) {
        failedOnce = true
        throw new Error(`${failedCommand} queue failed`)
      }
      successful.push(args)
    },
  })

  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  const commandsBeforeEvents = successful.length
  assert.strictEqual(trackEvent("click_whatsapp", {}, target), false)
  assert.strictEqual(
    trackPageView(
      { pathname: "/contact/", key: `failed-${failedCommand}` },
      target
    ),
    false
  )
  assert.strictEqual(
    successful.length,
    commandsBeforeEvents,
    `${failedCommand} failure must block application events`
  )

  assert.strictEqual(initializeAnalyticsConsent(target), true)
  assert.strictEqual(trackEvent("click_whatsapp", {}, target), true)
  assert.strictEqual(
    trackPageView(
      { pathname: "/contact/", key: `recovered-${failedCommand}` },
      target
    ),
    true
  )
  const configIndex = successful.findIndex(args => args[0] === "config")
  const eventIndexes = successful
    .map((args, index) => (args[0] === "event" ? index : -1))
    .filter(index => index >= 0)
  assert.strictEqual(eventIndexes.length, 2)
  assert(eventIndexes.every(index => index > configIndex))
}

{
  const { scripts, target } = createTarget()
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(isAnalyticsReady(target), true)
  scripts[0].onerror()
  assert.strictEqual(
    isAnalyticsReady(target),
    true,
    "script network failure must not undo fully queued initialization"
  )
  assert.strictEqual(setAnalyticsConsent("denied", target), true)
  assert.strictEqual(isAnalyticsReady(target), false)
}

{
  const { scripts, target } = createTarget()
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  const failedScript = scripts[0]
  const canonicalId = failedScript.id
  Object.defineProperty(failedScript, "id", {
    configurable: true,
    get: () => canonicalId,
    set() {
      throw new Error("script id is read-only")
    },
  })
  failedScript.remove = () => {
    throw new Error("script removal denied")
  }
  failedScript.onerror()
  assert.strictEqual(initializeAnalyticsConsent(target), true)
  assert.strictEqual(
    scripts.length,
    2,
    "known-failed canonical script must not block a replacement"
  )
  assert.strictEqual(initializeAnalyticsConsent(target), true)
  assert.strictEqual(
    scripts.length,
    2,
    "pending replacement must not duplicate"
  )
}

{
  const target = {
    localStorage: {
      getItem() {
        throw new Error("storage read denied")
      },
      setItem() {
        throw new Error("storage write denied")
      },
    },
  }
  assert.strictEqual(getAnalyticsConsent(target), "unknown")
  assert.strictEqual(setAnalyticsConsent("denied", target), true)
  assert.strictEqual(getAnalyticsConsent(target), "denied")
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(getAnalyticsConsent(target), "granted")
  assert.strictEqual(initializeAnalyticsConsent(target), false)
}

{
  const target = {
    localStorage: {
      getItem: () => "granted",
      setItem() {
        throw new Error("storage write denied")
      },
    },
  }
  assert.strictEqual(getAnalyticsConsent(target), "granted")
  assert.strictEqual(setAnalyticsConsent("denied", target), true)
  assert.strictEqual(
    getAnalyticsConsent(target),
    "denied",
    "failed persistence must not revive stale granted consent"
  )
}

for (const [stored, explicit] of [
  ["granted", "denied"],
  ["denied", "granted"],
]) {
  const calls = []
  const { target } = createTarget({
    gtag: (...args) => calls.push(args),
    localStorage: {
      getItem: () => stored,
      setItem() {
        // Simulate a privacy wrapper that reports success without persisting.
      },
    },
  })

  assert.strictEqual(getAnalyticsConsent(target), stored)
  assert.strictEqual(setAnalyticsConsent(explicit, target), true)
  assert.strictEqual(
    getAnalyticsConsent(target),
    explicit,
    `explicit ${explicit} must override stale stored ${stored} for this runtime`
  )
  if (explicit === "denied") {
    const callsBeforeEvent = calls.length
    assert.strictEqual(trackEvent("click_whatsapp", {}, target), false)
    assert.strictEqual(
      calls.length,
      callsBeforeEvent,
      "stale granted storage must not revive analytics after explicit denial"
    )
  }
}

{
  let appendAttempts = 0
  const { scripts, target } = createTarget()
  target.document.head.appendChild = script => {
    appendAttempts += 1
    if (appendAttempts === 1) throw new Error("DOM insertion denied")
    scripts.push(script)
  }
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(scripts.length, 0)
  assert.strictEqual(initializeAnalyticsConsent(target), true)
  assert.strictEqual(scripts.length, 1)
}

{
  let gtagAttempts = 0
  const { target } = createTarget({
    gtag() {
      gtagAttempts += 1
      throw new Error("gtag unavailable")
    },
    CustomEvent: class CustomEvent {
      constructor() {
        throw new Error("events unavailable")
      }
    },
    dispatchEvent() {
      throw new Error("dispatch unavailable")
    },
  })
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(getAnalyticsConsent(target), "granted")
  assert(gtagAttempts > 0)
  assert.strictEqual(setAnalyticsConsent("denied", target), true)
  assert.strictEqual(openAnalyticsConsent(target), false)
}

const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8")
const gatsbyConfig = fs.readFileSync(
  path.join(root, "gatsby-config.js"),
  "utf8"
)
const consentComponent = fs.readFileSync(
  path.join(root, "src/components/AnalyticsConsent.js"),
  "utf8"
)
const gatsbyBrowser = fs.readFileSync(
  path.join(root, "gatsby-browser.js"),
  "utf8"
)
const layout = fs.readFileSync(
  path.join(root, "src/components/layout.js"),
  "utf8"
)
const whatsappStyles = fs.readFileSync(
  path.join(root, "src/styles/wa.css"),
  "utf8"
)
const footer = fs.readFileSync(
  path.join(root, "src/components/footer.js"),
  "utf8"
)
const privacyPage = fs.readFileSync(
  path.join(root, "src/pages/privacy.js"),
  "utf8"
)
assert(!packageJson.includes("gatsby-plugin-google-gtag"))
assert(!gatsbyConfig.includes("gatsby-plugin-google-gtag"))
assert(
  !consentComponent.includes(".gtag("),
  "components must not call gtag directly"
)
assert(gatsbyBrowser.includes("initializeAnalyticsConsent()"))
assert(gatsbyBrowser.includes("registerAnalyticsNavigation(location)"))
assert(gatsbyBrowser.includes("trackPageView(location)"))
assert(
  gatsbyBrowser.indexOf("registerAnalyticsNavigation(location)") <
    gatsbyBrowser.indexOf("trackPageView(location)"),
  "Gatsby must register each route update before attempting its page view"
)
assert(layout.includes("<AnalyticsConsent />"))
assert(footer.includes("openAnalyticsConsent()"))
const consentOpenBodyClass = "analytics-consent-open"
assert(consentComponent.includes("createAnalyticsConsentDomController"))
assert(consentComponent.includes("captureOpener()"))
assert(consentComponent.includes("restoreOpener()"))
assert(
  whatsappStyles.includes(`body.${consentOpenBodyClass} #wa`),
  "WhatsApp must have an open-consent stylesheet rule"
)
assert(
  new RegExp(
    `(?:^|})\\s*body\\.${consentOpenBodyClass} #wa\\s*\\{\\s*display:\\s*none`
  ).test(whatsappStyles.replace(/\/\*[\s\S]*?\*\//g, "")),
  "open consent must remove WhatsApp visibility and interaction"
)
assert(privacyPage.includes('t("privacy.analytics.titulo")'))
assert(privacyPage.includes('t("privacy.actualizacion")'))

const localizedExpectations = {
  es: {
    accept: "Aceptar analítica",
    lastUpdated: "Última actualización: 11 de julio de 2026.",
    rectificationChanges: "cambios solicitados",
    rectificationEvidence: "documentación que los sustente",
  },
  en: {
    accept: "Allow analytics",
    lastUpdated: "Last updated: 11 July 2026.",
    rectificationChanges: "requested changes",
    rectificationEvidence: "supporting documentation",
  },
  "pt-br": {
    accept: "Aceitar análise",
    lastUpdated: "Última atualização: 11 de julho de 2026.",
    rectificationChanges: "alterações solicitadas",
    rectificationEvidence: "documentação que as sustente",
  },
}

for (const [locale, expected] of Object.entries(localizedExpectations)) {
  const common = require(`../src/i18n/locales/${locale}/common.json`)
  const { privacy } = require(`../src/i18n/locales/${locale}/legal.json`)
  assert.strictEqual(common.analyticsConsent.accept, expected.accept)
  assert(common.analyticsConsent.reject)
  assert(common.analyticsConsent.settings)
  assert.strictEqual(privacy.actualizacion, expected.lastUpdated)
  assert(
    privacy.fundamento.p1.includes(
      "Ley Federal de Protección de Datos Personales en Posesión de los Particulares"
    )
  )
  assert(privacy.fundamento.p1.includes("20-03-2025"))
  assert(privacy.fundamento.p1.includes("14-11-2025"))
  assert(
    privacy.responsable.p1.includes("Asociación Montessori de México A.C.")
  )
  assert(privacy.responsable.p1.includes("Avenida Dos 48"))
  assert(privacy.analytics.p1.includes("G-P0CNEGW276"))
  assert(privacy.analytics.p2.includes(CONSENT_KEY))
  assert(/retroactiv|retroativ/i.test(privacy.analytics.p2))
  assert(
    /access tokens|tokens de acceso|tokens de acesso/i.test(
      privacy.analytics.exclusiones
    )
  )
  assert(privacy.arco.p1.includes("admin@certificacionmontessori.com"))
  assert(privacy.arco.p1.includes(expected.rectificationChanges))
  assert(privacy.arco.p1.includes(expected.rectificationEvidence))
  assert(privacy.arco.p1.includes("20"))
  assert(privacy.arco.p1.includes("15"))
}

const privacyReview = fs.readFileSync(
  path.join(root, "docs/i18n/PRIVACY_REVIEW_2026-07-11.md"),
  "utf8"
)
for (const locale of ["es", "en", "pt-BR"]) {
  assert(
    privacyReview.includes(
      `| ${locale} | AMMAC responsible owner | 2026-07-11 | \`approved_for_production\` |`
    ),
    `${locale} privacy approval record`
  )
}
assert.strictEqual(
  (privacyReview.match(/`approved_for_production`/g) || []).length,
  3
)
assert.strictEqual(
  (privacyReview.match(/pending_owner_review/g) || []).length,
  0
)

const operations = fs.readFileSync(
  path.join(root, "docs/SEO_ANALYTICS_OPERATIONS.md"),
  "utf8"
)
for (const [documentName, documentText] of [
  ["privacy review", privacyReview],
  ["analytics operations", operations],
]) {
  assert(
    /AMMAC responsible owner(?:'s)?(?: production)? approval|AMMAC responsible owner approved|by the AMMAC responsible owner/i.test(
      documentText
    ),
    `${documentName} must identify the AMMAC responsible owner as approver`
  )
  assert(
    /not independent legal (?:advice|review)|independent legal review not represented|does not represent independent legal counsel review/i.test(
      documentText
    ),
    `${documentName} must disclaim independent legal review or advice`
  )
}
for (const reference of [
  "https://developers.google.com/analytics/devguides/collection/ga4/reference/config",
  "https://developers.google.com/analytics/devguides/collection/ga4/views",
  "https://support.google.com/analytics/answer/9216061",
  "https://developers.google.com/tag-platform/gtagjs/reference",
  "https://developers.google.com/tag-platform/security/concepts/consent-mode",
  "https://developers.google.com/tag-platform/security/guides/consent",
  "https://support.google.com/analytics/answer/17016975",
  "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf",
  "https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais",
]) {
  assert(operations.includes(reference), reference)
}
assert(!operations.includes("pending_owner_review"))
assert(operations.includes("approved_for_production"))
assert(operations.toLowerCase().includes("non-retroactive"))
assert(
  operations.includes("disable **Page changes based on browser history events**")
)
assert(operations.includes("exactly one app-controlled `page_view` per route"))
assert(operations.includes("fully queued initialization"))
assert(operations.includes("per navigation instance"))
assert(operations.includes("location.key"))

const plan = fs.readFileSync(
  path.join(
    root,
    "docs/superpowers/plans/2026-07-11-analytics-indexnow-foundation.md"
  ),
  "utf8"
)
const taskThree = plan.slice(
  plan.indexOf("### Task 3:"),
  plan.indexOf("### Task 4:")
)
for (const contractTerm of [
  "regrant",
  "20 days",
  "Playwright",
  "google-analytics.com",
  "analyticsPageContext.js",
  "page_referrer",
  "Enhanced Measurement",
  "scripts/test-analytics-instrumentation.js",
  "isAnalyticsReady",
  "registerAnalyticsNavigation",
  "location.key",
  "per navigation instance",
]) {
  assert(taskThree.includes(contractTerm), contractTerm)
}
const taskThreeGitAdd = taskThree.slice(taskThree.lastIndexOf("git add"))
assert(taskThreeGitAdd.includes("src/styles/wa.css"))

const parsedPackage = JSON.parse(packageJson)
assert.strictEqual(
  parsedPackage.scripts["test:analytics-consent"],
  "node scripts/test-analytics-consent.js"
)
assert.strictEqual(
  parsedPackage.scripts["test:wordpress-analytics"],
  "node scripts/test-wordpress-analytics-snippet.js"
)
assert(
  parsedPackage.scripts["test:foundation"].includes(
    "npm run test:wordpress-analytics"
  )
)

console.log("analytics consent contract ok")
