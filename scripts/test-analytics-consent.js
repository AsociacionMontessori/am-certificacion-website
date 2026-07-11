const assert = require("assert")
const fs = require("fs")
const path = require("path")
const {
  CONSENT_CHANGE_EVENT,
  CONSENT_KEY,
  CONSENT_OPEN_EVENT,
  getAnalyticsConsent,
  initializeAnalyticsConsent,
  openAnalyticsConsent,
  setAnalyticsConsent,
} = require("../src/utils/analyticsConsent")

const root = path.resolve(__dirname, "..")

const createTarget = (overrides = {}) => {
  const values = new Map()
  const scripts = []
  const dispatched = []
  const cookieWrites = []
  let cookieValue = "_ga=GA1.1.123; _ga_AMMAC=GS1.1.456; functional=yes"

  const document = {
    querySelector: selector => scripts.find(script => `#${script.id}` === selector) || null,
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

const commandsFor = target => (target.dataLayer || []).map(args => Array.from(args))

{
  const { cookieWrites, dispatched, scripts, target, values } = createTarget()

  assert.strictEqual(getAnalyticsConsent(target), "unknown")
  assert.strictEqual(initializeAnalyticsConsent(target), false)
  assert.strictEqual(scripts.length, 0)

  assert.strictEqual(setAnalyticsConsent("denied", target), true)
  assert.strictEqual(values.get(CONSENT_KEY), "denied")
  assert.strictEqual(getAnalyticsConsent(target), "denied")
  assert.strictEqual(scripts.length, 0)
  assert.strictEqual(target.dataLayer, undefined, "fresh denial must not create gtag")

  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(getAnalyticsConsent(target), "granted")
  assert.strictEqual(scripts.length, 1)
  assert.strictEqual(
    scripts[0].src,
    "https://www.googletagmanager.com/gtag/js?id=G-P0CNEGW276"
  )

  const commands = commandsFor(target)
  assert.deepStrictEqual(commands.slice(0, 4).map(args => args.slice(0, 2)), [
    ["consent", "default"],
    ["consent", "update"],
    ["js", commands[2][1]],
    ["config", "G-P0CNEGW276"],
  ])
  assert.strictEqual(commands[0][2].analytics_storage, "denied")
  assert.strictEqual(commands[1][2].analytics_storage, "granted")
  for (const command of commands.slice(0, 2)) {
    assert.strictEqual(command[2].ad_storage, "denied")
    assert.strictEqual(command[2].ad_user_data, "denied")
    assert.strictEqual(command[2].ad_personalization, "denied")
  }
  assert.deepStrictEqual(commands[3][2], { send_page_view: false })

  assert.strictEqual(setAnalyticsConsent("denied", target), true)
  assert.strictEqual(getAnalyticsConsent(target), "denied")
  assert.strictEqual(commandsFor(target).at(-1)[2].analytics_storage, "denied")
  assert(cookieWrites.some(value => value.startsWith("_ga=")))
  assert(cookieWrites.some(value => value.startsWith("_ga_AMMAC=")))
  assert(!cookieWrites.some(value => value.startsWith("functional=")))

  const configCount = commandsFor(target).filter(args => args[0] === "config").length
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(scripts.length, 1)
  assert.strictEqual(commandsFor(target).filter(args => args[0] === "config").length, configCount)
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
  assert.strictEqual(scripts.length, 1, "failed script insertion must be retryable")
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
  assert.strictEqual(scripts.length, 2, "failed script must be retryable when removal throws")
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
const gatsbyConfig = fs.readFileSync(path.join(root, "gatsby-config.js"), "utf8")
const consentComponent = fs.readFileSync(
  path.join(root, "src/components/AnalyticsConsent.js"),
  "utf8"
)
const gatsbyBrowser = fs.readFileSync(path.join(root, "gatsby-browser.js"), "utf8")
const layout = fs.readFileSync(path.join(root, "src/components/layout.js"), "utf8")
const footer = fs.readFileSync(path.join(root, "src/components/footer.js"), "utf8")
const privacyPage = fs.readFileSync(path.join(root, "src/pages/privacy.js"), "utf8")
assert(!packageJson.includes("gatsby-plugin-google-gtag"))
assert(!gatsbyConfig.includes("gatsby-plugin-google-gtag"))
assert(!consentComponent.includes(".gtag("), "components must not call gtag directly")
assert(gatsbyBrowser.includes("initializeAnalyticsConsent()"))
assert(gatsbyBrowser.includes("trackPageView(location)"))
assert(layout.includes("<AnalyticsConsent />"))
assert(footer.includes("openAnalyticsConsent()"))
assert(privacyPage.includes('t("privacy.analytics.titulo")'))
assert(privacyPage.includes('t("privacy.actualizacion")'))

const localizedExpectations = {
  es: {
    accept: "Aceptar analítica",
    lastUpdated: "Última actualización: 11 de julio de 2026.",
  },
  en: {
    accept: "Allow analytics",
    lastUpdated: "Last updated: 11 July 2026.",
  },
  "pt-br": {
    accept: "Aceitar análise",
    lastUpdated: "Última atualização: 11 de julho de 2026.",
  },
}

for (const [locale, expected] of Object.entries(localizedExpectations)) {
  const common = require(`../src/i18n/locales/${locale}/common.json`)
  const { privacy } = require(`../src/i18n/locales/${locale}/legal.json`)
  assert.strictEqual(common.analyticsConsent.accept, expected.accept)
  assert(common.analyticsConsent.reject)
  assert(common.analyticsConsent.settings)
  assert.strictEqual(privacy.actualizacion, expected.lastUpdated)
  assert(privacy.fundamento.p1.includes("Ley Federal de Protección de Datos Personales en Posesión de los Particulares"))
  assert(privacy.fundamento.p1.includes("20-03-2025"))
  assert(privacy.fundamento.p1.includes("14-11-2025"))
  assert(privacy.responsable.p1.includes("Asociación Montessori de México A.C."))
  assert(privacy.responsable.p1.includes("Avenida Dos 48"))
  assert(privacy.analytics.p1.includes("G-P0CNEGW276"))
  assert(privacy.analytics.p2.includes(CONSENT_KEY))
  assert(/retroactiv|retroativ/i.test(privacy.analytics.p2))
  assert(/access tokens|tokens de acceso|tokens de acesso/i.test(privacy.analytics.exclusiones))
  assert(privacy.arco.p1.includes("admin@certificacionmontessori.com"))
  assert(privacy.arco.p1.includes("20"))
  assert(privacy.arco.p1.includes("15"))
}

const privacyReview = fs.readFileSync(
  path.join(root, "docs/i18n/PRIVACY_REVIEW_2026-07-11.md"),
  "utf8"
)
assert.strictEqual((privacyReview.match(/pending_owner_review/g) || []).length, 3)
assert(!privacyReview.match(/\|\s*approved\s*\|/i))

const operations = fs.readFileSync(
  path.join(root, "docs/SEO_ANALYTICS_OPERATIONS.md"),
  "utf8"
)
for (const reference of [
  "https://developers.google.com/tag-platform/security/concepts/consent-mode",
  "https://developers.google.com/tag-platform/security/guides/consent",
  "https://support.google.com/analytics/answer/17016975",
  "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf",
  "https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais",
]) {
  assert(operations.includes(reference), reference)
}
assert(operations.includes("pending_owner_review"))
assert(operations.toLowerCase().includes("non-retroactive"))

const plan = fs.readFileSync(
  path.join(root, "docs/superpowers/plans/2026-07-11-analytics-indexnow-foundation.md"),
  "utf8"
)
const taskThree = plan.slice(plan.indexOf("### Task 3:"), plan.indexOf("### Task 4:"))
for (const contractTerm of [
  "pending_owner_review",
  "regrant",
  "20 days",
  "Playwright",
  "google-analytics.com",
  "scripts/test-analytics-instrumentation.js",
]) {
  assert(taskThree.includes(contractTerm), contractTerm)
}

const parsedPackage = JSON.parse(packageJson)
assert.strictEqual(
  parsedPackage.scripts["test:analytics-consent"],
  "node scripts/test-analytics-consent.js"
)

console.log("analytics consent contract ok")
