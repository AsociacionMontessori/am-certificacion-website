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
const legacyRoutes = ["certificate", "masterclasses", "otroscursos"]
const legacySitemapPaths = LANGUAGE_CODES.flatMap(language =>
  legacyRoutes.flatMap(route =>
    [`/${route}/`, `/${route}/archive/`].map(path =>
      localizePath(language, path)
    )
  )
)
const legacySitemapPages = legacySitemapPaths.map(path => ({ path }))
const legacyCertificatePaths = LANGUAGE_CODES.map(language =>
  localizePath(language, "/certificate/")
)
const publicPages = LANGUAGE_CODES.map(language => ({
  path: localizePath(language, "/diplomados/"),
}))

assert.strictEqual(
  new Set(legacySitemapPaths).size,
  18,
  "Expected an exact and wildcard fixture for every localized legacy route"
)

const { filteredPages } = pageFilter({
  allPages: [...transactionalPages, ...legacySitemapPages, ...publicPages],
  filterPages: defaultFilterPages,
  excludes: sitemapPlugin.options.excludes,
})

assert.deepStrictEqual(
  filteredPages,
  publicPages,
  "Expected every localized transaction and legacy page to be excluded while public /diplomados/ pages remain"
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
    htmlSourceOfTruthPattern: /\bpublic HTML pages are the source of truth\b/iu,
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

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const legacyCertificatePathPattern = legacyCertificatePaths
  .map(certificatePath => certificatePath.replace(/\/$/, ""))
  .map(escapeRegExp)
  .join("|")
const legacyCertificateUrlPattern = new RegExp(
  "(?:https?:\\/\\/(?:www\\.)?certificacionmontessori\\.com|(?<![/\\w.-]))" +
    `(?:${legacyCertificatePathPattern})/?` +
    "(?=$|[\\s#?.,;:!'\"`<>{}\\[\\]()])",
  "iu"
)

const legacyCertificateUrlFixtures = legacyCertificatePaths.flatMap(path => {
  const withoutTrailingSlash = path.replace(/\/$/, "")

  return [
    `Legacy URL: https://certificacionmontessori.com${withoutTrailingSlash}`,
    `* [Old canonical](https://certificacionmontessori.com${path})`,
    `Use ${withoutTrailingSlash} instead`,
    `> \`${path}\``,
    `Legacy:${withoutTrailingSlash}`,
  ]
})

for (const fixture of legacyCertificateUrlFixtures) {
  assert.match(
    fixture,
    legacyCertificateUrlPattern,
    `Expected legacy certificate URL detector to match ${fixture}`
  )
}

for (const fixture of [
  "https://example.com/en/certificate/",
  "https://certificacionmontessori.com/en/certificate-program/",
  "/pt-br/certificate-program/",
]) {
  assert.doesNotMatch(
    fixture,
    legacyCertificateUrlPattern,
    `Expected legacy certificate URL detector not to match ${fixture}`
  )
}

for (const guide of llmsGuides) {
  const contents = fs.readFileSync(guide.filePath, "utf8")

  assert(
    contents.includes(guide.certificationUrl),
    `Expected ${guide.locale} llms guide to recommend ${guide.certificationUrl}`
  )
  assert.doesNotMatch(
    contents,
    legacyCertificateUrlPattern,
    `Expected ${guide.locale} llms guide not to contain a same-site /certificate URL`
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
