const assert = require("assert")
const {
  buildSafeParams,
  getAttribution,
  INTENT_LANDING_PATHS,
  trackAttributedArrival,
  trackEvent,
} = require("../src/utils/analytics")
const { LANGUAGE_CODES, LOCALIZED_PATHS, localizePath } = require("../src/i18n/config")

const attributionSearch = (content = "observacion-casa", term = "casa") =>
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
  return {
    calls,
    target: {
      gtag: (...args) => calls.push(args),
      sessionStorage: createStorage(),
      document: { referrer: "https://montessorimexico.org/articulo-editorial/" },
      ...overrides,
    },
  }
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
    source_post_slug: "orden-en-el-ambiente",
  }),
  {
    source_hostname: "montessorimexico.org",
    source_post_slug: "orden-en-el-ambiente",
  }
)

assert.deepStrictEqual(
  buildSafeParams({ source_hostname: "certificacionmontessori.com" }),
  { source_hostname: "certificacionmontessori.com" }
)

for (const source_post_slug of [
  "observacion-casa",
  "formacion-montessori",
  "el-ambiente-preparado-montessori",
  "desarrollo-del-lenguaje-en-casa-de-ninos",
]) {
  assert.deepStrictEqual(buildSafeParams({ source_post_slug }), { source_post_slug })
}

const rejectedValues = [
  ["language", "persona@example.com"],
  ["program_id", "orden-12345678"],
  ["source_hostname", "montessorimexico.org.evil.example"],
  ["source_hostname", "certificacionmontessori.com.evil.example"],
  ["source_hostname", "user@certificacionmontessori.com"],
  ["source_hostname", "certificacionmontessori.com:443"],
  ["source_post_slug", "ana-garcia"],
  ["source_post_slug", "persona@example.com"],
  ["source_post_slug", "llama-55-1234-5678"],
  ["source_post_slug", "5501234567"],
  ["source_post_slug", "550e8400-e29b-41d4-a716-446655440000"],
  ["source_post_slug", "orden-abc123def456"],
  ["source_post_slug", "order-abc-123456"],
  ["source_post_slug", "orden-2026"],
  ["source_post_slug", "transaction-id-1234"],
  ["source_post_slug", "transaccion-abc-9876"],
  ["source_post_slug", "pedido-cliente-42"],
  ["source_post_slug", "payment-abcdefabcdef"],
  ["source_post_slug", "checkout-550e8400-e29b-41d4-a716-446655440000"],
  ["source_post_slug", "tema-1234567890123456"],
  ["source_post_slug", "tema-abcdefabcdefabcd"],
  ["source_post_slug", "observacion%2Fcasa"],
  ["source_post_slug", "observacion%ZZcasa"],
  ["source_post_slug", "observacion_casa"],
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
  assert.deepStrictEqual(buildSafeParams({ [key]: value }), {}, `${key}: ${value}`)

  if (key === "source_hostname" || key === "source_post_slug") {
    const { calls, target } = createTarget()
    assert.strictEqual(trackEvent("click_article", { [key]: value }, target), true)
    assert.strictEqual(calls.length, 1)
    assert(!Object.values(calls[0][2]).includes(value), `${key} leaked to gtag: ${value}`)
  }
}

{
  const { calls, target } = createTarget()
  assert.strictEqual(
    trackEvent(
      "click_article",
      {
        source_hostname: "certificacionmontessori.com",
        source_post_slug: "observacion-montessori",
        landing_path: "/publicaciones/",
        cta_position: "article_card",
      },
      target
    ),
    true
  )
  assert.deepStrictEqual(calls[0][2], {
    source_hostname: "certificacionmontessori.com",
    source_post_slug: "observacion-montessori",
    landing_path: "/publicaciones/",
    cta_position: "article_card",
  })
}

assert.deepStrictEqual(getAttribution(attributionSearch()), {
  source_hostname: "montessorimexico.org",
  source_post_slug: "observacion-casa",
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
    getAttribution(attributionSearch("formacion-montessori", programId)).program_id,
    programId
  )
}

for (const search of [
  attributionSearch("persona@example.com"),
  attributionSearch("ana-garcia"),
  attributionSearch("llama-55-1234-5678"),
  attributionSearch("orden-abc123def456"),
  attributionSearch("pedido-cliente-42"),
  attributionSearch("tema-abcdefabcdefabcd"),
  attributionSearch("observacion%ZZcasa"),
  attributionSearch("observacion-casa", "unknown"),
  attributionSearch("observacion-casa", "orden-12345678"),
  "?utm_source=montessorimexico.org&utm_medium=referral&utm_campaign=guia_montessori&utm_content=observacion-casa",
]) {
  assert.strictEqual(getAttribution(search), null, search)
}

for (const content of [
  "ana-garcia",
  "pedido-cliente-42",
  "tema-abcdefabcdefabcd",
  "persona%40example.com",
  "observacion%ZZcasa",
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
  assert.strictEqual(calls.length, 0, `invalid content reached gtag: ${content}`)
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
  assert.strictEqual(calls[0][2].source_post_slug, "observacion-casa")
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

for (const [programId, path] of Object.entries(expectedIntentLandingPaths)) {
  for (const language of LANGUAGE_CODES) {
    const { calls, target } = createTarget()
    assert.strictEqual(
      trackAttributedArrival(
        {
          pathname: localizePath(language, path),
          search: attributionSearch(
            `guia-${programId.replace(/_/g, "-")}-montessori`,
            programId
          ),
        },
        target
      ),
      true,
      `${programId}: ${language}`
    )
    assert.strictEqual(calls.length, 1)
  }
}

for (const [programId, pathname] of [
  ["casa", "/diplomados/neuroeducacion/"],
  ["general_training", "/pt-br/diplomados/casa-de-ninos/"],
]) {
  const { calls, target } = createTarget()
  assert.strictEqual(
    trackAttributedArrival(
      {
        pathname,
        search: attributionSearch(
          `mismatch-${programId.replace(/_/g, "-")}-montessori`,
          programId
        ),
      },
      target
    ),
    false
  )
  assert.strictEqual(calls.length, 0)
}

for (const [referrer, expected, label] of [
  ["", false, "missing referrer"],
  ["https://montessorimexico.org/observacion/", true, "canonical referrer"],
  ["https://www.montessorimexico.org/observacion/", true, "redirecting www referrer"],
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
        search: attributionSearch(`referrer-${label.replace(/\s+/g, "-")}-montessori`),
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
        search: attributionSearch("invalid-arrival-path"),
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
    search: attributionSearch("lectura-taller", "taller"),
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
    search: attributionSearch("cerebro-neuroeducacion", "neuro"),
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
    search: attributionSearch("desarrollo-del-nido", "nido"),
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
    sessionStorage: createStorage(),
    document: { referrer: "https://montessorimexico.org/universo-y-vida/" },
  }
  const location = {
    pathname: "/diplomados/educacion-cosmica/",
    search: attributionSearch("universo-y-vida", "cosmica"),
  }
  assert.strictEqual(trackAttributedArrival(location, target), false)
  assert.strictEqual(trackAttributedArrival(location, target), false)
  assert.strictEqual(attempts, 2)
  assert.strictEqual(trackEvent("click_whatsapp", {}, target), false)
  assert.strictEqual(attempts, 3)
}

assert.strictEqual(trackEvent("invented_event", {}, createTarget().target), false)
console.log("analytics contract ok")
