const assert = require("assert")
const fs = require("fs")

const reportPath = process.argv[2]
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"))
const audits = report.audits

assert(
  audits["largest-contentful-paint"].numericValue <= 2500,
  "LCP exceeds 2.5s"
)
assert(audits["cumulative-layout-shift"].numericValue <= 0.1, "CLS exceeds 0.1")
assert(audits["total-blocking-time"].numericValue <= 200, "TBT exceeds 200ms")

console.log(`Lighthouse budget ok: ${reportPath}`)
