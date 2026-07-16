const wordpressPostsSnapshot = require("../data/wordpressPostsSnapshot.json")
const { fetchRecentWordPressPosts } = require("./wordpressPosts")

const loadWordPressPosts = async ({
  fetchImpl = fetch,
  snapshot = wordpressPostsSnapshot,
  reporter,
} = {}) => {
  try {
    const posts = await fetchRecentWordPressPosts({ fetchImpl, limit: 12 })
    if (!posts.length) throw new Error("no valid posts")
    reporter?.info(`Using ${posts.length} live WordPress posts`)
    return { posts, source: "live" }
  } catch (error) {
    if (!Array.isArray(snapshot) || !snapshot.length) throw error
    reporter?.warn(
      `WordPress unavailable; using ${snapshot.length} snapshot posts`
    )
    return { posts: snapshot, source: "snapshot" }
  }
}

module.exports = { loadWordPressPosts }
