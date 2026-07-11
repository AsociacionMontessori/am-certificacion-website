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

## Operator checks

### Hard pre-production GA4 stream gate

In the GA4 web stream, **Disable every Enhanced Measurement option**, especially page views on browser-history changes. `send_page_view: false` disables the automatic config page view but does not supersede Enhanced Measurement history settings.

With every Enhanced Measurement option disabled, navigate each localized route in an intercepted clean browser context and verify exactly one app-controlled `page_view` per route and per navigation instance. Include initial unknown then grant, grant reaffirmation, revoke/regrant, a genuine next route, same pathname with a new `location.key`, browser back, invalid paths, and a failed-send retry. Do not release while GA4 or the application produces a duplicate route page view.

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

## Privacy and release gate

The localized privacy wording is an evidence-based draft, not legal advice. Status for `es`, `en`, and `pt-BR` is `pending_owner_review` in `docs/i18n/PRIVACY_REVIEW_2026-07-11.md`. Do not deploy this change to production until AMMAC's privacy owner approves the rendered banner, notices, and regional policy.

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
- Google tag API reference: https://developers.google.com/tag-platform/gtagjs/reference

## Legal sources

- Current LFPDPPP text: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf
- DOF decree dated 20 March 2025: https://www.dof.gob.mx/nota_detalle.php?codigo=5752569&fecha=20/03/2025
- Brazilian ANPD cookie guidance: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais

The legal-source review was performed against the supplied source set dated 2026-07-11. Articles 15 and 28-31 require the controller/purpose/choice/change-notice information and establish the ARCO request content and timing reflected in the draft.
