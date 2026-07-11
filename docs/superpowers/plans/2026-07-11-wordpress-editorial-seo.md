# WordPress Editorial SEO Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir `montessorimexico.org` en una fuente editorial técnicamente limpia: portada descriptiva, artículos canónicos, rastreo explícito, taxonomías controladas, páginas comerciales antiguas redirigidas y propiedades completas en Google/Bing.

**Architecture:** AIOSEO sigue siendo la fuente de sitemap, metadatos y schema en WordPress. Un comprobador Python versionado valida la salida pública sin usar credenciales. Las decisiones de taxonomía usan datos de Search Console/Bing y calidad visible, no volumen indiscriminado. Los artículos conservan sus URLs; únicamente cuatro páginas comerciales antiguas pasan mediante 301 de un salto al dominio comercial ya desplegado.

**Tech Stack:** WordPress, AIOSEO, MonsterInsights, SiteGround Optimizer, Python 3.10+, `httpx`, BeautifulSoup, XML estándar, Google Search Console, Bing Webmaster Tools.

## Global Constraints

- Repositorio de automatización: `/home/carlos/montessori-blog-automation`.
- Repositorio de documentación: `/home/carlos/Documentos/Repositorios/certificacionMontessori`.
- Este plan se ejecuta después de que las 15 páginas de programa estén en producción.
- Ningún artículo publicado cambia de permalink, canonical o dominio.
- `montessorimexico.org` sigue siendo autor/editor/canonical de sus artículos.
- Tags y categorías no se indexan solo por existir; una página de archivo necesita valor visible propio.
- Antes de cambiar una URL indexable se exportan rendimiento y backlinks.
- Los cambios de AIOSEO, WordPress, CookieYes, redirects y caché se registran con capturas/fecha, porque no viven en Git.
- `llms.txt` es informativo; no se presenta como factor de Google.
- No se reenvían sitemaps ni se reinician validaciones mientras un buscador los procesa.

---

### Task 1: Version a Public WordPress SEO Contract and Record the Baseline

**Files:**
- Create: `/home/carlos/montessori-blog-automation/wordpress_seo_contract.py`
- Create: `/home/carlos/montessori-blog-automation/tests/test_wordpress_seo_contract.py`
- Create: `docs/WORDPRESS_SEO_BASELINE_2026-07-11.md`

**Interfaces:**
- Produces `audit_documents(documents: dict[str, str]) -> list[str]`.
- Produces `fetch_live_documents(origin: str) -> dict[str, str]`.
- CLI exits nonzero for a controllable SEO contract failure and never authenticates to WordPress.

- [ ] **Step 1: Write the failing parser contract**

```python
# tests/test_wordpress_seo_contract.py
import unittest

from wordpress_seo_contract import audit_documents


HOME_TITLE = "Educación Montessori: artículos y práctica | Montessori México"
HOME_DESCRIPTION = (
    "Artículos originales sobre método Montessori, desarrollo infantil, "
    "neuroeducación y práctica docente publicados por la Asociación Montessori de México."
)


def valid_documents():
    return {
        "home_url": "https://montessorimexico.org/",
        "home": f'''<html lang="es"><head><title>{HOME_TITLE}</title>
          <meta name="description" content="{HOME_DESCRIPTION}">
          <meta name="robots" content="index,follow,max-image-preview:large">
          <link rel="canonical" href="https://montessorimexico.org/">
          <script type="application/ld+json">{{"@context":"https://schema.org","@graph":[{{"@type":"Organization"}},{{"@type":"WebSite"}},{{"@type":"WebPage"}}]}}</script>
          </head><body><h1>Montessori México</h1></body></html>''',
        "robots": '''User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
User-agent: OAI-SearchBot
Allow: /
Disallow: /wp-admin/
User-agent: GPTBot
Allow: /
Disallow: /wp-admin/
User-agent: ChatGPT-User
Allow: /
Disallow: /wp-admin/
Sitemap: https://montessorimexico.org/sitemap.xml
''',
        "sitemap": '''<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <sitemap><loc>https://montessorimexico.org/post-sitemap.xml</loc></sitemap>
          <sitemap><loc>https://montessorimexico.org/page-sitemap.xml</loc></sitemap>
        </sitemapindex>''',
        "sample_url": "https://montessorimexico.org/articulo/",
        "sample": '''<html lang="es"><head><title>Artículo Montessori | Montessori México</title>
          <meta name="description" content="Una descripción editorial suficientemente específica para representar el contenido del artículo Montessori publicado por AMMAC.">
          <meta name="robots" content="index,follow"><link rel="canonical" href="https://montessorimexico.org/articulo/">
          <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BlogPosting","headline":"Artículo Montessori","author":{"@type":"Person","name":"Roxana Muñoz"},"datePublished":"2026-07-10","dateModified":"2026-07-10"}]}</script>
          </head><body><h1>Artículo Montessori</h1></body></html>''',
        "llms": "# MontessoriMexico.org\n\n## Sitemaps\n- https://montessorimexico.org/sitemap.xml\n",
    }


class WordPressSeoContractTests(unittest.TestCase):
    def test_accepts_the_controlled_public_contract(self):
        self.assertEqual(audit_documents(valid_documents()), [])

    def test_rejects_tag_sitemap_and_missing_explicit_ai_group(self):
        documents = valid_documents()
        documents["sitemap"] = documents["sitemap"].replace(
            "</sitemapindex>",
            "<sitemap><loc>https://montessorimexico.org/post_tag-sitemap.xml</loc></sitemap></sitemapindex>",
        )
        documents["robots"] = documents["robots"].replace("User-agent: GPTBot", "User-agent: OtherBot")
        errors = audit_documents(documents)
        self.assertTrue(any("post_tag-sitemap" in error for error in errors))
        self.assertTrue(any("GPTBot" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run and verify the missing module failure**

```bash
python -m unittest tests.test_wordpress_seo_contract -v
```

Expected: missing `wordpress_seo_contract`.

- [ ] **Step 3: Implement the public-output checker**

```python
# wordpress_seo_contract.py
"""Public SEO contract for montessorimexico.org."""

from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET

import httpx
from bs4 import BeautifulSoup


ORIGIN = "https://montessorimexico.org"
HOME_TITLE = "Educación Montessori: artículos y práctica | Montessori México"
HOME_DESCRIPTION = (
    "Artículos originales sobre método Montessori, desarrollo infantil, "
    "neuroeducación y práctica docente publicados por la Asociación Montessori de México."
)
REQUIRED_AI_AGENTS = ("OAI-SearchBot", "GPTBot", "ChatGPT-User")


def _schemas(html: str) -> list[dict]:
    soup = BeautifulSoup(html or "", "html.parser")
    schemas: list[dict] = []
    for node in soup.select('script[type="application/ld+json"]'):
        try:
            value = json.loads(node.get_text())
        except (TypeError, json.JSONDecodeError):
            continue
        values = value if isinstance(value, list) else [value]
        for item in values:
            if not isinstance(item, dict):
                continue
            graph = item.get("@graph")
            schemas.extend(graph if isinstance(graph, list) else [item])
    return [item for item in schemas if isinstance(item, dict)]


def _sitemap_locations(xml_text: str) -> list[str]:
    root = ET.fromstring(xml_text.lstrip("\ufeff"))
    return [node.text.strip() for node in root.findall("{*}sitemap/{*}loc") if node.text]


def audit_documents(documents: dict[str, str]) -> list[str]:
    errors: list[str] = []
    home = BeautifulSoup(documents.get("home", ""), "html.parser")
    home_url = documents.get("home_url", f"{ORIGIN}/")
    if home.title is None or home.title.get_text(strip=True) != HOME_TITLE:
        errors.append("homepage title does not match the reviewed contract")
    description = home.select_one('meta[name="description"]')
    if not description or description.get("content", "").strip() != HOME_DESCRIPTION:
        errors.append("homepage description does not match the reviewed contract")
    if home.select_one('link[rel="canonical"]') is None or home.select_one('link[rel="canonical"]').get("href") != home_url:
        errors.append("homepage canonical is invalid")
    if "noindex" in str(home.select_one('meta[name="robots"]') or "").lower():
        errors.append("homepage is noindex")
    if len(home.select("h1")) != 1:
        errors.append("homepage must expose exactly one H1")
    home_types = {schema.get("@type") for schema in _schemas(documents.get("home", ""))}
    for required in ("Organization", "WebSite", "WebPage"):
        if required not in home_types:
            errors.append(f"homepage schema is missing {required}")

    robots = documents.get("robots", "")
    for agent in REQUIRED_AI_AGENTS:
        if f"User-agent: {agent}" not in robots:
            errors.append(f"robots.txt is missing explicit {agent}")
    if "Sitemap: https://montessorimexico.org/sitemap.xml" not in robots:
        errors.append("robots.txt is missing the canonical sitemap")

    try:
        sitemap_locations = _sitemap_locations(documents.get("sitemap", ""))
    except ET.ParseError:
        sitemap_locations = []
        errors.append("sitemap.xml is invalid XML")
    if f"{ORIGIN}/post-sitemap.xml" not in sitemap_locations:
        errors.append("sitemap.xml is missing post-sitemap.xml")
    if any("post_tag-sitemap" in location for location in sitemap_locations):
        errors.append("post_tag-sitemap must be removed from the indexable inventory")

    sample = BeautifulSoup(documents.get("sample", ""), "html.parser")
    sample_url = documents.get("sample_url", "")
    sample_canonical = sample.select_one('link[rel="canonical"]')
    if not sample_canonical or sample_canonical.get("href") != sample_url:
        errors.append("sample article canonical is invalid")
    sample_description = sample.select_one('meta[name="description"]')
    description_length = len(sample_description.get("content", "").strip()) if sample_description else 0
    if not 70 <= description_length <= 160:
        errors.append("sample article description must contain 70-160 characters")
    article_schemas = [schema for schema in _schemas(documents.get("sample", "")) if schema.get("@type") in {"Article", "BlogPosting"}]
    if not article_schemas:
        errors.append("sample article lacks Article/BlogPosting schema")
    else:
        article = article_schemas[0]
        for key in ("headline", "author", "datePublished", "dateModified"):
            if not article.get(key):
                errors.append(f"sample article schema is missing {key}")

    llms = documents.get("llms", "")
    if "MontessoriMexico.org" not in llms or f"{ORIGIN}/sitemap.xml" not in llms:
        errors.append("llms.txt lacks site identity or canonical sitemap")
    return errors


def fetch_live_documents(origin: str = ORIGIN) -> dict[str, str]:
    if origin.rstrip("/") != ORIGIN:
        raise ValueError(f"origin must be {ORIGIN}")
    with httpx.Client(timeout=20, follow_redirects=False) as client:
        home = client.get(f"{ORIGIN}/")
        robots = client.get(f"{ORIGIN}/robots.txt")
        sitemap = client.get(f"{ORIGIN}/sitemap.xml")
        llms = client.get(f"{ORIGIN}/llms.txt")
        for response in (home, robots, sitemap, llms):
            response.raise_for_status()
        posts = client.get(
            f"{ORIGIN}/wp-json/wp/v2/posts",
            params={"status": "publish", "per_page": 1, "orderby": "date", "order": "desc"},
        )
        posts.raise_for_status()
        rows = posts.json()
        if not rows or not rows[0].get("link"):
            raise RuntimeError("WordPress returned no published article")
        sample_url = rows[0]["link"]
        sample = client.get(sample_url)
        sample.raise_for_status()
    return {
        "home_url": f"{ORIGIN}/",
        "home": home.text,
        "robots": robots.text,
        "sitemap": sitemap.text,
        "sample_url": sample_url,
        "sample": sample.text,
        "llms": llms.text,
    }


if __name__ == "__main__":
    failures = audit_documents(fetch_live_documents())
    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        sys.exit(1)
    print("WordPress public SEO contract ok")
```

- [ ] **Step 4: Run unit tests and record the intentional live failures**

```bash
python -m unittest tests.test_wordpress_seo_contract -v
python wordpress_seo_contract.py
```

Expected before admin changes: unit tests pass; live contract reports the generic homepage metadata, missing explicit crawler groups and `post_tag-sitemap.xml`.

Record the observed 2026-07-11 baseline in `docs/WORDPRESS_SEO_BASELINE_2026-07-11.md`:

```text
AIOSEO 4.9.10; MonsterInsights 10.2.2.
132 post-sitemap URLs, 5 page URLs, 32 category URLs, 397 tag URLs.
Homepage title “MontessoriMexico.org”.
Homepage description is a concatenated feed excerpt.
robots.txt uses wildcard access and has no separate OAI-SearchBot/GPTBot groups.
llms.txt is generated by AIOSEO and returns 200.
```

- [ ] **Step 5: Commit the checker and baseline separately by repository**

Automation repository:

```bash
git add wordpress_seo_contract.py tests/test_wordpress_seo_contract.py
git commit -m "test(seo): add WordPress public output contract"
```

Gatsby/documentation repository:

```bash
git add docs/WORDPRESS_SEO_BASELINE_2026-07-11.md
git commit -m "docs(seo): record WordPress editorial baseline"
```

---

### Task 2: Correct AIOSEO Home, Article and Taxonomy Signals

**Files:**
- Create: `docs/WORDPRESS_AIOSEO_OPERATIONS.md`

**Interfaces:**
- Home has one search intent and one reviewed snippet.
- Posts remain indexable `Article`/`BlogPosting` documents.
- Tags cease creating hundreds of thin indexable archives.
- Category/author archives require a data and content gate.

- [ ] **Step 1: Export before changing settings**

Export AIOSEO settings, the current sitemap child list, Search Console page/query data for 16 months, Bing URL/search data and backlinks for `/category/`, `/tag/`, `/author/` and the four legacy pages listed in Task 4. Store no credentials in the exports. Record export filenames and timestamps in `docs/WORDPRESS_AIOSEO_OPERATIONS.md`.

- [ ] **Step 2: Set reviewed homepage identity**

In AIOSEO Search Appearance/Homepage set exactly:

```text
SEO title: Educación Montessori: artículos y práctica | Montessori México
Meta description: Artículos originales sobre método Montessori, desarrollo infantil, neuroeducación y práctica docente publicados por la Asociación Montessori de México.
```

Set Site Name to `Montessori México`, Alternate Site Name to `Asociación Montessori de México`, keep the verified AMMAC Organization and logo, and use a real AMMAC social image rather than a Gravatar or theme-demo asset. Ensure the visible homepage has exactly one H1: `Montessori México`.

- [ ] **Step 3: Keep articles canonical and complete**

In AIOSEO Content Types/Posts:

```text
Show in search results: Yes.
Schema type: Article / Blog Post.
Canonical: self unless a human explicitly overrides one.
Title source: per-post AIOSEO value from automation, with one site suffix only.
Description source: per-post AIOSEO value from automation.
Author, datePublished, dateModified and featured image: enabled and visible.
```

Inspect the latest post from each of the three real authors. Confirm canonical, one H1, title, 70-160 character description, visible byline/date, image alt and Article/BlogPosting graph. Do not change historical permalinks.

- [ ] **Step 4: Remove tag crawl bloat**

In AIOSEO Search Appearance/Taxonomies/Tags set `Show in Search Results = No` and remove Tags from the XML sitemap. Keep tag links usable for people with `noindex,follow`; do not block `/tag/` in robots.txt because crawlers must read `noindex`.

Expected: `post_tag-sitemap.xml` disappears from `sitemap.xml`; existing tag pages expose `noindex,follow`. The 397 current tag URLs are an expected temporary Page Indexing exclusion, not 397 validation requests.

- [ ] **Step 5: Apply the archive quality gate**

For categories and authors use this exact rule:

```text
Index only if the archive has at least 3 published posts, a unique human-reviewed introduction of at least 120 words, a specific title/description, and either nonzero organic clicks/backlinks or an approved strategic topic.
Otherwise: noindex,follow and exclude from sitemap until curated.
```

Reassign posts from `sin-categoria` and `uncategorized` before setting those two archives to noindex. Do not delete categories named in `topics.yml`. For the three active authors (`Roxana Muñoz`, `Caridad Roxana Romero Muñoz`, `Carlos Alfonso Romero`), use indexable author archives only after display name, verified biography, portrait and credentials have human approval; never generate credentials from a model.

Record an allowlist table with URL, post count, description word count, evidence and `index|noindex` decision. This table is the source of truth for later sitemap checks.

- [ ] **Step 6: Purge cache and verify**

Purge AIOSEO and SiteGround caches. Confirm source HTML, not only the admin preview. Run:

```bash
python wordpress_seo_contract.py
```

Expected at this stage: homepage/article/tag checks pass; robots may remain as the only failure until Task 3.

- [ ] **Step 7: Commit operations documentation**

```bash
git add docs/WORDPRESS_AIOSEO_OPERATIONS.md
git commit -m "docs(seo): define WordPress indexable archive policy"
```

---

### Task 3: Make WordPress Robots, Sitemap and AI Access Explicit

**Files:**
- Modify: `docs/WORDPRESS_AIOSEO_OPERATIONS.md`

**Interfaces:**
- Public content remains allowed by `User-agent: *`.
- OAI-SearchBot, GPTBot and ChatGPT-User have separate auditable groups.
- WordPress admin remains disallowed in every explicit group.

- [ ] **Step 1: Configure the AIOSEO robots editor**

Preserve any host-required directives and produce this semantic content:

```text
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

User-agent: OAI-SearchBot
Allow: /
Disallow: /wp-admin/

User-agent: GPTBot
Allow: /
Disallow: /wp-admin/

User-agent: ChatGPT-User
Allow: /
Disallow: /wp-admin/

Sitemap: https://montessorimexico.org/sitemap.xml
Sitemap: https://montessorimexico.org/sitemap.rss
```

Do not disallow `/wp-json/`, `/tag/`, `/category/` or article paths. GPTBot remains independently changeable without affecting ChatGPT Search.

- [ ] **Step 2: Verify sitemap and `llms.txt` output**

Confirm:

```text
/sitemap.xml returns 200 XML and includes post-sitemap.xml.
post_tag-sitemap.xml is absent.
Every retained sitemap URL is HTTPS, canonical, indexable and 200.
/llms.txt returns 200, identifies MontessoriMexico.org and points to /sitemap.xml.
llms.txt contains public editorial inventory only and is documented as informational.
```

- [ ] **Step 3: Purge cache and run the live contract**

```bash
python wordpress_seo_contract.py
```

Expected: `WordPress public SEO contract ok`.

- [ ] **Step 4: Record and commit evidence**

Append the live timestamp, AIOSEO export, cache purge, robots response, sitemap child inventory and checker output to `docs/WORDPRESS_AIOSEO_OPERATIONS.md`.

```bash
git add docs/WORDPRESS_AIOSEO_OPERATIONS.md
git commit -m "docs(seo): record WordPress crawler configuration"
```

---

### Task 4: Retire Four Legacy Commercial Pages With One-Hop Redirects

**Files:**
- Create: `docs/WORDPRESS_COMMERCIAL_REDIRECTS.md`
- Modify: `/home/carlos/montessori-blog-automation/config.py`

**Interfaces:**
- Four WordPress commercial URLs leave the editorial sitemap.
- Each returns one permanent redirect to a live canonical commercial page.
- Future generated content cannot reintroduce those URLs as preferred links.

- [ ] **Step 1: Record the approved redirect map**

```text
https://montessorimexico.org/proxima-certificacion/
  -> https://certificacionmontessori.com/diplomados/
https://montessorimexico.org/descubre-nuestro-nuevo-curso/
  -> https://certificacionmontessori.com/diplomados/neuroeducacion/
https://montessorimexico.org/massterclass/
  -> https://certificacionmontessori.com/diplomados/
https://montessorimexico.org/proxima-certificacion/massterclasses/
  -> https://certificacionmontessori.com/publicaciones/
```

For each source record its final Search Console clicks/impressions and Bing/backlink evidence. The target pages must already pass production `200`, canonical and indexability checks.

- [ ] **Step 2: Create redirects before unpublishing source pages**

Use AIOSEO Redirects if licensed; otherwise install the maintained WordPress `Redirection` plugin. Add exact-match `301` rules, disable regex, preserve no query parameters unless required, and test in an incognito session. Only after all rules work, move the four old pages to Draft so AIOSEO removes them from `page-sitemap.xml` and `llms.txt`.

- [ ] **Step 3: Remove obsolete internal destinations**

Search WordPress menus, widgets, reusable blocks and published content for the four old paths and `http://certificacionmontessori.com`. Replace them with their final HTTPS target. In automation `config.py`, ensure `PREFERRED_EXTERNAL_LINKS` contains canonical HTTPS roots only; controlled program links continue through `conversion_funnel.py`.

- [ ] **Step 4: Verify one hop and no sitemap residue**

```bash
curl -fsSI https://montessorimexico.org/proxima-certificacion/
curl -fsSI https://montessorimexico.org/descubre-nuestro-nuevo-curso/
curl -fsSI https://montessorimexico.org/massterclass/
curl -fsSI https://montessorimexico.org/proxima-certificacion/massterclasses/
```

Expected: each first response is `301` with exactly the mapped HTTPS `Location`; a request to that location is `200`. None of the four source URLs appears in any sitemap, internal link or `llms.txt`.

- [ ] **Step 5: Commit code and redirect evidence separately**

Automation repository, only if `config.py` changed:

```bash
git add config.py
git commit -m "fix(seo): keep preferred editorial links canonical"
```

Documentation repository:

```bash
git add docs/WORDPRESS_COMMERCIAL_REDIRECTS.md
git commit -m "docs(seo): record legacy WordPress redirects"
```

---

### Task 5: Complete Google and Bing Operations for the Editorial Domain

**Files:**
- Modify: `docs/SEO_MONITORING_RUNBOOK.md`
- Modify: `docs/WORDPRESS_AIOSEO_OPERATIONS.md`

**Interfaces:**
- Both search engines know the canonical editorial sitemap.
- Search status and technical health are recorded separately from ranking guarantees.

- [ ] **Step 1: Verify or import the domain property**

Confirm the domain property for `montessorimexico.org` in Google Search Console and Bing Webmaster Tools using DNS/imported ownership. Do not add visible verification meta solely for this task when DNS ownership already works.

- [ ] **Step 2: Submit the canonical sitemap once**

Submit only:

```text
https://montessorimexico.org/sitemap.xml
```

Do not additionally submit redirected aliases `sitemap_index.xml` or `wp-sitemap.xml`; both currently redirect to the AIOSEO sitemap. Record processing state without repeated resubmission.

- [ ] **Step 3: Inspect representative editorial URLs**

Inspect/live-test:

```text
https://montessorimexico.org/
the latest published article
one retained indexable category or author archive, if the allowlist contains one
```

Google: confirm crawl allowed, user canonical equals selected canonical, HTTPS and no accidental noindex. Bing: confirm Index, SEO, Markup and Live URL cards. Request indexing only when a corrected live URL is indexable and quota is available.

- [ ] **Step 4: Run Bing Site Scan and classify reports**

Run a Website-scope scan from the homepage after cache purge. Target zero Errors. Review every Warning/Notice; fix technical defects, but document and reject stylistic recommendations that conflict with accurate copy, accessibility or the approved architecture.

- [ ] **Step 5: Record monitoring windows**

Add editorial-domain rows for 48 hours, 7 days, 28 days and 90 days:

```text
Sitemap children and submitted URL count.
Indexed/non-indexed submitted URLs by reason.
Tag/legacy URL transition to expected noindex or redirect states.
Non-brand queries, article/category/author pages, country and device.
IndexNow public-post receipts and no draft submissions.
Manual actions, security issues, HTTPS and Core Web Vitals.
```

- [ ] **Step 6: Run the final two-domain gate**

Automation repository:

```bash
python -m unittest discover -s tests -v
python wordpress_seo_contract.py
```

Commercial repository:

```bash
npm run test:seo-production
```

Expected: both public contracts pass; four legacy URLs are one-hop redirects; tag archives are absent from sitemap; no Google tag loads before consent; search dashboards have no controllable sitemap/crawl/manual/security error.

- [ ] **Step 7: Commit the final operations record**

```bash
git add docs/SEO_MONITORING_RUNBOOK.md docs/WORDPRESS_AIOSEO_OPERATIONS.md
git commit -m "docs(seo): complete editorial search operations"
```

## Plan Completion Gate

- `wordpress_seo_contract.py` exits `0` against production.
- Homepage metadata is reviewed, stable and not feed-generated.
- Published articles retain canonical URLs and valid Article/BlogPosting data.
- `post_tag-sitemap.xml` is gone; tags are crawlable `noindex,follow`.
- Category/author archives follow the allowlist rule.
- AI crawler rules are separate and WordPress admin stays disallowed.
- Four obsolete commercial pages redirect once to live canonical destinations.
- Search Console and Bing contain the canonical sitemap with no controllable technical error.
- Indexing and ranking remain measured outcomes, not guarantees.
