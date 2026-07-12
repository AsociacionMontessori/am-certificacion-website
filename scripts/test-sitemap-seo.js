const assert = require("assert")
const fs = require("fs")
const path = require("path")

const gatsbyConfig = require("../gatsby-config")
const {
  defaultFilterPages,
  pageFilter,
} = require("gatsby-plugin-sitemap/internals")
const { LANGUAGE_CODES, localizePath } = require("../src/i18n/config")

const sitemapPlugin = gatsbyConfig.plugins.find(
  plugin => plugin?.resolve === "gatsby-plugin-sitemap"
)

assert(sitemapPlugin, "Expected gatsby-plugin-sitemap to be configured")

const transactionalPaths = [
  "/checkout/cancel/",
  "/checkout/libro/",
  "/checkout/success/",
  "/inscripcion/completar/",
  "/inscripcion/documentos/",
  "/inscripcion/pagar/",
  "/inscripcion/transferencia/",
]

const transactionalPages = LANGUAGE_CODES.flatMap(language =>
  transactionalPaths.map(path => ({ path: localizePath(language, path) }))
)
const publicPages = [
  { path: "/diplomados/" },
  { path: "/en/diplomados/" },
  { path: "/pt-br/diplomados/" },
]

const { filteredPages } = pageFilter({
  allPages: [...transactionalPages, ...publicPages],
  filterPages: defaultFilterPages,
  excludes: sitemapPlugin.options.excludes,
})

assert.deepStrictEqual(
  filteredPages,
  publicPages,
  "Expected every localized transaction page to be excluded while public pages remain"
)

const llmsGuides = [
  {
    locale: "Spanish",
    filePath: path.join(__dirname, "..", "static", "llms.txt"),
    certificationUrl:
      "https://certificacionmontessori.com/diplomados/#certificacion_internacional",
    informationalPattern: /\beste archivo llms\.txt es informativo\b/iu,
    noRankingPattern:
      /\bno es una señal de (?:posicionamiento|clasificación|ranking)\b/iu,
    htmlSourceOfTruthPattern:
      /\blas páginas HTML públicas son la fuente (?:de verdad|oficial|autoritativa)\b/iu,
  },
  {
    locale: "English",
    filePath: path.join(__dirname, "..", "static", "en", "llms.txt"),
    certificationUrl:
      "https://certificacionmontessori.com/en/diplomados/#certificacion_internacional",
    informationalPattern: /\bthis llms\.txt file is informational\b/iu,
    noRankingPattern: /\bis not a ranking signal\b/iu,
    htmlSourceOfTruthPattern:
      /\bpublic HTML pages are the source of truth\b/iu,
  },
  {
    locale: "Portuguese (Brazil)",
    filePath: path.join(__dirname, "..", "static", "pt-br", "llms.txt"),
    certificationUrl:
      "https://certificacionmontessori.com/pt-br/diplomados/#certificacion_internacional",
    informationalPattern: /\beste arquivo llms\.txt é informativo\b/iu,
    noRankingPattern:
      /\bnão é um sinal de (?:ranqueamento|classificação|ranking)\b/iu,
    htmlSourceOfTruthPattern:
      /\bas páginas HTML públicas são a fonte (?:da verdade|oficial|autoritativa)\b/iu,
  },
]

const legacyCertificateRecommendationPattern =
  /^\s*-\s+[^:\n]+:\s+https:\/\/certificacionmontessori\.com(?:\/(?:en|pt-br))?\/certificate\/\s*$/imu

for (const guide of llmsGuides) {
  const contents = fs.readFileSync(guide.filePath, "utf8")

  assert(
    contents.includes(guide.certificationUrl),
    `Expected ${guide.locale} llms guide to recommend ${guide.certificationUrl}`
  )
  assert(
    !legacyCertificateRecommendationPattern.test(contents),
    `Expected ${guide.locale} llms guide not to recommend a /certificate/ canonical URL`
  )
  assert.match(
    contents,
    guide.informationalPattern,
    `Expected ${guide.locale} llms guide to say the file is informational`
  )
  assert.match(
    contents,
    guide.noRankingPattern,
    `Expected ${guide.locale} llms guide to say the file is not a ranking signal`
  )
  assert.match(
    contents,
    guide.htmlSourceOfTruthPattern,
    `Expected ${guide.locale} llms guide to identify public HTML pages as the source of truth`
  )
}

console.log("sitemap SEO contract ok")
