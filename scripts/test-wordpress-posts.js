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
  post.imageCardUrl,
  "https://montessorimexico.org/wp-content/uploads/2026/07/observacion-768x403.jpg"
)
assert.strictEqual(
  post.imageSrcSet,
  [
    "https://montessorimexico.org/wp-content/uploads/2026/07/observacion-300x158.jpg 300w",
    "https://montessorimexico.org/wp-content/uploads/2026/07/observacion-768x403.jpg 768w",
    "https://montessorimexico.org/wp-content/uploads/2026/07/observacion-1024x538.jpg 1024w",
    "https://montessorimexico.org/wp-content/uploads/2026/07/observacion.jpg 1200w",
  ].join(", ")
)
assert.strictEqual(post.imageSrcSet.includes("evil.example"), false)
assert.strictEqual(
  post.url,
  "https://montessorimexico.org/observacion-montessori/"
)
assert.strictEqual(post.sourceContentId, "post_3cdd538282a5c53b")

assert.strictEqual(normalizeWordPressPost(fixture[1]), null)
assert.strictEqual(normalizeWordPressPost(fixture[2]), null)
assert.strictEqual(normalizeWordPressPosts(fixture).length, 1)
console.log("WordPress post contract ok")
