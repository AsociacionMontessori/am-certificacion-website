const assert = require("assert")
const fs = require("fs")
const path = require("path")
const cheerio = require("cheerio")

const root = path.resolve(__dirname, "..")
const publicDir = path.join(root, "public")
const wordpressOrigin = "https://montessorimexico.org"
const globalCss = fs.readFileSync(
  path.join(root, "src/styles/global.css"),
  "utf8"
)
const publicationHeroMobile = path.join(
  root,
  "static/backgrounds/publicaciones-mobile.webp"
)
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

  assert.strictEqual(
    $("iframe").length,
    0,
    `${page.pathname} must not contain an iframe`
  )
  assert.strictEqual(
    html.includes("fonts.googleapis.com"),
    false,
    `${page.pathname} must not load unused remote fonts`
  )
  assert.strictEqual(
    $(
      "link[rel='preload'][as='image'][href='/backgrounds/publicaciones-mobile.webp']"
    ).attr("fetchpriority"),
    "high",
    `${page.pathname} must preload the mobile publication hero with high priority`
  )
  assert.strictEqual(
    $(
      "link[rel='preload'][href='/backgrounds/publicaciones-mobile.webp']"
    ).attr("media"),
    "(max-width: 767px)",
    `${page.pathname} must scope the mobile hero preload`
  )
  assert.strictEqual(
    $("link[rel='preload'][href='/backgrounds/publicaciones.webp']").attr(
      "media"
    ),
    "(min-width: 768px)",
    `${page.pathname} must scope the desktop hero preload`
  )
  assert.strictEqual(
    $("main > section").first().hasClass("bg-fixed"),
    false,
    `${page.pathname} hero must not use fixed backgrounds`
  )
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
    const image = $(card).find("img")
    const imageSrc = image.attr("src")
    const imageSrcSet = image.attr("srcset")
    assert(link, `${page.pathname} article card must have a destination`)
    assert.strictEqual(
      new URL(link).origin,
      wordpressOrigin,
      `${page.pathname} article links must use the canonical WordPress origin`
    )
    assert(imageSrc, `${page.pathname} article card must have an image`)
    assert(
      imageSrcSet?.split(", ").length >= 3,
      `${page.pathname} article images must expose responsive sources`
    )
    assert.strictEqual(
      image.attr("sizes"),
      "(min-width: 1280px) 368px, (min-width: 768px) calc((100vw - 68px) / 2), calc(100vw - 34px)",
      `${page.pathname} article images must describe their rendered size`
    )
    assert(
      /-768x\d+\.(?:jpe?g|png|webp)$/i.test(new URL(imageSrc).pathname),
      `${page.pathname} article images must use the medium-large fallback`
    )
    for (const candidate of imageSrcSet.split(", ")) {
      assert.strictEqual(
        new URL(candidate.replace(/\s+\d+w$/, "")).origin,
        wordpressOrigin,
        `${page.pathname} responsive article images must use the WordPress origin`
      )
    }
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

assert(
  /@font-face\s*{[^}]*font-display:\s*swap;/s.test(globalCss),
  "Local heading fonts must use font-display: swap"
)
assert(
  fs.existsSync(publicationHeroMobile),
  "A dedicated mobile publication hero must exist"
)
assert(
  fs.statSync(publicationHeroMobile).size < 40000,
  "The mobile publication hero must stay below 40 KB"
)

console.log(
  "Built publications contract ok: native articles precede AMMAC books"
)
