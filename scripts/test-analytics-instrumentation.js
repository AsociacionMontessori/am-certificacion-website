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

const findTrackedEvents = (node, eventName) =>
  findNodes(
    node,
    candidate =>
      isCallNamed(candidate, "trackEvent") &&
      candidate.arguments[0]?.type === "StringLiteral" &&
      candidate.arguments[0].value === eventName
  )

const findTrackedEvent = (node, eventName) => findTrackedEvents(node, eventName)[0]

const assertSingleTrackedEvent = (node, eventName, message) => {
  const calls = findTrackedEvents(node, eventName)
  assert.strictEqual(calls.length, 1, message)
  return calls[0]
}

const assertLocalizationLanguageBinding = (languagePath, sourceName) => {
  assertIdentifier(
    languagePath.node,
    "language",
    `${sourceName} language must be an identifier`
  )
  const binding = languagePath.scope.getBinding("language")
  assert(binding, `${sourceName} language must resolve to a lexical binding`)

  const { id, init } = binding.path.node
  assert.strictEqual(
    binding.path.node.type,
    "VariableDeclarator",
    `${sourceName} language must be declared by useLocalization`
  )
  assert.strictEqual(
    id?.type,
    "ObjectPattern",
    `${sourceName} language must be destructured from useLocalization`
  )
  assert.strictEqual(
    init?.type,
    "CallExpression",
    `${sourceName} language must be initialized by useLocalization()`
  )
  assertIdentifier(
    init?.callee,
    "useLocalization",
    `${sourceName} language must be initialized by useLocalization()`
  )
  assert.strictEqual(
    init.arguments.length,
    0,
    `${sourceName} language must use zero-argument useLocalization()`
  )

  const languageProperty = id.properties.find(
    property =>
      property.type === "ObjectProperty" &&
      property.key.type === "Identifier" &&
      property.key.name === "language" &&
      property.value.type === "Identifier" &&
      property.value.name === "language"
  )
  assert(languageProperty, `${sourceName} language must destructure the language property`)
  assert.strictEqual(
    binding.identifier,
    languageProperty.value,
    `${sourceName} language payload must use the destructured localization binding`
  )

  let componentPath
  for (let ancestor = languagePath.parentPath; ancestor; ancestor = ancestor.parentPath) {
    if (ancestor.isFunction()) componentPath = ancestor
  }
  const bindingComponentPath = binding.path.findParent(path => path.isFunction())
  assert.strictEqual(
    bindingComponentPath?.node,
    componentPath?.node,
    `${sourceName} language must bind in the component scope`
  )
}

const statementIndex = (statements, predicate, message) => {
  const index = statements.findIndex(statement =>
    findNodes(statement, predicate).length > 0
  )
  assert.notStrictEqual(index, -1, message)
  return index
}

const getPayloadProperty = (payload, key, eventName) => {
  const property = payload.properties.find(
    candidate => (candidate.key.name || candidate.key.value) === key
  )
  assert(property, `${eventName} must include ${key}`)
  return property.value
}

const getPayloadPropertyPath = (payloadPath, key, eventName) => {
  const propertyPath = payloadPath.get("properties").find(
    candidate => (candidate.node.key.name || candidate.node.key.value) === key
  )
  assert(propertyPath, `${eventName} must include ${key}`)
  return propertyPath.get("value")
}

const assertPayloadLanguageBinding = (payloadPath, sourceName) =>
  assertLocalizationLanguageBinding(
    getPayloadPropertyPath(payloadPath, "language", sourceName),
    sourceName
  )

const assertIdentifier = (node, identifier, message) => {
  assert.strictEqual(node?.type, "Identifier", message)
  assert.strictEqual(node.name, identifier, message)
}

const assertStringLiteral = (node, value, message) => {
  assert.strictEqual(node?.type, "StringLiteral", message)
  assert.strictEqual(node.value, value, message)
}

const assertBrowserLandingPath = (node, eventName) => {
  assert.strictEqual(
    node?.type,
    "ConditionalExpression",
    `${eventName} landing_path must branch for SSR`
  )
  const test = node.test
  assert.strictEqual(test?.type, "BinaryExpression", `${eventName} landing_path must test window`)
  assert.strictEqual(test.operator, "===", `${eventName} landing_path must test window exactly`)
  assert.strictEqual(test.left?.type, "UnaryExpression", `${eventName} landing_path must use typeof window`)
  assert.strictEqual(test.left.operator, "typeof", `${eventName} landing_path must use typeof window`)
  assertIdentifier(test.left.argument, "window", `${eventName} landing_path must use window`)
  assertStringLiteral(test.right, "undefined", `${eventName} landing_path must test undefined`)
  assertStringLiteral(node.consequent, "", `${eventName} landing_path must be empty during SSR`)
  assert.strictEqual(
    node.alternate?.type,
    "MemberExpression",
    `${eventName} landing_path must read window.location.pathname in the browser`
  )
  assert.strictEqual(node.alternate.computed, false, `${eventName} landing_path must use pathname directly`)
  assertIdentifier(node.alternate.property, "pathname", `${eventName} landing_path must read pathname`)
  assert.strictEqual(
    node.alternate.object?.type,
    "MemberExpression",
    `${eventName} landing_path must read window.location`
  )
  assert.strictEqual(node.alternate.object.computed, false, `${eventName} landing_path must use location directly`)
  assertIdentifier(node.alternate.object.object, "window", `${eventName} landing_path must use window.location`)
  assertIdentifier(node.alternate.object.property, "location", `${eventName} landing_path must use window.location`)
}

const assertLeadProgramId = node => {
  assert.strictEqual(node?.type, "CallExpression", "generate_lead program_id must use the closed level mapping")
  assertIdentifier(
    node.callee,
    "getAnalyticsProgramIdByNivelLabel",
    "generate_lead program_id must use the closed level mapping"
  )
  assert.strictEqual(node.arguments.length, 1, "generate_lead program_id must map one level label")
  assertIdentifier(
    node.arguments[0],
    "nivelElegido",
    "generate_lead program_id must map nivelElegido"
  )
}

const assertFullCheckoutProgramId = node => {
  assert.strictEqual(
    node?.type,
    "LogicalExpression",
    "full checkout program_id must use the catalog lookup with its fallback"
  )
  assert.strictEqual(node.operator, "||", "full checkout program_id must retain its fallback")
  assertStringLiteral(node.right, "inscripcion", "full checkout fallback must be inscripcion")
  assert.strictEqual(
    node.left?.type,
    "OptionalMemberExpression",
    "full checkout program_id must read the optional catalog result"
  )
  assert.strictEqual(node.left.computed, false, "full checkout program_id must read id directly")
  assert.strictEqual(node.left.optional, true, "full checkout program_id must use optional catalog access")
  assertIdentifier(node.left.property, "id", "full checkout program_id must read catalog id")
  assert.strictEqual(node.left.object?.type, "CallExpression", "full checkout program_id must call the catalog lookup")
  assertIdentifier(
    node.left.object.callee,
    "getProgramaByCheckoutLabel",
    "full checkout program_id must call the catalog lookup"
  )
  assert.strictEqual(node.left.object.arguments.length, 1, "full checkout catalog lookup must use one label")
  assertIdentifier(node.left.object.arguments[0], "programa", "full checkout catalog lookup must use programa")
}

const assertExactObjectPayload = (
  payload,
  { eventName, ctaPosition, leadChannel, assertProgramId }
) => {
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
  assertIdentifier(
    getPayloadProperty(payload, "language", eventName),
    "language",
    `${eventName} language must use the closed localization language`
  )
  assertBrowserLandingPath(getPayloadProperty(payload, "landing_path", eventName), eventName)
  assertStringLiteral(
    getPayloadProperty(payload, "cta_position", eventName),
    ctaPosition,
    `${eventName} cta_position must be ${ctaPosition}`
  )
  assertStringLiteral(
    getPayloadProperty(payload, "lead_channel", eventName),
    leadChannel,
    `${eventName} lead_channel must be ${leadChannel}`
  )
  if (assertProgramId) {
    assertProgramId(getPayloadProperty(payload, "program_id", eventName))
  }
}

const assertExactPayload = (call, options) => {
  const { eventName } = options
  assert(call, `${eventName} must be tracked`)
  assertExactObjectPayload(call.arguments[1], options)
}

const assertTrackedActionLinkPayload = (relativePath, ctaPosition) => {
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
      assertExactObjectPayload(eventParams?.value?.expression, {
        eventName: "click_whatsapp",
        ctaPosition,
        leadChannel: "whatsapp",
      })
      const eventParamsPath = nodePath.get("attributes").find(
        attributePath =>
          attributePath.node.type === "JSXAttribute" &&
          attributePath.node.name.name === "eventParams"
      )
      assertPayloadLanguageBinding(
        eventParamsPath.get("value").get("expression"),
        `${relativePath} click_whatsapp`
      )
      trackedLinks.push(nodePath.node)
    },
  })
  assert.strictEqual(trackedLinks.length, 1, `${relativePath} must have one tracked WhatsApp link`)
}

const assertTrackedEventLanguageBinding = (relativePath, eventName) => {
  const ast = parseSource(relativePath)
  let eventCount = 0
  traverse(ast, {
    CallExpression(nodePath) {
      if (
        !isCallNamed(nodePath.node, "trackEvent") ||
        nodePath.node.arguments[0]?.type !== "StringLiteral" ||
        nodePath.node.arguments[0].value !== eventName
      ) {
        return
      }
      assertPayloadLanguageBinding(
        nodePath.get("arguments")[1],
        `${relativePath} ${eventName}`
      )
      eventCount += 1
    },
  })
  assert.strictEqual(eventCount, 1, `${relativePath} must have one ${eventName} language payload`)
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

for (const [relativePath, ctaPosition] of [
  ["src/components/layout.js", "floating_widget"],
  ["src/components/footer.js", "footer"],
  ["src/pages/contact.js", "contact_whatsapp"],
]) {
  assertTrackedActionLinkPayload(relativePath, ctaPosition)
}

{
  const relativePath = "src/components/inscripcion/InscripcionParte1Form.js"
  assertTrackedEventLanguageBinding(relativePath, "generate_lead")
  const tryStatement = findHandleSubmitTry(
    relativePath
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
  assertExactPayload(assertSingleTrackedEvent(
    tryStatement.block,
    "generate_lead",
    "generate_lead must have exactly one successful call site"
  ), {
    eventName: "generate_lead",
    ctaPosition: "inscripcion_part_1",
    leadChannel: "form",
    assertProgramId: assertLeadProgramId,
  })
  assert.strictEqual(findTrackedEvent(tryStatement.handler, "generate_lead"), undefined)
}

for (const { relativePath, ctaPosition, assertProgramId } of [
  {
    relativePath: "src/components/checkout/InscriptionCheckoutForm.js",
    ctaPosition: "checkout_form",
    assertProgramId: assertFullCheckoutProgramId,
  },
  {
    relativePath: "src/components/checkout/ApartarInscripcionForm.js",
    ctaPosition: "enrollment_reservation_form",
    assertProgramId: node => assertStringLiteral(node, "inscripcion", "reservation checkout program_id must be inscripcion"),
  },
]) {
  assertTrackedEventLanguageBinding(relativePath, "begin_checkout")
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
  assertExactPayload(assertSingleTrackedEvent(
    tryStatement.block,
    "begin_checkout",
    `${relativePath} must have exactly one successful begin_checkout call site`
  ), {
    eventName: "begin_checkout",
    ctaPosition,
    leadChannel: "stripe",
    assertProgramId,
  })
  assert.strictEqual(findTrackedEvent(tryStatement.handler, "begin_checkout"), undefined)
}

const getSyntheticEventPayload = source => {
  const event = findTrackedEvent(
    parse(source, { sourceType: "module" }),
    "generate_lead"
  )
  return event.arguments[1]
}

const getSyntheticEventLanguagePath = source => {
  const ast = parse(source, { sourceType: "module" })
  let languagePath
  traverse(ast, {
    CallExpression(nodePath) {
      if (!isCallNamed(nodePath.node, "trackEvent") || nodePath.node.arguments[0]?.value !== "generate_lead") {
        return
      }
      const payloadPath = nodePath.get("arguments")[1]
      const languagePropertyPath = payloadPath.get("properties").find(
        propertyPath => (propertyPath.node.key.name || propertyPath.node.key.value) === "language"
      )
      languagePath = languagePropertyPath.get("value")
    },
  })
  assert(languagePath, "synthetic generate_lead event must include language")
  return languagePath
}

{
  const languagePath = getSyntheticEventLanguagePath(`
    function EnrollmentForm(form) {
      const { language } = useLocalization()
      function submit() {
        const language = form.emailContacto
        trackEvent("generate_lead", {
          language,
          program_id: getAnalyticsProgramIdByNivelLabel(nivelElegido),
          landing_path: typeof window === "undefined" ? "" : window.location.pathname,
          cta_position: "inscripcion_part_1",
          lead_channel: "form",
        })
      }
    }
  `)
  assert.throws(
    () => assertLocalizationLanguageBinding(languagePath, "synthetic shadowed language"),
    /synthetic shadowed language/,
    "language payloads must reject a user-derived shadowing binding"
  )
}

for (const unsafeProgramId of ["userValue", "message", "nombreCompleto", "emailContacto"]) {
  assert.throws(
    () =>
      assertExactObjectPayload(
        getSyntheticEventPayload(`trackEvent("generate_lead", {
          language,
          program_id: ${unsafeProgramId},
          landing_path: typeof window === "undefined" ? "" : window.location.pathname,
          cta_position: "inscripcion_part_1",
          lead_channel: "form",
        })`),
        {
          eventName: "generate_lead",
          ctaPosition: "inscripcion_part_1",
          leadChannel: "form",
          assertProgramId: assertLeadProgramId,
        }
      ),
    /generate_lead program_id/,
    `generate_lead must reject ${unsafeProgramId} as a program_id source`
  )
}

const runStripeCheckoutUrlTests = async () => {
  const { createPublicCheckoutSession } = loadModule("src/utils/stripeCheckout.js")
  const originalFetch = global.fetch
  const responseFor = url => ({
    ok: true,
    json: async () => ({ url }),
  })

  try {
    const validUrl = "https://checkout.stripe.com/c/pay/cs_test_123"
    global.fetch = async () => responseFor(validUrl)
    assert.deepStrictEqual(await createPublicCheckoutSession({ sku: "test" }), {
      url: validUrl,
    })

    for (const [label, url] of [
      ["absent", undefined],
      ["non-string", 42],
      ["relative", "/c/pay/cs_test_123"],
      ["malformed", "https://"],
      ["HTTP", "http://checkout.stripe.com/c/pay/cs_test_123"],
      ["credentials", "https://user:secret@checkout.stripe.com/c/pay/cs_test_123"],
      ["suffix host", "https://checkout.stripe.com.attacker.test/c/pay/cs_test_123"],
      ["other host", "https://example.test/c/pay/cs_test_123"],
      ["non-standard port", "https://checkout.stripe.com:444/c/pay/cs_test_123"],
    ]) {
      global.fetch = async () => responseFor(url)
      await assert.rejects(
        () => createPublicCheckoutSession({ sku: "test" }),
        /Respuesta de pago incompleta/,
        `createPublicCheckoutSession must reject a ${label} checkout URL`
      )
    }
  } finally {
    global.fetch = originalFetch
  }
}

const successSource = fs.readFileSync(sourcePath("src/pages/checkout/success.js"), "utf8")
assert.doesNotMatch(successSource, /trackEvent\(\s*["']purchase["']/)

runStripeCheckoutUrlTests()
  .then(() => console.log("analytics instrumentation contract ok"))
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
