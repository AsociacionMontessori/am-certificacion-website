const assert = require("assert")
const fs = require("fs")
const path = require("path")
const vm = require("vm")
const { trackAttributedArrival } = require("../src/utils/analytics")
const { initializeAnalyticsConsent } = require("../src/utils/analyticsConsent")

const root = path.resolve(__dirname, "..")
const snippetPath = path.join(
  root,
  "docs/snippets/montessorimexico-ga4-cookieyes.php"
)
const php = fs.readFileSync(snippetPath, "utf8")
const embeddedScript = php.match(/<script>\s*([\s\S]*?)\s*<\/script>/)
assert(embeddedScript, "WordPress snippet must contain an executable script")

const appendedScripts = []
const commandsAtScriptAppend = []
const intervals = []
const listeners = new Map()
const revocationTimeline = []
class CustomEvent {
  constructor(type) {
    this.type = type
  }
}
const document = {
  cookie: "cookieyes-consent=consentid:test,analytics:no",
  body: { className: "post-template-default post-id-314" },
  documentElement: { lang: "es-MX" },
  createElement: tagName => ({ tagName }),
  head: {
    appendChild(script) {
      commandsAtScriptAppend.push(sourceCommands())
      appendedScripts.push(script)
    },
  },
  addEventListener(type, handler, capture) {
    listeners.set(type, { capture, handler })
  },
  dispatchEvent(event) {
    const listener = listeners.get(event.type)
    if (listener) listener.handler(event)
    revocationTimeline.push(`${event.type}:complete`)
    return true
  },
}
const window = {
  document,
  location: {
    href: "https://montessorimexico.org/guia/casa-de-ninos/",
    hostname: "montessorimexico.org",
    search: "",
  },
  setInterval(handler, delay) {
    const interval = { active: true, delay, handler }
    intervals.push(interval)
    return interval
  },
  clearInterval(interval) {
    interval.active = false
  },
}
window.window = window

vm.runInNewContext(
  embeddedScript[1],
  { CustomEvent, URL, URLSearchParams, document, window },
  { filename: snippetPath }
)

const sourceCommands = () =>
  Array.from(window.dataLayer || [], args => Array.from(args))
const consentCommands = () =>
  sourceCommands().filter(
    command => command[0] === "consent" && command[1] === "update"
  )
const sourceEvents = () =>
  sourceCommands().filter(command => command[0] === "event")
const commandLabel = command => {
  if (command[0] === "consent") {
    return `consent:${command[1]}:${command[2].analytics_storage}`
  }
  if (command[0] === "config") return `config:${command[1]}`
  return command[0]
}

assert.strictEqual(
  appendedScripts.length,
  0,
  "denied startup must not eagerly load gtag.js"
)
assert.strictEqual(
  window.dataLayer,
  undefined,
  "denied startup must not create a Google tag queue"
)
assert.strictEqual(
  window.gtag,
  undefined,
  "denied startup must not create gtag"
)
assert.strictEqual(intervals.length, 1, "consent must have one polling loop")

document.cookie = "cookieyes-consent=consentid:test,analytics:yes"
intervals[0].handler()
assert.strictEqual(appendedScripts.length, 1, "first grant loads one script")
assert.deepStrictEqual(
  commandsAtScriptAppend[0].map(commandLabel).concat("script:append"),
  [
    "consent:default:denied",
    "consent:update:granted",
    "js",
    "config:G-075JTS42RZ",
    "config:G-P0CNEGW276",
    "script:append",
  ],
  "first grant must fully queue both destinations before script append"
)

const destinationSearch =
  "?utm_source=montessorimexico.org&utm_medium=referral" +
  "&utm_campaign=guia_montessori" +
  "&utm_content=post_d95119f319861cea&utm_term=casa"
const link = {
  href:
    "https://certificacionmontessori.com/diplomados/casa-de-ninos/" +
    destinationSearch,
  closest: () => null,
  getAttribute: () => "casa",
}
const clickListener = listeners.get("click")
assert(clickListener, "consent must synchronize immediately before clicks")
assert.strictEqual(clickListener.capture, true)
const consentUpdatesBeforeRevocationClick = consentCommands().length
assert(
  document.cookie.includes("analytics:yes"),
  "CookieYes capture ordering must expose the previous consent value"
)
clickListener.handler({
  target: {
    closest: selector => (selector === "a[href]" ? link : null),
  },
})
assert.strictEqual(
  consentCommands().length,
  consentUpdatesBeforeRevocationClick,
  "capture fallback cannot revoke while CookieYes still exposes analytics:yes"
)

document.cookie = "cookieyes-consent=consentid:test,analytics:no"
const cookieYesConsentListener = listeners.get("cookieyes_consent_update")
assert(
  cookieYesConsentListener,
  "consent must synchronize on CookieYes' post-write document event"
)
document.dispatchEvent(new CustomEvent("cookieyes_consent_update"))
const disabledAfterRevoke = [
  window["ga-disable-G-075JTS42RZ"],
  window["ga-disable-G-P0CNEGW276"],
]
const consentAfterRevoke = consentCommands().at(-1)[2].analytics_storage
assert.deepStrictEqual(
  {
    consent: consentAfterRevoke,
    disabled: disabledAfterRevoke,
    timeline: revocationTimeline.slice(),
  },
  {
    consent: "denied",
    disabled: [true, true],
    timeline: ["cookieyes_consent_update:complete"],
  },
  "revocation must be applied synchronously before navigation or reload"
)
revocationTimeline.push("navigation/reload")
assert.deepStrictEqual(
  revocationTimeline,
  ["cookieyes_consent_update:complete", "navigation/reload"],
  "CookieYes update handling must finish before navigation or reload"
)

document.cookie = "cookieyes-consent=consentid:test,analytics:yes"
intervals[0].handler()
const disabledAfterRegrant = [
  window["ga-disable-G-075JTS42RZ"],
  window["ga-disable-G-P0CNEGW276"],
]

const destinationCalls = []
const destinationStorage = new Map([["ammac-analytics-consent-v1", "granted"]])
const destinationSession = new Map()
const destinationTarget = {
  document: {
    createElement: () => ({}),
    head: { appendChild() {} },
    querySelector: () => null,
    referrer: "https://montessorimexico.org/guia/casa-de-ninos/",
  },
  gtag: (...args) => destinationCalls.push(args),
  localStorage: {
    getItem: key => destinationStorage.get(key) || null,
    setItem: (key, value) => destinationStorage.set(key, value),
  },
  location: { pathname: "/diplomados/casa-de-ninos/" },
  sessionStorage: {
    getItem: key => destinationSession.get(key) || null,
    setItem: (key, value) => destinationSession.set(key, value),
  },
}
assert.strictEqual(initializeAnalyticsConsent(destinationTarget), true)
destinationCalls.length = 0
const destinationLocation = {
  pathname: "/diplomados/casa-de-ninos/",
  search: destinationSearch,
}
assert.strictEqual(
  trackAttributedArrival(destinationLocation, destinationTarget),
  true
)
assert.strictEqual(
  trackAttributedArrival(destinationLocation, destinationTarget),
  false,
  "destination arrival must be deduplicated"
)
const destinationCtaEvents = destinationCalls.filter(
  command => command[0] === "event" && command[1] === "click_program_cta"
)

assert.strictEqual(
  sourceEvents().length,
  0,
  "WordPress must never emit source-side business events"
)
assert.strictEqual(
  sourceCommands().some(command => command[1] === "click_program_cta"),
  false,
  "WordPress must never emit click_program_cta"
)
assert.strictEqual(
  /\bgtag\s*\(\s*["']event["']/.test(embeddedScript[1]),
  false,
  "WordPress source must not contain an event emission branch"
)
assert.strictEqual(
  destinationCtaEvents.length,
  1,
  "attributed destination must emit one authoritative CTA event"
)
assert.strictEqual(
  sourceEvents().length + destinationCtaEvents.length,
  1,
  "one traversal must produce exactly one CTA event across both sites"
)

assert.strictEqual(appendedScripts.length, 1, "regrant must reuse gtag.js")
assert.deepStrictEqual(
  sourceCommands()
    .filter(command => command[0] === "config")
    .map(command => command[1]),
  ["G-075JTS42RZ", "G-P0CNEGW276"],
  "first grant must configure both destinations once"
)
assert.deepStrictEqual(disabledAfterRevoke, [true, true])
assert.deepStrictEqual(disabledAfterRegrant, [false, false])
assert.deepStrictEqual(
  consentCommands().map(command => command[2].analytics_storage),
  ["granted", "denied", "granted"],
  "grant, revoke, and regrant must each update analytics consent"
)
for (const command of consentCommands()) {
  assert.strictEqual(command[2].ad_storage, "denied")
  assert.strictEqual(command[2].ad_user_data, "denied")
  assert.strictEqual(command[2].ad_personalization, "denied")
}
const defaultConsent = sourceCommands().find(
  command => command[0] === "consent" && command[1] === "default"
)
assert(defaultConsent, "first grant must queue default consent")
assert.strictEqual(defaultConsent[2].analytics_storage, "denied")
assert.strictEqual(defaultConsent[2].ad_storage, "denied")
assert.strictEqual(defaultConsent[2].ad_user_data, "denied")
assert.strictEqual(defaultConsent[2].ad_personalization, "denied")
assert.strictEqual(intervals[0].active, true, "consent polling must persist")
assert(
  intervals[0].delay >= 1000,
  "persistent consent polling must remain low frequency"
)

console.log("WordPress analytics consent contract ok")
