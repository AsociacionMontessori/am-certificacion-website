# Directory country scope

The page language still follows the existing browser-language redirect / explicit
language selector. Country detection never changes that language.

## Initial country and manual controls (2026-11-12)

- Default: show schools in the visitor's IP country when it exists in the catalog,
  independently of page language (for example Argentina on the English page).
- Reuse `useVisitorGeo`: ipapi.co, 5-second timeout. Only the directory opts into
  a free GeoJS country lookup as fallback (3 seconds) if the primary is invalid,
  unavailable or rate-limited. No GPS, API keys or paid fallback.
- `detectedCountryCode` is null until a real, valid response. The existing Mexican
  pricing default is NOT evidence of visitor location. Pricing consumers keep
  their existing default and do not opt into the fallback.
- Only the country code is used; no IP, city or coordinates are persisted by the
  new directory functionality. Providers necessarily receive the connection IP.
- Map ISO code to the catalog's Spanish names using native `Intl.DisplayNames`;
  unsupported browsers, missing countries and failed detection use language scope.
- “Mi país” returns to the detected country. “Otros países” opens the rest of the
  catalog; “Todos” includes every country. The language-group button is retained.
- Manual scope, country, search and certification choices are never overwritten
  by a late lookup. Page-language navigation restores the automatic scope.
- Search and AMMAC certification combine with the selected scope/country.
- “Cargar más” adds 120 cards per click until ALL matching schools are visible.
  Counters report the current visible count; filter changes reset the page size.

Country groups in `src/data/directoryLanguages.js` classify countries, not school
teaching languages. New countries should be classified there. Brazil belongs to
the Portuguese group but currently has no catalog entries (so detection falls
back to the language scope rather than showing an empty Brazilian directory).

## Verification and release

- Foundation contracts, Gatsby production build and built SEO checks.
- `npx playwright test tests/e2e/directory-language.spec.js tests/e2e/directory-country.spec.js --workers=2`
  covers country overrides, all three page languages, browser-language redirects,
  primary-provider failure/timeout/rate-limits, fallback lookup, late-response
  manual override protection, search, certification and pagination through the
  entire 2,577-school catalog. Runs desktop Chrome and Pixel 7 emulation.
- Browser plugin/skill unavailable; use the repository's Playwright workflow.
- Deploy only public hosting: `npx firebase deploy --only hosting --project
  certificacionmontessori`. Do not deploy alumnos-app, functions or rules.
- Previous source commit: `93150a2`. Firebase Hosting release history retains the
  previous deployment for rollback.
