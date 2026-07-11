const assert = require("assert")
const {
  buildSafeParams,
  getAttribution,
  INTENT_LANDING_PATHS,
  registerAnalyticsNavigation,
  trackAttributedArrival,
  trackEvent,
  trackPageView,
} = require("../src/utils/analytics")
const {
  LANGUAGE_CODES,
  LOCALIZED_PATHS,
  localizePath,
} = require("../src/i18n/config")
const {
  initializeAnalyticsConsent,
  setAnalyticsConsent,
} = require("../src/utils/analyticsConsent")

const VALID_SOURCE_CONTENT_IDS = [
  "post_d95119f319861cea",
  "post_0123456789abcdef",
]
const opaqueId = suffix => `post_${suffix.toString(16).padStart(16, "0")}`

const attributionSearch = (
  content = VALID_SOURCE_CONTENT_IDS[0],
  term = "casa"
) =>
  `?utm_source=montessorimexico.org&utm_medium=referral&utm_campaign=guia_montessori&utm_content=${content}&utm_term=${term}`

const createStorage = () => ({
  values: new Map(),
  getItem(key) {
    return this.values.get(key) || null
  },
  setItem(key, value) {
    this.values.set(key, value)
  },
})

const createTarget = (overrides = {}) => {
  const calls = []
  const consentValues = new Map([["ammac-analytics-consent-v1", "granted"]])
  const result = {
    calls,
    consentValues,
    target: {
      gtag: (...args) => calls.push(args),
      localStorage: {
        getItem: key => consentValues.get(key) || null,
        setItem: (key, value) => consentValues.set(key, value),
      },
      sessionStorage: createStorage(),
      location: { pathname: "/contact/" },
      document: {
        referrer: "https://montessorimexico.org/articulo-editorial/",
      },
      ...overrides,
    },
  }
  if (!("gtag" in overrides) && !("localStorage" in overrides)) {
    initializeAnalyticsConsent(result.target)
    calls.length = 0
  }
  return result
}

{
  const { calls, target } = createTarget({
    location: {
      origin: "https://attacker.example",
      pathname: "/diplomados/casa-de-ninos/",
      search: "?email=persona@example.com&order=cs_secret",
      hash: "#access-token",
    },
    document: { referrer: "https://www.google.com.mx/" },
  })
  assert.strictEqual(
    trackEvent(
      "click_whatsapp",
      {
        language: "es",
        page_path: "/privacy/",
        page_location: "https://attacker.example/persona@example.com",
        page_referrer: "https://attacker.example/order/cs_secret",
      },
      target
    ),
    true
  )
  assert.deepStrictEqual(calls[0][2], {
    language: "es",
    page_path: "/diplomados/casa-de-ninos/",
    page_location:
      "https://certificacionmontessori.com/diplomados/casa-de-ninos/",
    page_referrer: "https://www.google.com.mx/",
  })
}

{
  const { calls, target } = createTarget({
    location: { pathname: "/checkout/success/order-cs_secret/" },
    document: { referrer: "https://www.google.com.mx/search?q=montessori" },
  })
  assert.strictEqual(trackEvent("click_whatsapp", {}, target), true)
  assert.deepStrictEqual(calls[0][2], {
    page_path: "/",
    page_location: "https://certificacionmontessori.com/",
    page_referrer: "https://www.google.com.mx/",
  })
}

for (const referrer of [
  "https://certificacionmontessori.com/",
  "https://montessorimexico.org/",
  "https://www.montessorimexico.org/",
  "https://google.com/",
  "https://www.google.com.mx/",
  "https://www.google.es/",
  "https://www.google.co.uk/",
  "https://www.google.com.br/",
  "https://www.google.pt/",
  "https://www.bing.com/",
  "https://chatgpt.com/",
  "https://chat.openai.com/",
  "https://copilot.microsoft.com/",
  "https://www.perplexity.ai/",
  "https://search.yahoo.com/",
  "https://duckduckgo.com/",
]) {
  const { calls, target } = createTarget({ document: { referrer } })
  assert.strictEqual(trackEvent("click_article", {}, target), true, referrer)
  assert.strictEqual(calls[0][2].page_referrer, referrer, referrer)
}

for (const [referrer, expectedOrigin] of [
  [
    "https://montessorimexico.org/articulo/?email=x#token",
    "https://montessorimexico.org/",
  ],
  [
    "https://www.google.com.mx/search?q=montessori",
    "https://www.google.com.mx/",
  ],
]) {
  const { calls, target } = createTarget({ document: { referrer } })
  assert.strictEqual(trackEvent("click_article", {}, target), true, referrer)
  assert.strictEqual(calls[0][2].page_referrer, expectedOrigin, referrer)
}

for (const referrer of [
  "http://www.google.com/",
  "https://user@example.com@www.google.com/",
  "https://www.google.com:443/",
  "https://www.google.com.evil.example/",
  "https://search.google.com/",
]) {
  const { calls, target } = createTarget({ document: { referrer } })
  assert.strictEqual(trackEvent("click_article", {}, target), true, referrer)
  assert.strictEqual(
    calls[0][2].page_referrer,
    "https://certificacionmontessori.com/",
    referrer
  )
}

assert.deepStrictEqual(
  buildSafeParams({
    language: "es",
    program_id: "casa",
    email: "persona@example.com",
    message: "texto privado",
    unknown: "discard",
  }),
  { language: "es", program_id: "casa" }
)

for (const language of ["es", "en", "pt-br"]) {
  assert.deepStrictEqual(buildSafeParams({ language }), { language })
}

for (const program_id of [
  "nido",
  "casa",
  "taller",
  "cosmica",
  "neuro",
  "general_training",
  "inscripcion",
  "unknown",
]) {
  assert.deepStrictEqual(buildSafeParams({ program_id }), { program_id })
}

for (const cta_position of [
  "article",
  "floating_widget",
  "footer",
  "contact_whatsapp",
  "inscripcion_part_1",
  "checkout_form",
  "enrollment_reservation_form",
  "article_card",
  "book_card",
  "program_offer",
  "program_page",
  "program_questions",
]) {
  assert.deepStrictEqual(buildSafeParams({ cta_position }), { cta_position })
}

for (const lead_channel of ["whatsapp", "form", "stripe"]) {
  assert.deepStrictEqual(buildSafeParams({ lead_channel }), { lead_channel })
}

for (const book_id of [
  "ammac-libro-1",
  "ammac-libro-2",
  "ammac-libro-3",
  "ammac-libro-4",
  "ammac-libro-5",
]) {
  assert.deepStrictEqual(buildSafeParams({ book_id }), { book_id })
}

const programLandingPaths = [
  "/diplomados/nido-comunidad-infantil/",
  "/diplomados/casa-de-ninos/",
  "/diplomados/taller-i-ii/",
  "/diplomados/educacion-cosmica/",
  "/diplomados/neuroeducacion/",
]
const plannedLandingPaths = [
  ...[...LOCALIZED_PATHS, ...programLandingPaths].flatMap(path =>
    LANGUAGE_CODES.map(language => localizePath(language, path))
  ),
  "/404/",
  "/certificate/",
  "/masterclasses/",
]
for (const landing_path of plannedLandingPaths) {
  assert.deepStrictEqual(buildSafeParams({ landing_path }), { landing_path })
}
assert.deepStrictEqual(buildSafeParams({ landing_path: "/contact" }), {
  landing_path: "/contact/",
})

assert.deepStrictEqual(
  buildSafeParams({
    source_hostname: "montessorimexico.org",
    source_content_id: VALID_SOURCE_CONTENT_IDS[0],
  }),
  {
    source_hostname: "montessorimexico.org",
    source_content_id: VALID_SOURCE_CONTENT_IDS[0],
  }
)

assert.deepStrictEqual(
  buildSafeParams({ source_hostname: "certificacionmontessori.com" }),
  { source_hostname: "certificacionmontessori.com" }
)

for (const source_content_id of VALID_SOURCE_CONTENT_IDS) {
  assert.deepStrictEqual(buildSafeParams({ source_content_id }), {
    source_content_id,
  })
}

assert.deepStrictEqual(
  buildSafeParams({ source_post_slug: VALID_SOURCE_CONTENT_IDS[0] }),
  {}
)
{
  const { calls, target } = createTarget()
  assert.strictEqual(
    trackEvent(
      "click_article",
      { source_post_slug: VALID_SOURCE_CONTENT_IDS[0] },
      target
    ),
    true
  )
  assert.deepStrictEqual(calls[0][2], {
    page_path: "/contact/",
    page_location: "https://certificacionmontessori.com/contact/",
    page_referrer: "https://montessorimexico.org/",
  })
}

const rejectedValues = [
  ["language", "persona@example.com"],
  ["program_id", "orden-12345678"],
  ["source_hostname", "montessorimexico.org.evil.example"],
  ["source_hostname", "certificacionmontessori.com.evil.example"],
  ["source_hostname", "user@certificacionmontessori.com"],
  ["source_hostname", "certificacionmontessori.com:443"],
  ["source_content_id", "observacion-casa"],
  ["source_content_id", "ana-garcia-lopez"],
  ["source_content_id", "order-id-abcde"],
  ["source_content_id", "post_D95119F319861CEA"],
  ["source_content_id", "post_d95119f319861ce"],
  ["source_content_id", "post_d95119f319861ceaa"],
  ["source_content_id", "xpost_d95119f319861cea"],
  ["source_content_id", "post_d95119f319861ceax"],
  ["book_id", "buyer@example.com"],
  ["book_id", "order-987654321"],
  ["cta_position", "contact_persona@example.com"],
  ["lead_channel", "+52-55-1234-5678"],
  ["landing_path", "/checkout/success/orden-12345678/"],
  ["landing_path", "/inscripcion/completar/?orden=abc123"],
  ["landing_path", "/diplomados/casa-de-ninos/?email=persona@example.com"],
  ["landing_path", "/arbitrary/user-550e8400-e29b-41d4-a716-446655440000/"],
]
for (const [key, value] of rejectedValues) {
  assert.deepStrictEqual(
    buildSafeParams({ [key]: value }),
    {},
    `${key}: ${value}`
  )

  if (key === "source_hostname" || key === "source_content_id") {
    const { calls, target } = createTarget()
    assert.strictEqual(
      trackEvent("click_article", { [key]: value }, target),
      true
    )
    assert.strictEqual(calls.length, 1)
    assert(
      !Object.values(calls[0][2]).includes(value),
      `${key} leaked to gtag: ${value}`
    )
  }
}

{
  const { calls, target } = createTarget()
  assert.strictEqual(
    trackEvent(
      "click_article",
      {
        source_hostname: "certificacionmontessori.com",
        source_content_id: VALID_SOURCE_CONTENT_IDS[1],
        landing_path: "/publicaciones/",
        cta_position: "article_card",
      },
      target
    ),
    true
  )
  assert.deepStrictEqual(calls[0][2], {
    source_hostname: "certificacionmontessori.com",
    source_content_id: VALID_SOURCE_CONTENT_IDS[1],
    landing_path: "/publicaciones/",
    cta_position: "article_card",
    page_path: "/contact/",
    page_location: "https://certificacionmontessori.com/contact/",
    page_referrer: "https://montessorimexico.org/",
  })
}

assert.deepStrictEqual(getAttribution(attributionSearch()), {
  source_hostname: "montessorimexico.org",
  source_content_id: VALID_SOURCE_CONTENT_IDS[0],
  program_id: "casa",
})

for (const programId of [
  "nido",
  "casa",
  "taller",
  "cosmica",
  "neuro",
  "general_training",
]) {
  assert.strictEqual(
    getAttribution(attributionSearch(VALID_SOURCE_CONTENT_IDS[1], programId))
      .program_id,
    programId
  )
}

for (const search of [
  attributionSearch("observacion-casa"),
  attributionSearch("ana-garcia-lopez"),
  attributionSearch("order-id-abcde"),
  attributionSearch("post_D95119F319861CEA"),
  attributionSearch("post_d95119f319861ce"),
  attributionSearch("post_d95119f319861ceaa"),
  attributionSearch("xpost_d95119f319861cea"),
  attributionSearch("post_d95119f319861ceax"),
  attributionSearch(VALID_SOURCE_CONTENT_IDS[0], "unknown"),
  attributionSearch(VALID_SOURCE_CONTENT_IDS[0], "orden-12345678"),
  `?utm_source=montessorimexico.org&utm_medium=referral&utm_campaign=guia_montessori&utm_content=${VALID_SOURCE_CONTENT_IDS[0]}`,
]) {
  assert.strictEqual(getAttribution(search), null, search)
}

for (const [parameter, expected, unexpected] of [
  ["utm_source", "montessorimexico.org", "montessorimexico.org.evil.example"],
  ["utm_medium", "referral", "organic"],
  ["utm_campaign", "guia_montessori", "otra-campana"],
]) {
  const search = attributionSearch(opaqueId(50)).replace(
    `${parameter}=${expected}`,
    `${parameter}=${unexpected}`
  )
  assert.strictEqual(getAttribution(search), null, `${parameter} mismatch`)

  const { calls, target } = createTarget()
  assert.strictEqual(
    trackAttributedArrival(
      {
        pathname: "/diplomados/casa-de-ninos/",
        search,
      },
      target
    ),
    false,
    `${parameter} mismatch`
  )
  assert.strictEqual(calls.length, 0, `${parameter} mismatch reached gtag`)
}

for (const content of [
  "observacion-casa",
  "ana-garcia-lopez",
  "order-id-abcde",
  "post_D95119F319861CEA",
  "post_d95119f319861ce",
  "post_d95119f319861ceaa",
  "xpost_d95119f319861cea",
  "post_d95119f319861ceax",
]) {
  const { calls, target } = createTarget()
  assert.strictEqual(
    trackAttributedArrival(
      {
        pathname: "/diplomados/casa-de-ninos/",
        search: attributionSearch(content),
      },
      target
    ),
    false,
    content
  )
  assert.strictEqual(
    calls.length,
    0,
    `invalid content reached gtag: ${content}`
  )
}

{
  const { calls, target } = createTarget()
  const location = {
    pathname: "/diplomados/casa-de-ninos/",
    search: attributionSearch(),
  }
  assert.strictEqual(trackAttributedArrival(location, target), true)
  assert.strictEqual(calls.length, 1)
  assert.strictEqual(calls[0][1], "click_program_cta")
  assert.strictEqual(calls[0][2].source_content_id, VALID_SOURCE_CONTENT_IDS[0])
  assert.strictEqual(trackAttributedArrival(location, target), false)
  assert.strictEqual(calls.length, 1)
}

const expectedIntentLandingPaths = {
  nido: "/diplomados/nido-comunidad-infantil/",
  casa: "/diplomados/casa-de-ninos/",
  taller: "/diplomados/taller-i-ii/",
  cosmica: "/diplomados/educacion-cosmica/",
  neuro: "/diplomados/neuroeducacion/",
  general_training: "/diplomados/",
}
assert.deepStrictEqual(INTENT_LANDING_PATHS, expectedIntentLandingPaths)

let attributionCase = 100
for (const [programId, path] of Object.entries(expectedIntentLandingPaths)) {
  for (const language of LANGUAGE_CODES) {
    const { calls, target } = createTarget()
    assert.strictEqual(
      trackAttributedArrival(
        {
          pathname: localizePath(language, path),
          search: attributionSearch(opaqueId(attributionCase++), programId),
        },
        target
      ),
      true,
      `${programId}: ${language}`
    )
    assert.strictEqual(calls.length, 1)
  }
}

let mismatchCase = 200
for (const [programId, pathname] of [
  ["casa", "/diplomados/neuroeducacion/"],
  ["general_training", "/pt-br/diplomados/casa-de-ninos/"],
]) {
  const { calls, target } = createTarget()
  assert.strictEqual(
    trackAttributedArrival(
      {
        pathname,
        search: attributionSearch(opaqueId(mismatchCase++), programId),
      },
      target
    ),
    false
  )
  assert.strictEqual(calls.length, 0)
}

let referrerCase = 300
for (const [referrer, expected, label] of [
  ["", false, "missing referrer"],
  ["https://montessorimexico.org/observacion/", true, "canonical referrer"],
  [
    "https://www.montessorimexico.org/observacion/",
    true,
    "redirecting www referrer",
  ],
  ["http://montessorimexico.org/observacion/", false, "insecure referrer"],
  ["https://montessorimexico.org.evil.example/", false, "suffix referrer"],
  ["https://user@montessorimexico.org/", false, "credential referrer"],
  ["https://montessorimexico.org:443/", false, "explicit port referrer"],
  ["not a url", false, "malformed referrer"],
]) {
  const { calls, target } = createTarget({ document: { referrer } })
  assert.strictEqual(
    trackAttributedArrival(
      {
        pathname: "/diplomados/casa-de-ninos/",
        search: attributionSearch(opaqueId(referrerCase++)),
      },
      target
    ),
    expected,
    label
  )
  assert.strictEqual(calls.length, expected ? 1 : 0, label)
}

{
  const { calls, target } = createTarget()
  assert.strictEqual(
    trackAttributedArrival(
      {
        pathname: "/checkout/success/orden-12345678/",
        search: attributionSearch(opaqueId(400)),
      },
      target
    ),
    false
  )
  assert.strictEqual(calls.length, 0)
}

{
  const { calls, target } = createTarget({
    sessionStorage: {
      getItem() {
        throw new Error("storage read denied")
      },
      setItem() {},
    },
  })
  const location = {
    pathname: "/diplomados/taller-i-ii/",
    search: attributionSearch(opaqueId(401), "taller"),
  }
  assert.strictEqual(trackAttributedArrival(location, target), true)
  assert.strictEqual(trackAttributedArrival(location, target), false)
  assert.strictEqual(calls.length, 1)
}

{
  let writes = 0
  const { calls, target } = createTarget({
    sessionStorage: {
      getItem() {
        return null
      },
      setItem() {
        writes += 1
        throw new Error("storage write denied")
      },
    },
  })
  const location = {
    pathname: "/diplomados/neuroeducacion/",
    search: attributionSearch(opaqueId(402), "neuro"),
  }
  assert.strictEqual(trackAttributedArrival(location, target), true)
  assert.strictEqual(trackAttributedArrival(location, target), false)
  assert.strictEqual(calls.length, 1)
  assert.strictEqual(writes, 1)
}

{
  const { calls, target } = createTarget({ sessionStorage: undefined })
  const location = {
    pathname: "/diplomados/nido-comunidad-infantil/",
    search: attributionSearch(opaqueId(403), "nido"),
  }
  assert.strictEqual(trackAttributedArrival(location, target), true)
  assert.strictEqual(trackAttributedArrival(location, target), false)
  assert.strictEqual(calls.length, 1)
}

{
  let attempts = 0
  const target = {
    gtag() {
      attempts += 1
      throw new Error("gtag unavailable")
    },
    localStorage: {
      getItem: key => (key === "ammac-analytics-consent-v1" ? "granted" : null),
    },
    sessionStorage: createStorage(),
    document: { referrer: "https://montessorimexico.org/universo-y-vida/" },
  }
  const location = {
    pathname: "/diplomados/educacion-cosmica/",
    search: attributionSearch(opaqueId(404), "cosmica"),
  }
  assert.strictEqual(trackAttributedArrival(location, target), false)
  assert.strictEqual(trackAttributedArrival(location, target), false)
  assert.strictEqual(attempts, 0)
  assert.strictEqual(trackEvent("click_whatsapp", {}, target), false)
  assert.strictEqual(attempts, 0)
}

{
  const calls = []
  const storedConsent = new Map()
  const scripts = []
  const target = {
    gtag: (...args) => calls.push(args),
    localStorage: {
      getItem: key => storedConsent.get(key) || null,
      setItem: (key, value) => storedConsent.set(key, value),
    },
    location: { pathname: "/contact/" },
    document: {
      referrer: "https://montessorimexico.org/",
      querySelector: selector =>
        scripts.find(script => `#${script.id}` === selector) || null,
      createElement: tagName => ({ tagName }),
      head: { appendChild: script => scripts.push(script) },
    },
  }
  const appPageViews = () =>
    calls.filter(args => args[0] === "event" && args[1] === "page_view")

  const initial = { pathname: "/contact/", key: "initial-key" }
  assert.strictEqual(registerAnalyticsNavigation(initial, target), true)
  assert.strictEqual(trackPageView(initial, target), false)
  assert.strictEqual(appPageViews().length, 0)

  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(trackPageView(target.location, target), true)
  assert.strictEqual(appPageViews().length, 1)
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(trackPageView(target.location, target), false)
  assert.strictEqual(setAnalyticsConsent("denied", target), true)
  assert.strictEqual(setAnalyticsConsent("granted", target), true)
  assert.strictEqual(trackPageView(target.location, target), false)
  assert.strictEqual(
    appPageViews().length,
    1,
    "reaffirm and revoke/regrant must not resend the current navigation"
  )

  const next = { pathname: "/privacy/", key: "next-key" }
  assert.strictEqual(registerAnalyticsNavigation(next, target), true)
  assert.strictEqual(trackPageView(next, target), true)
  assert.strictEqual(appPageViews().length, 2)

  const samePathNewKey = { pathname: "/privacy/", key: "same-path-new-key" }
  assert.strictEqual(registerAnalyticsNavigation(samePathNewKey, target), true)
  assert.strictEqual(trackPageView(samePathNewKey, target), true)
  assert.strictEqual(appPageViews().length, 3)

  const intervening = { pathname: "/contact/", key: "intervening-key" }
  assert.strictEqual(registerAnalyticsNavigation(intervening, target), true)
  assert.strictEqual(trackPageView(intervening, target), true)
  const browserBack = { pathname: "/privacy/", key: "next-key" }
  assert.strictEqual(registerAnalyticsNavigation(browserBack, target), true)
  assert.strictEqual(trackPageView(browserBack, target), true)
  assert.strictEqual(appPageViews().length, 5)

  const beforeInvalid = appPageViews().length
  assert.strictEqual(
    registerAnalyticsNavigation(
      { pathname: "/checkout/success/?order=cs_secret", key: "invalid-key" },
      target
    ),
    false
  )
  assert.strictEqual(
    trackPageView(
      { pathname: "/checkout/success/?order=cs_secret", key: "invalid-key" },
      target
    ),
    false
  )
  assert.strictEqual(appPageViews().length, beforeInvalid)

  const retry = { pathname: "/diplomados/", key: "retry-key" }
  assert.strictEqual(registerAnalyticsNavigation(retry, target), true)
  const workingGtag = target.gtag
  target.gtag = () => {
    throw new Error("page view queue failed")
  }
  assert.strictEqual(trackPageView(retry, target), false)
  target.gtag = workingGtag
  assert.strictEqual(trackPageView(retry, target), true)
  assert.strictEqual(appPageViews().length, beforeInvalid + 1)
  for (const pageView of appPageViews()) {
    assert.strictEqual("key" in pageView[2], false)
    assert.doesNotMatch(
      JSON.stringify(pageView[2]),
      /initial-key|next-key|retry-key/
    )
  }
}

{
  const { calls, consentValues, target } = createTarget()
  assert.strictEqual(
    trackPageView(
      {
        origin: "https://attacker.example",
        pathname: "/diplomados/casa-de-ninos/",
        search: "?email=persona@example.com&order=cs_secret",
        hash: "#access-token",
      },
      target
    ),
    true
  )
  assert.deepStrictEqual(calls.at(-1), [
    "event",
    "page_view",
    {
      page_path: "/diplomados/casa-de-ninos/",
      page_location:
        "https://certificacionmontessori.com/diplomados/casa-de-ninos/",
      page_referrer: "https://montessorimexico.org/",
    },
  ])

  for (const pathname of [
    "https://attacker.example/diplomados/",
    "//attacker.example/diplomados/",
    "/arbitrary/persona@example.com/",
    "/checkout/success/?order=cs_secret",
    "/checkout/success/#access-token",
    "/checkout/success/cs_live_secret/",
  ]) {
    assert.strictEqual(trackPageView({ pathname }, target), false, pathname)
  }

  consentValues.set("ammac-analytics-consent-v1", "denied")
  assert.strictEqual(trackEvent("click_whatsapp", {}, target), false)
  assert.strictEqual(trackPageView({ pathname: "/contact/" }, target), false)
  consentValues.delete("ammac-analytics-consent-v1")
  assert.strictEqual(trackEvent("click_whatsapp", {}, target), false)
  assert.strictEqual(trackPageView({ pathname: "/contact/" }, target), false)
}

{
  const { calls, target } = createTarget({
    localStorage: {
      getItem() {
        throw new Error("storage unavailable")
      },
    },
  })
  assert.strictEqual(trackEvent("click_whatsapp", {}, target), false)
  assert.strictEqual(trackPageView({ pathname: "/contact/" }, target), false)
  assert.strictEqual(calls.length, 0)
}

assert.strictEqual(
  trackEvent("invented_event", {}, createTarget().target),
  false
)
console.log("analytics contract ok")
