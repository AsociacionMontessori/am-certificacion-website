const assert = require("assert")
const fs = require("fs")
const path = require("path")
const { transformFileSync } = require("@babel/core")
const { parse } = require("@babel/parser")
const traverse = require("@babel/traverse").default
const { buildSafeParams } = require("../src/utils/analytics")

const root = path.resolve(__dirname, "..")

const sourcePath = relativePath => path.join(root, relativePath)

const loadModule = (relativePath, mocks = {}) => {
  const filename = sourcePath(relativePath)
  const { code } = transformFileSync(filename, {
    babelrc: false,
    configFile: false,
    plugins: [
      "@babel/plugin-transform-react-jsx",
      "@babel/plugin-transform-modules-commonjs",
    ],
  })
  const module = { exports: {} }
  const localRequire = request => mocks[request] || require(request)
  new Function("require", "module", "exports", code)(
    localRequire,
    module,
    module.exports
  )
  return module.exports
}

const parseSource = relativePath =>
  parse(fs.readFileSync(sourcePath(relativePath), "utf8"), {
    sourceType: "module",
    plugins: ["jsx"],
  })

const findNodes = (node, predicate, matches = []) => {
  if (!node || typeof node !== "object") return matches
  if (predicate(node)) matches.push(node)
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) findNodes(item, predicate, matches)
    } else if (value && typeof value === "object" && value.type) {
      findNodes(value, predicate, matches)
    }
  }
  return matches
}

const findHandleSubmitTry = relativePath => {
  const ast = parseSource(relativePath)
  let handleSubmit
  traverse(ast, {
    VariableDeclarator(nodePath) {
      if (
        nodePath.node.id.type === "Identifier" &&
        nodePath.node.id.name === "handleSubmit" &&
        nodePath.node.init?.type === "ArrowFunctionExpression"
      ) {
        handleSubmit = nodePath.node.init
      }
    },
  })
  assert(handleSubmit, `${relativePath} must define handleSubmit`)
  const tryStatement = findNodes(
    handleSubmit.body,
    node => node.type === "TryStatement"
  )[0]
  assert(tryStatement, `${relativePath} handleSubmit must contain a try block`)
  return tryStatement
}

const isCallNamed = (node, name) =>
  (node.type === "CallExpression" || node.type === "OptionalCallExpression") &&
  node.callee?.type === "Identifier" &&
  node.callee.name === name

const findTrackedEvent = (node, eventName) =>
  findNodes(
    node,
    candidate =>
      isCallNamed(candidate, "trackEvent") &&
      candidate.arguments[0]?.type === "StringLiteral" &&
      candidate.arguments[0].value === eventName
  )[0]

const statementIndex = (statements, predicate, message) => {
  const index = statements.findIndex(statement =>
    findNodes(statement, predicate).length > 0
  )
  assert.notStrictEqual(index, -1, message)
  return index
}

const assertSafeObjectPayload = (payload, eventName) => {
  assert(payload?.type === "ObjectExpression", `${eventName} must use an object payload`)
  const expectedKeys = [
    "language",
    "landing_path",
    "cta_position",
    "lead_channel",
  ]
  if (eventName !== "click_whatsapp") expectedKeys.splice(1, 0, "program_id")
  assert.deepStrictEqual(
    payload.properties.map(property => property.key.name || property.key.value),
    expectedKeys,
    `${eventName} must use only its approved payload keys`
  )
  const prohibitedIdentifiers = new Set([
    "form",
    "nombre",
    "email",
    "telefono",
    "ordenId",
    "accessToken",
    "url",
    "checkoutUrl",
    "stripeTab",
  ])
  const leaked = findNodes(
    payload,
    node => node.type === "Identifier" && prohibitedIdentifiers.has(node.name)
  ).map(node => node.name)
  assert.deepStrictEqual(leaked, [], `${eventName} payload must not include personal or payment data`)
}

const assertSafePayload = (call, eventName) => {
  assert(call, `${eventName} must be tracked`)
  assertSafeObjectPayload(call.arguments[1], eventName)
}

const assertTrackedActionLinkPayload = relativePath => {
  const ast = parseSource(relativePath)
  const trackedLinks = []
  traverse(ast, {
    JSXOpeningElement(nodePath) {
      if (nodePath.node.name.type !== "JSXIdentifier" || nodePath.node.name.name !== "TrackedActionLink") {
        return
      }
      const attributes = nodePath.node.attributes
      const eventName = attributes.find(
        attribute => attribute.type === "JSXAttribute" && attribute.name.name === "eventName"
      )
      const eventParams = attributes.find(
        attribute => attribute.type === "JSXAttribute" && attribute.name.name === "eventParams"
      )
      assert.strictEqual(eventName?.value?.value, "click_whatsapp")
      assertSafeObjectPayload(eventParams?.value?.expression, "click_whatsapp")
      trackedLinks.push(nodePath.node)
    },
  })
  assert.strictEqual(trackedLinks.length, 1, `${relativePath} must have one tracked WhatsApp link`)
}

const trackedActionLinkPath = sourcePath("src/components/TrackedActionLink.js")
assert.ok(
  fs.existsSync(trackedActionLinkPath),
  "TrackedActionLink must exist before its click contract can run"
)

{
  const events = []
  let callerClicks = 0
  const TrackedActionLink = loadModule("src/components/TrackedActionLink.js", {
    react: {
      createElement: (type, props, ...children) => ({
        type,
        props: { ...props, children },
      }),
    },
    "../utils/analytics": {
      trackEvent: (...args) => events.push(args),
    },
  }).default
  const eventParams = {
    language: "en",
    landing_path: "/en/contact/",
    cta_position: "contact_whatsapp",
    lead_channel: "whatsapp",
  }
  const link = TrackedActionLink({
    eventName: "click_whatsapp",
    eventParams,
    href: "https://api.whatsapp.com/send",
    onClick: event => {
      callerClicks += 1
      assert.strictEqual(event.type, "click")
    },
    children: "WhatsApp",
  })
  link.props.onClick({ type: "click" })
  assert.deepStrictEqual(events, [["click_whatsapp", eventParams]])
  assert.strictEqual(callerClicks, 1)
}

{
  const { NIVELES_ESPECIALIZACION, getAnalyticsProgramIdByNivelLabel } = loadModule(
    "src/data/inscripcionForm.js",
    { "./programasOferta": { mapProgramaCheckoutANivel: () => "" } }
  )
  for (const programId of ["nido", "casa", "taller", "cosmica", "neuro"]) {
    const nivel = NIVELES_ESPECIALIZACION.find(
      item => item.reglamentoKey === programId
    )
    assert.strictEqual(getAnalyticsProgramIdByNivelLabel(nivel.label), programId)
  }
  for (const reglamentoKey of ["filosofia", "otro"]) {
    const nivel = NIVELES_ESPECIALIZACION.find(
      item => item.reglamentoKey === reglamentoKey
    )
    assert.strictEqual(getAnalyticsProgramIdByNivelLabel(nivel.label), "unknown")
  }
  for (const label of ["", "Nivel que no existe"]) {
    assert.strictEqual(getAnalyticsProgramIdByNivelLabel(label), "unknown")
  }
}

for (const landingPath of ["/contact/", "/en/contact/", "/pt-br/contact/"]) {
  assert.deepStrictEqual(buildSafeParams({ landing_path: landingPath }), {
    landing_path: landingPath,
  })
}

{
  const contactSource = fs.readFileSync(sourcePath("src/pages/contact.js"), "utf8")
  assert.match(contactSource, /methodKey=\{method\.key\}/)
  assert.match(contactSource, /methodKey === "whatsapp"/)
  assert.match(
    contactSource,
    /landing_path:\s*typeof window === "undefined" \? "" : window\.location\.pathname/
  )
  assert.doesNotMatch(contactSource, /landing_path:\s*["']\/contact\//)
}

for (const relativePath of [
  "src/components/layout.js",
  "src/components/footer.js",
  "src/pages/contact.js",
]) {
  assertTrackedActionLinkPayload(relativePath)
}

{
  const tryStatement = findHandleSubmitTry(
    "src/components/inscripcion/InscripcionParte1Form.js"
  )
  const statements = tryStatement.block.body
  const submitIndex = statementIndex(
    statements,
    node =>
      node.type === "AwaitExpression" &&
      isCallNamed(node.argument, "submitInscripcionParte1"),
    "generate_lead must wait for submitInscripcionParte1"
  )
  const leadIndex = statementIndex(
    statements,
    node => Boolean(findTrackedEvent(node, "generate_lead")),
    "generate_lead must be inside the successful try path"
  )
  const successIndex = statementIndex(
    statements,
    node => findNodes(node, candidate => isCallNamed(candidate, "onSuccess")).length > 0,
    "generate_lead must be followed by onSuccess"
  )
  assert(submitIndex < leadIndex, "generate_lead must follow API acceptance")
  assert(leadIndex < successIndex, "generate_lead must precede onSuccess")
  assertSafePayload(findTrackedEvent(tryStatement.block, "generate_lead"), "generate_lead")
  assert.strictEqual(findTrackedEvent(tryStatement.handler, "generate_lead"), undefined)
}

for (const relativePath of [
  "src/components/checkout/InscriptionCheckoutForm.js",
  "src/components/checkout/ApartarInscripcionForm.js",
]) {
  const tryStatement = findHandleSubmitTry(relativePath)
  const statements = tryStatement.block.body
  const checkoutIndex = statementIndex(
    statements,
    node =>
      node.type === "AwaitExpression" &&
      isCallNamed(node.argument, "createPublicCheckoutSession"),
    `${relativePath} must wait for createPublicCheckoutSession`
  )
  const eventIndex = statementIndex(
    statements,
    node => Boolean(findTrackedEvent(node, "begin_checkout")),
    `${relativePath} must track begin_checkout in the successful path`
  )
  const navigationIndex = statementIndex(
    statements,
    node =>
      node.type === "AssignmentExpression" &&
      node.left?.type === "MemberExpression" &&
      ["location", "href"].includes(node.left.property?.name),
    `${relativePath} must navigate after checkout succeeds`
  )
  assert(checkoutIndex < eventIndex, `${relativePath} must track after Stripe returns a URL`)
  assert(eventIndex < navigationIndex, `${relativePath} must track before navigation`)
  assertSafePayload(findTrackedEvent(tryStatement.block, "begin_checkout"), "begin_checkout")
  assert.strictEqual(findTrackedEvent(tryStatement.handler, "begin_checkout"), undefined)
}

const successSource = fs.readFileSync(sourcePath("src/pages/checkout/success.js"), "utf8")
assert.doesNotMatch(successSource, /trackEvent\(\s*["']purchase["']/)

console.log("analytics instrumentation contract ok")
