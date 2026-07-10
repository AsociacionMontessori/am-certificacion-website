const assert = require("assert")

const { LOCALIZED_PATHS, localizePath } = require("../src/i18n/config")
const {
  buildLocalizedCheckoutUrl,
  getStripeCheckoutLocale,
  resolveCheckoutLanguage,
} = require("../alumnos-app/functions-stripe/stripe/checkoutLanguage")

const requiredTransactionalPaths = [
  "/checkout/cancel/",
  "/checkout/libro/",
  "/checkout/success/",
  "/inscripcion/completar/",
  "/inscripcion/documentos/",
  "/inscripcion/pagar/",
  "/inscripcion/transferencia/",
]

requiredTransactionalPaths.forEach((path) => {
  assert(
      LOCALIZED_PATHS.includes(path),
      `Expected ${path} to be listed as a localized transactional path`,
  )
})

assert.strictEqual(localizePath("en", "/inscripcion/pagar/"), "/en/inscripcion/pagar/")
assert.strictEqual(localizePath("pt-br", "/checkout/success/"), "/pt-br/checkout/success/")
assert.strictEqual(
    localizePath("en", "/checkout/success?orden=abc123&tipo=inscripcion"),
    "/en/checkout/success/?orden=abc123&tipo=inscripcion",
)

assert.strictEqual(resolveCheckoutLanguage("en"), "en")
assert.strictEqual(resolveCheckoutLanguage("pt-BR"), "pt-br")
assert.strictEqual(resolveCheckoutLanguage("pt"), "pt-br")
assert.strictEqual(resolveCheckoutLanguage("fr"), "es")
assert.strictEqual(resolveCheckoutLanguage(""), "es")

assert.strictEqual(getStripeCheckoutLocale("es"), "es")
assert.strictEqual(getStripeCheckoutLocale("en"), "en")
assert.strictEqual(getStripeCheckoutLocale("pt-br"), "pt-BR")

assert.strictEqual(
    buildLocalizedCheckoutUrl({
      siteUrl: "https://certificacionmontessori.com/",
      language: "en",
      pathname: "/checkout/success",
      query: "orden=abc123&tipo=inscripcion",
    }),
    "https://certificacionmontessori.com/en/checkout/success?orden=abc123&tipo=inscripcion",
)

assert.strictEqual(
    buildLocalizedCheckoutUrl({
      siteUrl: "https://certificacionmontessori.com",
      language: "pt-br",
      pathname: "/checkout/cancel",
      query: "orden=abc123",
    }),
    "https://certificacionmontessori.com/pt-br/checkout/cancel?orden=abc123",
)

assert.strictEqual(
    buildLocalizedCheckoutUrl({
      siteUrl: "https://certificacionmontessori.com",
      language: "es",
      pathname: "/checkout/success",
      query: "",
    }),
    "https://certificacionmontessori.com/checkout/success",
)

console.log("checkout i18n contract ok")
