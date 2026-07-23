const assert = require("assert")
const es = require("../src/i18n/locales/es/programs.json")
const en = require("../src/i18n/locales/en/programs.json")
const pt = require("../src/i18n/locales/pt-br/programs.json")

const ids = ["nido", "casa", "taller", "cosmica", "neuro"]
const required = [
  "shortTitle",
  "seoTitle",
  "seoDescription",
  "eyebrow",
  "title",
  "intro",
  "audience",
  "focus",
]
const flattenKeys = (value, prefix = "") =>
  Object.entries(value)
    .flatMap(([key, child]) => {
      const keyPath = prefix ? `${prefix}.${key}` : key
      return child && typeof child === "object" && !Array.isArray(child)
        ? flattenKeys(child, keyPath)
        : [keyPath]
    })
    .sort()

for (const locale of [es, en, pt]) {
  assert(locale.common)
  for (const id of ids) {
    for (const key of required)
      assert(locale[id]?.[key], `${id}.${key} missing`)
    assert.strictEqual(locale[id].focus.length, 3)
    assert(locale[id].seoTitle.length <= 60, `${id}.seoTitle is too long`)
    assert(
      locale[id].seoDescription.length >= 70 &&
        locale[id].seoDescription.length <= 160,
      `${id}.seoDescription length is invalid`
    )
  }
  assert.strictEqual(new Set(ids.map(id => locale[id].title)).size, ids.length)
}

assert.deepStrictEqual(flattenKeys(en), flattenKeys(es))
assert.deepStrictEqual(flattenKeys(pt), flattenKeys(es))
for (const id of ids) {
  assert.notStrictEqual(en[id].title, es[id].title)
  assert.notStrictEqual(pt[id].title, es[id].title)
}
console.log("program copy contract ok")
