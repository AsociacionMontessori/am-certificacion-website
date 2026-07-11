const {
  LANGUAGE_CODES,
  LOCALIZED_PATHS,
  localizePath,
  normalizePath,
} = require("../i18n/config")

const SITE_ORIGIN = "https://certificacionmontessori.com"
const SAFE_FALLBACK_REFERRER = `${SITE_ORIGIN}/`

const PROGRAM_PATHS = [
  "/diplomados/nido-comunidad-infantil/",
  "/diplomados/casa-de-ninos/",
  "/diplomados/taller-i-ii/",
  "/diplomados/educacion-cosmica/",
  "/diplomados/neuroeducacion/",
]

const ALLOWED_PAGE_PATHS = new Set([
  ...[...new Set([...LOCALIZED_PATHS, ...PROGRAM_PATHS])].flatMap(path =>
    LANGUAGE_CODES.map(language => localizePath(language, path))
  ),
  "/404/",
  "/certificate/",
  "/masterclasses/",
])

const ALLOWED_REFERRER_HOSTNAMES = new Set([
  "certificacionmontessori.com",
  "montessorimexico.org",
  "www.montessorimexico.org",
  "google.com",
  "www.google.com",
  "google.com.mx",
  "www.google.com.mx",
  "google.es",
  "www.google.es",
  "google.com.ar",
  "www.google.com.ar",
  "google.com.co",
  "www.google.com.co",
  "google.cl",
  "www.google.cl",
  "google.co.uk",
  "www.google.co.uk",
  "google.ca",
  "www.google.ca",
  "google.com.au",
  "www.google.com.au",
  "google.co.nz",
  "www.google.co.nz",
  "google.com.br",
  "www.google.com.br",
  "google.pt",
  "www.google.pt",
  "bing.com",
  "www.bing.com",
  "chatgpt.com",
  "www.chatgpt.com",
  "chat.openai.com",
  "openai.com",
  "www.openai.com",
  "copilot.microsoft.com",
  "perplexity.ai",
  "www.perplexity.ai",
  "search.yahoo.com",
  "yahoo.com",
  "www.yahoo.com",
  "duckduckgo.com",
  "www.duckduckgo.com",
])

const validatePagePath = value => {
  if (typeof value !== "string") return undefined
  const clean = value.trim()
  if (!clean || !clean.startsWith("/") || /[?#]/.test(clean)) return undefined
  const normalized = normalizePath(clean)
  return ALLOWED_PAGE_PATHS.has(normalized) ? normalized : undefined
}

const getSafeReferrer = runtime => {
  let value
  try {
    value = runtime?.document?.referrer
  } catch (_error) {
    return SAFE_FALLBACK_REFERRER
  }
  if (typeof value !== "string" || !value.trim()) return SAFE_FALLBACK_REFERRER

  try {
    const clean = value.trim()
    const url = new URL(clean)
    const authority = clean.slice(clean.indexOf("://") + 3).split(/[/?#]/, 1)[0]
    if (
      url.protocol !== "https:" ||
      !ALLOWED_REFERRER_HOSTNAMES.has(url.hostname) ||
      authority.toLowerCase() !== url.hostname
    ) {
      return SAFE_FALLBACK_REFERRER
    }
    return `https://${url.hostname}/`
  } catch (_error) {
    return SAFE_FALLBACK_REFERRER
  }
}

const buildSafePageContext = (runtime, pathname) => {
  let runtimePathname
  try {
    runtimePathname = runtime?.location?.pathname
  } catch (_error) {
    runtimePathname = undefined
  }
  const pagePath =
    validatePagePath(pathname === undefined ? runtimePathname : pathname) || "/"
  return {
    page_path: pagePath,
    page_location: `${SITE_ORIGIN}${pagePath}`,
    page_referrer: getSafeReferrer(runtime),
  }
}

module.exports = {
  ALLOWED_PAGE_PATHS,
  ALLOWED_REFERRER_HOSTNAMES,
  SITE_ORIGIN,
  buildSafePageContext,
  getSafeReferrer,
  validatePagePath,
}
