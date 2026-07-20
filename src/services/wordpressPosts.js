const sanitizeHtml = require("sanitize-html")
const he = require("he")
const { sha256 } = require("@noble/hashes/sha256")
const { bytesToHex, utf8ToBytes } = require("@noble/hashes/utils")

const WORDPRESS_ORIGIN = "https://montessorimexico.org"
const WORDPRESS_POSTS_ENDPOINT = `${WORDPRESS_ORIGIN}/wp-json/wp/v2/posts`

const buildSourceContentId = slug =>
  `post_${bytesToHex(sha256(utf8ToBytes(slug))).slice(0, 16)}`

const plainText = value =>
  he
    .decode(
      sanitizeHtml(String(value || ""), {
        allowedTags: [],
        allowedAttributes: {},
      })
    )
    .replace(/\s+/g, " ")
    .trim()

const validWordPressUrl = value => {
  try {
    const url = new URL(value)
    return url.protocol === "https:" &&
      url.hostname === "montessorimexico.org" &&
      !url.username &&
      !url.password &&
      !url.port
      ? url.toString()
      : ""
  } catch {
    return ""
  }
}

const positiveInteger = value => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const isoDate = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString()
}

const normalizeImageCandidate = value => {
  const url = validWordPressUrl(value?.source_url)
  const width = positiveInteger(value?.width)
  const height = positiveInteger(value?.height)
  return url && width ? { url, width, height } : null
}

const responsiveImageData = media => {
  const imageUrl = validWordPressUrl(media?.source_url)
  if (!imageUrl) return { imageUrl: "", imageCardUrl: "", imageSrcSet: "" }

  const sizes = media?.media_details?.sizes || {}
  const full = normalizeImageCandidate({
    source_url: imageUrl,
    width: media?.media_details?.width,
    height: media?.media_details?.height,
  })
  const reference =
    full ||
    normalizeImageCandidate(sizes.medium_large) ||
    normalizeImageCandidate(sizes.large) ||
    normalizeImageCandidate(sizes.medium)
  const referenceRatio =
    reference?.width && reference?.height
      ? reference.width / reference.height
      : null
  const candidates = [
    ...Object.values(sizes).map(normalizeImageCandidate),
    full,
  ]
    .filter(Boolean)
    .filter(candidate => {
      if (!referenceRatio) return true
      if (!candidate.height) return false
      const ratioDifference = Math.abs(
        candidate.width / candidate.height - referenceRatio
      )
      return ratioDifference / referenceRatio <= 0.03
    })
    .sort((left, right) => left.width - right.width)
    .filter(
      (candidate, index, rows) =>
        rows.findIndex(row => row.width === candidate.width) === index
    )
  const preferred =
    candidates.find(candidate => candidate.width >= 640) ||
    candidates[candidates.length - 1] ||
    full

  return {
    imageUrl,
    imageCardUrl: preferred?.url || imageUrl,
    imageSrcSet: candidates
      .map(candidate => `${candidate.url} ${candidate.width}w`)
      .join(", "),
  }
}

const normalizeWordPressPost = raw => {
  const url = validWordPressUrl(raw?.link)
  const title = plainText(raw?.title?.rendered)
  const id = String(raw?.id || "").trim()
  const slug = String(raw?.slug || "").trim()
  const date = isoDate(raw?.date)
  if (!url || !title || !id || !slug || !date) return null

  const author = Array.isArray(raw?._embedded?.author)
    ? plainText(raw._embedded.author[0]?.name)
    : ""
  const media = Array.isArray(raw?._embedded?.["wp:featuredmedia"])
    ? raw._embedded["wp:featuredmedia"][0]
    : null
  const { imageUrl, imageCardUrl, imageSrcSet } = responsiveImageData(media)

  return {
    id,
    slug,
    sourceContentId: buildSourceContentId(slug),
    url,
    title,
    excerpt: plainText(raw?.excerpt?.rendered),
    date,
    modified: isoDate(raw.modified) || date,
    author: author || "Asociación Montessori de México",
    imageUrl,
    imageCardUrl,
    imageSrcSet,
    imageAlt: plainText(media?.alt_text) || title,
    imageWidth: positiveInteger(media?.media_details?.width),
    imageHeight: positiveInteger(media?.media_details?.height),
  }
}

const normalizeWordPressPosts = rows =>
  (Array.isArray(rows) ? rows : [])
    .map(normalizeWordPressPost)
    .filter(Boolean)

const fetchRecentWordPressPosts = async ({
  fetchImpl = fetch,
  limit = 12,
  timeoutMs = 8000,
} = {}) => {
  const count = Math.max(1, Math.min(Number(limit) || 12, 12))
  const url = new URL(WORDPRESS_POSTS_ENDPOINT)
  url.searchParams.set("status", "publish")
  url.searchParams.set("orderby", "date")
  url.searchParams.set("order", "desc")
  url.searchParams.set("per_page", String(count))
  url.searchParams.set("_embed", "author,wp:featuredmedia")
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`WordPress returned HTTP ${response.status}`)
    }
    return normalizeWordPressPosts(await response.json()).slice(0, count)
  } finally {
    clearTimeout(timer)
  }
}

module.exports = {
  WORDPRESS_ORIGIN,
  WORDPRESS_POSTS_ENDPOINT,
  fetchRecentWordPressPosts,
  normalizeWordPressPost,
  normalizeWordPressPosts,
  plainText,
}
