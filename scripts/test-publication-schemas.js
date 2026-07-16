const assert = require("assert")

let buildPublicationSchemas
try {
  ;({ buildPublicationSchemas } = require("../src/utils/publicationSchemas"))
} catch {
  assert.fail("buildPublicationSchemas must be implemented")
}

const schemas = buildPublicationSchemas({
  posts: [
    {
      id: "101",
      url: "https://montessorimexico.org/post/",
      title: "Post",
    },
  ],
  books: [
    {
      id: "book-1",
      title: "Libro",
      description: "Descripción",
      coverImage: "/books/libro.jpg",
      amazonUrl: "https://www.amazon.com.mx/dp/ABC",
    },
  ],
  pageUrl: "https://certificacionmontessori.com/publicaciones/",
  language: "es-MX",
})

assert.strictEqual(schemas[0]["@type"], "ItemList")
assert.strictEqual(schemas[0].name, "Artículos recientes")
assert.strictEqual(
  schemas[0].itemListElement[0].url,
  "https://montessorimexico.org/post/"
)
assert.strictEqual(schemas[1]["@type"], "ItemList")
assert.strictEqual(schemas[2]["@type"], "Book")
assert.strictEqual(
  schemas[2].author["@id"],
  "https://certificacionmontessori.com/roxana/#person"
)
assert.strictEqual(schemas[2].offers, undefined)
assert.strictEqual(schemas[2].aggregateRating, undefined)

console.log("Publication schemas contract ok")
