const assert = require("assert")
const { buildCourseSchema } = require("../src/utils/programSchemas")

const schema = buildCourseSchema({
  pageUrl: "https://certificacionmontessori.com/en/diplomados/casa-de-ninos/",
  name: "Montessori Guide for Children's House",
  description: "Online professional training.",
  language: "en",
  programId: "casa",
})

assert.strictEqual(schema["@type"], "Course")
assert.strictEqual(
  schema.provider["@id"],
  "https://certificacionmontessori.com/#organization"
)
assert.strictEqual(schema.inLanguage, "en")
assert.strictEqual(schema.hasCourseInstance, undefined)
assert.strictEqual(schema.offers, undefined)
console.log("program schemas ok")
