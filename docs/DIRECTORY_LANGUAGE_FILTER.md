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
- Country, city and region from the existing primary response are used in memory
  only; no IP, city or coordinates are persisted by the directory. Providers necessarily receive the connection IP.
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

### Confirmed release evidence

- 2026-11-12: foundation contracts, production build and built SEO checks passed.
- **30/30 Playwright tests passed**, desktop Chrome and Pixel 7 emulation.
- Real GeoJS fallback worked in desktop and mobile browsers. Screenshots showed
  no horizontal overflow; both had no page runtime errors.
- Firebase confirmed public Hosting release complete (implementation `45583a8`).
- Production browser checks: HTTP 200 in ES/EN/PT-BR, country selection independent
  of language and loading from 120 to 240 cards, with no page runtime errors.
- Real, unmocked production IP detection passed.
- `npm run test:deployed-hosting -- https://certificacionmontessori.com` passed:
  42 canonical URLs, 14 per language.
- No Git push: the task authorized implementation/public-site release, not a push;
  local history includes earlier unpublished commits that are outside this diff.

## City filtering (2026-11-12)

- Reuses the existing ipapi response city/region; adds no requests, GPS, keys,
  paid services or dependencies. GeoJS remains country-only.
- Automatically selects a catalog city in the detected country. Accent/case
  normalization supports spelling differences; state disambiguates repeated names.
  Ambiguous/unmatched city falls back to country, then the existing language scope.
- “Mi ciudad” restores the detected city. “Mi país” and scope/country changes
  reset the city. Manual city choices cannot be overwritten by late detection.
- Native labeled city selector lists only cities in the selected country/view,
  displaying city, state and country. Search and certification combine with it.
  Pagination resets on city changes, and Maps search includes the selected city.
- ES/EN/PT-BR supported. No school data was rewritten or inferred from amounts,
  names, addresses or IP coordinates.
- Verification: production build, foundation, built SEO and directory Playwright
  regression suite (40 desktop/mobile checks). Browser plugin unavailable;
  validation uses the existing Playwright project workflow.
- Carlos explicitly authorized commit/push of all pending project changes globally
  on 2026-11-12, superseding the earlier no-push interpretation above.
