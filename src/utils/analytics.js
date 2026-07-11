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
  "source_post_slug",
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

const PROGRAM_LANDING_PATHS = [
  "/diplomados/",
  "/diplomados/nido-comunidad-infantil/",
  "/diplomados/casa-de-ninos/",
  "/diplomados/taller-i-ii/",
  "/diplomados/educacion-cosmica/",
  "/diplomados/neuroeducacion/",
]
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
const ATTRIBUTED_LANDING_PATHS = new Set(
  PROGRAM_LANDING_PATHS.flatMap(path =>
    LANGUAGE_CODES.map(language => localizePath(language, path))
  )
)

const SAFE_TOKEN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const EMAIL_PATTERN = /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i
const UUID_PATTERN =
  /(?:^|-)[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?:-|$)/i
const ORDER_ID_PATTERN =
  /(?:^|-)(?:order|orden|checkout|payment|pago|stripe|session|pi|cs)(?:-id)?-[a-z0-9]{6,}(?:-|$)/i
const ORDER_MARKER_PATTERN =
  /(?:^|-)(?:order|orden|checkout|payment|pago|stripe|session)(?:-|$)/i
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
    ORDER_ID_PATTERN.test(clean) ||
    (digitCount > 0 && ORDER_MARKER_PATTERN.test(clean)) ||
    digitCount >= 7
  ) {
    return undefined
  }
  return clean
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
    cleanString(value) === "montessorimexico.org" ? "montessorimexico.org" : undefined,
  source_post_slug: value => validateSafeToken(value, 100),
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

  const sourcePostSlug = validateSafeToken(params.get("utm_content"), 100)
  const programId = validateClosedValue(params.get("utm_term"), ATTRIBUTION_PROGRAM_IDS)
  if (!sourcePostSlug || !programId) return null

  return {
    source_hostname: "montessorimexico.org",
    source_post_slug: sourcePostSlug,
    program_id: programId,
  }
}

const trackAttributedArrival = (location, target) => {
  const attribution = getAttribution(location?.search)
  if (!attribution) return false

  const landingPath = validateLandingPath(location?.pathname)
  if (!landingPath || !ATTRIBUTED_LANDING_PATHS.has(landingPath)) return false

  const runtime = getTarget(target)
  if (!runtime) return false
  const dedupeKey = [
    "ammac-cta-arrival",
    landingPath,
    attribution.source_post_slug,
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
  buildSafeParams,
  getAttribution,
  trackAttributedArrival,
  trackEvent,
}
