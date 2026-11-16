# Hyperapp frontend notes

This is the authenticated wallet frontend. The Django backend is in `../backend`.

- Cookie-based auth uses httpOnly cookies set by `/api/auth/web/*`; never store tokens in localStorage, sessionStorage or JavaScript state.
- Mutating requests must include the CSRF header; see `src/lib/http.ts`.
- Use the design tokens in `src/styles/tokens.css` rather than hardcoded component colors, spacing or radii.
- Preserve English/Arabic localization and RTL support. User-facing strings go through `src/i18n`.
- Public brand settings live in `src/config/brand.json`. Keep production domains aligned with `../backend/brand.json`.

## White-label template boundary

Read `../PROJECT_CONTEXT.md` for product context and the owner's design decisions.
Templates share business logic, APIs and controllers, while their UI, colors and layouts stay separate. Keep visual changes in the requested template's own view/style files. Anon changes must not affect Apple or Binance. The target is one customer-admin configuration location with a ready-to-use template selector; the current build-time brand manifests are not that finished feature.
