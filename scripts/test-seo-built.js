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
const { PROGRAM_LANDING_ROUTES } = require("../src/data/programLandingRoutes")

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
  ...PROGRAM_LANDING_ROUTES.map(route => `/diplomados/${route.slug}/`),
]
const expectedCanonicalUrls = LANGUAGE_CODES.flatMap(language =>
  approvedOriginalCanonicalPaths.map(
    originalPath => `${origin}${localizePath(language, originalPath)}`
  )
).sort()

const homeGuideIntent = [
  {
    pathname: "/",
    title: "Certificación de Guía Montessori Online | AMMAC",
    heading: "¿Qué hace una Guía Montessori?",
    answer:
      "Una Guía Montessori observa el desarrollo de cada niña y niño, prepara el ambiente y presenta los materiales en el momento adecuado.",
  },
  {
    pathname: "/en/",
    title: "Online Montessori Guide Certification | AMMAC",
    heading: "What does a Montessori Guide do?",
    answer:
      "A Montessori Guide observes each child's development, prepares the learning environment, and presents materials at the appropriate moment.",
  },
  {
    pathname: "/pt-br/",
    title: "Certificação Montessori Online | Formação de Guias | AMMAC",
    heading: "O que faz uma Guia Montessori?",
    answer:
      "Uma Guia Montessori observa o desenvolvimento de cada criança, prepara o ambiente e apresenta os materiais no momento adequado.",
  },
]

const htmlPathFor = pathname =>
  pathname === "/"
    ? path.join(publicDir, "index.html")
    : path.join(publicDir, ...pathname.split("/").filter(Boolean), "index.html")

const readHtml = pathname => {
  const htmlPath = htmlPathFor(pathname)
  assert(fs.existsSync(htmlPath), `Built HTML must exist for ${pathname}`)
  const contents = fs.readFileSync(htmlPath)
  assert(!contents.includes(0), `${pathname} must not contain NUL bytes`)
  return contents.toString("utf8")
}

const builtFileForPathname = pathname => {
  const clean = decodeURIComponent(pathname)
  if (clean === "/") return path.join(publicDir, "index.html")
  if (path.extname(clean)) return path.join(publicDir, clean.replace(/^\//, ""))
  return htmlPathFor(clean)
}

const assertInternalLink = (href, sourceUrl) => {
  if (!href || href.startsWith("#") || /^(mailto|tel):/i.test(href)) return
  const target = new URL(href, sourceUrl)
  if (target.origin !== origin) return
  assert(
    !legacyPattern.test(target.pathname),
    `${sourceUrl} links to legacy ${target.pathname}`
  )
  const targetPath = path.resolve(builtFileForPathname(target.pathname))
  assert(
    targetPath.startsWith(`${path.resolve(publicDir)}${path.sep}`),
    `${sourceUrl} has an escaping internal path ${target.pathname}`
  )
  assert(
    fs.existsSync(targetPath),
    `${sourceUrl} links to missing ${target.pathname}`
  )
}

const uniqueAlternates = (links, label) => {
  const alternates = new Map()
  for (const link of links) {
    assert(
      !alternates.has(link.language),
      `${label} duplicate hreflang ${link.language}`
    )
    alternates.set(link.language, link.url)
  }
  return alternates
}

async function main() {
  const indexXml = fs.readFileSync(
    path.join(publicDir, "sitemap-index.xml"),
    "utf8"
  )
  const sitemapIndex = await parseSitemapIndex(Readable.from([indexXml]))
  assert.deepStrictEqual(sitemapIndex, [{ url: `${origin}/sitemap-0.xml` }])

  const sitemapXml = fs.readFileSync(
    path.join(publicDir, "sitemap-0.xml"),
    "utf8"
  )
  const entries = await parseSitemap(Readable.from([sitemapXml]))
  const urls = entries.map(entry => entry.url).sort()
  const urlSet = new Set(urls)

  assert.strictEqual(urls.length, 42, "Expected 42 canonical URLs")
  assert.strictEqual(urlSet.size, urls.length, "Sitemap URLs must be unique")
  assert.deepStrictEqual(
    [...urlSet].sort(),
    expectedCanonicalUrls,
    "Sitemap URLs must exactly match the approved localized canonical routes"
  )
  assert(urls.every(url => url.startsWith(`${origin}/`)))
  assert(urls.every(url => !legacyPattern.test(new URL(url).pathname)))

  for (const language of LANGUAGE_CODES) {
    const prefix = LANGUAGES[language].prefix
    const localizedCount = urls.filter(url => {
      const pathname = new URL(url).pathname
      if (!prefix) {
        return !LANGUAGE_CODES.some(
          code =>
            LANGUAGES[code].prefix &&
            pathname.startsWith(`${LANGUAGES[code].prefix}/`)
        )
      }
      return pathname.startsWith(`${prefix}/`)
    }).length
    assert.strictEqual(localizedCount, 14, `${language} sitemap count`)
  }

  for (const absoluteUrl of urls) {
    const { pathname } = new URL(absoluteUrl)
    const { language, originalPath } = parsePath(pathname)
    const html = readHtml(pathname)
    const $ = cheerio.load(html)
    const sitemapAlternates = uniqueAlternates(
      (entries.find(entry => entry.url === absoluteUrl)?.links || []).map(
        link => ({
          language: link.lang,
          url: link.url,
        })
      ),
      `${absoluteUrl} sitemap`
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
      `${absoluteUrl} title is too long (${
        [...title].length
      } characters): ${title}`
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

    const alternates = uniqueAlternates(
      $("link[rel='alternate'][hreflang]")
        .toArray()
        .map(element => ({
          language: $(element).attr("hreflang"),
          url: $(element).attr("href"),
        })),
      absoluteUrl
    )
    for (const code of LANGUAGE_CODES) {
      const expectedUrl = `${origin}${localizePath(code, originalPath)}`
      assert.strictEqual(
        alternates.get(LANGUAGES[code].hreflang),
        expectedUrl,
        `${absoluteUrl} hreflang ${LANGUAGES[code].hreflang}`
      )
      assert(
        urlSet.has(expectedUrl),
        `${expectedUrl} must be reciprocal in sitemap`
      )
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

    const schemaElements = $("script[type='application/ld+json']").toArray()
    assert(schemaElements.length > 0, `${absoluteUrl} must expose JSON-LD`)
    const schemas = []
    for (const schemaElement of schemaElements) {
      const contents = String($(schemaElement).html() || "").trim()
      assert(contents, `${absoluteUrl} JSON-LD must not be empty`)
      const parsed = JSON.parse(contents)
      assert(
        parsed && typeof parsed === "object",
        `${absoluteUrl} JSON-LD must be an object or array`
      )
      schemas.push(...(Array.isArray(parsed) ? parsed : [parsed]))
    }

    const schemaTypes = schemas.map(schema => schema["@type"])
    assert(
      schemaTypes.includes("EducationalOrganization"),
      `${absoluteUrl} organization schema`
    )
    assert(schemaTypes.includes("WebSite"), `${absoluteUrl} website schema`)
    assert(schemaTypes.includes("WebPage"), `${absoluteUrl} webpage schema`)
    assert(schemas.some(schema => schema["@id"] === `${origin}/#organization`))
    assert(schemas.some(schema => schema["@id"] === `${origin}/#website`))
    assert(schemas.some(schema => schema["@id"] === `${absoluteUrl}#webpage`))
    if (originalPath !== "/") {
      assert(
        schemaTypes.includes("BreadcrumbList"),
        `${absoluteUrl} breadcrumb schema`
      )
    }

    const programRoute = PROGRAM_LANDING_ROUTES.find(
      route => originalPath === `/diplomados/${route.slug}/`
    )
    if (programRoute) {
      const courses = schemas.filter(schema => schema["@type"] === "Course")
      assert.strictEqual(
        courses.length,
        1,
        `${absoluteUrl} Course schema count`
      )
      const course = courses[0]
      assert.strictEqual(course["@id"], `${absoluteUrl}#course`)
      assert.strictEqual(course.provider?.["@id"], `${origin}/#organization`)
      assert.strictEqual(course.inLanguage, LANGUAGES[language].htmlLang)
      for (const unsupported of [
        "hasCourseInstance",
        "offers",
        "aggregateRating",
        "review",
      ]) {
        assert.strictEqual(
          course[unsupported],
          undefined,
          `${absoluteUrl} must omit ${unsupported}`
        )
      }

      const breadcrumb = schemas.find(
        schema => schema["@type"] === "BreadcrumbList"
      )
      const expectedSection = {
        es: "Diplomados",
        en: "Diploma courses",
        "pt-br": "Cursos de formação",
      }[language]
      assert.strictEqual(
        breadcrumb.itemListElement?.[1]?.name,
        expectedSection,
        `${absoluteUrl} localized breadcrumb section`
      )
    }

    if (originalPath === "/publicaciones/") {
      assert(schemaTypes.filter(type => type === "ItemList").length >= 2)
      assert.strictEqual(schemaTypes.filter(type => type === "Book").length, 5)
    }
    if (originalPath === "/roxana/") {
      assert(
        schemas.some(schema => schema["@id"] === `${origin}/roxana/#person`)
      )
    }

    $("a[href]").each((_, link) =>
      assertInternalLink($(link).attr("href"), absoluteUrl)
    )
  }

  for (const expectation of homeGuideIntent) {
    const $ = cheerio.load(readHtml(expectation.pathname))
    const headings = $("main h2")
      .toArray()
      .map(element => $(element).text().replace(/\s+/g, " ").trim())
    const mainText = $("main").text().replace(/\s+/g, " ").trim()

    assert.strictEqual(
      $("title").text().trim(),
      expectation.title,
      `${expectation.pathname} must expose the approved guide-intent title`
    )
    assert(
      headings.includes(expectation.heading),
      `${expectation.pathname} must expose the localized guide-role H2`
    )
    assert(
      mainText.includes(expectation.answer),
      `${expectation.pathname} must expose the localized guide-role answer`
    )
  }

  for (const originalPath of transactionalPaths) {
    for (const language of LANGUAGE_CODES) {
      const pathname = localizePath(language, originalPath)
      assert(
        !urlSet.has(`${origin}${pathname}`),
        `${pathname} must stay out of sitemap`
      )
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
    for (const forbidden of [
      "connect.facebook.net",
      "w.behold.so",
      "data-behold-id",
    ]) {
      assert(
        !html.includes(forbidden),
        `${contactPath} must not load ${forbidden}`
      )
    }
  }

  for (const relativePath of ["llms.txt", "en/llms.txt", "pt-br/llms.txt"]) {
    assert.strictEqual(
      fs.readFileSync(path.join(publicDir, relativePath), "utf8"),
      fs.readFileSync(path.join(root, "static", relativePath), "utf8"),
      `${relativePath} must survive the build unchanged`
    )
  }

  console.log("Built SEO contract ok: 42 canonical URLs, 14 per language")
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
