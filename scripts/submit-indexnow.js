const fs = require("fs")
const path = require("path")
const { Readable } = require("stream")
const firebaseConfig = require("../firebase.json")
const { parseSitemap } = require("sitemap")

const HOST = "certificacionmontessori.com"
const ORIGIN = `https://${HOST}`
const DEFAULT_SITEMAP_PATH = path.join(
  __dirname,
  "..",
  "public",
  "sitemap-0.xml"
)
const MAX_URLS_PER_BATCH = 10000
const LOCALE_PREFIXES = new Set(["en", "pt-br"])
const BLOCKED_SEGMENTS = new Set([
  "404",
  "certificate",
  "masterclasses",
  "otroscursos",
  "checkout",
  "inscripcion",
  "alumnos-app",
  "draft",
  "external",
])
const FAIL_FAST_STATUSES = new Set([400, 403, 422])
const RFC3986_PATH = /^\/(?:[A-Za-z0-9\-._~!$&'()*+,;=:@]|%[A-Fa-f0-9]{2}|\/)*$/

const redirectPrefixes = (firebaseConfig.hosting?.redirects || [])
  .map(redirect => redirect.source)
  .filter(source => typeof source === "string" && source.startsWith("/"))
  .map(source => {
    const wildcardIndex = source.indexOf("*")
    const prefix = (
      wildcardIndex === -1 ? source : source.slice(0, wildcardIndex)
    ).replace(/\/+$/, "")
    return prefix ? `${prefix}/` : "/"
  })

const isRedirectPath = pathname =>
  redirectPrefixes.some(prefix => {
    if (pathname === prefix || pathname.startsWith(prefix)) return true
    return [...LOCALE_PREFIXES].some(locale => {
      const localizedPrefix = `/${locale}${prefix}`
      return (
        pathname === localizedPrefix || pathname.startsWith(localizedPrefix)
      )
    })
  })

const isSafePublicPath = pathname => {
  if (!RFC3986_PATH.test(pathname)) return false

  const segments = pathname.split("/").filter(Boolean)
  try {
    return !segments.some((segment, index) => {
      const decoded = decodeURIComponent(segment)
      const lower = decoded.toLowerCase()
      return (
        decoded === "." ||
        decoded === ".." ||
        decoded.includes("/") ||
        decoded.includes("\\") ||
        /[\u0000-\u001f\u007f]/.test(decoded) ||
        BLOCKED_SEGMENTS.has(lower) ||
        (index === 0 && /^(?:https?|ftp):$/i.test(decoded))
      )
    })
  } catch {
    return false
  }
}

const normalizeCanonicalPath = pathname => {
  if (
    typeof pathname !== "string" ||
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.includes("\\") ||
    !isSafePublicPath(pathname)
  ) {
    return null
  }

  const normalized = pathname === "/" ? "/" : `${pathname.replace(/\/+$/, "")}/`
  return isRedirectPath(normalized) ? null : normalized
}

const parseSitemapCanonicalPaths = async sitemapText => {
  if (typeof sitemapText !== "string" || !sitemapText.trim()) {
    throw new Error("Generated sitemap XML is empty")
  }

  const entries = await parseSitemap(Readable.from([sitemapText]))
  const canonicalPaths = new Set()
  for (const entry of entries) {
    if (typeof entry?.url !== "string") continue

    try {
      const location = new URL(entry.url.trim())
      if (
        location.origin !== ORIGIN ||
        location.username ||
        location.password ||
        location.search ||
        location.hash
      ) {
        continue
      }
      const normalized = normalizeCanonicalPath(location.pathname)
      if (normalized) canonicalPaths.add(normalized)
    } catch {
      // Ignore malformed or non-absolute loc entries.
    }
  }
  return canonicalPaths
}

const loadSitemapCanonicalPaths = async (
  sitemapPath = DEFAULT_SITEMAP_PATH
) => {
  const resolvedPath = path.resolve(sitemapPath)
  try {
    const sitemapText = await fs.promises.readFile(resolvedPath, "utf8")
    const canonicalPaths = await parseSitemapCanonicalPaths(sitemapText)
    if (!canonicalPaths.size) throw new Error("No canonical URLs found")
    return canonicalPaths
  } catch (error) {
    throw new Error(
      `Generated sitemap is missing or unusable at ${resolvedPath}. ` +
        "Run npm run build before submitting URLs to IndexNow.",
      { cause: error }
    )
  }
}

const normalizePublicPaths = (paths, canonicalPaths) => {
  if (!(canonicalPaths instanceof Set) || !canonicalPaths.size) {
    throw new Error("IndexNow canonical sitemap allowlist is required")
  }

  const accepted = new Set()
  for (const raw of paths || []) {
    if (typeof raw !== "string") continue
    const pathname = raw.split(/[?#]/, 1)[0]
    const normalized = normalizeCanonicalPath(pathname)
    if (!normalized || !canonicalPaths.has(normalized)) continue
    accepted.add(normalized)
  }
  return [...accepted].sort()
}

const buildIndexNowPayload = (paths, key, canonicalPaths) => {
  if (typeof key !== "string" || !/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    throw new Error(
      "IndexNow key must be 8-128 characters using only A-Za-z0-9-"
    )
  }
  const publicPaths = normalizePublicPaths(paths, canonicalPaths)
  if (publicPaths.length > MAX_URLS_PER_BATCH) {
    throw new Error(
      `IndexNow accepts at most ${MAX_URLS_PER_BATCH} URLs per batch`
    )
  }
  return {
    host: HOST,
    key,
    keyLocation: `${ORIGIN}/indexnow-key.txt`,
    urlList: publicPaths.map(pathname => `${ORIGIN}${pathname}`),
  }
}

const wait = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds))

const submitIndexNow = async (
  fetchImpl,
  payload,
  attempts = 3,
  sleep = wait,
  timeoutMs = 10000
) => {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error("IndexNow attempts must be a positive integer")
  }

  let lastStatus = 0
  let lastError = null
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      if (response.ok) return response
      lastStatus = response.status
      if (FAIL_FAST_STATUSES.has(response.status)) {
        throw new Error(`IndexNow returned HTTP ${response.status}`)
      }
    } catch (error) {
      if (FAIL_FAST_STATUSES.has(lastStatus)) throw error
      lastError = error
    } finally {
      clearTimeout(timer)
    }
    if (attempt < attempts - 1) await sleep(500 * 2 ** attempt)
  }
  if (lastError && !lastStatus) {
    throw new Error(
      `IndexNow network failure after ${attempts} attempts: ${lastError.message}`
    )
  }
  throw new Error(
    `IndexNow returned HTTP ${lastStatus} after ${attempts} attempts`
  )
}

const run = async ({
  argv = process.argv.slice(2),
  env = process.env,
  fetchImpl = globalThis.fetch,
  key,
  log = console.log,
  sitemapPath,
} = {}) => {
  const effectiveKey =
    key === undefined
      ? fs
          .readFileSync(
            path.join(__dirname, "..", "static", "indexnow-key.txt"),
            "utf8"
          )
          .trim()
      : key
  const effectiveSitemapPath =
    sitemapPath || env.INDEXNOW_SITEMAP_PATH || DEFAULT_SITEMAP_PATH
  const canonicalPaths = await loadSitemapCanonicalPaths(effectiveSitemapPath)
  const payload = buildIndexNowPayload(argv, effectiveKey, canonicalPaths)
  if (!payload.urlList.length) throw new Error("No valid public URLs supplied")
  if (env.INDEXNOW_DRY_RUN === "1") {
    log(JSON.stringify(payload, null, 2))
    return payload
  }
  await submitIndexNow(fetchImpl, payload)
  log(`IndexNow accepted ${payload.urlList.length} URL(s)`)
  return payload
}

module.exports = {
  buildIndexNowPayload,
  loadSitemapCanonicalPaths,
  normalizePublicPaths,
  parseSitemapCanonicalPaths,
  run,
  submitIndexNow,
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
