const assert = require("assert")
const { PROGRAM_LANDING_ROUTES } = require("../src/data/programLandingRoutes")
const gatsbyNode = require("../gatsby-node")

assert.strictEqual(PROGRAM_LANDING_ROUTES.length, 5)
assert.deepStrictEqual(
  PROGRAM_LANDING_ROUTES.map(route => route.id),
  ["nido", "casa", "taller", "cosmica", "neuro"]
)

const created = []
gatsbyNode.createPages({
  actions: { createPage: page => created.push(page) },
})

assert.strictEqual(created.length, 15)
assert(created.some(page => page.path === "/diplomados/casa-de-ninos/"))
assert(created.some(page => page.path === "/en/diplomados/casa-de-ninos/"))
assert(created.some(page => page.path === "/pt-br/diplomados/casa-de-ninos/"))
assert(created.every(page => page.context.programId))
console.log("program route contract ok")
