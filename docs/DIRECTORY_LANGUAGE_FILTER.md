# Directory country scope

The directory uses `useLocalization()` (the active page language), not IP
geolocation. The existing first-visit browser-language redirect and explicit
language selector remain responsible for choosing the page language.

- Default: countries in the page language group.
- “Todos” / “All”: all countries in the existing catalog; resets the country chip.
- The language-group button restores the scoped view and resets the country chip.
- Search and AMMAC certification remain independent, combined filters.
- Changing page language restores its default language scope.
- The existing 120-card rendering limit remains unchanged; the counter reports
  all matches and search/country filters narrow the list.

Country names in `src/data/directoryLanguages.js` match the Spanish values in
`static/schools.json`. Multilingual countries may belong to several groups.
This groups countries, not the teaching language of individual schools. New
countries must be classified there. Brazil is included in the Portuguese group,
although the current catalog contains Portugal but no Brazilian records.

## Verification and deployment (2026-11-12)

- `npm run test:foundation`, `npm run build`, `npm run test:seo-built` passed.
- `npx playwright test tests/e2e/directory-language.spec.js`: 8 passed (desktop
  Chrome and Pixel 7 emulation). Includes browser-language redirects, country
  selection, global scope, search and return to language scope.
- Playwright fallback: Browser plugin/skill not available in this session.
- Deploy only the public site: `npx firebase deploy --only hosting --project
  certificacionmontessori`; never deploy the independent alumnos-app as part
  of this change.
- Firebase Hosting retains the preceding release: use the Hosting release
  history to roll back if needed. The pre-change source commit is `051cc32`.
