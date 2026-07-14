# Home Guide Intent Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reforzar en las tres portadas localizadas la intención de búsqueda sobre el rol y la formación de la Guía Montessori sin crear una URL competidora ni alterar el embudo comercial existente.

**Architecture:** El cambio reutiliza la franja `educacion` ya renderizada por `src/pages/index.js`; toda la nueva redacción vive en los archivos `home.json`, siguiendo la arquitectura i18n actual. El contrato de SEO construido valida el título y el contenido visible de las tres portadas antes de Firebase; no se crean componentes, rutas, dependencias ni nuevos tipos de schema.

**Tech Stack:** Gatsby 5, React 18, react-i18next, JSON de traducciones, Cheerio, Node.js, Firebase Hosting, IndexNow, Google Search Console y Bing Webmaster Tools.

## Global Constraints

- La portada española mantiene `/`; las traducciones mantienen `/en/` y `/pt-br/`.
- No crear `/guia-montessori/` ni otra URL que compita con la portada.
- `/diplomados/` y sus traducciones no cambian en esta implementación.
- La portada conserva exactamente un H1; el nuevo encabezado informativo es H2.
- Conservar hero, programas, precios, fechas, CTA, imágenes, layout y schema actuales.
- No agregar FAQ, texto oculto, tarjetas, acordeones, animaciones ni dependencias.
- El título final de cada portada debe tener 65 caracteres o menos.
- Conservar las descripciones SEO actuales en los tres idiomas.
- Usar `Montessori Guide` en inglés y `Guia Montessori` en portugués brasileño, según los glosarios del repositorio.
- Notificar por IndexNow una sola vez y únicamente las tres portadas modificadas.
- No reenviar el sitemap ni repetir solicitudes manuales de indexación en Google Search Console.
- No interpretar una variación de corto plazo como causalidad ni prometer una posición concreta.

---

### Task 1: Add the Built-HTML Contract and Localized Guide Copy

**Files:**
- Modify: `scripts/test-seo-built.js`
- Modify: `src/i18n/locales/es/home.json`
- Modify: `src/i18n/locales/en/home.json`
- Modify: `src/i18n/locales/pt-br/home.json`

**Interfaces:**
- Consumes: `readHtml(pathname) -> string`, ya definido en `scripts/test-seo-built.js`.
- Produces: tres portadas construidas con título SEO localizado, H2 localizado y respuesta visible sobre el rol de la Guía Montessori.
- No cambia ninguna interfaz de React, ruta o estructura JSON fuera de `seo.title`, `educacion.titulo` y `educacion.p1`.

- [ ] **Step 1: Write the failing built-HTML contract**

Agregar después de `transactionalPaths` en `scripts/test-seo-built.js`:

```javascript
const homeGuideIntent = [
  {
    pathname: "/",
    title: "Certificación de Guía Montessori Online | AMMAC",
    heading: "¿Qué hace una Guía Montessori?",
    answer:
      "Una Guía Montessori observa el desarrollo de cada niña y niño, prepara el ambiente y presenta los materiales en el momento adecuado.",
  },
  {
    pathname: "/en/",
    title: "Online Montessori Guide Certification | AMMAC",
    heading: "What does a Montessori Guide do?",
    answer:
      "A Montessori Guide observes each child's development, prepares the learning environment, and presents materials at the appropriate moment.",
  },
  {
    pathname: "/pt-br/",
    title: "Certificação Montessori Online | Formação de Guias | AMMAC",
    heading: "O que faz uma Guia Montessori?",
    answer:
      "Uma Guia Montessori observa o desenvolvimento de cada criança, prepara o ambiente e apresenta os materiais no momento adequado.",
  },
]
```

Agregar inmediatamente antes de
`for (const originalPath of transactionalPaths) {`:

```javascript
  for (const expectation of homeGuideIntent) {
    const $ = cheerio.load(readHtml(expectation.pathname))
    const headings = $("main h2")
      .toArray()
      .map(element => $(element).text().replace(/\s+/g, " ").trim())
    const mainText = $("main").text().replace(/\s+/g, " ").trim()

    assert.strictEqual(
      $("title").text().trim(),
      expectation.title,
      `${expectation.pathname} must expose the approved guide-intent title`
    )
    assert(
      headings.includes(expectation.heading),
      `${expectation.pathname} must expose the localized guide-role H2`
    )
    assert(
      mainText.includes(expectation.answer),
      `${expectation.pathname} must expose the localized guide-role answer`
    )
  }
```

- [ ] **Step 2: Run the contract and verify the expected RED state**

Run:

```bash
npm run build
npm run test:seo-built
```

Expected: FAIL on `/` because the current built title is
`Certificación Montessori Online | AMMAC`, not
`Certificación de Guía Montessori Online | AMMAC`. The failure must be an
assertion mismatch, not a syntax or missing-file error.

- [ ] **Step 3: Apply the minimal Spanish locale change**

In `src/i18n/locales/es/home.json`, set:

```json
"seo": {
  "title": "Certificación de Guía Montessori Online",
  "description": "Inscríbete a diplomados Guía Montessori 100% en línea. Certificación internacional, próximo ciclo con cupo limitado. Aparta tu lugar desde $4,900 MXN."
}
```

Replace `educacion` with:

```json
"educacion": {
  "titulo": "¿Qué hace una Guía Montessori?",
  "p1": "Una Guía Montessori <destacado>observa el desarrollo de cada niña y niño, prepara el ambiente y presenta los materiales en el momento adecuado.</destacado> Acompaña la autonomía sin sustituir la iniciativa del estudiante y vincula la observación, la familia y la comunidad educativa. La formación de AMMAC desarrolla estas competencias en el nivel Montessori que elijas."
}
```

- [ ] **Step 4: Apply the reviewed English and Brazilian Portuguese copy**

In `src/i18n/locales/en/home.json`, preserve `seo` and replace `educacion` with:

```json
"educacion": {
  "titulo": "What does a Montessori Guide do?",
  "p1": "A Montessori Guide <destacado>observes each child's development, prepares the learning environment, and presents materials at the appropriate moment.</destacado> The Guide supports independence without replacing the learner's initiative and connects observation with families and the learning community. AMMAC training develops these competencies for the Montessori level you choose."
}
```

In `src/i18n/locales/pt-br/home.json`, preserve `seo` and replace `educacion` with:

```json
"educacion": {
  "titulo": "O que faz uma Guia Montessori?",
  "p1": "Uma Guia Montessori <destacado>observa o desenvolvimento de cada criança, prepara o ambiente e apresenta os materiais no momento adequado.</destacado> A Guia apoia a autonomia sem substituir a iniciativa do aluno e conecta a observação às famílias e à comunidade educativa. A formação da AMMAC desenvolve essas competências para o nível Montessori escolhido."
}
```

- [ ] **Step 5: Build and verify the GREEN state**

Run:

```bash
npm run build
npm run test:seo-built
```

Expected: Gatsby build completes and the contract prints:

```text
Built SEO contract ok: 27 canonical URLs, 9 per language
```

- [ ] **Step 6: Run the full pre-deployment foundation**

Run:

```bash
npm run test:foundation
git diff --check
```

Expected: analytics, WordPress analytics, consent, instrumentation, IndexNow,
redirect, sitemap and hosting contracts all pass; `git diff --check` emits no
output.

- [ ] **Step 7: Commit the tested implementation**

```bash
git add scripts/test-seo-built.js src/i18n/locales/es/home.json src/i18n/locales/en/home.json src/i18n/locales/pt-br/home.json
git commit -m "feat(seo): strengthen home guide intent"
```

Expected: one commit containing only the contract and the three locale files.

---

### Task 2: Deploy, Verify Production, and Notify IndexNow Once

**Files:**
- Read: `public/index.html`
- Read: `public/en/index.html`
- Read: `public/pt-br/index.html`
- Read: `public/sitemap-0.xml`
- Read: `static/indexnow-key.txt`

**Interfaces:**
- Consumes: the green built output from Task 1 and the existing Firebase/IndexNow scripts.
- Produces: a verified Firebase release and one accepted IndexNow batch containing exactly three canonical URLs.
- Does not modify source files.

- [ ] **Step 1: Deploy through the guarded production command**

Run:

```bash
npm run deploy
```

Expected: `test:foundation`, Gatsby build and `test:seo-built` pass before
Firebase reports the Hosting release complete. Stop if any prerequisite fails.

- [ ] **Step 2: Run the deployed-hosting contract**

Run:

```bash
npm run test:deployed-hosting -- https://certificacionmontessori.com
```

Expected: the contract validates the 27 canonical URLs, localized redirects,
canonicales, `hreflang`, robots, sitemap, AI files and IndexNow verification
without error.

- [ ] **Step 3: Verify the three public titles and H2 elements**

Run:

```bash
node - <<'NODE'
const assert = require("assert")
const cheerio = require("cheerio")

const expected = [
  ["/", "Certificación de Guía Montessori Online | AMMAC", "¿Qué hace una Guía Montessori?"],
  ["/en/", "Online Montessori Guide Certification | AMMAC", "What does a Montessori Guide do?"],
  ["/pt-br/", "Certificação Montessori Online | Formação de Guias | AMMAC", "O que faz uma Guia Montessori?"],
]

;(async () => {
  for (const [pathname, title, heading] of expected) {
    const response = await fetch(`https://certificacionmontessori.com${pathname}`)
    assert.strictEqual(response.status, 200, pathname)
    const $ = cheerio.load(await response.text())
    assert.strictEqual($("title").text().trim(), title, pathname)
    assert.strictEqual($("h1").length, 1, pathname)
    assert(
      $("main h2").toArray().some(element => $(element).text().replace(/\s+/g, " ").trim() === heading),
      pathname
    )
    console.log(`production home ok: ${pathname}`)
  }
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
NODE
```

Expected:

```text
production home ok: /
production home ok: /en/
production home ok: /pt-br/
```

- [ ] **Step 4: Validate the exact IndexNow batch without network submission**

Run:

```bash
INDEXNOW_DRY_RUN=1 npm run indexnow:submit -- / /en/ /pt-br/
```

Expected: `urlList` contains exactly these three values and no others:

```text
https://certificacionmontessori.com/
https://certificacionmontessori.com/en/
https://certificacionmontessori.com/pt-br/
```

- [ ] **Step 5: Submit the changed URLs exactly once**

Run once:

```bash
npm run indexnow:submit -- / /en/ /pt-br/
```

Expected:

```text
IndexNow accepted 3 URL(s)
```

Do not repeat the command after an accepted response.

---

### Task 3: Record the Experiment and Push the Reviewed Commits

**Files:**
- Modify: `docs/SEO_MONITORING_RUNBOOK.md`

**Interfaces:**
- Consumes: the Search Console baseline from the design and the production evidence from Task 2.
- Produces: a dated experiment record with fixed follow-up dates.

- [ ] **Step 1: Add the dated experiment record**

Insert before `## Acceso de crawlers e IA` in
`docs/SEO_MONITORING_RUNBOOK.md`:

```markdown
## Experimento SEO: intención «Guía Montessori»

| Control | Estado | Fecha de evidencia | Evidencia/resultado |
| --- | --- | --- | --- |
| Línea base de Google | `COMPLETADO_CON_EVIDENCIA` | `2026-07-14` | Search Console, búsqueda Web, últimos 28 días y consulta que contiene `guia montessori`: `200` impresiones, `6` clics, CTR `3 %` y posición media `6,3`. La portada reúne `189` impresiones y los `6` clics; `/diplomados/` reúne `21` impresiones y `0` clics. La consulta exacta `guia montessori` aporta `153` impresiones y `2` clics. Las filas pueden solaparse por la agregación de Search Console. |
| Decisión de intención | `COMPLETADO_CON_EVIDENCIA` | `2026-07-14` | La portada conserva la intención `Guía Montessori`; no se crea `/guia-montessori/`. `/diplomados/` conserva su intención específica. Se sustituyó la franja genérica por una respuesta localizada sobre el rol de la Guía y el título español pasó a `Certificación de Guía Montessori Online | AMMAC`. |
| Producción e IndexNow | `COMPLETADO_CON_EVIDENCIA` | `2026-07-14` | Los contratos local y público validaron las tres portadas, un solo H1, H2 localizado, canonicales, `hreflang`, robots y JSON-LD. IndexNow aceptó una sola vez exactamente `/`, `/en/` y `/pt-br/`. No se reenvió el sitemap ni se repitieron solicitudes manuales en Google. |
| Seguimiento | `PROGRAMADO` | `2026-07-21`, `2026-08-11`, `2026-10-12` | A 7 días: rastreo y títulos observados. A 28 días: impresiones, clics, CTR, posición y reparto por página. A 90 días: tendencia por idioma, consultas de formación y leads atribuidos en GA4. No se atribuye causalidad con muestras pequeñas. |
```

- [ ] **Step 2: Validate documentation and repository state**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only
`docs/SEO_MONITORING_RUNBOOK.md` remains modified after the implementation
commit.

- [ ] **Step 3: Commit the production evidence**

```bash
git add docs/SEO_MONITORING_RUNBOOK.md
git commit -m "docs(seo): record home guide intent experiment"
```

- [ ] **Step 4: Re-run the final verification gate**

Run:

```bash
npm run test:foundation
npm run test:seo-built
git status --short --branch
```

Expected: all contracts pass and the branch is clean with local commits ahead
of `origin/main`.

- [ ] **Step 5: Push the design, implementation, and evidence commits**

```bash
git push origin main
```

Expected: `main -> main`; do not alter or suppress unrelated remote security
alerts reported by GitHub.
