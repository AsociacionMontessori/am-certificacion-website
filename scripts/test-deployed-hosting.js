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

const deploymentOrigin = String(process.argv[2] || "").replace(/\/+$/, "")
const canonicalOrigin = "https://certificacionmontessori.com"
assert.match(deploymentOrigin, /^https:\/\/[a-z0-9.-]+$/i, "HTTPS deployment origin required")
const approvedOriginalCanonicalPaths = [
  "/",
  "/diplomados/",
  "/publicaciones/",
  "/contact/",
  "/directorio/",
  "/privacy/",
  "/reembolsos/",
  "/roxana/",
  "/ia/",
]
const expectedCanonicalUrls = LANGUAGE_CODES.flatMap(language =>
  approvedOriginalCanonicalPaths.map(
    originalPath => `${canonicalOrigin}${localizePath(language, originalPath)}`
  )
).sort()

async function request(pathname) {
  return fetch(`${deploymentOrigin}${pathname}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
  })
}

const sitemapPathFor = absoluteUrl => {
  const url = new URL(absoluteUrl)
  assert.strictEqual(url.origin, canonicalOrigin, `Unexpected sitemap origin: ${absoluteUrl}`)
  return `${url.pathname}${url.search}`
}

const sitemapLanguageCount = (urls, language) => {
  const prefix = LANGUAGES[language].prefix
  return urls.filter(absoluteUrl => {
    const pathname = new URL(absoluteUrl).pathname
    if (!prefix) {
      return !LANGUAGE_CODES.some(
        code =>
          LANGUAGES[code].prefix &&
          pathname.startsWith(`${LANGUAGES[code].prefix}/`)
      )
    }
    return pathname.startsWith(`${prefix}/`)
  }).length
}

const uniqueAlternates = (links, label) => {
  const alternates = new Map()
  for (const link of links) {
    assert(!alternates.has(link.language), `${label} duplicate hreflang ${link.language}`)
    alternates.set(link.language, link.url)
  }
  return alternates
}

async function main() {
  const missing = await request("/not-a-real-page-deployment-contract/")
  assert.strictEqual(missing.status, 404)
  assert.match(await missing.text(), /noindex,nofollow/i)

  for (const [pathname, destination] of [
    ["/buscador/", "/directorio/"],
    ["/certificate/", "/diplomados/#certificacion_internacional"],
    ["/en/certificate/", "/en/diplomados/#certificacion_internacional"],
    ["/pt-br/certificate/", "/pt-br/diplomados/#certificacion_internacional"],
  ]) {
    const response = await request(pathname)
    assert.strictEqual(response.status, 301, pathname)
    assert.strictEqual(response.headers.get("location"), destination, pathname)
  }

  for (const pathname of ["/robots.txt", "/llms.txt", "/en/llms.txt", "/pt-br/llms.txt"]) {
    const response = await request(pathname)
    assert.strictEqual(response.status, 200, pathname)
  }

  const sitemapIndexResponse = await request("/sitemap-index.xml")
  assert.strictEqual(sitemapIndexResponse.status, 200, "/sitemap-index.xml")
  const sitemapIndex = await parseSitemapIndex(
    Readable.from([await sitemapIndexResponse.text()])
  )
  assert.deepStrictEqual(sitemapIndex, [{ url: `${canonicalOrigin}/sitemap-0.xml` }])

  const sitemapResponse = await request(sitemapPathFor(sitemapIndex[0].url))
  assert.strictEqual(sitemapResponse.status, 200, sitemapIndex[0].url)
  const sitemapEntries = await parseSitemap(
    Readable.from([await sitemapResponse.text()])
  )
  const canonicalUrls = sitemapEntries.map(entry => entry.url).sort()
  const canonicalUrlSet = new Set(canonicalUrls)

  assert.strictEqual(canonicalUrls.length, 27, "Expected 27 canonical sitemap URLs")
  assert.strictEqual(
    canonicalUrlSet.size,
    canonicalUrls.length,
    "Canonical sitemap URLs must be unique"
  )
  assert.deepStrictEqual(
    [...canonicalUrlSet].sort(),
    expectedCanonicalUrls,
    "Canonical sitemap URLs must exactly match the approved localized canonical routes"
  )
  assert(canonicalUrls.every(url => new URL(url).origin === canonicalOrigin))
  for (const language of LANGUAGE_CODES) {
    assert.strictEqual(
      sitemapLanguageCount(canonicalUrls, language),
      9,
      `${language} sitemap count`
    )
  }

  for (const entry of sitemapEntries) {
    const absoluteUrl = entry.url
    const { pathname } = new URL(absoluteUrl)
    const { originalPath } = parsePath(pathname)
    const response = await request(pathname)
    assert(
      response.status >= 200 && response.status < 300,
      `${pathname} expected a successful response, received ${response.status}`
    )

    const $ = cheerio.load(await response.text())
    assert.strictEqual(
      $("link[rel='canonical']").attr("href"),
      absoluteUrl,
      `${pathname} canonical`
    )
    assert.doesNotMatch(
      String($("meta[name='robots']").attr("content") || ""),
      /noindex/i,
      `${pathname} must remain indexable`
    )
    assert.strictEqual($("h1").length, 1, `${pathname} H1 count`)

    const title = $("title").text().trim()
    assert(title, `${pathname} title required`)
    assert([...title].length <= 65, `${pathname} title exceeds 65 characters`)

    const pageAlternates = uniqueAlternates(
      $("link[rel='alternate'][hreflang]")
        .toArray()
        .map(element => ({
          language: $(element).attr("hreflang"),
          url: $(element).attr("href"),
        })),
      pathname
    )
    const sitemapAlternates = uniqueAlternates(
      (entry.links || []).map(link => ({ language: link.lang, url: link.url })),
      `${pathname} sitemap`
    )

    for (const language of LANGUAGE_CODES) {
      const hreflang = LANGUAGES[language].hreflang
      const expectedUrl = `${canonicalOrigin}${localizePath(language, originalPath)}`
      assert.strictEqual(pageAlternates.get(hreflang), expectedUrl, `${pathname} ${hreflang}`)
      assert(canonicalUrlSet.has(expectedUrl), `${expectedUrl} missing from sitemap`)
      assert.strictEqual(
        sitemapAlternates.get(hreflang),
        expectedUrl,
        `${pathname} sitemap ${hreflang}`
      )
    }

    const defaultUrl = `${canonicalOrigin}${localizePath(DEFAULT_LANGUAGE, originalPath)}`
    assert.strictEqual(pageAlternates.get("x-default"), defaultUrl, `${pathname} x-default`)
    assert.strictEqual(
      sitemapAlternates.get("x-default"),
      defaultUrl,
      `${pathname} sitemap x-default`
    )
    assert.strictEqual(pageAlternates.size, 4, `${pathname} page hreflang count`)
    assert.strictEqual(sitemapAlternates.size, 4, `${pathname} sitemap hreflang count`)

    const schemas = $("script[type='application/ld+json']").toArray()
    assert(schemas.length > 0, `${pathname} JSON-LD required`)
    for (const schema of schemas) {
      const contents = String($(schema).html() || "").trim()
      assert(contents, `${pathname} JSON-LD must not be empty`)
      const parsed = JSON.parse(contents)
      assert(
        parsed && typeof parsed === "object",
        `${pathname} JSON-LD must be an object or array`
      )
    }
  }

  const contact = await request("/contact/")
  assert.strictEqual(contact.status, 200)
  const contactHtml = await contact.text()
  assert.doesNotMatch(
    contactHtml,
    /w\.behold\.so|connect\.facebook\.net|data-behold-id/
  )
  assert(contactHtml.includes("https://www.facebook.com/asociacionmontessori/"))
  assert(contactHtml.includes("https://www.instagram.com/asociacionmontessori/"))

  const keyResponse = await request("/indexnow-key.txt")
  assert.strictEqual(keyResponse.status, 200)
  assert.strictEqual(
    (await keyResponse.text()).trim(),
    fs
      .readFileSync(path.join(__dirname, "..", "static", "indexnow-key.txt"), "utf8")
      .trim()
  )

  console.log(
    `Deployed Hosting contract ok: ${deploymentOrigin} (27 canonical URLs, 9 per language)`
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
