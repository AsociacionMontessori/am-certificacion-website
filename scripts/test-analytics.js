const assert = require("assert")
const {
  buildSafeParams,
  getAttribution,
  trackAttributedArrival,
  trackEvent,
} = require("../src/utils/analytics")

assert.deepStrictEqual(
  buildSafeParams({
    language: "es",
    program_id: "casa",
    email: "persona@example.com",
    message: "texto privado",
    unknown: "discard",
  }),
  { language: "es", program_id: "casa" }
)

assert.deepStrictEqual(
  getAttribution(
    "?utm_source=montessorimexico.org&utm_medium=referral&utm_campaign=guia_montessori&utm_content=observacion-casa&utm_term=casa"
  ),
  {
    source_hostname: "montessorimexico.org",
    source_post_slug: "observacion-casa",
    program_id: "casa",
  }
)

const calls = []
const target = {
  gtag: (...args) => calls.push(args),
  sessionStorage: {
    values: new Map(),
    getItem(key) {
      return this.values.get(key) || null
    },
    setItem(key, value) {
      this.values.set(key, value)
    },
  },
}

assert.strictEqual(
  trackAttributedArrival(
    {
      pathname: "/diplomados/casa-de-ninos/",
      search:
        "?utm_source=montessorimexico.org&utm_medium=referral&utm_campaign=guia_montessori&utm_content=observacion-casa&utm_term=casa",
    },
    target
  ),
  true
)
assert.strictEqual(calls.length, 1)
assert.strictEqual(calls[0][1], "click_program_cta")
assert.strictEqual(calls[0][2].source_post_slug, "observacion-casa")

assert.strictEqual(
  trackAttributedArrival(
    {
      pathname: "/diplomados/casa-de-ninos/",
      search:
        "?utm_source=montessorimexico.org&utm_medium=referral&utm_campaign=guia_montessori&utm_content=observacion-casa&utm_term=casa",
    },
    target
  ),
  false
)
assert.strictEqual(calls.length, 1)

assert.strictEqual(trackEvent("invented_event", {}, target), false)
console.log("analytics contract ok")
