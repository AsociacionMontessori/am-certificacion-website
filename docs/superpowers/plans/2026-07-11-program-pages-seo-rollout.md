# Multilingual Program Pages and SEO Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar cinco landing pages de programas en español, inglés y portugués brasileño, validar 42 URLs canónicas y activar el embudo editorial únicamente después del despliegue correcto.

**Architecture:** Un registro CommonJS contiene solo IDs y rutas; Gatsby crea 15 páginas desde una plantilla y las traducciones aportan contenido localizado. El catálogo `programasOferta.js` sigue siendo la única fuente de nombres comerciales, duración y precios. Builders puros producen Course/Breadcrumb schemas y un rastreador de build valida sitemap, canonical, robots y `hreflang` antes de Firebase.

**Tech Stack:** Gatsby 5, React 18, i18next, Gatsby Node APIs, Schema.org JSON-LD, Cheerio, Playwright, Firebase Hosting, Search Console, Bing Webmaster Tools, IndexNow.

## Global Constraints

- Rutas españolas:
  - `/diplomados/nido-comunidad-infantil/`
  - `/diplomados/casa-de-ninos/`
  - `/diplomados/taller-i-ii/`
  - `/diplomados/educacion-cosmica/`
  - `/diplomados/neuroeducacion/`
- Inglés añade `/en`; portugués brasileño añade `/pt-br`; los slugs permanecen iguales para seguir el patrón del sitio.
- El sitemap final contiene exactamente 42 URLs públicas.
- `es`, `en`, `pt-BR` y `x-default` se enlazan de forma recíproca; `x-default` apunta al español.
- `programasOferta.js` conserva la verdad de duración, precio, promoción y checkout.
- Ningún texto afirma fechas, requisitos, reconocimiento, ratings o credenciales que no estén visibles en el sitio aprobado.
- No emitir `CourseInstance` hasta tener fecha y datos completos visibles para cada instancia.
- Cada landing usa contenido humano revisado en un solo idioma.
- Los CTA editoriales siguen apagados hasta que las 15 URLs respondan `200` en producción.
- No se reenvía repetidamente el mismo sitemap durante procesamiento.

---

### Task 1: Register Routes and Create 15 Gatsby Pages

**Files:**
- Create: `src/data/programLandingRoutes.js`
- Create: `src/templates/programLandingPage.js`
- Create: `scripts/test-program-routes.js`
- Create: `src/i18n/locales/es/programs.json`
- Create: `src/i18n/locales/en/programs.json`
- Create: `src/i18n/locales/pt-br/programs.json`
- Modify: `gatsby-node.js`
- Modify: `src/i18n/config.js:51-71`
- Modify: `src/i18n/index.js:7-20`
- Modify: `package.json:43-64`

**Interfaces:**
- Produces `PROGRAM_LANDING_ROUTES: readonly { id: string, slug: string }[]`.
- Produces `getProgramLandingRoute(id: string) -> object | null`.
- Gatsby page context: `{ language, originalPath, programId }`.
- The template initially renders a minimal testable shell; Task 3 replaces it with the complete experience.

- [ ] **Step 1: Write the failing route-generation contract**

```javascript
// scripts/test-program-routes.js
const assert = require("assert")
const { PROGRAM_LANDING_ROUTES } = require("../src/data/programLandingRoutes")
const gatsbyNode = require("../gatsby-node")

assert.strictEqual(PROGRAM_LANDING_ROUTES.length, 5)
assert.deepStrictEqual(
  PROGRAM_LANDING_ROUTES.map(route => route.id),
  ["nido", "casa", "taller", "cosmica", "neuro"]
)

const created = []
gatsbyNode.createPages({
  actions: { createPage: page => created.push(page) },
})
assert.strictEqual(created.length, 15)
assert(created.some(page => page.path === "/diplomados/casa-de-ninos/"))
assert(created.some(page => page.path === "/en/diplomados/casa-de-ninos/"))
assert(created.some(page => page.path === "/pt-br/diplomados/casa-de-ninos/"))
assert(created.every(page => page.context.programId))
console.log("program route contract ok")
```

- [ ] **Step 2: Run and verify the missing registry failure**

```bash
node scripts/test-program-routes.js
```

Expected: missing `programLandingRoutes`.

- [ ] **Step 3: Create the route registry**

```javascript
// src/data/programLandingRoutes.js
const PROGRAM_LANDING_ROUTES = Object.freeze([
  { id: "nido", slug: "nido-comunidad-infantil" },
  { id: "casa", slug: "casa-de-ninos" },
  { id: "taller", slug: "taller-i-ii" },
  { id: "cosmica", slug: "educacion-cosmica" },
  { id: "neuro", slug: "neuroeducacion" },
])

const getProgramLandingRoute = id =>
  PROGRAM_LANDING_ROUTES.find(route => route.id === id) || null

module.exports = { PROGRAM_LANDING_ROUTES, getProgramLandingRoute }
```

- [ ] **Step 4: Add the route set to i18n and createPages**

In `src/i18n/config.js`, require the registry and append:

```javascript
...PROGRAM_LANDING_ROUTES.map(route => `/diplomados/${route.slug}/`),
```

to `LOCALIZED_PATHS`.

In `gatsby-node.js`, add:

```javascript
const path = require("path")
const { PROGRAM_LANDING_ROUTES } = require("./src/data/programLandingRoutes")

exports.createPages = ({ actions }) => {
  const component = path.resolve("./src/templates/programLandingPage.js")
  PROGRAM_LANDING_ROUTES.forEach(route => {
    const originalPath = `/diplomados/${route.slug}/`
    LANGUAGE_CODES.forEach(language => {
      actions.createPage({
        path: localizePath(language, originalPath),
        component,
        context: { language, originalPath, programId: route.id },
      })
    })
  })
}
```

Add `programs` to `NAMESPACES` in `src/i18n/index.js`.

- [ ] **Step 5: Create the minimal template used by the route test/build**

```javascript
// src/templates/programLandingPage.js
import * as React from "react"
import Layout from "../components/layout"
import Nav from "../components/nav"

const ProgramLandingPage = ({ pageContext }) => (
  <Layout>
    <Nav />
    <main data-program-id={pageContext.programId}>
      <h1>{pageContext.programId}</h1>
    </main>
  </Layout>
)

export default ProgramLandingPage
```

Create valid empty namespace objects first:

```json
{}
```

at `src/i18n/locales/es/programs.json`, `src/i18n/locales/en/programs.json` and `src/i18n/locales/pt-br/programs.json` so webpack can load the new namespace.

- [ ] **Step 6: Add script, test and build**

Add:

```json
"test:program-routes": "node scripts/test-program-routes.js"
```

Run:

```bash
npm run test:program-routes
npm run build
find public/diplomados public/en/diplomados public/pt-br/diplomados -mindepth 2 -name index.html | wc -l
```

Expected: route contract passes; build completes; command counts at least 15 nested program files.

- [ ] **Step 7: Commit**

```bash
git add src/data/programLandingRoutes.js src/templates/programLandingPage.js scripts/test-program-routes.js gatsby-node.js src/i18n/config.js src/i18n/index.js src/i18n/locales/es/programs.json src/i18n/locales/en/programs.json src/i18n/locales/pt-br/programs.json package.json
git commit -m "feat(programs): generate localized program routes"
```

---

### Task 2: Add Reviewed Program Copy in Three Languages

**Files:**
- Modify: `src/i18n/locales/es/programs.json`
- Modify: `src/i18n/locales/en/programs.json`
- Modify: `src/i18n/locales/pt-br/programs.json`
- Create: `scripts/test-program-copy.js`
- Modify: `package.json:43-66`

**Interfaces:**
- Produces identical key structure in all three locales.
- `programs.common` supplies shared UI; `programs.<id>` supplies unique search intent and copy.
- The test rejects missing keys and accidental Spanish fallback in English/Portuguese titles.

- [ ] **Step 1: Write the failing locale-parity test**

```javascript
// scripts/test-program-copy.js
const assert = require("assert")
const es = require("../src/i18n/locales/es/programs.json")
const en = require("../src/i18n/locales/en/programs.json")
const pt = require("../src/i18n/locales/pt-br/programs.json")

const ids = ["nido", "casa", "taller", "cosmica", "neuro"]
const required = ["shortTitle", "seoTitle", "seoDescription", "eyebrow", "title", "intro", "audience", "focus"]
const flattenKeys = (value, prefix = "") => Object.entries(value).flatMap(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key
  return child && typeof child === "object" && !Array.isArray(child)
    ? flattenKeys(child, path)
    : [path]
}).sort()

for (const locale of [es, en, pt]) {
  assert(locale.common)
  for (const id of ids) {
    for (const key of required) assert(locale[id]?.[key], `${id}.${key} missing`)
    assert.strictEqual(locale[id].focus.length, 3)
    assert(locale[id].seoTitle.length <= 60, `${id}.seoTitle is too long`)
    assert(locale[id].seoDescription.length >= 70 && locale[id].seoDescription.length <= 160)
  }
  assert.strictEqual(new Set(ids.map(id => locale[id].title)).size, ids.length)
}

assert.deepStrictEqual(flattenKeys(en), flattenKeys(es))
assert.deepStrictEqual(flattenKeys(pt), flattenKeys(es))
for (const id of ids) {
  assert.notStrictEqual(en[id].title, es[id].title)
  assert.notStrictEqual(pt[id].title, es[id].title)
}
console.log("program copy contract ok")
```

- [ ] **Step 2: Add the complete Spanish copy**

```json
{
  "common": {
    "back": "Todos los diplomados",
    "online": "100% en línea",
    "duration": "Duración",
    "currentPrice": "Costo actual",
    "focusTitle": "Qué trabajarás",
    "audienceTitle": "Para quién es",
    "foundationTitle": "Base formativa",
    "foundation": [
      "Filosofía Montessori y métodos de observación",
      "Psicología educativa, neuroeducación y psicomotricidad",
      "Educación inclusiva, creatividad y acompañamiento docente"
    ],
    "requirementsTitle": "Requisitos e inscripción",
    "requirements": "No hay requisito de nivel educativo para cursar. Algunas escuelas establecen requisitos propios para estar frente a grupo; consulta las condiciones de cada institución.",
    "checkout": "Inscribirme en línea",
    "whatsapp": "Resolver dudas por WhatsApp",
    "otherPrograms": "Explora todas las formaciones",
    "priceNoteMonthly": "Colegiatura mensual. La inscripción institucional se paga una sola vez; el checkout confirma las condiciones vigentes.",
    "priceNoteProgram": "Costo del programa. La inscripción institucional se cobra solo con el primer programa; el checkout confirma las condiciones vigentes.",
    "priceNotePromoIncluded": "Promoción vigente: el programa y la inscripción institucional están incluidos; el checkout confirma el importe antes del pago.",
    "credentialTitle": "Certificación y finalización",
    "guideCredential": "La oferta pública de esta formación incluye certificación internacional emitida por AMMAC. Revisa las condiciones vigentes antes de inscribirte.",
    "diplomaCredential": "AMMAC confirma el documento de finalización y sus condiciones vigentes durante el proceso de inscripción.",
    "faqTitle": "Preguntas frecuentes",
    "faqOnlineQuestion": "¿La formación es en línea?",
    "faqOnlineAnswer": "Sí. El programa se cursa en línea, con contenido a tu ritmo y acompañamiento docente.",
    "faqDurationQuestion": "¿Cuánto dura este programa?",
    "faqDurationAnswer": "La duración pública actual es de {{duration}}.",
    "faqCostQuestion": "¿Dónde consulto el costo vigente?",
    "faqCostAnswer": "El panel de esta página toma el costo del catálogo público y el checkout lo confirma antes del pago.",
    "whatsappMessage": "Hola, me interesa {{program}}. ¿Me pueden orientar sobre la formación y la inscripción?"
  },
  "nido": {
    "shortTitle": "Nido y Comunidad Infantil",
    "seoTitle": "Certificación Guía Montessori en Nido",
    "seoDescription": "Fórmate en línea como Guía Montessori en Nido y Comunidad Infantil con acompañamiento docente y certificación internacional AMMAC.",
    "eyebrow": "Certificación internacional · Guía Montessori",
    "title": "Guía Montessori en Nido y Comunidad Infantil",
    "intro": "Una formación profesional para comprender y acompañar los primeros ambientes Montessori con observación, preparación y respeto por el desarrollo.",
    "audience": "Personas que trabajan o desean trabajar en ambientes de primera infancia y buscan una formación Montessori estructurada, flexible y acompañada.",
    "focus": [
      "Observación y comprensión de las necesidades de desarrollo",
      "Preparación del ambiente y función del adulto",
      "Materiales y presentaciones correspondientes al nivel"
    ]
  },
  "casa": {
    "shortTitle": "Casa de Niños",
    "seoTitle": "Certificación Guía Montessori Casa de Niños",
    "seoDescription": "Estudia en línea la formación de Guía Montessori en Casa de Niños con acompañamiento docente y certificación internacional AMMAC.",
    "eyebrow": "Certificación internacional · Guía Montessori",
    "title": "Guía Montessori en Casa de Niños",
    "intro": "Una formación para acompañar el ambiente de Casa de Niños mediante observación, materiales Montessori y una práctica educativa consciente.",
    "audience": "Educadores y personas interesadas en formarse profesionalmente para acompañar un ambiente Montessori de Casa de Niños.",
    "focus": [
      "Observación, independencia y ambiente preparado",
      "Papel de la Guía y acompañamiento respetuoso",
      "Materiales y presentaciones correspondientes al nivel"
    ]
  },
  "taller": {
    "shortTitle": "Taller I y II",
    "seoTitle": "Certificación Guía Montessori Taller I y II",
    "seoDescription": "Fórmate en línea como Guía Montessori de Taller I y II con acompañamiento docente y certificación internacional AMMAC.",
    "eyebrow": "Certificación internacional · Guía Montessori",
    "title": "Guía Montessori en Taller I y II",
    "intro": "Una formación profesional orientada al acompañamiento Montessori de Taller, la exploración cultural y el desarrollo de una mirada integral del aprendizaje.",
    "audience": "Educadores y personas que desean prepararse para acompañar el nivel de Taller I y II dentro de una comunidad Montessori.",
    "focus": [
      "Observación y necesidades del segundo plano de desarrollo",
      "Ambiente preparado, autonomía e investigación",
      "Materiales, presentaciones y conexiones culturales del nivel"
    ]
  },
  "cosmica": {
    "shortTitle": "Educación Cósmica",
    "seoTitle": "Diplomado en Educación Cósmica Montessori",
    "seoDescription": "Estudia en línea Educación Cósmica y Grandes Lecciones Montessori con la AMMAC, acompañamiento docente y una ruta formativa organizada.",
    "eyebrow": "Diplomado Montessori · Grandes Lecciones",
    "title": "Diplomado en Educación Cósmica",
    "intro": "Un recorrido por la Educación Cósmica y las Grandes Lecciones para comprender sus conexiones y llevarlas a una práctica educativa organizada.",
    "audience": "Guías, docentes y personas interesadas en profundizar en Educación Cósmica y en las Grandes Lecciones Montessori.",
    "focus": [
      "Sentido y estructura de la Educación Cósmica",
      "Grandes Lecciones y conexiones entre áreas",
      "Narración, preparación y continuidad del trabajo"
    ]
  },
  "neuro": {
    "shortTitle": "Neuroeducación",
    "seoTitle": "Diplomado en Neuroeducación en línea",
    "seoDescription": "Profundiza en aprendizaje y desarrollo con el diplomado en Neuroeducación de AMMAC, 100% en línea y a tu ritmo.",
    "eyebrow": "Diplomado · Aprendizaje y desarrollo",
    "title": "Diplomado en Neuroeducación",
    "intro": "Una formación breve para relacionar desarrollo, aprendizaje, emoción y movimiento con decisiones educativas más conscientes.",
    "audience": "Docentes, Guías Montessori, familias y profesionales de la educación que buscan una introducción aplicada a la neuroeducación.",
    "focus": [
      "Desarrollo cerebral y procesos de aprendizaje",
      "Emoción, movimiento y experiencia educativa",
      "Aplicación responsable y prevención de neuromitos"
    ]
  }
}
```

- [ ] **Step 3: Add complete English copy with the same keys**

Use these exact translations:

```json
{
  "common": {
    "back": "All diploma courses",
    "online": "100% online",
    "duration": "Duration",
    "currentPrice": "Current cost",
    "focusTitle": "What you will study",
    "audienceTitle": "Who it is for",
    "foundationTitle": "Training foundation",
    "foundation": [
      "Montessori philosophy and observation methods",
      "Educational psychology, neuroeducation, and psychomotor development",
      "Inclusive education, creativity, and faculty guidance"
    ],
    "requirementsTitle": "Requirements and enrollment",
    "requirements": "There is no educational-level requirement to take the program. Some schools set their own requirements for classroom positions; check each institution's conditions.",
    "checkout": "Enroll online",
    "whatsapp": "Ask questions on WhatsApp",
    "otherPrograms": "Explore all training programs",
    "priceNoteMonthly": "Monthly tuition. Institutional enrollment is charged once; checkout confirms the current conditions.",
    "priceNoteProgram": "Program cost. Institutional enrollment is charged only with the first program; checkout confirms the current conditions.",
    "priceNotePromoIncluded": "Current promotion: the program and institutional enrollment are included; checkout confirms the amount before payment.",
    "credentialTitle": "Certificate and completion",
    "guideCredential": "The public offer for this training includes an international certificate issued by AMMAC. Review the current conditions before enrolling.",
    "diplomaCredential": "AMMAC confirms the completion document and its current conditions during the enrollment process.",
    "faqTitle": "Frequently asked questions",
    "faqOnlineQuestion": "Is the training online?",
    "faqOnlineAnswer": "Yes. The program is online, with self-paced content and faculty guidance.",
    "faqDurationQuestion": "How long is this program?",
    "faqDurationAnswer": "The current published duration is {{duration}}.",
    "faqCostQuestion": "Where can I check the current cost?",
    "faqCostAnswer": "The panel on this page reads from the public catalog, and checkout confirms the amount before payment.",
    "whatsappMessage": "Hello, I am interested in {{program}}. Could you guide me through the training and enrollment process?"
  },
  "nido": {
    "shortTitle": "Nido and Infant Community",
    "seoTitle": "Montessori Guide Training for Nido",
    "seoDescription": "Train online as a Montessori Guide for Nido and Infant Community with faculty support and an international AMMAC certificate.",
    "eyebrow": "International certificate · Montessori Guide",
    "title": "Montessori Guide for Nido and Infant Community",
    "intro": "Professional training to understand and support the earliest Montessori environments through observation, preparation, and respect for development.",
    "audience": "People who work or want to work in early-childhood environments and seek structured, flexible Montessori training with faculty guidance.",
    "focus": [
      "Observation and understanding of developmental needs",
      "Environment preparation and the adult's role",
      "Materials and presentations for this level"
    ]
  },
  "casa": {
    "shortTitle": "Children's House",
    "seoTitle": "Montessori Children's House Guide Training",
    "seoDescription": "Study online to become a Montessori Children's House Guide with faculty support and an international AMMAC certificate.",
    "eyebrow": "International certificate · Montessori Guide",
    "title": "Montessori Guide for Children's House",
    "intro": "Training to support a Children's House environment through observation, Montessori materials, and thoughtful educational practice.",
    "audience": "Educators and people interested in professional training to support a Montessori Children's House environment.",
    "focus": [
      "Observation, independence, and the prepared environment",
      "The Guide's role and respectful support",
      "Materials and presentations for this level"
    ]
  },
  "taller": {
    "shortTitle": "Elementary I and II",
    "seoTitle": "Montessori Elementary I and II Guide Training",
    "seoDescription": "Train online as a Montessori Elementary I and II Guide with faculty support and an international AMMAC certificate.",
    "eyebrow": "International certificate · Montessori Guide",
    "title": "Montessori Guide for Elementary I and II",
    "intro": "Professional training focused on the Montessori elementary environment, cultural exploration, and an integrated view of learning.",
    "audience": "Educators and people preparing to support Elementary I and II within a Montessori community.",
    "focus": [
      "Observation and the needs of the second plane of development",
      "Prepared environment, autonomy, and research",
      "Materials, presentations, and cultural connections"
    ]
  },
  "cosmica": {
    "shortTitle": "Cosmic Education",
    "seoTitle": "Montessori Cosmic Education Diploma Course",
    "seoDescription": "Study Cosmic Education and the Montessori Great Lessons online with AMMAC, faculty guidance, and an organized training path.",
    "eyebrow": "Montessori diploma course · Great Lessons",
    "title": "Diploma Course in Cosmic Education",
    "intro": "A journey through Cosmic Education and the Great Lessons to understand their connections and bring them into organized educational practice.",
    "audience": "Guides, teachers, and people seeking deeper knowledge of Cosmic Education and the Montessori Great Lessons.",
    "focus": [
      "Purpose and structure of Cosmic Education",
      "Great Lessons and connections across subject areas",
      "Storytelling, preparation, and continuity of work"
    ]
  },
  "neuro": {
    "shortTitle": "Neuroeducation",
    "seoTitle": "Online Diploma Course in Neuroeducation",
    "seoDescription": "Explore learning and development in AMMAC's self-paced online Neuroeducation diploma course with faculty guidance.",
    "eyebrow": "Diploma course · Learning and development",
    "title": "Diploma Course in Neuroeducation",
    "intro": "A short program connecting development, learning, emotion, and movement with more thoughtful educational decisions.",
    "audience": "Teachers, Montessori Guides, families, and education professionals seeking an applied introduction to neuroeducation.",
    "focus": [
      "Brain development and learning processes",
      "Emotion, movement, and educational experience",
      "Responsible application and prevention of neuromyths"
    ]
  }
}
```

- [ ] **Step 4: Add complete Brazilian Portuguese copy with the same keys**

```json
{
  "common": {
    "back": "Todos os cursos de formação",
    "online": "100% on-line",
    "duration": "Duração",
    "currentPrice": "Custo atual",
    "focusTitle": "O que você vai estudar",
    "audienceTitle": "Para quem é",
    "foundationTitle": "Base da formação",
    "foundation": [
      "Filosofia Montessori e métodos de observação",
      "Psicologia educacional, neuroeducação e psicomotricidade",
      "Educação inclusiva, criatividade e acompanhamento docente"
    ],
    "requirementsTitle": "Requisitos e inscrição",
    "requirements": "Não há requisito de escolaridade para cursar o programa. Algumas escolas definem requisitos próprios para atuar em sala; consulte as condições de cada instituição.",
    "checkout": "Inscrever-me on-line",
    "whatsapp": "Tirar dúvidas pelo WhatsApp",
    "otherPrograms": "Explore todas as formações",
    "priceNoteMonthly": "Mensalidade. A inscrição institucional é cobrada uma única vez; o checkout confirma as condições vigentes.",
    "priceNoteProgram": "Custo do programa. A inscrição institucional é cobrada apenas no primeiro programa; o checkout confirma as condições vigentes.",
    "priceNotePromoIncluded": "Promoção vigente: o programa e a inscrição institucional estão incluídos; o checkout confirma o valor antes do pagamento.",
    "credentialTitle": "Certificado e conclusão",
    "guideCredential": "A oferta pública desta formação inclui certificado internacional emitido pela AMMAC. Consulte as condições vigentes antes de se inscrever.",
    "diplomaCredential": "A AMMAC confirma o documento de conclusão e suas condições vigentes durante o processo de inscrição.",
    "faqTitle": "Perguntas frequentes",
    "faqOnlineQuestion": "A formação é on-line?",
    "faqOnlineAnswer": "Sim. O programa é on-line, com conteúdo no seu ritmo e acompanhamento docente.",
    "faqDurationQuestion": "Quanto tempo dura este programa?",
    "faqDurationAnswer": "A duração pública atual é de {{duration}}.",
    "faqCostQuestion": "Onde consulto o custo vigente?",
    "faqCostAnswer": "O painel desta página usa o catálogo público, e o checkout confirma o valor antes do pagamento.",
    "whatsappMessage": "Olá, tenho interesse em {{program}}. Podem me orientar sobre a formação e a inscrição?"
  },
  "nido": {
    "shortTitle": "Nido e Comunidade Infantil",
    "seoTitle": "Formação de Guia Montessori para Nido",
    "seoDescription": "Forme-se on-line como Guia Montessori de Nido e Comunidade Infantil com acompanhamento docente e certificado internacional AMMAC.",
    "eyebrow": "Certificado internacional · Guia Montessori",
    "title": "Guia Montessori de Nido e Comunidade Infantil",
    "intro": "Formação profissional para compreender e acompanhar os primeiros ambientes Montessori por meio da observação, preparação e respeito ao desenvolvimento.",
    "audience": "Pessoas que trabalham ou desejam trabalhar em ambientes da primeira infância e buscam uma formação Montessori estruturada, flexível e acompanhada.",
    "focus": [
      "Observação e compreensão das necessidades de desenvolvimento",
      "Preparação do ambiente e função do adulto",
      "Materiais e apresentações correspondentes ao nível"
    ]
  },
  "casa": {
    "shortTitle": "Casa das Crianças",
    "seoTitle": "Formação de Guia Montessori Casa das Crianças",
    "seoDescription": "Estude on-line para ser Guia Montessori de Casa das Crianças com acompanhamento docente e certificado internacional AMMAC.",
    "eyebrow": "Certificado internacional · Guia Montessori",
    "title": "Guia Montessori de Casa das Crianças",
    "intro": "Formação para acompanhar o ambiente de Casa das Crianças por meio da observação, dos materiais Montessori e de uma prática educacional consciente.",
    "audience": "Educadores e pessoas interessadas em formação profissional para acompanhar um ambiente Montessori de Casa das Crianças.",
    "focus": [
      "Observação, independência e ambiente preparado",
      "Papel do Guia e acompanhamento respeitoso",
      "Materiais e apresentações correspondentes ao nível"
    ]
  },
  "taller": {
    "shortTitle": "Fundamental I e II",
    "seoTitle": "Formação de Guia Montessori Fundamental I e II",
    "seoDescription": "Forme-se on-line como Guia Montessori de Fundamental I e II com acompanhamento docente e certificado internacional AMMAC.",
    "eyebrow": "Certificado internacional · Guia Montessori",
    "title": "Guia Montessori de Fundamental I e II",
    "intro": "Formação profissional voltada ao ambiente Montessori do ensino fundamental, à exploração cultural e a uma visão integrada da aprendizagem.",
    "audience": "Educadores e pessoas que desejam se preparar para acompanhar o Fundamental I e II em uma comunidade Montessori.",
    "focus": [
      "Observação e necessidades do segundo plano de desenvolvimento",
      "Ambiente preparado, autonomia e pesquisa",
      "Materiais, apresentações e conexões culturais do nível"
    ]
  },
  "cosmica": {
    "shortTitle": "Educação Cósmica",
    "seoTitle": "Curso de Formação em Educação Cósmica Montessori",
    "seoDescription": "Estude Educação Cósmica e Grandes Lições Montessori on-line com a AMMAC, acompanhamento docente e uma trajetória formativa organizada.",
    "eyebrow": "Formação Montessori · Grandes Lições",
    "title": "Curso de Formação em Educação Cósmica",
    "intro": "Um percurso pela Educação Cósmica e pelas Grandes Lições para compreender suas conexões e levá-las a uma prática educacional organizada.",
    "audience": "Guias, docentes e pessoas interessadas em aprofundar Educação Cósmica e as Grandes Lições Montessori.",
    "focus": [
      "Sentido e estrutura da Educação Cósmica",
      "Grandes Lições e conexões entre áreas",
      "Narração, preparação e continuidade do trabalho"
    ]
  },
  "neuro": {
    "shortTitle": "Neuroeducação",
    "seoTitle": "Curso on-line de Formação em Neuroeducação",
    "seoDescription": "Aprofunde aprendizagem e desenvolvimento no curso de Neuroeducação da AMMAC, 100% on-line e no seu ritmo.",
    "eyebrow": "Formação · Aprendizagem e desenvolvimento",
    "title": "Curso de Formação em Neuroeducação",
    "intro": "Uma formação breve para relacionar desenvolvimento, aprendizagem, emoção e movimento com decisões educacionais mais conscientes.",
    "audience": "Docentes, Guias Montessori, famílias e profissionais da educação que buscam uma introdução aplicada à neuroeducação.",
    "focus": [
      "Desenvolvimento cerebral e processos de aprendizagem",
      "Emoção, movimento e experiência educacional",
      "Aplicação responsável e prevenção de neuromitos"
    ]
  }
}
```

- [ ] **Step 5: Test parity and build**

Add package script:

```json
"test:program-copy": "node scripts/test-program-copy.js"
```

Run:

```bash
npm run test:program-copy
npm run build
```

Expected: parity test and build pass without i18next fallback warnings.

- [ ] **Step 6: Human-review all transactional copy**

Review all 15 generated HTML files against the public offer and existing glossary documents under `docs/i18n/`. Record approval in `docs/i18n/PROGRAM_PAGES_REVIEW_2026-07-11.md` with one row per URL and reviewer status `approved`.

No URL may proceed to production if its row is absent or not approved.

- [ ] **Step 7: Commit**

```bash
git add src/i18n/locales/es/programs.json src/i18n/locales/en/programs.json src/i18n/locales/pt-br/programs.json scripts/test-program-copy.js docs/i18n/PROGRAM_PAGES_REVIEW_2026-07-11.md package.json package-lock.json
git commit -m "feat(i18n): add reviewed program landing copy"
```

---

### Task 3: Build the Program Template, Directory and Conversion Actions

**Files:**
- Create: `src/components/programs/ProgramDirectory.js`
- Create: `src/components/programs/ProgramOfferPanel.js`
- Modify: `src/templates/programLandingPage.js`
- Modify: `src/pages/diplomados.js:1-533`

**Interfaces:**
- `ProgramDirectory({ excludeProgramId?: string })` links every real program in the current locale.
- `ProgramOfferPanel({ program, programId })` reads price/duration from `programasOferta.js`.
- Program page emits `view_program`, `click_program_cta`, and `click_whatsapp` through `trackEvent`.

- [ ] **Step 1: Build the localized directory**

```javascript
// src/components/programs/ProgramDirectory.js
import * as React from "react"
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../../i18n"
const { PROGRAM_LANDING_ROUTES } = require("../../data/programLandingRoutes")

const ProgramDirectory = ({ excludeProgramId = "" }) => {
  const { t } = useTranslation("programs")
  const { localizedPath } = useLocalization()
  const routes = PROGRAM_LANDING_ROUTES.filter(route => route.id !== excludeProgramId)
  return (
    <nav aria-labelledby="other-programs-heading" className="bg-white py-10">
      <div className="mx-auto max-w-6xl px-6">
        <h2 id="other-programs-heading" className="text-2xl font-bold text-blue">
          {t("common.otherPrograms")}
        </h2>
        <ul className="mt-5 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map(route => (
            <li key={route.id}>
              <Link
                to={localizedPath(`/diplomados/${route.slug}/`)}
                className="block min-h-[48px] border border-blue/20 bg-white px-4 py-3 font-semibold text-blue hover:bg-blue/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                {t(`${route.id}.shortTitle`)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default ProgramDirectory
```

- [ ] **Step 2: Build the offer panel from the existing catalog**

```javascript
// src/components/programs/ProgramOfferPanel.js
import * as React from "react"
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../../i18n"
import { getInscripcionPagarUrl } from "../../data/programasOferta"
import { useVisitorGeo } from "../../hooks/useVisitorGeo"
import { getLocalizedPrice } from "../../utils/localizedPrice"

const { trackEvent } = require("../../utils/analytics")

const ProgramOfferPanel = ({ program, programId }) => {
  const { t } = useTranslation(["programs", "diplomados"])
  const { language, localizedPath } = useLocalization()
  const { geo } = useVisitorGeo()
  const { coin, price } = getLocalizedPrice(geo, program.priceMx, program.priceUsd)
  const checkoutPath = localizedPath(getInscripcionPagarUrl(programId))
  const priceNoteKey = program.promoInscripcionIncluida
    ? "common.priceNotePromoIncluded"
    : program.tipo === "guia"
      ? "common.priceNoteMonthly"
      : "common.priceNoteProgram"

  return (
    <aside className="border border-blue/20 bg-white p-6 shadow-lg" aria-label={t("common.currentPrice")}>
      <p className="text-sm font-semibold text-green">{t("common.online")}</p>
      <dl className="mt-4 grid gap-3">
        <div><dt className="text-xs text-gray">{t("common.duration")}</dt><dd className="font-bold text-blue">{t(`diplomados:programas.${programId}.duration`, { defaultValue: program.duration })}</dd></div>
        <div><dt className="text-xs text-gray">{t("common.currentPrice")}</dt><dd className="font-bold text-blue">${price} {coin}</dd></div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-gray">{t(priceNoteKey)}</p>
      <Link
        to={checkoutPath}
        onClick={() => trackEvent("click_program_cta", {
          language, program_id: programId, landing_path: typeof window === "undefined" ? "" : window.location.pathname, cta_position: "program_offer",
        })}
        className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center bg-green px-5 py-3 font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
      >
        {t("common.checkout")}
      </Link>
    </aside>
  )
}

export default ProgramOfferPanel
```

- [ ] **Step 3: Replace the minimal template with the complete page**

The template must:

1. resolve `program` with `getProgramaById(pageContext.programId)` and throw the explicit build invariant shown below if an unknown ID ever reaches the template;
2. use `useTranslation("programs")` and `useLocalization()`;
3. fire `view_program` once in `useEffect` with `language`, `program_id` and current path;
4. render compact hero, audience, three focus items, shared foundation, requirements, credential text, visible FAQs, `ProfessorsSection`, `ProgramOfferPanel`, WhatsApp and `ProgramDirectory`;
5. build WhatsApp with `buildWhatsAppUrl(t("common.whatsappMessage", { program: t(`${programId}.shortTitle`) }))` and emit `click_whatsapp` without sending the message to GA4;
6. link back to localized `/diplomados/`.

Use this exact page skeleton:

Required imports in addition to `Layout` and `Nav`:

```javascript
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../i18n"
import { getProgramaById } from "../data/programasOferta"
import { buildWhatsAppUrl } from "../data/contactoWhatsApp"
import ProgramDirectory from "../components/programs/ProgramDirectory"
import ProgramOfferPanel from "../components/programs/ProgramOfferPanel"
import ProfessorsSection from "../components/professorsSection"

const { trackEvent } = require("../utils/analytics")
```

Initialize the component with:

```javascript
const programId = pageContext.programId
const program = getProgramaById(programId)
const { t } = useTranslation(["programs", "diplomados"])
const { language, localizedPath } = useLocalization()
const trackedViewRef = React.useRef("")

React.useEffect(() => {
  const trackingKey = `${language}:${programId}:${window.location.pathname}`
  if (trackedViewRef.current === trackingKey) return
  trackedViewRef.current = trackingKey
  trackEvent("view_program", {
    language,
    program_id: programId,
    landing_path: window.location.pathname,
    cta_position: "program_page",
  })
}, [language, programId])

if (!program) {
  throw new Error(`Unknown program landing page: ${programId}`)
}
```

```jsx
<Layout>
  <section className="bg-blue text-white">
    <Nav textColor="text-white" />
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div>
        <Link to={localizedPath("/diplomados/")} className="text-sm underline">{t("common.back")}</Link>
        <p className="mt-6 text-xs font-semibold uppercase text-yellow">{t(`${programId}.eyebrow`)}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">{t(`${programId}.title`)}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/90">{t(`${programId}.intro`)}</p>
      </div>
      <ProgramOfferPanel program={program} programId={programId} />
    </div>
  </section>
  <section className="bg-white py-12">
    <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2">
      <div><h2 className="text-2xl font-bold text-blue">{t("common.audienceTitle")}</h2><p className="mt-4 leading-relaxed text-gray">{t(`${programId}.audience`)}</p></div>
      <div><h2 className="text-2xl font-bold text-blue">{t("common.focusTitle")}</h2><ul className="mt-4 list-disc space-y-3 pl-5 text-gray">{t(`${programId}.focus`, { returnObjects: true }).map(item => <li key={item}>{item}</li>)}</ul></div>
      <div><h2 className="text-2xl font-bold text-blue">{t("common.foundationTitle")}</h2><ul className="mt-4 list-disc space-y-3 pl-5 text-gray">{t("common.foundation", { returnObjects: true }).map(item => <li key={item}>{item}</li>)}</ul></div>
      <div><h2 className="text-2xl font-bold text-blue">{t("common.requirementsTitle")}</h2><p className="mt-4 leading-relaxed text-gray">{t("common.requirements")}</p></div>
    </div>
  </section>
  <section className="bg-blue/5 py-12">
    <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2">
      <div>
        <h2 className="text-2xl font-bold text-blue">{t("common.credentialTitle")}</h2>
        <p className="mt-4 leading-relaxed text-gray">{t(program.tipo === "guia" ? "common.guideCredential" : "common.diplomaCredential")}</p>
        <a
          href={buildWhatsAppUrl(t("common.whatsappMessage", { program: t(`${programId}.shortTitle`) }))}
          onClick={() => trackEvent("click_whatsapp", { language, program_id: programId, landing_path: typeof window === "undefined" ? "" : window.location.pathname, cta_position: "program_questions", lead_channel: "whatsapp" })}
          className="mt-5 inline-flex min-h-[48px] items-center bg-green px-5 py-3 font-semibold text-white"
        >
          {t("common.whatsapp")}
        </a>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-blue">{t("common.faqTitle")}</h2>
        <div className="mt-4 space-y-3">
          <details><summary className="font-semibold text-blue">{t("common.faqOnlineQuestion")}</summary><p className="mt-2 text-gray">{t("common.faqOnlineAnswer")}</p></details>
          <details><summary className="font-semibold text-blue">{t("common.faqDurationQuestion")}</summary><p className="mt-2 text-gray">{t("common.faqDurationAnswer", { duration: t(`diplomados:programas.${programId}.duration`, { defaultValue: program.duration }) })}</p></details>
          <details><summary className="font-semibold text-blue">{t("common.faqCostQuestion")}</summary><p className="mt-2 text-gray">{t("common.faqCostAnswer")}</p></details>
        </div>
      </div>
    </div>
  </section>
  <ProfessorsSection />
  <ProgramDirectory excludeProgramId={programId} />
</Layout>
```

- [ ] **Step 4: Add program discovery to the hub**

Import and render `<ProgramDirectory />` in `src/pages/diplomados.js` immediately before the existing price/program section. Do not replace checkout cards or change their payment behavior.

- [ ] **Step 5: Build and inspect one page per locale**

```bash
npm run build
rg -n "Guía Montessori en Casa de Niños" public/diplomados/casa-de-ninos/index.html
rg -n "Montessori Guide for Children's House" public/en/diplomados/casa-de-ninos/index.html
rg -n "Guia Montessori de Casa das Crianças" public/pt-br/diplomados/casa-de-ninos/index.html
```

Expected: each phrase appears only in its intended locale.

- [ ] **Step 6: Commit**

```bash
git add src/components/programs src/templates/programLandingPage.js src/pages/diplomados.js
git commit -m "feat(programs): add localized training landing experience"
```

---

### Task 4: Connect Stable Schema IDs and Localized Breadcrumbs

**Files:**
- Create: `src/utils/programSchemas.js`
- Create: `scripts/test-program-schemas.js`
- Modify: `src/components/seo.js:15-275`
- Modify: `src/templates/programLandingPage.js`
- Modify: `src/pages/roxana.js:91-109`
- Modify: `src/i18n/locales/es/common.json`
- Modify: `src/i18n/locales/en/common.json`
- Modify: `src/i18n/locales/pt-br/common.json`
- Modify: `static/llms.txt`
- Modify: `static/en/llms.txt`
- Modify: `static/pt-br/llms.txt`
- Modify: `package.json:43-68`

**Interfaces:**
- Produces `buildCourseSchema({ pageUrl, name, description, language, programId }) -> object`.
- `Seo` organization ID: `https://certificacionmontessori.com/#organization`.
- `Seo` website ID: `https://certificacionmontessori.com/#website`.
- Breadcrumb intermediate labels come from localized `common.breadcrumb.paths`.

- [ ] **Step 1: Write the failing schema contract**

```javascript
// scripts/test-program-schemas.js
const assert = require("assert")
const { buildCourseSchema } = require("../src/utils/programSchemas")

const schema = buildCourseSchema({
  pageUrl: "https://certificacionmontessori.com/en/diplomados/casa-de-ninos/",
  name: "Montessori Guide for Children's House",
  description: "Online professional training.",
  language: "en",
  programId: "casa",
})

assert.strictEqual(schema["@type"], "Course")
assert.strictEqual(schema.provider["@id"], "https://certificacionmontessori.com/#organization")
assert.strictEqual(schema.inLanguage, "en")
assert.strictEqual(schema.hasCourseInstance, undefined)
assert.strictEqual(schema.offers, undefined)
console.log("program schemas ok")
```

- [ ] **Step 2: Implement Course without unsupported claims**

```javascript
// src/utils/programSchemas.js
const ORGANIZATION_ID = "https://certificacionmontessori.com/#organization"

const buildCourseSchema = ({ pageUrl, name, description, language, programId }) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  "@id": `${pageUrl}#course`,
  name,
  description,
  url: pageUrl,
  inLanguage: language,
  courseCode: `AMMAC-${programId.toUpperCase()}`,
  provider: { "@id": ORGANIZATION_ID },
})

module.exports = { buildCourseSchema, ORGANIZATION_ID }
```

- [ ] **Step 3: Give core schemas stable IDs**

In `Seo`:

```javascript
const organizationId = `${siteUrl}/#organization`
const websiteId = `${siteUrl}/#website`
```

Add `"@id": organizationId` to the organization. Add `"@id": websiteId` and `publisher: { "@id": organizationId }` to WebSite. Add the WebPage properties shown below.

Use the concise public brand for browser-title suffixes while keeping the legal name in Organization schema:

```javascript
const titleSuffix = metadata?.siteName || defaultTitle
const fullTitle = title === titleSuffix ? title : `${title} | ${titleSuffix}`
```

For WebPage, use syntactically exact properties:

```javascript
"@id": `${pageUrl}#webpage`,
isPartOf: { "@id": websiteId },
```

In `buildRoxanaSchema`, add:

```javascript
"@id": "https://certificacionmontessori.com/roxana/#person",
```

and replace the nested `worksFor` object with:

```javascript
worksFor: { "@id": "https://certificacionmontessori.com/#organization" },
```

Change `buildBreadcrumbSchema` to accept `pathLabels`. Resolve non-final names with:

```javascript
name: isLast && title
  ? title
  : pathLabels?.[segment] || formatBreadcrumbName(segment),
```

Pass:

```javascript
pathLabels: tc("breadcrumb.paths", { returnObjects: true }),
```

Add locale keys:

```json
// es
"breadcrumb": { "inicio": "Inicio", "paths": { "diplomados": "Diplomados" } }
```

```json
// en
"breadcrumb": { "inicio": "Home", "paths": { "diplomados": "Diploma courses" } }
```

```json
// pt-br
"breadcrumb": { "inicio": "Início", "paths": { "diplomados": "Cursos de formação" } }
```

Merge `paths` into the existing `breadcrumb` object rather than creating duplicate JSON keys.

- [ ] **Step 4: Add localized Head to the program template**

Add these imports, merging the existing `useLocalization` import rather than duplicating it:

```javascript
import Seo from "../components/seo"
import { getT, useLocalization } from "../i18n"
import { LANGUAGES } from "../i18n/config"
import { buildCourseSchema } from "../utils/programSchemas"
```

```javascript
export const Head = ({ location, pageContext }) => {
  const t = getT(location.pathname, "programs")
  const language = LANGUAGES[pageContext.language]?.htmlLang || "es-MX"
  const pageUrl = `https://certificacionmontessori.com${location.pathname}`
  const schema = buildCourseSchema({
    pageUrl,
    name: t(`${pageContext.programId}.title`),
    description: t(`${pageContext.programId}.seoDescription`),
    language,
    programId: pageContext.programId,
  })
  return (
    <Seo
      title={t(`${pageContext.programId}.seoTitle`)}
      description={t(`${pageContext.programId}.seoDescription`)}
      pathname={location.pathname}
      schema={[schema]}
    />
  )
}
```

- [ ] **Step 5: Add canonical program inventory to all `llms.txt` files**

List the five localized canonical URLs and one-sentence descriptions in the matching language. State that `llms.txt` is informational and the HTML pages are the source of truth.

- [ ] **Step 6: Test schemas and build**

Add:

```json
"test:program-schemas": "node scripts/test-program-schemas.js"
```

Run:

```bash
npm run test:program-schemas
npm run build
rg -n '"@type":"Course"|"@id":"https://certificacionmontessori.com/#organization"' public/en/diplomados/casa-de-ninos/index.html
```

Expected: schema test passes; both stable IDs appear in HTML.

- [ ] **Step 7: Commit**

```bash
git add src/utils/programSchemas.js scripts/test-program-schemas.js src/components/seo.js src/templates/programLandingPage.js src/pages/roxana.js src/i18n/locales/es/common.json src/i18n/locales/en/common.json src/i18n/locales/pt-br/common.json static/llms.txt static/en/llms.txt static/pt-br/llms.txt package.json package-lock.json
git commit -m "feat(seo): connect program and organization schemas"
```

---

### Task 5: Enforce the 42-URL Built SEO Contract

**Files:**
- Create: `scripts/test-built-seo.js`
- Create: `scripts/test-production-seo.js`
- Modify: `scripts/test-sitemap-seo.js:1-47`
- Modify: `package.json:30-68`

**Interfaces:**
- `npm run test:seo-built` validates generated files without network.
- `node scripts/test-production-seo.js https://certificacionmontessori.com` validates production responses.
- Both expect exactly 42 canonical public URLs.

- [ ] **Step 1: Install one structured HTML/XML parser**

```bash
npm install --save-dev cheerio
```

- [ ] **Step 2: Write the complete built crawler**

```javascript
// scripts/test-built-seo.js
const assert = require("assert")
const fs = require("fs")
const path = require("path")
const cheerio = require("cheerio")
const {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_CODES,
  parsePath,
  localizePath,
} = require("../src/i18n/config")

const ORIGIN = "https://certificacionmontessori.com"
const publicDir = path.join(__dirname, "..", "public")
const sitemapIndex = fs.readFileSync(path.join(publicDir, "sitemap-index.xml"), "utf8")
const sitemap = fs.readFileSync(path.join(publicDir, "sitemap-0.xml"), "utf8")
const robots = fs.readFileSync(path.join(publicDir, "robots.txt"), "utf8")
assert(robots.includes("User-agent: Googlebot"))
assert(robots.includes("User-agent: Bingbot"))
assert(robots.includes("User-agent: OAI-SearchBot"))
assert(robots.includes("User-agent: GPTBot"))
assert(robots.includes("User-agent: ChatGPT-User"))
assert(robots.includes("Sitemap: https://certificacionmontessori.com/sitemap-index.xml"))

const indexXml = cheerio.load(sitemapIndex, { xmlMode: true })
const sitemapChildren = indexXml("sitemap > loc")
  .map((_, node) => indexXml(node).text().trim())
  .get()
assert.deepStrictEqual(sitemapChildren, [`${ORIGIN}/sitemap-0.xml`])

const xml = cheerio.load(sitemap, { xmlMode: true })
const urls = xml("url > loc").map((_, node) => xml(node).text().trim()).get()

assert.strictEqual(urls.length, 42, `expected 42 sitemap URLs, got ${urls.length}`)
assert.strictEqual(new Set(urls).size, 42, "sitemap URLs must be unique")

const builtFileForPathname = pathname => {
  const clean = decodeURIComponent(pathname)
  if (clean === "/") return path.join(publicDir, "index.html")
  if (path.extname(clean)) return path.join(publicDir, clean.replace(/^\//, ""))
  return path.join(publicDir, clean.replace(/^\//, "").replace(/\/$/, ""), "index.html")
}

const assertInternalLink = (href, sourceUrl) => {
  if (!href || href.startsWith("#") || /^(mailto|tel):/i.test(href)) return
  const target = new URL(href, sourceUrl)
  if (target.origin !== ORIGIN) return
  assert(
    !["/otroscursos", "/masterclasses"].some(legacy =>
      target.pathname === legacy || target.pathname.startsWith(`${legacy}/`)
    ),
    `${sourceUrl} links to legacy route ${target.pathname}`
  )
  const file = builtFileForPathname(target.pathname)
  const root = path.resolve(publicDir)
  const resolved = path.resolve(file)
  assert(
    resolved === root || resolved.startsWith(`${root}${path.sep}`),
    `${sourceUrl} has escaping internal path ${target.pathname}`
  )
  assert(fs.existsSync(resolved), `${sourceUrl} links to missing ${target.pathname}`)
}

for (const absolute of urls) {
  const url = new URL(absolute)
  assert.strictEqual(url.origin, ORIGIN)
  const file = builtFileForPathname(url.pathname)
  assert(fs.existsSync(file), `missing built HTML for ${absolute}`)
  const $ = cheerio.load(fs.readFileSync(file, "utf8"))
  assert.strictEqual($("html").attr("lang"), LANGUAGES[parsePath(url.pathname).language].htmlLang)
  assert.strictEqual($("title").length, 1)
  assert($("title").text().trim(), `${absolute} has an empty title`)
  assert.strictEqual($("meta[name=description]").length, 1)
  assert($("meta[name=description]").attr("content")?.trim(), `${absolute} has no description`)
  assert.strictEqual($("link[rel=canonical]").length, 1)
  assert.strictEqual($("link[rel=canonical]").attr("href"), absolute)
  assert(!String($("meta[name=robots]").attr("content") || "").toLowerCase().includes("noindex"), `${absolute} is noindex`)

  const alternates = $("link[rel=alternate][hreflang]").map((_, node) => ({
    lang: $(node).attr("hreflang"),
    href: $(node).attr("href"),
  })).get()
  assert.strictEqual(alternates.length, 4, `${absolute} must have four hreflang links`)
  const { originalPath } = parsePath(url.pathname)
  for (const code of LANGUAGE_CODES) {
    const alternate = alternates.find(item => item.lang === LANGUAGES[code].hreflang)
    assert(alternate, `${absolute} is missing ${LANGUAGES[code].hreflang}`)
    assert.strictEqual(alternate.href, `${ORIGIN}${localizePath(code, originalPath)}`)
  }
  const xDefault = alternates.find(item => item.lang === "x-default")
  assert(xDefault, `${absolute} is missing x-default`)
  assert.strictEqual(xDefault.href, `${ORIGIN}${localizePath(DEFAULT_LANGUAGE, originalPath)}`)

  const schemas = []
  $("script[type='application/ld+json']").each((_, node) => {
    const parsed = JSON.parse($(node).text())
    schemas.push(...(Array.isArray(parsed) ? parsed : [parsed]))
  })
  const types = schemas.map(schema => schema["@type"])
  assert(types.includes("EducationalOrganization"), `${absolute} lacks organization schema`)
  assert(types.includes("WebSite"), `${absolute} lacks website schema`)
  assert(types.includes("WebPage"), `${absolute} lacks webpage schema`)
  assert(schemas.some(schema => schema["@id"] === `${ORIGIN}/#organization`))
  assert(schemas.some(schema => schema["@id"] === `${ORIGIN}/#website`))
  assert(schemas.some(schema => schema["@id"] === `${absolute}#webpage`))
  if (originalPath !== "/") {
    assert(types.includes("BreadcrumbList"), `${absolute} lacks breadcrumb schema`)
  }
  if (/\/diplomados\/(nido-comunidad-infantil|casa-de-ninos|taller-i-ii|educacion-cosmica|neuroeducacion)\/$/.test(url.pathname)) {
    assert(types.includes("Course"), `${absolute} lacks Course schema`)
  }
  if (originalPath === "/publicaciones/") {
    assert(types.filter(type => type === "ItemList").length >= 2)
    assert.strictEqual(types.filter(type => type === "Book").length, 5)
  }
  if (originalPath === "/roxana/") {
    assert(schemas.some(schema => schema["@id"] === `${ORIGIN}/roxana/#person`))
  }

  $("a[href]").each((_, node) => assertInternalLink($(node).attr("href"), absolute))
}

console.log("built SEO contract ok: 42 URLs")
```

- [ ] **Step 3: Add the production HTTP checker**

```javascript
// scripts/test-production-seo.js
const assert = require("assert")
const cheerio = require("cheerio")
const {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_CODES,
  parsePath,
  localizePath,
} = require("../src/i18n/config")

const origin = String(process.argv[2] || "").replace(/\/$/, "")
if (origin !== "https://certificacionmontessori.com") {
  throw new Error("production origin must be https://certificacionmontessori.com")
}

async function run() {
  const fetchProduction = (url, options = {}) => fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
    ...options,
  })

  const robotsResponse = await fetchProduction(`${origin}/robots.txt`)
  assert.strictEqual(robotsResponse.status, 200)
  const robots = await robotsResponse.text()
  assert(robots.includes("User-agent: Googlebot"))
  assert(robots.includes("User-agent: Bingbot"))
  assert(robots.includes("User-agent: OAI-SearchBot"))
  assert(robots.includes("User-agent: GPTBot"))
  assert(robots.includes("User-agent: ChatGPT-User"))
  assert(robots.includes("Sitemap: https://certificacionmontessori.com/sitemap-index.xml"))

  const indexResponse = await fetchProduction(`${origin}/sitemap-index.xml`)
  assert.strictEqual(indexResponse.status, 200)
  const indexXml = cheerio.load(await indexResponse.text(), { xmlMode: true })
  const sitemapChildren = indexXml("sitemap > loc")
    .map((_, node) => indexXml(node).text().trim())
    .get()
  assert.deepStrictEqual(sitemapChildren, [`${origin}/sitemap-0.xml`])

  const sitemapResponse = await fetchProduction(sitemapChildren[0])
  assert.strictEqual(sitemapResponse.status, 200)
  const xmlText = await sitemapResponse.text()
  const xml = cheerio.load(xmlText, { xmlMode: true })
  const urls = xml("url > loc").map((_, node) => xml(node).text().trim()).get()
  assert.strictEqual(urls.length, 42)
  assert.strictEqual(new Set(urls).size, 42)

  for (const url of urls) {
    assert.strictEqual(new URL(url).origin, origin)
    const response = await fetchProduction(url)
    assert.strictEqual(response.status, 200, `${url} returned ${response.status}`)
    const $ = cheerio.load(await response.text())
    const parsedPath = parsePath(new URL(url).pathname)
    assert.strictEqual($("html").attr("lang"), LANGUAGES[parsedPath.language].htmlLang)
    assert.strictEqual($("title").length, 1)
    assert($("title").text().trim())
    assert.strictEqual($("meta[name=description]").length, 1)
    assert($("meta[name=description]").attr("content")?.trim())
    assert.strictEqual($("link[rel=canonical]").length, 1)
    assert.strictEqual($("link[rel=canonical]").attr("href"), url)
    assert(!String($("meta[name=robots]").attr("content") || "").toLowerCase().includes("noindex"))

    const alternates = $("link[rel=alternate][hreflang]").map((_, node) => ({
      lang: $(node).attr("hreflang"),
      href: $(node).attr("href"),
    })).get()
    assert.strictEqual(alternates.length, 4)
    for (const code of LANGUAGE_CODES) {
      const alternate = alternates.find(item => item.lang === LANGUAGES[code].hreflang)
      assert(alternate, `${url} is missing ${LANGUAGES[code].hreflang}`)
      assert.strictEqual(alternate.href, `${origin}${localizePath(code, parsedPath.originalPath)}`)
    }
    assert.strictEqual(
      alternates.find(item => item.lang === "x-default")?.href,
      `${origin}${localizePath(DEFAULT_LANGUAGE, parsedPath.originalPath)}`
    )

    const schemas = []
    $("script[type='application/ld+json']").each((_, node) => {
      const parsed = JSON.parse($(node).text())
      schemas.push(...(Array.isArray(parsed) ? parsed : [parsed]))
    })
    const types = schemas.map(schema => schema["@type"])
    assert(types.includes("EducationalOrganization"))
    assert(types.includes("WebSite"))
    assert(types.includes("WebPage"))
    assert(schemas.some(schema => schema["@id"] === `${origin}/#organization`))
    assert(schemas.some(schema => schema["@id"] === `${origin}/#website`))
    assert(schemas.some(schema => schema["@id"] === `${url}#webpage`))
    if (parsedPath.originalPath !== "/") assert(types.includes("BreadcrumbList"))
    if (/\/diplomados\/(nido-comunidad-infantil|casa-de-ninos|taller-i-ii|educacion-cosmica|neuroeducacion)\/$/.test(new URL(url).pathname)) {
      assert(types.includes("Course"), `${url} lacks Course schema`)
    }
    if (parsedPath.originalPath === "/publicaciones/") {
      assert(types.filter(type => type === "ItemList").length >= 2)
      assert.strictEqual(types.filter(type => type === "Book").length, 5)
    }
    if (parsedPath.originalPath === "/roxana/") {
      assert(schemas.some(schema => schema["@id"] === `${origin}/roxana/#person`))
    }

    $("a[href]").each((_, node) => {
      const href = $(node).attr("href")
      if (!href || href.startsWith("#") || /^(mailto|tel):/i.test(href)) return
      const target = new URL(href, url)
      if (target.origin !== origin) return
      assert(
        !["/otroscursos", "/masterclasses"].some(legacy =>
          target.pathname === legacy || target.pathname.startsWith(`${legacy}/`)
        ),
        `${url} links to legacy route ${target.pathname}`
      )
    })
  }
  console.log("production SEO contract ok: 42 URLs")
}

run().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
```

- [ ] **Step 4: Expand the existing sitemap contract**

In `scripts/test-sitemap-seo.js`, add all 15 localized program routes to `publicPages` using `PROGRAM_LANDING_ROUTES` and `LANGUAGE_CODES`. Assert that transactional pages remain excluded and every generated program route remains included.

- [ ] **Step 5: Add scripts and run the complete local gate**

Add:

```json
"test:program-pages": "npm run test:program-routes && npm run test:program-copy && npm run test:program-schemas",
"test:seo-built": "node scripts/test-built-seo.js",
"test:seo-production": "node scripts/test-production-seo.js https://certificacionmontessori.com"
```

Run:

```bash
npm run test:program-pages
npm run test:seo-sitemap
npm run build
npm run test:seo-built
```

Expected: all contracts pass and print `42 URLs`.

- [ ] **Step 6: Commit**

```bash
git add scripts/test-built-seo.js scripts/test-production-seo.js scripts/test-sitemap-seo.js package.json package-lock.json
git commit -m "test(seo): enforce 42 localized canonical pages"
```

---

### Task 6: Preview, Deploy, Submit Changed URLs and Activate the Editorial Funnel

**Files:**
- Create: `tests/e2e/program-pages.spec.js`
- Modify: `docs/SEO_MONITORING_RUNBOOK.md`
- Environment only: `/home/carlos/montessori-blog-automation/.env`

**Interfaces:**
- Production release gate for both repositories.
- Activates `CONVERSION_CTA_ENABLED=1` only after production success.

- [ ] **Step 1: Add browser coverage for all locales**

```javascript
// tests/e2e/program-pages.spec.js
const { test, expect } = require("@playwright/test")

const cases = [
  ["/diplomados/casa-de-ninos/", "Guía Montessori en Casa de Niños", "Colegiatura mensual"],
  ["/en/diplomados/casa-de-ninos/", "Montessori Guide for Children's House", "Monthly tuition"],
  ["/pt-br/diplomados/casa-de-ninos/", "Guia Montessori de Casa das Crianças", "Mensalidade"],
]

for (const [url, heading, priceMeaning] of cases) {
  test(`${url} renders localized program content`, async ({ page }) => {
    await page.goto(url)
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible()
    await expect(page.getByRole("link", { name: /online|línea|on-line/i }).first()).toBeVisible()
    await expect(page.getByText(new RegExp(priceMeaning, "i")).first()).toBeVisible()
    await expect(page.locator("script[type='application/ld+json']")).not.toHaveCount(0)
    const width = await page.locator("body").evaluate(body => body.scrollWidth <= window.innerWidth + 1)
    expect(width).toBe(true)
  })
}

test("catalog pricing semantics distinguish tuition, program cost and promotion", async ({ page }) => {
  for (const [url, meaning] of [
    ["/diplomados/casa-de-ninos/", "Colegiatura mensual"],
    ["/diplomados/educacion-cosmica/", "Costo del programa"],
    ["/diplomados/neuroeducacion/", "Promoción vigente"],
  ]) {
    await page.goto(url)
    await expect(page.getByText(new RegExp(meaning, "i")).first()).toBeVisible()
  }
})
```

- [ ] **Step 2: Run local and preview gates**

```bash
npm run test:program-pages
npm run test:seo-redirects
npm run test:seo-sitemap
npm run test:analytics
npm run test:analytics-consent
npm run test:wordpress-posts
npm run test:wordpress-source
npm run test:publication-schemas
npm run test:indexnow
npm run build
npm run test:seo-built
npm run test:e2e
npm run deploy:preview
```

Expected: all tests pass and Firebase prints a preview URL.

- [ ] **Step 3: Enforce the representative program performance budget**

Start the already-built site in one terminal:

```bash
npm run serve:test
```

In a second terminal run:

```bash
npx lighthouse http://127.0.0.1:9000/diplomados/casa-de-ninos/ --only-categories=performance --form-factor=mobile --output=json --output-path=test-results/lighthouse-program-casa.json --chrome-flags="--headless --no-sandbox"
node scripts/test-lighthouse-budget.js test-results/lighthouse-program-casa.json
```

Expected: representative program LCP is at most 2.5 seconds, CLS at most 0.1 and TBT at most 200 milliseconds. Stop the dedicated server after this command.

- [ ] **Step 4: Inspect preview visually and technically**

Inspect `/publicaciones/` plus the three Casa de Niños URLs at desktop `1440x900` and mobile `390x844`. Confirm:

```text
No overlap or horizontal scroll.
Program name is the first-viewport signal.
CTA text fits.
Articles remain first in /publicaciones/.
Books and Amazon links remain reachable.
Canonical on preview still points to production.
```

- [ ] **Step 5: Deploy production only after review**

```bash
npm run deploy
npm run test:seo-production
```

Expected: Firebase deploy succeeds, then all 42 production URLs return `200` with self-canonical.

- [ ] **Step 6: Submit only changed commercial URLs to IndexNow**

```bash
npm run indexnow:submit -- \
  /publicaciones/ \
  /diplomados/ \
  /diplomados/nido-comunidad-infantil/ \
  /diplomados/casa-de-ninos/ \
  /diplomados/taller-i-ii/ \
  /diplomados/educacion-cosmica/ \
  /diplomados/neuroeducacion/ \
  /en/diplomados/nido-comunidad-infantil/ \
  /en/diplomados/casa-de-ninos/ \
  /en/diplomados/taller-i-ii/ \
  /en/diplomados/educacion-cosmica/ \
  /en/diplomados/neuroeducacion/ \
  /pt-br/diplomados/nido-comunidad-infantil/ \
  /pt-br/diplomados/casa-de-ninos/ \
  /pt-br/diplomados/taller-i-ii/ \
  /pt-br/diplomados/educacion-cosmica/ \
  /pt-br/diplomados/neuroeducacion/
```

Expected: IndexNow accepts 17 URLs. Do not resubmit `sitemap-index.xml`; its location did not change.

- [ ] **Step 7: Inspect representative URLs without exhausting Google quota**

Use Search Console URL Inspection for:

```text
https://certificacionmontessori.com/diplomados/casa-de-ninos/
https://certificacionmontessori.com/en/diplomados/casa-de-ninos/
https://certificacionmontessori.com/pt-br/diplomados/casa-de-ninos/
```

Request indexing only if live inspection confirms each is indexable. Bing relies on IndexNow plus sitemap processing.

- [ ] **Step 8: Activate the editorial feature flag**

In `/home/carlos/montessori-blog-automation/.env`, set:

```dotenv
CONVERSION_CTA_ENABLED=1
CERTIFICATION_SITE_URL=https://certificacionmontessori.com
WHATSAPP_PHONE=5215548885013
```

Restart and run safe checks:

```bash
systemctl --user restart montessori-blog.timer montessori-cuadernillos.timer
DRY_RUN=1 ./run.sh
python run_cuadernillos.py --limit 1 --dry-run
```

Expected: generated HTML decision stats follow high/medium/low rules; dry run creates no WordPress draft.

- [ ] **Step 9: Create and inspect one real draft**

Run one normal pipeline cycle only when the draft buffer permits. Inspect the WordPress draft before publication:

```text
Destination is one of six configured routes.
UTM source, medium, campaign, content and term are present.
Medium has one contextual link and no final block.
High has one contextual link and one final block with secondary WhatsApp.
Low has no commercial element.
Telegram shows intent/relevance/destination but no secret.
```

Publish only after editorial approval. Confirm WordPress IndexNow fires only at that transition.

- [ ] **Step 10: Record release and monitoring checkpoints**

Append deployment timestamp, commit hashes, Firebase release, GA4 DebugView result and IndexNow receipt to `docs/SEO_MONITORING_RUNBOOK.md`. Schedule observations at 48 hours, 7, 28 and 90 days. At 28 and 90 days record field p75 LCP, INP and CLS by locale when Search Console/CrUX has enough samples; explicitly record `insufficient data` rather than substituting laboratory TBT for INP.

- [ ] **Step 11: Commit browser test and runbook update**

```bash
git add tests/e2e/program-pages.spec.js docs/SEO_MONITORING_RUNBOOK.md
git commit -m "test(seo): record multilingual production rollout"
```

## Plan Completion Gate

This gate completes the commercial-site rollout and editorial CTA activation. The overall roadmap remains open until the separate WordPress Editorial SEO Completion plan passes Gate E.

```bash
npm run test:program-pages
npm run test:seo-redirects
npm run test:seo-sitemap
npm run test:analytics
npm run test:analytics-consent
npm run test:wordpress-posts
npm run test:wordpress-source
npm run test:publication-schemas
npm run test:indexnow
npm run build
npm run test:seo-built
npm run test:e2e
npm run test:seo-production
```

Expected:

- every command exits `0`;
- sitemap has exactly 42 canonical URLs;
- 15 new program pages are live and localized;
- `/publicaciones/` remains article-first and iframe-free;
- GA4 receives no PII;
- IndexNow has only changed public URLs;
- editorial CTA activation occurred after the production `200` gate.
