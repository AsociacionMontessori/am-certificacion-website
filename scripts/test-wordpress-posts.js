const assert = require("assert")
const fixture = require("./fixtures/wordpress-posts.json")
const {
  normalizeWordPressPost,
  normalizeWordPressPosts,
} = require("../src/services/wordpressPosts")

const post = normalizeWordPressPost(fixture[0])
assert.strictEqual(post.title, "Observación & ambiente preparado")
assert.strictEqual(post.excerpt, "Una mirada práctica a la observación.")
assert.strictEqual(post.author, "Roxana Muñoz")
assert.strictEqual(post.imageWidth, 1200)
assert.strictEqual(post.imageHeight, 630)
assert.strictEqual(
  post.url,
  "https://montessorimexico.org/observacion-montessori/"
)
assert.strictEqual(post.sourceContentId, "post_3cdd538282a5c53b")

assert.strictEqual(normalizeWordPressPost(fixture[1]), null)
assert.strictEqual(normalizeWordPressPost(fixture[2]), null)
assert.strictEqual(normalizeWordPressPosts(fixture).length, 1)
console.log("WordPress post contract ok")
