const fs = require("fs")
const path = require("path")
const {
  fetchRecentWordPressPosts,
} = require("../src/services/wordpressPosts")

const run = async () => {
  const posts = await fetchRecentWordPressPosts({ limit: 12 })
  if (!posts.length) {
    throw new Error("WordPress returned no valid published posts")
  }
  const output = path.join(
    __dirname,
    "..",
    "src",
    "data",
    "wordpressPostsSnapshot.json"
  )
  fs.writeFileSync(output, `${JSON.stringify(posts, null, 2)}\n`, "utf8")
  console.log(`Saved ${posts.length} posts to ${output}`)
}

run().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
