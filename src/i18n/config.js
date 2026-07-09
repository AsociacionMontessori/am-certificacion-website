/**
 * Configuración central de i18n del sitio.
 * CommonJS a propósito: se comparte entre gatsby-node.js (Node) y el código de src (webpack).
 *
 * Español vive en la raíz (URLs actuales intactas); inglés en /en/ y portugués en /pt-br/.
 */

const DEFAULT_LANGUAGE = "es"

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
// Los flujos transaccionales (inscripción, checkout, certificados, masterclasses)
// se quedan solo en español por ahora.
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

/** Ruta de una página (originalPath en español) en el idioma dado. */
const localizePath = (language, originalPath) => {
  const normalized = normalizePath(originalPath)
  const lang = LANGUAGES[language] || LANGUAGES[DEFAULT_LANGUAGE]
  if (!lang.prefix) return normalized
  return normalized === "/" ? `${lang.prefix}/` : `${lang.prefix}${normalized}`
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
