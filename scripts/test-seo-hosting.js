const assert = require("assert")
const fs = require("fs")
const path = require("path")

const root = path.resolve(__dirname, "..")
const robots = fs.readFileSync(path.join(root, "static", "robots.txt"), "utf8")
const parseRobotsGroups = contents => {
  const groups = []
  let agents = []
  let rules = []
  const commitGroup = () => {
    if (agents.length) groups.push([...agents, ...rules])
    agents = []
    rules = []
  }

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.replace(/\s*#.*$/, "").trim()
    if (!line) continue
    if (/^user-agent:/i.test(line)) {
      if (rules.length) commitGroup()
      agents.push(line)
    } else if (agents.length) {
      rules.push(line)
    }
  }
  commitGroup()
  return groups
}
const groups = parseRobotsGroups(robots)

for (const agent of [
  "*",
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot",
  "meta-externalagent",
  "Amazonbot",
  "CCBot",
]) {
  const group = groups.find(lines =>
    lines.some(line => line.toLowerCase() === `user-agent: ${agent.toLowerCase()}`)
  )
  assert(group, `robots.txt must declare ${agent}`)
  assert(group.includes("Allow: /"), `${agent} must allow public crawling`)
  assert(
    group.includes("Disallow: /alumnos-app/"),
    `${agent} must not crawl the private student app`
  )
  assert(
    group.includes("Disallow: /404.html"),
    `${agent} must not crawl the generated 404 document`
  )
}

const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(root, "firebase.json"), "utf8")
)
assert(
  !firebaseConfig.hosting.rewrites?.length,
  "Firebase Hosting must serve Gatsby's 404.html instead of rewriting unknown paths to the homepage"
)

const contactSource = fs.readFileSync(
  path.join(root, "src", "pages", "contact.js"),
  "utf8"
)
for (const forbidden of [
  "react-facebook",
  "FacebookProvider",
  "w.behold.so",
  "data-behold-id",
]) {
  assert(
    !contactSource.includes(forbidden),
    `Contact page must not eagerly load ${forbidden}`
  )
}
for (const expectedLink of [
  "https://www.facebook.com/asociacionmontessori/",
  "https://www.instagram.com/asociacionmontessori/",
]) {
  assert(
    contactSource.includes(expectedLink),
    `Contact page must retain a privacy-safe outbound link to ${expectedLink}`
  )
}

const socialSectionSource = contactSource.match(
  /<section className="bg-white">[\s\S]*?<\/section>/
)?.[0]
assert(socialSectionSource, "Contact page must include the social profile section")
assert.doesNotMatch(
  socialSectionSource,
  /(?:text|border|bg|ring)-(?:blue|gray)-\d+/,
  "Contact social section must use colors that exist in the custom Tailwind palette"
)
for (const expectedClass of ["text-gray", "text-gray/80", "text-blue", "border-blue"]) {
  assert(
    socialSectionSource.includes(expectedClass),
    `Contact social section must include ${expectedClass}`
  )
}

const navSource = fs.readFileSync(
  path.join(root, "src", "components", "nav.js"),
  "utf8"
)
const mobileMenuClasses = navSource.match(
  /<Disclosure\.Button className="([^"]+)"/
)?.[1]
assert(mobileMenuClasses, "Navigation must include the mobile menu button")
assert.match(
  mobileMenuClasses,
  /(?:^|\s)text-gray(?:\s|$)/,
  "Mobile menu icon must contrast with its white button background"
)
assert.match(
  mobileMenuClasses,
  /(?:^|\s)hover:bg-gray(?:\s|$)/,
  "Mobile menu hover color must exist in the custom Tailwind palette"
)

for (const locale of ["es", "en", "pt-br"]) {
  const contact = require(`../src/i18n/locales/${locale}/contact.json`)
  assert(contact.social?.title, `${locale} contact social title`)
  assert(contact.social?.description, `${locale} contact social description`)
  assert(contact.social?.facebook, `${locale} contact Facebook label`)
  assert(contact.social?.instagram, `${locale} contact Instagram label`)
}

const packageJson = require("../package.json")
assert.deepStrictEqual(
  {
    legacy: packageJson.overrides?.["path-to-regexp"],
    superstatic: packageJson.overrides?.superstatic?.["path-to-regexp"],
    router: packageJson.overrides?.router?.["path-to-regexp"],
  },
  {
    legacy: "$path-to-regexp",
    superstatic: "1.9.0",
    router: "8.4.2",
  },
  "legacy security override must preserve the incompatible Superstatic and Router APIs"
)

const resolvedDependencyVersion = packageName => {
  const packageDirectory = path.dirname(require.resolve(`${packageName}/package.json`))
  const dependencyEntry = require.resolve("path-to-regexp", {
    paths: [packageDirectory],
  })
  let directory = path.dirname(dependencyEntry)
  while (directory !== path.dirname(directory)) {
    const manifestPath = path.join(directory, "package.json")
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
      if (manifest.name === "path-to-regexp") return manifest.version
    }
    directory = path.dirname(directory)
  }
  throw new Error(`Unable to resolve path-to-regexp for ${packageName}`)
}

assert.match(resolvedDependencyVersion("gatsby"), /^0\.1\.13$/)
assert.match(resolvedDependencyVersion("express"), /^0\.1\.13$/)
assert.match(resolvedDependencyVersion("superstatic"), /^1\./)
assert.match(resolvedDependencyVersion("router"), /^8\./)

console.log("SEO hosting and privacy contract ok")
