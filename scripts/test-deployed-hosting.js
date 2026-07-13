const assert = require("assert")
const fs = require("fs")
const path = require("path")
const cheerio = require("cheerio")

const deploymentOrigin = String(process.argv[2] || "").replace(/\/+$/, "")
const canonicalOrigin = "https://certificacionmontessori.com"
assert.match(deploymentOrigin, /^https:\/\/[a-z0-9.-]+$/i, "HTTPS deployment origin required")

async function request(pathname) {
  return fetch(`${deploymentOrigin}${pathname}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
  })
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

  for (const pathname of [
    "/robots.txt",
    "/sitemap-index.xml",
    "/llms.txt",
    "/en/llms.txt",
    "/pt-br/llms.txt",
  ]) {
    const response = await request(pathname)
    assert.strictEqual(response.status, 200, pathname)
  }

  for (const pathname of ["/", "/en/", "/pt-br/"]) {
    const response = await request(pathname)
    assert.strictEqual(response.status, 200, pathname)
    const $ = cheerio.load(await response.text())
    assert.strictEqual(
      $("link[rel='canonical']").attr("href"),
      `${canonicalOrigin}${pathname}`
    )
    for (const hreflang of ["es", "en", "pt-BR", "x-default"]) {
      assert.strictEqual(
        $(`link[rel='alternate'][hreflang='${hreflang}']`).length,
        1,
        `${pathname} ${hreflang}`
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

  console.log(`Deployed Hosting contract ok: ${deploymentOrigin}`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
