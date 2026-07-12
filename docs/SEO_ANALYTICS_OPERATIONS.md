# SEO and analytics operations

## Gatsby consent boundary

- Gatsby uses Google Basic Consent Mode for measurement ID `G-P0CNEGW276`.
- Until `ammac-analytics-consent-v1` is explicitly `granted`, the site creates no Google tag queue, script, request, event, or page view. A fresh denial also sends nothing to Google.
- The first grant queues consent default denied, consent update with analytics granted, `js`, and `config` with `send_page_view: false`, then appends the tag script.
- An explicit grant or denial remains authoritative in memory for the current page runtime even when local storage throws, silently ignores the write, or returns a stale opposite value. A new page runtime may read valid persisted consent normally.
- Application events require fully queued initialization: current granted consent plus successful default-denied, granted-update, `js`, and config commands. A failed `js` or config blocks custom events, page views, and attributed arrival until retry. A script network failure after those commands are queued does not roll readiness back.
- `ad_storage`, `ad_user_data`, and `ad_personalization` remain denied. Only `analytics_storage` can be granted.
- Revocation immediately queues a denied update when `gtag` exists, blocks later app events and page views, and best-effort removes first-party `_ga` and `_ga_*` cookies. Revocation is non-retroactive for processing already performed.
- Regrant sends a new granted update without duplicating script or config. Script/network failures remain retryable.
- Gatsby registers each valid route update before delivery and deduplicates page views per navigation instance. It uses `location.key` when available and a normalized pathname fallback otherwise. First grant backfills the current unsent navigation once; reaffirm and revoke/regrant do not resend it. A next route, same pathname under a new key, or browser-history return after an intervening navigation may send once. Invalid paths do not register, and failed sends remain retryable.
- If local storage is unavailable, the choice remains effective in memory for the current page session. A reload may ask again.
- Event parameters are closed. GA config, every custom event, and every manual page view include only a normalized allowlisted pathname, the fixed page origin `https://certificacionmontessori.com`, and a safe referrer origin.
- Invalid or missing runtime paths fall back to `/` for config and custom events; explicit invalid manual page-view paths fail closed. Page query strings, hashes, arbitrary origins, credentials, PII, order identifiers, and access tokens are excluded.
- Referrers are accepted only over HTTPS on the closed funnel-source hostname allowlist and reduced to `https://hostname/`. Their path, query, and hash are discarded. HTTP, credentials, explicit ports, suffix-host attacks, and unlisted hosts fall back to `https://certificacionmontessori.com/`.

## Cross-domain funnel runbook

### GA4 topology

| Role | Measurement ID | Hosts |
| --- | --- | --- |
| Shared funnel source of truth | `G-P0CNEGW276` | `certificacionmontessori.com`, `montessorimexico.org` |
| Editorial historical property | `G-075JTS42RZ` | `montessorimexico.org` only |

Keep the editorial historical property. On a WordPress page after Analytics consent, each property may receive one `page_view`: one for `G-075JTS42RZ` and one for `G-P0CNEGW276`. The same property must never receive two `page_view` events for one page load. On a Certificacion Montessori page, only `G-P0CNEGW276` may receive the one app-controlled `page_view`.

### 1. Gate WordPress analytics with CookieYes Basic consent

In WordPress Admin for `montessorimexico.org`, install the official CookieYes WordPress plugin (`cookie-law-info`) and use its native free configuration. Configure only the Necessary and Analytics categories; keep advertising consent disabled. Use Spanish as the banner language. The paid CookieYes web-app connection, scanner, and language add-on are intentionally not enabled; the multilingual Gatsby consent panel remains independent.

Disable MonsterInsights frontend tracking and deploy `docs/snippets/montessorimexico-ga4-cookieyes.php` through Code Snippets. The snippet must block both Google destinations until Analytics consent is accepted, keep every advertising consent state denied, and disable Google Signals and ad-personalization signals. It must continue reconciling the CookieYes state after load and synchronize it in the capture phase before a click: revocation disables both measurement IDs and sends an Analytics denied update, while regrant enables both IDs without loading another tag. The snippet never emits a business event. Consent is independent for the two registrable domains: a choice on `montessorimexico.org` does not grant, deny, or revoke consent on `certificacionmontessori.com`, and the reverse is also true.

In a clean browser profile, verify the following before continuing:

```text
Before any choice: no request to googletagmanager.com or google-analytics.com.
After Reject: still no Google analytics/tag request.
After accepting Analytics: one Google tag loads and the editorial property receives one page_view.
Cookie settings can reopen and revoke Analytics.
```

Record the administered configuration and evidence in this runbook before the second destination is added:

| Item | Required record |
| --- | --- |
| CookieYes plugin version | `3.5.2` |
| Cookie scan date | `Not performed: free plugin scan requires CookieYes web-app connection` |
| Connected domain | `montessorimexico.org`; native WordPress plugin configuration |
| Consent configuration | `Basic gate; Necessary + Analytics; advertising disabled` |
| Banner languages | `Spanish primary; free plugin language add-on not enabled` |
| Tag classification | `Custom GA4 editorial snippet: Analytics; MonsterInsights frontend tracking disabled` |
| Privacy/legal wording approval | `approved_for_production` for `es`, `en`, and `pt-BR` by the AMMAC responsible owner on `2026-07-11`; independent legal review not represented |
| Clean-profile consent evidence | `2026-07-12 manual DevTools Network checks: reject/revoke produced no Google tag or collect requests; accept produced one gtag.js load and one 204 collect request` |

### 2. Add the shared destination without duplicating tags

Proceed only after the CookieYes gate passes. Add `G-P0CNEGW276` as the second destination in the maintained Code Snippets implementation, preserving `G-075JTS42RZ`. Both destinations remain classified as Analytics and blocked by CookieYes until Analytics consent is accepted.

After saving, check page source and Network. The source must contain each destination exactly once:

```text
G-075JTS42RZ appears once as the editorial destination.
G-P0CNEGW276 appears once as the shared funnel destination.
```

MonsterInsights Lite cannot provide the required consent integration, so its frontend tracking remains disabled. Do not add another page-level snippet. Repeat the pre-consent, reject, accept, and revoke Network checks after adding the destination. A duplicate destination, a request before consent, or more than one `page_view` for either property on one WordPress load blocks production. Verified on 2026-07-12: one `204 collect` request for each ID after consent and none after reject or revoke; `npa=1` confirmed advertising personalization is disabled.

### 3. Configure cross-domain measurement in GA4 Admin

In the GA4 property containing `G-P0CNEGW276`, use Google's Admin configuration:

```text
Admin -> Data streams -> Web -> Configure tag settings -> Configure your domains
```

Add and save exact-match conditions for:

```text
certificacionmontessori.com
montessorimexico.org
```

This GA4 Admin configuration is the preferred method. Do not add a conflicting manual linker override. Verified on 2026-07-12 in stream `Certificación Montessori` (`G-P0CNEGW276`): both public domains use exact-match rules. Suggested Vercel and `web.app` hosts were not accepted.

### 4. Register event-scoped dimensions

In the shared `G-P0CNEGW276` property, register the following as event-scoped custom dimensions before reporting on the funnel:

```text
program_id
source_hostname
source_content_id
landing_path
cta_position
lead_channel
book_id
language
```

Verified on 2026-07-12: all eight definitions exist with event scope and the exact parameter names above. Do not register or send form values, contact details, order identifiers, or other personal data.

### 5. Verify linker, events, and page-view deduplication

Use a clean browser session. Accept Analytics separately on `montessorimexico.org` and `certificacionmontessori.com`; do not infer one domain's consent from the other. Perform this sequence:

1. Confirm the source WordPress page has one page view in `G-075JTS42RZ` and one in `G-P0CNEGW276`, with no duplicate for either property.
2. Click the CTA and immediately capture the destination URL. It must include `_gl` immediately after the click. Do not add campaign parameters to an internal cross-domain CTA merely for testing because they can overwrite acquisition attribution.
3. Confirm the destination page loads correctly and that `G-P0CNEGW276` receives exactly one page view for that visited page.
4. In the shared property's GA4 DebugView, confirm the attributed destination emitted exactly one `click_program_cta` and inspect its permitted event parameters. The WordPress source snippet must emit no business event.
5. Reopen settings on each registrable domain and revoke Analytics. In a clean repeat, confirm revocation blocks later analytics/tag requests on that domain.

Verified on 2026-07-12: the destination URL included `_gl`; the source emitted one page view to each destination and no business event; the attributed destination emitted `click_program_cta` exactly once with the allowlisted funnel parameters; the destination emitted one `G-P0CNEGW276` page view; and revocation independently blocked later requests on each domain. No credentials or personal data were captured.

### Cross-domain production gates

Do not release the cross-domain funnel configuration until all of the following are evidenced:

- The native CookieYes plugin on `montessorimexico.org` gates both Google destinations as Analytics and passes the clean-profile pre-consent, reject, accept, reopen, and revoke checks.
- WordPress contains `G-075JTS42RZ` once and `G-P0CNEGW276` once; each property receives at most one `page_view` per WordPress load.
- The GA4 Admin domain configuration contains both exact-match domains and has no competing manual linker configuration.
- All eight required custom dimensions are event-scoped in the shared property.
- A consented, clean-session CTA traversal shows `_gl`, produces no source business event and exactly one destination `click_program_cta` in DebugView, preserves the editorial WordPress page view, and produces only one shared-property page view per visited page.
- The Gatsby hard pre-production GA4 stream gate below passes, and the AMMAC privacy/legal wording approval and all required evidence placeholders are completed.

## Operator checks

### Hard pre-production GA4 stream gate

In the GA4 web stream, keep Enhanced Measurement enabled but open the advanced Page views settings and disable **Page changes based on browser history events**. Keep ordinary page-load measurement and the other useful enhanced events enabled. `send_page_view: false` disables Gatsby's automatic config page view, while this stream setting prevents a competing history-change view.

Verified on 2026-07-12: the history-event option is disabled, ordinary page-load measurement remains enabled, and a clean consented load of `certificacionmontessori.com` produced exactly one `204 collect` request for `G-P0CNEGW276`. The intercepted Gatsby suite separately verifies exactly one app-controlled `page_view` per route and navigation instance across initial grant, reaffirmation, revoke/regrant, next route, repeated pathname under a new key, browser back, invalid paths, and failed-send retry. Do not release if GA4 or the application later produces a duplicate route page view.

Run from the Gatsby repository root:

```bash
npm run test:analytics-consent
npm run test:analytics
npm run test:analytics-instrumentation
npm run test:seo-redirects
npm run test:seo-sitemap
npm run build
! rg -n '<script[^>]+googletagmanager.com/gtag/js|G-P0CNEGW276' public/index.html
! rg -n 'gatsby-plugin-google-gtag' package.json package-lock.json gatsby-config.js
```

For rendered QA, use a clean browser context and intercept and abort requests whose host matches `googletagmanager.com`, `google-analytics.com`, `analytics.google.com`, or `region1.google-analytics.com`. Record attempted requests rather than allowing live analytics traffic. Verify unknown, decline, denied reload, footer reopen, grant, revoke, regrant, keyboard focus, desktop/mobile layout, and console health.

Expected request-attempt counts in one clean context: unknown `0`; fresh decline `0`; denied reload `0`; first grant exactly one tag-script attempt; revoke and later navigation no additional analytics event request. Because Google endpoints are aborted, a script-load retry is expected only when the application deliberately retries initialization.

## IndexNow submissions

Use IndexNow only after the changed commercial pages are publicly available. The public key file is intentionally deployed at `/indexnow-key.txt`; it is not an unrelated credential.

1. Run the complete build and SEO suite.
2. Deploy Firebase Hosting successfully.
3. Pass only changed public paths to `npm run indexnow:submit`.
4. Verify receipt in Bing Webmaster Tools.
5. Do not resubmit unchanged URLs or treat receipt as an indexing guarantee.

For a no-network validation, use `INDEXNOW_DRY_RUN=1 npm run indexnow:submit -- /public/path/`. The CLI rejects non-public, redirect, and protected paths, and accepts no more than 10,000 URLs in one request.

## Privacy and release gate

The localized privacy wording is evidence-based and is not independent legal advice. The AMMAC responsible owner approved `es`, `en`, and `pt-BR` for production on `2026-07-11`; `docs/i18n/PRIVACY_REVIEW_2026-07-11.md` records all three as `approved_for_production`. Evidence consists of that responsible-owner approval record plus the rendered banner and policy captures to be attached after deployment. This approval does not represent independent legal counsel review.

Do not deploy this change to production until the cross-domain production gates, Gatsby hard pre-production GA4 stream gate, and the rendered-banner, notices, and regional-policy evidence are complete.

The notice aligns the implementation with AMMAC as a private civil association, the current private-sector LFPDPPP, required versus optional purposes, GA4 behavior after consent, the 20-day response and following 15-day implementation periods, one justified extension, electronic and office ARCO intake, and publication of changes at the same localized URL.

## Technical sources

- Google, Consent mode concepts: https://developers.google.com/tag-platform/security/concepts/consent-mode
- Google, Set up consent mode: https://developers.google.com/tag-platform/security/guides/consent
- Google, Consent mode troubleshooting: https://developers.google.com/tag-platform/security/guides/consent-debugging
- Google Analytics, Consent settings and parameters: https://support.google.com/analytics/answer/17016975
- Google Analytics, privacy controls: https://support.google.com/analytics/answer/10000067
- Google Analytics, config reference: https://developers.google.com/analytics/devguides/collection/ga4/reference/config
- Google Analytics, page-view measurement: https://developers.google.com/analytics/devguides/collection/ga4/views
- Google Analytics, Enhanced Measurement: https://support.google.com/analytics/answer/9216061
- Google Analytics, Set up cross-domain measurement: https://support.google.com/analytics/answer/10071811
- Google Analytics, Monitor events in DebugView: https://support.google.com/analytics/answer/7201382
- Google Analytics, About custom dimensions and metrics: https://support.google.com/analytics/answer/14240153
- Google tag API reference: https://developers.google.com/tag-platform/gtagjs/reference
- CookieYes, official WordPress plugin (`cookie-law-info`): https://wordpress.org/plugins/cookie-law-info/
- CookieYes, Basic and advanced consent mode: https://www.cookieyes.com/documentation/basic-and-advanced-consent-mode/

## Legal sources

- Current LFPDPPP text: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf
- DOF decree dated 20 March 2025: https://www.dof.gob.mx/nota_detalle.php?codigo=5752569&fecha=20/03/2025
- Brazilian ANPD cookie guidance: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais

The legal-source review was performed against the supplied source set dated 2026-07-11. Articles 15 and 28-31 require the controller/purpose/choice/change-notice information and establish the ARCO request content and timing reflected in the draft.
