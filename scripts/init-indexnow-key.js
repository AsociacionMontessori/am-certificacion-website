const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const keyPath = path.join(__dirname, "..", "static", "indexnow-key.txt")
if (fs.existsSync(keyPath)) {
  console.log("IndexNow key already exists")
  process.exit(0)
}

const key = crypto.randomBytes(16).toString("hex")
fs.writeFileSync(keyPath, `${key}\n`, { encoding: "utf8", mode: 0o644 })
console.log("Created static/indexnow-key.txt")
