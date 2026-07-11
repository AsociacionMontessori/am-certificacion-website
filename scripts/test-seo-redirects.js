const assert = require("assert")

const firebaseConfig = require("../firebase.json")

const redirects = firebaseConfig.hosting?.redirects || []
const redirectBySource = new Map(
  redirects.map(redirect => [redirect.source, redirect])
)

const expectedRedirects = [
  "/otroscursos",
  "/otroscursos/**",
  "/masterclasses",
  "/masterclasses/**",
]

expectedRedirects.forEach(source => {
  assert.deepStrictEqual(
    redirectBySource.get(source),
    {
      source,
      destination: "/diplomados/",
      type: 301,
    },
    `Expected ${source} to redirect permanently and directly to /diplomados/`
  )
})

console.log("SEO redirects contract ok")
