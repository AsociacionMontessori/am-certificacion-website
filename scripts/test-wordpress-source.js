const assert = require("assert")
const fixture = require("./fixtures/wordpress-posts.json")
const { loadWordPressPosts } = require("../gatsby-node")

const reporter = { warn() {}, info() {} }

async function run() {
  const live = await loadWordPressPosts({
    fetchImpl: async () => ({ ok: true, json: async () => fixture }),
    snapshot: [],
    reporter,
  })
  assert.strictEqual(live.source, "live")
  assert.strictEqual(live.posts.length, 1)

  const fallback = await loadWordPressPosts({
    fetchImpl: async () => {
      throw new Error("offline")
    },
    snapshot: [live.posts[0]],
    reporter,
  })
  assert.strictEqual(fallback.source, "snapshot")
  assert.strictEqual(fallback.posts.length, 1)
  console.log("WordPress Gatsby source contract ok")
}

run().catch(error => {
  console.error(error)
  process.exitCode = 1
})
