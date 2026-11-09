const assert = require("assert")

const firebaseConfig = require("../firebase.json")

const redirects = firebaseConfig.hosting?.redirects || []
const redirectBySource = new Map(
  redirects.map(redirect => [redirect.source, redirect])
)

assert.strictEqual(
  redirectBySource.size,
  redirects.length,
  "Expected every Firebase redirect source to be unique"
)

const localePrefixes = ["", "/en", "/pt-br"]
const legacyRoutes = [
  {
    source: "certificate",
    destination: "/diplomados/#certificacion_internacional",
  },
  { source: "masterclasses", destination: "/diplomados/" },
  { source: "otroscursos", destination: "/diplomados/" },
]
const routeSuffixes = ["", "/**"]

const expectedRedirects = localePrefixes.flatMap(localePrefix =>
  legacyRoutes.flatMap(route =>
    routeSuffixes.map(suffix => ({
      source: `${localePrefix}/${route.source}${suffix}`,
      destination: `${localePrefix}${route.destination}`,
      type: 301,
    }))
  )
)

expectedRedirects.forEach(expectedRedirect => {
  assert.deepStrictEqual(
    redirectBySource.get(expectedRedirect.source),
    expectedRedirect,
    `Expected ${expectedRedirect.source} to redirect permanently and directly to ${expectedRedirect.destination}`
  )
})

for (const source of ["/buscador", "/buscador/**"]) {
  assert.deepStrictEqual(
    redirectBySource.get(source),
    { source, destination: "/directorio/", type: 301 },
    `Expected ${source} to redirect permanently and directly to /directorio/`
  )
}

for (const source of ["/contacto", "/contacto/**"]) {
  assert.deepStrictEqual(
    redirectBySource.get(source),
    { source, destination: "/contact/", type: 301 },
    `Expected ${source} to redirect permanently and directly to /contact/`
  )
}

console.log("SEO redirects contract ok")
