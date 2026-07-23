/**
 * Configuración central de i18n del sitio.
 * CommonJS a propósito: se comparte entre gatsby-node.js (Node) y el código de src (webpack).
 *
 * Español vive en la raíz (URLs actuales intactas); inglés en /en/ y portugués en /pt-br/.
 */

const DEFAULT_LANGUAGE = "es"
const { PROGRAM_LANDING_ROUTES } = require("../data/programLandingRoutes")

// Idioma al que cae un navegador que no es es/en/pt (p. ej. fr, de):
// inglés como lengua franca (decisión de Carlos, 2026-07-08).
const FALLBACK_LANGUAGE = "en"

// Fase 5 (2026-07-09): traducciones EN/PT-BR listas y dictaminadas →
// indexables (index,follow + sitemap + hreflang). Si hubiera que retirar
// un idioma del índice, regresar a false y reconstruir.
const INDEX_TRANSLATIONS = true

const LANGUAGES = {
  es: {
    code: "es",
    prefix: "",
    htmlLang: "es-MX",
    hreflang: "es",
    ogLocale: "es_MX",
    label: "ES",
    name: "Español",
  },
  en: {
    code: "en",
    prefix: "/en",
    htmlLang: "en",
    hreflang: "en",
    ogLocale: "en_US",
    label: "EN",
    name: "English",
  },
  "pt-br": {
    code: "pt-br",
    prefix: "/pt-br",
    htmlLang: "pt-BR",
    hreflang: "pt-BR",
    ogLocale: "pt_BR",
    label: "PT",
    name: "Português",
  },
}

const LANGUAGE_CODES = Object.keys(LANGUAGES)

// Páginas públicas que se localizan (rutas canónicas en español, con barra final).
// El flujo público de inscripción/checkout también se duplica para que Stripe
// regrese al mismo idioma. Certificados y masterclasses siguen solo en español.
const LOCALIZED_PATHS = [
  "/",
  "/diplomados/",
  "/publicaciones/",
  "/contact/",
  "/directorio/",
  "/privacy/",
  "/reembolsos/",
  "/roxana/",
  "/ia/",
  "/checkout/cancel/",
  "/checkout/libro/",
  "/checkout/success/",
  "/inscripcion/completar/",
  "/inscripcion/documentos/",
  "/inscripcion/pagar/",
  "/inscripcion/transferencia/",
  ...PROGRAM_LANDING_ROUTES.map(route => `/diplomados/${route.slug}/`),
]

// Claves de almacenamiento en el navegador
const STORAGE_KEY_LANGUAGE = "cm-language" // último idioma elegido explícitamente (selector)

const normalizePath = pathname => {
  if (!pathname || pathname === "/") return "/"
  return `${pathname.replace(/\/+$/, "")}/`
}

/**
 * Descompone un pathname en { language, originalPath }.
 * originalPath es siempre la ruta canónica en español (sin prefijo de idioma).
 */
const parsePath = pathname => {
  const normalized = normalizePath(pathname)
  for (const code of LANGUAGE_CODES) {
    const { prefix } = LANGUAGES[code]
    if (!prefix) continue
    if (normalized === `${prefix}/` || normalized.startsWith(`${prefix}/`)) {
      const rest = normalized.slice(prefix.length) || "/"
      return { language: code, originalPath: normalizePath(rest) }
    }
  }
  return { language: DEFAULT_LANGUAGE, originalPath: normalized }
}

const splitPathSuffix = pathname => {
  const value = String(pathname || "/")
  const queryIndex = value.indexOf("?")
  const hashIndex = value.indexOf("#")
  const suffixIndex =
    queryIndex === -1
      ? hashIndex
      : hashIndex === -1
      ? queryIndex
      : Math.min(queryIndex, hashIndex)

  if (suffixIndex === -1) {
    return { path: value, suffix: "" }
  }

  return {
    path: value.slice(0, suffixIndex) || "/",
    suffix: value.slice(suffixIndex),
  }
}

/** Ruta de una página (originalPath en español) en el idioma dado. */
const localizePath = (language, originalPath) => {
  const { path, suffix } = splitPathSuffix(originalPath)
  const normalized = normalizePath(path)
  const lang = LANGUAGES[language] || LANGUAGES[DEFAULT_LANGUAGE]
  if (!lang.prefix) return `${normalized}${suffix}`
  const localized =
    normalized === "/" ? `${lang.prefix}/` : `${lang.prefix}${normalized}`
  return `${localized}${suffix}`
}

const isLocalizedPath = originalPath =>
  LOCALIZED_PATHS.includes(normalizePath(originalPath))

/**
 * Detección por IDIOMA del navegador (nunca por país/geolocalización).
 * es-US, es-419, es-MX… → español; en-* → inglés; pt-* → portugués (pt-br);
 * cualquier otro idioma → FALLBACK_LANGUAGE.
 */
const detectLanguage = browserLanguages => {
  const list = Array.isArray(browserLanguages) ? browserLanguages : []
  for (const entry of list) {
    if (!entry || typeof entry !== "string") continue
    const primary = entry.toLowerCase().split("-")[0]
    if (primary === "es") return "es"
    if (primary === "en") return "en"
    if (primary === "pt") return "pt-br"
  }
  return FALLBACK_LANGUAGE
}

module.exports = {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  INDEX_TRANSLATIONS,
  LANGUAGES,
  LANGUAGE_CODES,
  LOCALIZED_PATHS,
  STORAGE_KEY_LANGUAGE,
  normalizePath,
  parsePath,
  localizePath,
  isLocalizedPath,
  detectLanguage,
}
