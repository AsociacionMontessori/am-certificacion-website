# A3 Task 3 Report

## Status

`DONE_WITH_CONCERNS`

- Review-fix commit/current HEAD: `d93f1514f3e37f38695bfdd0122d1637385eba5b` (`fix(analytics): harden consent page context`).
- Review-fix starting HEAD: `4dae23f004213774a5044abee53923bfb23295c4`.
- Earlier Task 3 commits: `efe205c`, `85818cb`, and `4dae23f`.
- Base HEAD: `99b45347402915bf4ed807ca54d2c7ede8311ce3`
- Branch: `codex/certification-search-funnel`
- Deployment: not performed.
- Live analytics/services: not called.
- `.env`: not read.
- Legal review: `pending_owner_review` for ES, EN, and PT-BR.

The A3 review-fix implementation, automated suites, production build, generated-HTML checks, scans, and intercepted rendered browser QA are complete. Production operations and legal owner approval remain gated as documented below.

## Changed Paths

Created:

- `docs/SEO_ANALYTICS_OPERATIONS.md`
- `docs/i18n/PRIVACY_REVIEW_2026-07-11.md`
- `scripts/test-analytics-consent.js`
- `src/components/AnalyticsConsent.js`
- `src/utils/analyticsConsent.js`

Modified:

- `docs/superpowers/plans/2026-07-11-analytics-indexnow-foundation.md`
- `gatsby-browser.js`
- `gatsby-config.js`
- `package.json`
- `package-lock.json`
- `scripts/test-analytics.js`
- `src/components/footer.js`
- `src/components/layout.js`
- `src/i18n/locales/en/common.json`
- `src/i18n/locales/en/legal.json`
- `src/i18n/locales/es/common.json`
- `src/i18n/locales/es/legal.json`
- `src/i18n/locales/pt-br/common.json`
- `src/i18n/locales/pt-br/legal.json`
- `src/pages/privacy.js`
- `src/utils/analytics.js`

## Implementation Summary

- Added Basic Consent Mode with no Google queue/script/request before explicit grant and no Google action for a fresh denial.
- First grant queues v2 default denied, analytics granted update, `js`, and one config with `send_page_view: false` before script insertion.
- Revoke queues denied when available, blocks later analytics, and best-effort removes `_ga`/`_ga_*`; regrant does not duplicate config.
- Storage/DOM/gtag/event/cookie/script failures are fail-safe. Failed persistence uses authoritative in-memory consent and failed scripts remain retryable.
- All analytics events fail closed. Page views use an allowlisted normalized path and fixed certification origin with no query, hash, arbitrary origin, credentials, PII, order values, or access tokens.
- Removed `gatsby-plugin-google-gtag` from config, package, and lock.
- Added keyboard-accessible reversible UI, footer preferences, and ES/EN/PT-BR strings.
- Replaced the privacy notice in all locales with the private-sector LFPDPPP basis, controller/address, required/optional purposes, GA4 boundary, ARCO 20+15 timing, intake channels, same-URL changes, and visible 11 July 2026 date.
- Replaced binding Task 3 with the amended implementation/test/browser contract and documented operations/release gates.

## TDD Evidence

RED was observed before production implementation:

1. `node scripts/test-analytics-consent.js` failed with `Cannot find module '../src/utils/analyticsConsent'`.
2. `node scripts/test-analytics.js` failed with `TypeError: trackPageView is not a function`.
3. After core implementation, the consent contract failed with `ENOENT ... src/components/AnalyticsConsent.js`, fixing the integration/UI boundary before UI production code.
4. A later edge-case RED failed `failed script must be retryable when removal throws` with `1 !== 2`; the loader now removes the canonical id before best-effort removal.
5. The stale-persisted-grant case was added before the memory-state fix; failed writes now keep the current in-memory denial authoritative.

GREEN:

- `npm run test:analytics-consent` -> `analytics consent contract ok`.
- `npm run test:analytics` -> `analytics contract ok`.
- `npm run test:analytics-instrumentation` -> `analytics instrumentation contract ok`.
- `npm run test:seo-redirects` -> `SEO redirects contract ok`.
- `npm run test:seo-sitemap` -> `sitemap SEO contract ok`.
- ES/EN/PT-BR common/legal JSON parse -> `localized JSON ok`.

## Commands And Results

Baseline on `99b4534`:

```text
npm run test:analytics                    PASS
npm run test:analytics-instrumentation    PASS
npm run test:seo-redirects                PASS
npm run test:seo-sitemap                  PASS
```

`npm uninstall gatsby-plugin-google-gtag --ignore-scripts --no-audit --no-fund` stalled in the sandbox without writing files and was interrupted. `npm pkg delete` plus `npm install --package-lock-only --offline --ignore-scripts --no-audit --no-fund` then updated package/lock without download. NPM emitted the existing Gatsby experimental React peer warning.

Final fresh verification before commit:

```text
npm run test:analytics-consent             PASS
npm run test:analytics                     PASS
npm run test:analytics-instrumentation     PASS
npm run test:seo-redirects                 PASS
npm run test:seo-sitemap                   PASS
localized JSON parse                       PASS
npm run build                              PASS (52/52 static pages)
git diff --check                           PASS
```

The build retained existing warnings: non-square manifest icon, stale Browserslist data, CSS chunk ordering among existing global/font/WhatsApp styles, and Node `punycode` deprecation. No build error or failed page occurred.

Negative checks returned no matches:

```text
<script ... googletagmanager.com/gtag/js in public/**/*.html
G-P0CNEGW276 in public/index.html
gatsby-plugin-google-gtag in package.json/package-lock.json/gatsby-config.js
private-key/AWS/Google API/live Stripe/GitHub token patterns in diff
PII parameter additions in analytics/consent/browser/component diff
tracked .superpowers paths
```

No Gatsby, Playwright, Chromium, or headless-shell process remained after cleanup.

## Browser QA

Browser plugin was unavailable. A Playwright fallback was prepared at `/tmp/a3-browser-qa.js` using the cached Playwright package and Chromium. It intercepts and aborts Google Tag Manager/Analytics hosts before navigation and covers unknown/decline/denied reload/footer reopen/grant/revoke/regrant, cookie cleanup, blocked later events, keyboard focus, console health, ES/EN/PT-BR wording, desktop/mobile overflow, and screenshots planned outside the repo.

Execution evidence:

1. `gatsby serve -H 127.0.0.1 -p 9000` did not expose a listening port within 30 seconds and produced no actionable server diagnostic beyond the existing `punycode` warning.
2. Same-process static fallback failed exactly with `listen EPERM: operation not permitted 127.0.0.1:9000`.
3. The requested unsandboxed rerun was aborted by the user/controller.

Therefore no browser navigation occurred, no screenshot was produced, and no Google request was sent. Controller QA must run the prepared flow or an equivalent intercepted flow outside this sandbox.

## Legal And Technical Sources

Technical basis supplied and recorded:

- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.google.com/tag-platform/security/guides/consent
- https://developers.google.com/tag-platform/security/guides/consent-debugging
- https://support.google.com/analytics/answer/17016975
- https://support.google.com/analytics/answer/10000067

Legal basis supplied and recorded:

- https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf
- https://www.dof.gob.mx/nota_detalle.php?codigo=5752569&fecha=20/03/2025
- https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais

The draft aligns the supplied summary of LFPDPPP Articles 15 and 28-31. It remains an evidence-based draft, not legal advice.

## Concerns And Required Follow-up

1. This initial browser-QA concern was resolved by the later intercepted controller runs documented below; no live Google request was permitted.
2. ES/EN/PT-BR banner and privacy notice remain `pending_owner_review`. Production deployment is blocked until AMMAC's privacy owner explicitly approves rendered wording and regional policy.
3. Existing Gatsby build warnings listed above remain outside A3 scope.

## Mobile Consent Overlap Fix

- Commit: `85818cb` (`fix(privacy): hide WhatsApp during consent`)
- Changed paths: `src/components/AnalyticsConsent.js`, `src/styles/wa.css`, `scripts/test-analytics-consent.js`, and `docs/superpowers/plans/2026-07-11-analytics-indexnow-foundation.md`.
- `pending_owner_review` was not changed.

### RED/GREEN Evidence

- RED: `npm run test:analytics-consent` failed at the new assertion `the open consent state must be reflected on body` before the component and stylesheet changes.
- GREEN: the consent component toggles `analytics-consent-open` on `document.body` while the panel is open and removes it on unmount; `body.analytics-consent-open #wa { display: none; }` removes the floating widget from rendering, interaction, keyboard navigation, and the accessibility tree until either choice closes the panel.
- `npm run test:analytics-consent` passed after the change with `analytics consent contract ok`.

### Verification

- `npm run test:analytics` passed: `analytics contract ok`.
- `npm run test:analytics-instrumentation` passed: `analytics instrumentation contract ok`.
- `npm run test:seo-redirects` passed: `SEO redirects contract ok`.
- `npm run test:seo-sitemap` passed: `sitemap SEO contract ok`.
- `npm run build` passed with 52/52 static pages. Existing warnings remain for `punycode`, a non-square manifest icon, stale Browserslist data, and CSS chunk ordering.
- `git diff --check` passed before commit.
- No port/browser QA was run, no `.env` was read, no live service was called, and no deployment was performed.

## Controller Browser QA And CSS Parser Fix

- The controller started `gatsby serve` outside the restricted network sandbox and ran `/tmp/a3-browser-qa.js` with Chromium 1228. Every Google Tag Manager/Analytics route was intercepted and aborted before network transmission.
- Initial QA exposed the intended browser-language redirect (`/privacy/` to `/en/privacy/` for an English browser); the final matrix used `es-MX`, `en-US`, and `pt-BR` browser locales.
- Lifecycle QA passed: unknown and fresh denial attempted zero Google requests; first grant attempted one blocked tag-script request; revoke removed GA cookies and blocked a later WhatsApp event; regrant produced a second granted update without a second config; console errors were zero after classifying the intentionally aborted resource request.
- Desktop `1440x900` and mobile `390x844` screenshots were written to `/tmp/a3-consent-desktop.png` and `/tmp/a3-consent-mobile.png`. Visual inspection found the original mobile WhatsApp/button overlap, and the final screenshots show no clipping, horizontal overflow, or overlap.
- Browser measurement revealed that the pre-existing first four lines of `src/styles/wa.css` were un-commented identifiers. The CSS parser combined them with `body.analytics-consent-open #wa`, so the hide rule did not apply even though the source-string test passed.
- RED: after strengthening the test to require the rule at a real CSS rule boundary, `npm run test:analytics-consent` failed with `open consent must remove WhatsApp visibility and interaction`.
- GREEN: the malformed header was converted to a CSS comment; the consent contract and all four existing analytics/SEO contracts passed, localized JSON parsed, `npm run build` generated 52/52 pages, and computed `#wa` display became `none` while the body class was active.
- Final intercepted Playwright result: `status=passed`, `unknownGoogleAttempts=0`, `deniedGoogleAttempts=0`, `firstGrantTagAttempts=1`, `configCommands=1`, `grantedUpdates=2`, `consoleErrors=0`.

## A3 Review Fix Wave

### Status And Scope

`DONE_WITH_CONCERNS`

- Starting HEAD: `4dae23f004213774a5044abee53923bfb23295c4`.
- Final commit/current HEAD: `d93f1514f3e37f38695bfdd0122d1637385eba5b` (`fix(analytics): harden consent page context`).
- Branch: `codex/certification-search-funnel`.
- Deployment: not performed.
- Live Google requests: not performed or permitted.
- `.env`: not read.
- Legal review: ES, EN, and PT-BR remain exactly `pending_owner_review`.
- Browser QA: complete for the review-fix wave with intercepted ES/EN/PT-BR desktop/mobile runs and zero live Google requests.

Changed production and contract paths:

- `src/utils/analyticsPageContext.js`
- `src/utils/analyticsConsent.js`
- `src/utils/analyticsConsentDom.js`
- `src/utils/analytics.js`
- `src/components/AnalyticsConsent.js`
- `src/i18n/locales/{es,en,pt-br}/legal.json`
- `scripts/test-analytics.js`
- `scripts/test-analytics-consent.js`
- `docs/SEO_ANALYTICS_OPERATIONS.md`
- `docs/superpowers/plans/2026-07-11-analytics-indexnow-foundation.md`
- `.superpowers/sdd/A3-review-fixes-brief.md`
- `.superpowers/sdd/A3-task-3-report.md`

`src/styles/wa.css` remains behaviorally unchanged and is now present in the binding Task 3 `git add` list as required.

### Implementation

- Added one shared closed safe-page-context boundary for GA config, every allowed custom event, and manual page views. It emits only `page_path`, fixed-origin `page_location`, and safe-origin `page_referrer`.
- Invalid or missing runtime paths fall back to `/` for config/custom events; explicit invalid `trackPageView` calls still fail closed. Caller URL fields cannot override internal context and are not public allowlisted parameters.
- Exact allowlisted HTTPS referrer hosts now discard all path/query/hash material and reduce to `https://hostname/`. HTTP, credentials, explicit ports, suffix hosts, and unlisted hosts use the certification fallback.
- Split consent initialization into independent successful markers for default, granted update, `js`, and config. Revoke/regrant queues a fresh granted update before unfinished initialization without duplicating successful one-time commands.
- Known-failed script objects are tracked independently from DOM cleanup. A canonical failed element cannot block replacement when both id assignment and removal throw; pending and loaded replacements remain deduplicated.
- Added executable fail-safe DOM helpers for event add/remove, body class toggle/remove, active-element capture, and focus. Footer reopen captures the opener, open focuses decline, and either successful choice restores the opener.
- Completed Article 30 rectification summaries in ES/EN/PT-BR with requested changes and supporting-documentation requirements while preserving 20-day decision, following 15-day implementation, and one justified equal extension.
- Added the GA4 Enhanced Measurement hard pre-production gate, exactly-one-app-page-view route check, four current official sources, clarified referrer wording, and expanded controller QA evidence requirements.

### RED Evidence

Each regression was exercised before its production fix or with a controlled restored regression where an earlier assertion otherwise stopped the combined script:

1. `npm run test:analytics` failed because custom-event payloads lacked `page_path`, `page_location`, and `page_referrer` (`actual: { language: 'es' }`).
2. `npm run test:analytics-consent` failed because config contained only `{ send_page_view: false }` and lacked safe context.
3. After the referrer clarification, `npm run test:analytics` failed because `https://montessorimexico.org/articulo/?email=x#token` fell back instead of reducing to `https://montessorimexico.org/`.
4. The `js` partial-init case failed with no fresh `consent:granted` between revoke and resumed `js`.
5. The `config` partial-init case failed with no fresh `consent:granted` between revoke and resumed config while the successful `js` correctly remained one-time.
6. Controlled failed-script regression failed `known-failed canonical script must not block a replacement` with `1 !== 2`; restoring the failed-object filter returned GREEN.
7. `npm run test:analytics-consent` failed with `Cannot find module '../src/utils/analyticsConsentDom'` before the executable DOM helper implementation.
8. The locale contract failed at missing `rectificationChanges` before ARCO text edits.
9. The operations/plan contract failed on the missing GA config reference URL before documentation edits.

### Final Verification

Fresh commands after formatting:

```text
npm run test:analytics-consent          PASS - analytics consent contract ok
npm run test:analytics                  PASS - analytics contract ok
npm run test:analytics-instrumentation  PASS - analytics instrumentation contract ok
npm run test:seo-redirects              PASS - SEO redirects contract ok
npm run test:seo-sitemap                PASS - sitemap SEO contract ok
node common locale JSON parse check      PASS - localized common JSON ok
node legal locale JSON parse check       PASS - localized legal JSON ok
npm run build                            PASS - 52/52 static pages
git diff --check                         PASS
```

The build retained existing warnings for the non-square manifest icon, stale Browserslist data, CSS chunk ordering, and Node `punycode` deprecation. No page or build step failed.

Negative checks:

```text
generated HTML Google script-tag scan    PASS - no eager Google script
public/index.html measurement-id scan    PASS - no eager measurement id
config/package/lock plugin scan          PASS - no gatsby-plugin-google-gtag
task diff credential-pattern scan        PASS - no secrets
production analytics fixture scan        PASS - no PII/secret fixtures
```

The broader PII review found only deliberate hostile test fixtures (`persona@example.com`, fake order/token strings) and AMMAC's already-public legal contact/address. None is emitted by production analytics code.

### Controller Browser QA

The controller ran `/tmp/a3-browser-qa.js` twice against commit `d93f151`, with every Google Tag Manager/Analytics request aborted before transmission. The final run also rendered and asserted the Article 30 additions in ES, EN, and PT-BR.

- Unknown, fresh denial, and denied reload attempted zero Google requests.
- First grant attempted exactly one blocked tag-script request; regrant attempted one expected retry because the first script was deliberately aborted.
- The queued order remained default denied, update granted, `js`, config. Config count stayed one and granted-update count became two after regrant.
- Config and every queued application event used a closed `page_path`, fixed certification `page_location`, and safe-origin `page_referrer`; hostile email/order/token/query/hash/origin/referrer fixtures were absent.
- Manual route tracking emitted exactly one application `page_view` in the intercepted context.
- The accessible labelled dialog opened in ES, EN, and PT-BR; decline received entry focus; both accept and revoke restored focus to the footer opener.
- `analytics-consent-open` toggled correctly. Computed `#wa` display was `none`, its link could not receive focus while hidden, and it returned after either choice.
- Desktop `1440x900` and mobile `390x844` had no horizontal overflow, clipping, or WhatsApp overlap. Final screenshots: `/tmp/a3-consent-desktop.png`, `/tmp/a3-consent-mobile.png`.
- Console errors: zero. Final result: `status=passed`, `configCommands=1`, `grantedUpdates=2`.

The remaining production-only check is exactly one app-controlled `page_view` per route after every Enhanced Measurement option is disabled for the live stream.

### Concerns

1. Production remains blocked until the GA4 stream has every Enhanced Measurement option disabled and route page-view uniqueness is verified.
2. ES, EN, and PT-BR legal text remains `pending_owner_review`; no legal approval was recorded.
3. Existing Gatsby build warnings listed above remain outside A3 scope.

## A3 Review Fix Wave 2

### Status And Scope

`DONE_WITH_CONCERNS`

- Starting HEAD: `d93f1514f3e37f38695bfdd0122d1637385eba5b`.
- Branch: `codex/certification-search-funnel`.
- Deployment: not performed.
- Live Google requests: not performed or permitted.
- `.env`: not read.
- Legal review: ES, EN, and PT-BR remain exactly `pending_owner_review`.
- Browser analytics: not run; the binding brief reserves the intercepted lifecycle rerun for the controller.

Changed production and contract paths:

- `src/utils/analyticsConsent.js`
- `src/utils/analytics.js`
- `gatsby-browser.js`
- `scripts/test-analytics-consent.js`
- `scripts/test-analytics.js`
- `docs/SEO_ANALYTICS_OPERATIONS.md`
- `docs/superpowers/plans/2026-07-11-analytics-indexnow-foundation.md`
- `.superpowers/sdd/A3-task-3-report.md`

### Implementation

- Every valid explicit grant or denial is now authoritative in runtime memory after `setAnalyticsConsent`, independent of setter/getter behavior. Persisted consent remains available to a new runtime.
- Exported `isAnalyticsReady(target?)`. It requires current granted consent plus successful default-denied, granted-update, `js`, and config queue markers; script load state is intentionally not part of readiness after all commands have queued.
- `trackEvent`, `trackPageView`, and attributed arrival now fail closed until readiness is complete. Failed `js` or config calls cannot be followed by an application event until successful retry/regrant.
- Added runtime-local current-navigation state and `registerAnalyticsNavigation(location, target?)`. Gatsby registers before attempting each route page view.
- Page-view state uses Gatsby `location.key` when available and a normalized pathname fallback. First grant backfills one current unsent navigation; reaffirm and revoke/regrant cannot resend it. Next route, same pathname/new key, and browser-back after an intervening navigation may each send once.
- Invalid paths never replace current navigation state. A throwing `gtag` does not mark the navigation sent, and keys remain internal rather than entering GA payloads.
- Removed the unused grant-branch `loaderState` local and obsolete persistence-success bookkeeping.
- Updated binding Task 3 and operations contracts for explicit-choice authority, command-level readiness, and per-navigation deduplication.

### TDD RED Evidence

Each behavior was added to the executable contracts before its production change and run against the then-current implementation:

1. Explicit authority: `npm run test:analytics-consent` exited 1 with `explicit denied must override stale stored granted for this runtime`; actual `granted`, expected `denied`.
2. Readiness predicate: `npm run test:analytics-consent` exited 1 with `TypeError: isAnalyticsReady is not a function` at the failed-`js` readiness assertion.
3. Event readiness gate: after the predicate was GREEN, `npm run test:analytics-consent` exited 1 with actual `true`, expected `false` for the immediate custom event after failed `js`. The same parameterized contract covers failed config, immediate page view, no queued event, successful retry, and event order after config.
4. Navigation instances: `npm run test:analytics` exited 1 with `TypeError: registerAnalyticsNavigation is not a function` at unknown-route registration. The added lifecycle then covers first-grant backfill, reaffirm, revoke/regrant, next route, same pathname/new key, browser-back key, invalid path, failed-send retry, and key exclusion from payloads.
5. Documentation contract: `npm run test:analytics-consent` exited 1 at `assert(operations.includes("fully queued initialization"))` before Task 3 and operations edits.

The broader analytics fixture initially failed `false !== true` because stored grant alone no longer represents an event-ready runtime. Its standard granted target now performs real initialization and discards setup commands. The old throwing-`gtag` assertion then failed `0 !== 2`; it was corrected to require zero calls before readiness, matching the new fail-safe boundary.

### GREEN Evidence

Focused GREEN runs after each minimal change:

```text
consent authority fix                  PASS - analytics consent contract ok
readiness predicate                    PASS - analytics consent contract ok
event readiness gate                   PASS - analytics consent contract ok
navigation registration/deduplication  PASS - analytics contract ok
Gatsby and documentation contracts     PASS - analytics consent contract ok
```

Final fresh verification:

```text
npm run test:analytics-consent          PASS - analytics consent contract ok
npm run test:analytics                  PASS - analytics contract ok
npm run test:analytics-instrumentation  PASS - analytics instrumentation contract ok
npm run test:seo-redirects              PASS - SEO redirects contract ok
npm run test:seo-sitemap                PASS - sitemap SEO contract ok
ES/EN/PT-BR common/legal JSON parse      PASS - pending_owner_review=3
npm run build                            PASS - 52/52 static pages
git diff --check                         PASS - no whitespace errors
```

The build retained existing warnings for the non-square manifest icon, six-month-old Browserslist data, CSS chunk ordering, and Node `punycode` deprecation. No page or build step failed.

### Negative Scans

```text
generated public/**/*.html eager Google script scan  PASS - no matches
public/index.html measurement-id scan                 PASS - no matches
package/lock/Gatsby plugin-config scan                PASS - no matches
task-diff credential-pattern scan                     PASS - zero matches
production-addition PII/secret scan                   PASS - zero matches
```

The full task-diff PII marker scan found only two occurrences of the deliberate fake `cs_secret` hostile-path fixture in `scripts/test-analytics.js`. No production addition contains that fixture or any email, phone, credential, private-key, API-key, live Stripe, or access-token pattern.

### Concerns

1. Production remains blocked until every GA4 Enhanced Measurement option is disabled and the controller's intercepted lifecycle confirms one app `page_view` after revoke/regrant, then two only after a genuine next route.
2. ES, EN, and PT-BR legal text remains `pending_owner_review`; no legal approval was recorded.
3. Existing Gatsby build warnings listed above remain outside A3 scope.
