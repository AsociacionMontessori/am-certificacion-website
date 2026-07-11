const {
  LANGUAGE_CODES,
  LOCALIZED_PATHS,
  localizePath,
  normalizePath,
} = require("../i18n/config")
const { isAnalyticsGranted } = require("./analyticsConsent")

const SITE_ORIGIN = "https://certificacionmontessori.com"

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
  if (!runtime || !isAnalyticsGranted(runtime)) return false
  try {
    if (typeof runtime.gtag !== "function") return false
    runtime.gtag("event", eventName, buildSafeParams(params))
    return true
  } catch (_error) {
    return false
  }
}

const trackPageView = (location, target) => {
  const runtime = getTarget(target)
  if (!runtime || !isAnalyticsGranted(runtime)) return false
  const pathname = validateLandingPath(location?.pathname)
  if (!pathname) return false

  try {
    if (typeof runtime.gtag !== "function") return false
    runtime.gtag("event", "page_view", {
      page_path: pathname,
      page_location: `${SITE_ORIGIN}${pathname}`,
    })
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
  trackPageView,
}
