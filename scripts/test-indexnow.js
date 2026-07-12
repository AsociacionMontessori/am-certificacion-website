const assert = require("assert")
const {
  buildIndexNowPayload,
  normalizePublicPaths,
  submitIndexNow,
} = require("./submit-indexnow")

assert.deepStrictEqual(
  normalizePublicPaths([
    "/publicaciones/",
    "/en/diplomados/casa-de-ninos/",
    "/checkout/success/",
    "/inscripcion/pagar/",
    "https://evil.example/page",
    "/publicaciones/",
  ]),
  [
    "/publicaciones/",
    "/en/diplomados/casa-de-ninos/",
  ]
)

assert.deepStrictEqual(
  buildIndexNowPayload(["/publicaciones/"], "abc123"),
  {
    host: "certificacionmontessori.com",
    key: "abc123",
    keyLocation: "https://certificacionmontessori.com/indexnow-key.txt",
    urlList: ["https://certificacionmontessori.com/publicaciones/"],
  }
)

assert.deepStrictEqual(
  normalizePublicPaths([
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
  ]),
  ["/publicaciones/"]
)

const maxBatchPaths = Array.from(
  { length: 10000 },
  (_, index) => `/publicaciones/indexnow-${index}/`
)
assert.strictEqual(
  buildIndexNowPayload(maxBatchPaths, "abc123").urlList.length,
  10000
)
assert.throws(
  () => buildIndexNowPayload([...maxBatchPaths, "/publicaciones/overflow/"], "abc123"),
  /at most 10000 URLs/
)

async function testRetries() {
  let calls = 0
  const fetchImpl = async () => {
    calls += 1
    return { ok: calls === 3, status: calls === 3 ? 200 : 503 }
  }
  await submitIndexNow(fetchImpl, buildIndexNowPayload(["/publicaciones/"], "abc123"), 3, async () => {})
  assert.strictEqual(calls, 3)

  let networkCalls = 0
  const flakyNetwork = async () => {
    networkCalls += 1
    if (networkCalls < 3) throw new Error("temporary network failure")
    return { ok: true, status: 200 }
  }
  await submitIndexNow(flakyNetwork, buildIndexNowPayload(["/publicaciones/"], "abc123"), 3, async () => {})
  assert.strictEqual(networkCalls, 3)

  let rateLimitCalls = 0
  const rateLimited = async () => {
    rateLimitCalls += 1
    return { ok: rateLimitCalls === 3, status: rateLimitCalls === 3 ? 202 : 429 }
  }
  await submitIndexNow(rateLimited, buildIndexNowPayload(["/publicaciones/"], "abc123"), 3, async () => {})
  assert.strictEqual(rateLimitCalls, 3)

  for (const status of [400, 403, 422]) {
    let callsForStatus = 0
    await assert.rejects(
      submitIndexNow(
        async () => {
          callsForStatus += 1
          return { ok: false, status }
        },
        buildIndexNowPayload(["/publicaciones/"], "abc123"),
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
      options.signal.addEventListener("abort", () => reject(new Error("aborted")))
    })
  }
  await submitIndexNow(
    timeoutThenSucceeds,
    buildIndexNowPayload(["/publicaciones/"], "abc123"),
    2,
    async () => {},
    5,
  )
  assert.strictEqual(timeoutCalls, 2)

  const neverResponds = (_url, options) => new Promise((_, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error("aborted")))
  })
  await assert.rejects(
    submitIndexNow(
      neverResponds,
      buildIndexNowPayload(["/publicaciones/"], "abc123"),
      1,
      async () => {},
      5,
    ),
    /network failure/
  )
}

testRetries().then(() => console.log("IndexNow contract ok")).catch(error => {
  console.error(error)
  process.exitCode = 1
})
