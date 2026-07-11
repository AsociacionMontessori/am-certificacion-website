# AMMAC Organic Search Funnel Implementation Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar el embudo orgánico multilingüe aprobado mediante cinco planes independientes que producen software comprobable y pueden desplegarse sin activar enlaces hacia páginas inexistentes.

**Architecture:** La automatización editorial se prepara primero detrás de `CONVERSION_CTA_ENABLED=0`. La medición e IndexNow se instalan como base; después se sustituye el iframe de publicaciones, se publican las páginas de programa y se activa el embudo. La última fase limpia la superficie editorial de WordPress y completa Google/Bing para ambos dominios. Cada repositorio conserva commits separados y cada despliegue tiene una reversión definida.

**Tech Stack:** Python 3.10+, `unittest`, BeautifulSoup, WordPress REST API, Gatsby 5, React 18, i18next, GA4, Firebase Hosting, Node.js scripts, IndexNow, Playwright.

## Global Constraints

- Español es el idioma prioritario; inglés y portugués brasileño deben quedar completos y revisados antes de indexarse.
- Español vive en la raíz, inglés en `/en/` y portugués brasileño en `/pt-br/`.
- `x-default` apunta a la variante española equivalente.
- Montessori México conserva el canonical de sus artículos; no se copian artículos al dominio comercial.
- Los modelos solo devuelven enums; nunca construyen URLs comerciales.
- Relevancia alta recibe enlace contextual, CTA final y WhatsApp secundario; media recibe un enlace; baja no recibe promoción.
- GA4 no recibe nombres, correos, teléfonos, mensajes ni otros datos personales.
- `click_whatsapp` no equivale a conversación ni a cliente potencial cualificado.
- IndexNow recibe solo URLs públicas creadas, modificadas o eliminadas; crear un borrador no lo activa.
- Fallos de Telegram, GA4, IndexNow o refresco WordPress no bloquean creación de borradores, navegación o despliegue.
- Los 27 URLs públicos actuales deben convertirse en 42 al añadir cinco programas por tres idiomas.
- No se reinician validaciones en Search Console ni se reenvían sitemaps mientras los buscadores estén procesando.
- Los cambios sin confirmar que ya existen en el repositorio Gatsby no se descartan ni se mezclan accidentalmente con commits nuevos.
- El token Telegram revocado nunca se copia a documentación, pruebas, mensajes o commits.
- Marketing pagado, Meta, email, CRM, colaboraciones y redes sociales permanecen fuera de estos planes.

---

## Dependency Order

1. [Editorial Funnel and Secret-Safe Logging](./2026-07-11-editorial-funnel-security.md)
2. [Analytics and IndexNow Foundation](./2026-07-11-analytics-indexnow-foundation.md)
3. [Native Publications Experience](./2026-07-11-native-publications.md)
4. [Multilingual Program Pages and SEO Rollout](./2026-07-11-program-pages-seo-rollout.md)
5. [WordPress Editorial SEO Completion](./2026-07-11-wordpress-editorial-seo.md)

## Preflight

- [ ] **Step 1: Preserve the already deployed SEO baseline in a separate commit**

In `/home/carlos/Documentos/Repositorios/certificacionMontessori`, inspect only the existing baseline files:

```bash
git diff -- firebase.json gatsby-config.js package.json
git status --short docs/SEO_INDEXACION_2026-07-09.md scripts/test-seo-redirects.js scripts/test-sitemap-seo.js
```

Expected: redirect, sitemap and regression-test changes only. Do not stage plan files with this baseline.

- [ ] **Step 2: Run the existing baseline checks**

```bash
npm run test:seo-redirects
npm run build
npm run test:seo-sitemap
```

Expected: both contract scripts print their success message and Gatsby completes a production build.

- [ ] **Step 3: Commit the baseline separately**

```bash
git add firebase.json gatsby-config.js package.json docs/SEO_INDEXACION_2026-07-09.md scripts/test-seo-redirects.js scripts/test-sitemap-seo.js
git commit -m "fix(seo): preserve indexable sitemap and legacy redirects"
```

Expected: the commit includes exactly those six paths.

- [ ] **Step 4: Commit the approved implementation plans separately**

```bash
git add docs/superpowers/plans/2026-07-11-organic-search-funnel-roadmap.md docs/superpowers/plans/2026-07-11-editorial-funnel-security.md docs/superpowers/plans/2026-07-11-analytics-indexnow-foundation.md docs/superpowers/plans/2026-07-11-native-publications.md docs/superpowers/plans/2026-07-11-program-pages-seo-rollout.md docs/superpowers/plans/2026-07-11-wordpress-editorial-seo.md
git commit -m "docs(seo): plan multilingual organic search funnel"
```

Expected: the documentation commit contains exactly the six plan files and follows the baseline commit.

- [ ] **Step 5: Create isolated execution worktrees**

Create one worktree per repository at execution time through the required worktree skill. Do not copy `.env`, `logs/`, Gatsby `public/`, `.cache/` or Python `data/blog_state.db` into Git.

Expected branches:

```text
codex/editorial-search-funnel
codex/certification-search-funnel
```

- [ ] **Step 6: Prepare dependencies without copying secrets**

In the Gatsby worktree run:

```bash
npm ci
```

In the automation worktree shell, point `python` at the existing virtual environment and export the original ignored environment only into that shell process:

```bash
export PATH="/home/carlos/montessori-blog-automation/.venv/bin:$PATH"
set -a
source /home/carlos/montessori-blog-automation/.env
set +a
```

Do not echo the environment, create a second `.env`, or start the live user services from a worktree. Live dry runs and service restarts occur only after the reviewed branches have been integrated into their original repositories.

## Release Gates

### Gate A: editorial code remains disabled

- All automation tests pass.
- Logs contain no Telegram token pattern.
- Draft notifications include intent and destination.
- `CONVERSION_CTA_ENABLED` remains `0` in the live `.env`.

### Gate B: measurement foundation is observable

- Neither domain requests Google tag or Analytics before analytics consent.
- Rejecting or revoking consent preserves navigation, contact and checkout.
- The commercial GA4 property receives both hostnames without duplicate `page_view` in that property.
- `_gl` survives navigation from Montessori México to Certificación Montessori after analytics is accepted on the source.
- UTM remain visible and `click_program_cta` fires once on attributed arrival.
- IndexNow dry-run rejects drafts, checkout paths and external hosts.

### Gate C: publications page can ship alone

- `/publicaciones/` contains no iframe.
- `Artículos` is the default panel and `#libros` opens books.
- WordPress failure leaves a populated snapshot and the blog link.
- All current Amazon destinations remain present; ebooks and bundles disabled for KDP Select remain disabled.

### Gate D: program pages exist before activation

- All 15 program URLs return `200` in production.
- The built sitemap contains exactly 42 canonical public URLs.
- Every localized group has reciprocal `es`, `en`, `pt-BR` and `x-default` links.
- Course, organization, breadcrumb, book and item-list schemas pass local validators.
- Only after these checks is `CONVERSION_CTA_ENABLED=1` applied to the automation service.

### Gate E: editorial search surface is deliberate

- Montessori México homepage metadata is reviewed and stable.
- Articles retain their existing canonicals and valid Article/BlogPosting schema.
- Tag archives are crawlable `noindex,follow` and absent from sitemap.
- Category/author archives pass the documented quality allowlist.
- Four obsolete commercial pages redirect once to the deployed commercial site.
- The editorial domain passes Google Search Console, Bing and the public WordPress SEO contract with no controllable technical error.

## Final Verification

- [ ] **Step 1: Run both repository test suites**

```bash
python -m unittest discover -s tests -v
python wordpress_seo_contract.py
npm run test:seo-redirects
npm run test:seo-sitemap
npm run test:analytics
npm run test:analytics-consent
npm run test:indexnow
npm run test:wordpress-posts
npm run test:wordpress-source
npm run test:publication-schemas
npm run test:program-pages
npm run build
npm run test:seo-built
npm run test:e2e
```

Expected: all commands exit `0`; E2E covers desktop and mobile.

- [ ] **Step 2: Verify production HTTP and indexing contracts**

```bash
node scripts/test-production-seo.js https://certificacionmontessori.com
INDEXNOW_DRY_RUN=1 npm run indexnow:submit -- /publicaciones/ /diplomados/nido-comunidad-infantil/ /en/diplomados/nido-comunidad-infantil/ /pt-br/diplomados/nido-comunidad-infantil/
```

Expected: 42 public URLs pass; IndexNow prints a valid payload without sending it.

- [ ] **Step 3: Activate and observe**

Set `CONVERSION_CTA_ENABLED=1` in the live automation `.env`, restart the two user services, generate one dry-run news item and one dry-run cuadernillo item, then create one real reviewed draft.

```bash
systemctl --user restart montessori-blog.timer montessori-cuadernillos.timer
DRY_RUN=1 ./run.sh
python run_cuadernillos.py --limit 1 --dry-run
journalctl --user -u montessori-blog.service -n 100 --no-pager
```

Expected: decisions are logged without secrets; the real draft contains at most the allowed conversion elements and no IndexNow submission occurs until publication.

- [ ] **Step 4: Use the monitoring windows**

Record status at 48 hours, 7 days, 28 days and 90 days in the operations runbook. Search Console/Bing processing states are observations, not release failures unless they expose a technical error.
