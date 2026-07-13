const assert = require("assert")
const cheerio = require("cheerio")

const baseUrl = process.env.FIREBASE_HOSTING_TEST_ORIGIN || "http://127.0.0.1:5000"

async function request(pathname) {
  return fetch(`${baseUrl}${pathname}`, { redirect: "manual" })
}

async function main() {
  const missing = await request("/definitely-not-a-real-page-hosting-contract/")
  assert.strictEqual(missing.status, 404)
  const $ = cheerio.load(await missing.text())
  assert.match(
    String($("meta[name='robots']").attr("content") || ""),
    /noindex,nofollow/i
  )
  assert.notStrictEqual(
    $("link[rel='canonical']").attr("href"),
    "https://certificacionmontessori.com/"
  )

  const redirects = new Map([
    ["/certificate/", "/diplomados/#certificacion_internacional"],
    ["/en/certificate/", "/en/diplomados/#certificacion_internacional"],
    ["/pt-br/certificate/", "/pt-br/diplomados/#certificacion_internacional"],
    ["/masterclasses/", "/diplomados/"],
    ["/en/otroscursos/", "/en/diplomados/"],
    ["/pt-br/masterclasses/", "/pt-br/diplomados/"],
  ])
  for (const [pathname, destination] of redirects) {
    const response = await request(pathname)
    assert.strictEqual(response.status, 301, pathname)
    assert.strictEqual(response.headers.get("location"), destination, pathname)
  }

  for (const [pathname, contentType] of [
    ["/robots.txt", "text/plain"],
    ["/sitemap-index.xml", "application/xml"],
    ["/contact/", "text/html"],
  ]) {
    const response = await request(pathname)
    assert.strictEqual(response.status, 200, pathname)
    assert.match(response.headers.get("content-type") || "", new RegExp(contentType))
  }

  console.log("Firebase Hosting HTTP contract ok")
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
