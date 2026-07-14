const assert = require("assert")
const fs = require("fs")
const path = require("path")
const { Readable } = require("stream")
const cheerio = require("cheerio")
const { parseSitemap, parseSitemapIndex } = require("sitemap")
const {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_CODES,
  localizePath,
  parsePath,
} = require("../src/i18n/config")

const root = path.resolve(__dirname, "..")
const publicDir = path.join(root, "public")
const origin = "https://certificacionmontessori.com"
const legacyPattern = /\/(?:certificate|masterclasses|otroscursos)(?:\/|$)/
const transactionalPaths = [
  "/checkout/cancel/",
  "/checkout/libro/",
  "/checkout/success/",
  "/inscripcion/completar/",
  "/inscripcion/documentos/",
  "/inscripcion/pagar/",
  "/inscripcion/transferencia/",
]

const htmlPathFor = pathname =>
  pathname === "/"
    ? path.join(publicDir, "index.html")
    : path.join(publicDir, ...pathname.split("/").filter(Boolean), "index.html")

const readHtml = pathname => {
  const htmlPath = htmlPathFor(pathname)
  assert(fs.existsSync(htmlPath), `Built HTML must exist for ${pathname}`)
  return fs.readFileSync(htmlPath, "utf8")
}

async function main() {
  const indexXml = fs.readFileSync(
    path.join(publicDir, "sitemap-index.xml"),
    "utf8"
  )
  const sitemapIndex = await parseSitemapIndex(Readable.from([indexXml]))
  assert.deepStrictEqual(sitemapIndex, [
    { url: `${origin}/sitemap-0.xml` },
  ])

  const sitemapXml = fs.readFileSync(
    path.join(publicDir, "sitemap-0.xml"),
    "utf8"
  )
  const entries = await parseSitemap(Readable.from([sitemapXml]))
  const urls = entries.map(entry => entry.url).sort()
  const urlSet = new Set(urls)

  assert.strictEqual(urls.length, 27, "Expected 27 current canonical URLs")
  assert.strictEqual(urlSet.size, urls.length, "Sitemap URLs must be unique")
  assert(urls.every(url => url.startsWith(`${origin}/`)))
  assert(urls.every(url => !legacyPattern.test(new URL(url).pathname)))

  for (const language of LANGUAGE_CODES) {
    const prefix = LANGUAGES[language].prefix
    const localizedCount = urls.filter(url => {
      const pathname = new URL(url).pathname
      if (!prefix) {
        return !LANGUAGE_CODES.some(
          code => LANGUAGES[code].prefix && pathname.startsWith(`${LANGUAGES[code].prefix}/`)
        )
      }
      return pathname.startsWith(`${prefix}/`)
    }).length
    assert.strictEqual(localizedCount, 9, `${language} sitemap count`)
  }

  for (const absoluteUrl of urls) {
    const { pathname } = new URL(absoluteUrl)
    const { language, originalPath } = parsePath(pathname)
    const html = readHtml(pathname)
    const $ = cheerio.load(html)
    const sitemapAlternates = new Map(
      (entries.find(entry => entry.url === absoluteUrl)?.links || []).map(link => [
        link.lang,
        link.url,
      ])
    )

    assert.strictEqual($("html").attr("lang"), LANGUAGES[language].htmlLang)
    assert.strictEqual($("link[rel='canonical']").attr("href"), absoluteUrl)
    assert.doesNotMatch(
      String($("meta[name='robots']").attr("content") || ""),
      /noindex/i,
      `${absoluteUrl} must remain indexable`
    )

    const title = $("title").text().trim()
    assert(title, `${absoluteUrl} must expose a title`)
    assert(
      [...title].length <= 65,
      `${absoluteUrl} title is too long (${[...title].length} characters): ${title}`
    )
    assert(
      (title.match(/\bAMMAC\b/g) || []).length <= 1,
      `${absoluteUrl} title must not repeat the AMMAC brand: ${title}`
    )
    assert.strictEqual(
      $("h1").length,
      1,
      `${absoluteUrl} must expose exactly one H1`
    )

    $("img").each((_, image) => {
      const element = $(image)
      const hasAlt = Object.prototype.hasOwnProperty.call(image.attribs, "alt")
      assert(hasAlt, `${absoluteUrl} image must expose an alt attribute`)

      if (!String(element.attr("alt") || "").trim()) {
        const isDecorative =
          element.attr("aria-hidden") === "true" ||
          element.parents("[aria-hidden='true']").length > 0
        assert(
          isDecorative,
          `${absoluteUrl} empty alt is only valid for an aria-hidden decorative image`
        )
      }
    })

    const alternates = new Map(
      $("link[rel='alternate'][hreflang]")
        .toArray()
        .map(element => [$(element).attr("hreflang"), $(element).attr("href")])
    )
    for (const code of LANGUAGE_CODES) {
      const expectedUrl = `${origin}${localizePath(code, originalPath)}`
      assert.strictEqual(
        alternates.get(LANGUAGES[code].hreflang),
        expectedUrl,
        `${absoluteUrl} hreflang ${LANGUAGES[code].hreflang}`
      )
      assert(urlSet.has(expectedUrl), `${expectedUrl} must be reciprocal in sitemap`)
      assert.strictEqual(
        sitemapAlternates.get(LANGUAGES[code].hreflang),
        expectedUrl,
        `${absoluteUrl} sitemap hreflang ${LANGUAGES[code].hreflang}`
      )
    }
    assert.strictEqual(
      alternates.get("x-default"),
      `${origin}${localizePath(DEFAULT_LANGUAGE, originalPath)}`
    )
    assert.strictEqual(alternates.size, 4, `${absoluteUrl} alternate count`)
    assert.strictEqual(
      sitemapAlternates.get("x-default"),
      `${origin}${localizePath(DEFAULT_LANGUAGE, originalPath)}`
    )
    assert.strictEqual(
      sitemapAlternates.size,
      4,
      `${absoluteUrl} sitemap alternate count`
    )

    const schemas = $("script[type='application/ld+json']").toArray()
    assert(schemas.length > 0, `${absoluteUrl} must expose JSON-LD`)
    for (const schema of schemas) {
      const contents = String($(schema).html() || "").trim()
      assert(contents, `${absoluteUrl} JSON-LD must not be empty`)
      const parsed = JSON.parse(contents)
      assert(
        parsed && typeof parsed === "object",
        `${absoluteUrl} JSON-LD must be an object or array`
      )
    }
  }

  for (const originalPath of transactionalPaths) {
    for (const language of LANGUAGE_CODES) {
      const pathname = localizePath(language, originalPath)
      assert(!urlSet.has(`${origin}${pathname}`), `${pathname} must stay out of sitemap`)
      const $ = cheerio.load(readHtml(pathname))
      assert.match(
        String($("meta[name='robots']").attr("content") || ""),
        /noindex,follow/i,
        `${pathname} must remain noindex,follow`
      )
    }
  }

  for (const language of LANGUAGE_CODES) {
    const contactPath = localizePath(language, "/contact/")
    const html = readHtml(contactPath)
    for (const forbidden of ["connect.facebook.net", "w.behold.so", "data-behold-id"]) {
      assert(!html.includes(forbidden), `${contactPath} must not load ${forbidden}`)
    }
  }

  for (const relativePath of ["llms.txt", "en/llms.txt", "pt-br/llms.txt"]) {
    assert.strictEqual(
      fs.readFileSync(path.join(publicDir, relativePath), "utf8"),
      fs.readFileSync(path.join(root, "static", relativePath), "utf8"),
      `${relativePath} must survive the build unchanged`
    )
  }

  console.log("Built SEO contract ok: 27 canonical URLs, 9 per language")
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
