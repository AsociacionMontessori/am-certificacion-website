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

const SAFE_VALUE_MAX_LENGTH = 120

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
  return buildSafeParams({
    source_hostname: params.get("utm_source"),
    source_post_slug: params.get("utm_content"),
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
    attribution.source_post_slug,
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
