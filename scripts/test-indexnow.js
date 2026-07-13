const assert = require("assert")
const fs = require("fs")
const os = require("os")
const path = require("path")
const {
  buildIndexNowPayload,
  loadSitemapCanonicalPaths,
  normalizePublicPaths,
  parseSitemapCanonicalPaths,
  run,
  submitIndexNow,
} = require("./submit-indexnow")

const ORIGIN = "https://certificacionmontessori.com"
const KEY = "abc12345"
const FABRICATED_PATH = "/definitely-not-a-public-page-review-probe/"
const submitSource = fs.readFileSync(
  path.join(__dirname, "submit-indexnow.js"),
  "utf8"
)

const sitemapXml = locations =>
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
  locations.map(location => `<url><loc>${location}</loc></url>`).join("") +
  `</urlset>`

async function testCanonicalAllowlist() {
  const canonicalPaths = new Set([
    "/alpha/",
    "/en/diplomados/casa-de-ninos/",
    "/pt-br/diplomados/casa-de-ninos/",
    "/publicaciones/",
    "/zeta/",
  ])

  assert.deepStrictEqual(
    normalizePublicPaths([FABRICATED_PATH, "/publicaciones/"], canonicalPaths),
    ["/publicaciones/"],
    "IndexNow must reject safe-looking paths absent from the generated sitemap"
  )

  assert.deepStrictEqual(
    normalizePublicPaths(["/zeta/", "/alpha/"], canonicalPaths),
    ["/alpha/", "/zeta/"]
  )

  assert.deepStrictEqual(
    normalizePublicPaths(
      [
        "/en/diplomados/casa-de-ninos",
        "/pt-br/diplomados/casa-de-ninos/?updated=1",
      ],
      canonicalPaths
    ),
    ["/en/diplomados/casa-de-ninos/", "/pt-br/diplomados/casa-de-ninos/"]
  )

  const pollutedAllowlist = new Set([
    ...canonicalPaths,
    "/404/",
    "/certificate/",
    "/masterclasses/",
    "/otroscursos/",
    "/checkout/success/",
    "/en/checkout/success/",
    "/inscripcion/pagar/",
    "/pt-br/inscripcion/pagar/",
    "/en/404/",
    "/pt-br/certificate/",
    "/en/masterclasses/",
    "/pt-br/otroscursos/",
    "/en/alumnos-app/",
    "/pt-br/draft/",
    "/en/external/",
    "/alumnos-app/",
    "/draft/",
    "/external/",
    "/buscador/",
    "/en/buscador/",
  ])

  assert.deepStrictEqual(
    normalizePublicPaths(
      [
        "/404/",
        "/certificate/",
        "/masterclasses/",
        "/otroscursos/",
        "/checkout/success/",
        "/en/checkout/success/",
        "/inscripcion/pagar/",
        "/pt-br/inscripcion/pagar/",
        "/en/404/",
        "/pt-br/certificate/",
        "/en/masterclasses/",
        "/pt-br/otroscursos/",
        "/en/alumnos-app/",
        "/pt-br/draft/",
        "/en/external/",
        "/alumnos-app/",
        "/draft/",
        "/external/",
        "/buscador/",
        "/en/buscador/",
        "//evil.example/page",
        "https://evil.example/page",
        "/https://evil.example/page",
        "/publicaciones con espacios/",
        "/publicaciones/%ZZ/",
        "/publicaciones\\unsafe/",
        "/publicaciones/?preview=true",
        "/publicaciones/#section",
        "/publicaciones/",
      ],
      pollutedAllowlist
    ),
    ["/publicaciones/"]
  )

  assert.throws(
    () => normalizePublicPaths(["/publicaciones/"]),
    /canonical sitemap allowlist is required/
  )

  for (const invalidKey of [
    "",
    "abc1234",
    "a".repeat(129),
    "abc defg",
    "abcdefg\n",
    "abcdefg_",
  ]) {
    assert.throws(
      () =>
        buildIndexNowPayload(["/publicaciones/"], invalidKey, canonicalPaths),
      /IndexNow key must be 8-128 characters using only A-Za-z0-9-/
    )
  }

  for (const validKey of ["a1b2c3d-", "a".repeat(128)]) {
    assert.strictEqual(
      buildIndexNowPayload(["/publicaciones/"], validKey, canonicalPaths).key,
      validKey
    )
  }

  assert.deepStrictEqual(
    buildIndexNowPayload(
      [FABRICATED_PATH, "/publicaciones/"],
      KEY,
      canonicalPaths
    ),
    {
      host: "certificacionmontessori.com",
      key: KEY,
      keyLocation: `${ORIGIN}/indexnow-key.txt`,
      urlList: [`${ORIGIN}/publicaciones/`],
    }
  )

  const maxBatchPaths = Array.from(
    { length: 10000 },
    (_, index) => `/publicaciones/indexnow-${index}/`
  )
  const maxBatchAllowlist = new Set([
    ...maxBatchPaths,
    "/publicaciones/overflow/",
  ])
  assert.strictEqual(
    buildIndexNowPayload(maxBatchPaths, KEY, maxBatchAllowlist).urlList.length,
    10000
  )
  assert.throws(
    () =>
      buildIndexNowPayload(
        [...maxBatchPaths, "/publicaciones/overflow/"],
        KEY,
        maxBatchAllowlist
      ),
    /at most 10000 URLs/
  )
}

async function testSitemapParsingAndCli() {
  assert(
    !submitSource.includes("env.INDEXNOW_SITEMAP_PATH"),
    "production CLI must not allow an environment-controlled sitemap allowlist"
  )

  const controlledXml = sitemapXml([
    `${ORIGIN}/publicaciones`,
    `${ORIGIN}/en/diplomados/casa-de-ninos/`,
    `${ORIGIN}/pt-br/diplomados/casa-de-ninos/`,
    "https://evil.example/foreign/",
    "http://certificacionmontessori.com/insecure/",
    "https://www.certificacionmontessori.com/wrong-host/",
    "https://certificacionmontessori.com:444/wrong-port/",
    `${ORIGIN}/publicaciones/?preview=true`,
    `${ORIGIN}/certificate/`,
    "not-a-url",
  ])
  const canonicalPaths = await parseSitemapCanonicalPaths(controlledXml)

  assert.deepStrictEqual([...canonicalPaths].sort(), [
    "/en/diplomados/casa-de-ninos/",
    "/pt-br/diplomados/casa-de-ninos/",
    "/publicaciones/",
  ])

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "indexnow-sitemap-"))
  const validPath = path.join(tempDir, "sitemap.xml")
  const malformedPath = path.join(tempDir, "malformed.xml")
  const wrongRootPath = path.join(tempDir, "wrong-root.xml")
  const foreignNamespacePath = path.join(tempDir, "foreign-namespace.xml")
  const foreignOnlyPath = path.join(tempDir, "foreign.xml")
  const missingPath = path.join(tempDir, "missing.xml")

  try {
    fs.writeFileSync(validPath, controlledXml)
    fs.writeFileSync(
      malformedPath,
      `<urlset><url><loc>${ORIGIN}/publicaciones/</urlset>`
    )
    fs.writeFileSync(
      wrongRootPath,
      `<root><url><loc>${ORIGIN}/publicaciones/</loc></url></root>`
    )
    fs.writeFileSync(
      foreignNamespacePath,
      `<urlset xmlns="https://example.com/not-a-sitemap">` +
        `<url><loc>${ORIGIN}/publicaciones/</loc></url></urlset>`
    )
    fs.writeFileSync(
      foreignOnlyPath,
      sitemapXml(["https://evil.example/foreign/"])
    )

    assert.deepStrictEqual(
      [...(await loadSitemapCanonicalPaths(validPath))].sort(),
      [...canonicalPaths].sort()
    )
    for (const unusablePath of [
      missingPath,
      malformedPath,
      wrongRootPath,
      foreignNamespacePath,
      foreignOnlyPath,
    ]) {
      await assert.rejects(
        loadSitemapCanonicalPaths(unusablePath),
        /Generated sitemap is missing or unusable.*Run npm run build/
      )
    }

    const logs = []
    let fetchCalls = 0
    const dryRunPayload = await run({
      argv: [FABRICATED_PATH, "/publicaciones/"],
      env: {
        INDEXNOW_DRY_RUN: "1",
      },
      fetchImpl: async () => {
        fetchCalls += 1
        return { ok: true, status: 200 }
      },
      key: KEY,
      log: message => logs.push(message),
      sitemapPath: validPath,
    })
    assert.strictEqual(fetchCalls, 0)
    assert.strictEqual(logs.length, 1)
    assert.deepStrictEqual(JSON.parse(logs[0]), dryRunPayload)
    assert.deepStrictEqual(dryRunPayload, {
      host: "certificacionmontessori.com",
      key: KEY,
      keyLocation: `${ORIGIN}/indexnow-key.txt`,
      urlList: [`${ORIGIN}/publicaciones/`],
    })

    for (const unusablePath of [missingPath, malformedPath]) {
      await assert.rejects(
        run({
          argv: ["/publicaciones/"],
          env: {
            INDEXNOW_DRY_RUN: "1",
          },
          key: KEY,
          log: () => {},
          sitemapPath: unusablePath,
        }),
        /Generated sitemap is missing or unusable.*Run npm run build/
      )
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

async function testRetries() {
  const canonicalPaths = new Set(["/publicaciones/"])
  const payload = buildIndexNowPayload(["/publicaciones/"], KEY, canonicalPaths)

  let calls = 0
  const fetchImpl = async () => {
    calls += 1
    return { ok: calls === 3, status: calls === 3 ? 200 : 503 }
  }
  await submitIndexNow(fetchImpl, payload, 3, async () => {})
  assert.strictEqual(calls, 3)

  let networkCalls = 0
  const flakyNetwork = async () => {
    networkCalls += 1
    if (networkCalls < 3) throw new Error("temporary network failure")
    return { ok: true, status: 200 }
  }
  await submitIndexNow(flakyNetwork, payload, 3, async () => {})
  assert.strictEqual(networkCalls, 3)

  let rateLimitCalls = 0
  const rateLimited = async () => {
    rateLimitCalls += 1
    return {
      ok: rateLimitCalls === 3,
      status: rateLimitCalls === 3 ? 202 : 429,
    }
  }
  await submitIndexNow(rateLimited, payload, 3, async () => {})
  assert.strictEqual(rateLimitCalls, 3)

  for (const status of [400, 403, 422]) {
    let callsForStatus = 0
    await assert.rejects(
      submitIndexNow(
        async () => {
          callsForStatus += 1
          return { ok: false, status }
        },
        payload,
        3,
        async () => {}
      ),
      new RegExp(`HTTP ${status}`)
    )
    assert.strictEqual(callsForStatus, 1)
  }

  let timeoutCalls = 0
  const timeoutThenSucceeds = (_url, options) => {
    timeoutCalls += 1
    if (timeoutCalls === 2) return Promise.resolve({ ok: true, status: 200 })
    return new Promise((_, reject) => {
      options.signal.addEventListener("abort", () =>
        reject(new Error("aborted"))
      )
    })
  }
  await submitIndexNow(timeoutThenSucceeds, payload, 2, async () => {}, 5)
  assert.strictEqual(timeoutCalls, 2)

  const neverResponds = (_url, options) =>
    new Promise((_, reject) => {
      options.signal.addEventListener("abort", () =>
        reject(new Error("aborted"))
      )
    })
  await assert.rejects(
    submitIndexNow(neverResponds, payload, 1, async () => {}, 5),
    /network failure/
  )
}

async function main() {
  await testCanonicalAllowlist()
  await testSitemapParsingAndCli()
  await testRetries()
  console.log("IndexNow contract ok")
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
