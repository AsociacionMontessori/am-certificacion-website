const assert = require("assert")
const fs = require("fs")
const path = require("path")
const cheerio = require("cheerio")

const root = path.resolve(__dirname, "..")
const publicDir = path.join(root, "public")
const wordpressOrigin = "https://montessorimexico.org"
const pages = [
  {
    pathname: "/publicaciones/",
    articleTab: "Artículos",
    booksTab: "Libros AMMAC",
  },
  {
    pathname: "/en/publicaciones/",
    articleTab: "Articles",
    booksTab: "AMMAC books",
  },
  {
    pathname: "/pt-br/publicaciones/",
    articleTab: "Artigos",
    booksTab: "Livros AMMAC",
  },
]

const htmlPathFor = pathname =>
  path.join(publicDir, ...pathname.split("/").filter(Boolean), "index.html")

for (const page of pages) {
  const htmlPath = htmlPathFor(page.pathname)
  assert(fs.existsSync(htmlPath), `Built HTML must exist for ${page.pathname}`)

  const html = fs.readFileSync(htmlPath, "utf8")
  const $ = cheerio.load(html)
  const articlesPosition = html.indexOf('id="articulos"')
  const booksPosition = html.indexOf('id="libros"')

  assert.strictEqual($("iframe").length, 0, `${page.pathname} must not contain an iframe`)
  assert(articlesPosition >= 0, `${page.pathname} must contain #articulos`)
  assert(booksPosition >= 0, `${page.pathname} must contain #libros`)
  assert(
    articlesPosition < booksPosition,
    `${page.pathname} must render articles before books`
  )

  const tabs = $("[role='tab']")
    .toArray()
    .map(element => $(element).text().trim())
  assert.deepStrictEqual(
    tabs,
    [page.articleTab, page.booksTab],
    `${page.pathname} must expose localized publication tabs`
  )

  const articleCards = $("#articulos article")
  assert.strictEqual(
    articleCards.length,
    12,
    `${page.pathname} must render the twelve latest article cards`
  )

  articleCards.each((_, card) => {
    const link = $(card).find("a[href]").last().attr("href")
    assert(link, `${page.pathname} article card must have a destination`)
    assert.strictEqual(
      new URL(link).origin,
      wordpressOrigin,
      `${page.pathname} article links must use the canonical WordPress origin`
    )
  })

  assert(
    $("#libros article").length > 0,
    `${page.pathname} must keep the AMMAC book catalogue in initial HTML`
  )
  assert.strictEqual(
    $("a[href='#articulos']").length,
    1,
    `${page.pathname} hero must link to articles`
  )
  assert.strictEqual(
    $("a[href='#libros']").length,
    1,
    `${page.pathname} hero must link to books`
  )
}

console.log("Built publications contract ok: native articles precede AMMAC books")
