const assert = require("assert")

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

console.log("sitemap SEO contract ok")
