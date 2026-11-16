<!-- Build plan: engineering direction. Dev-focused, not product. -->

# Build Plan — hyperapp (Web App)

## Core Principle

Same backend, same API contracts, same design tokens as Android — this project should
never invent its own version of something that already has a correct answer in
`hyperapp` or `the optional Android client`. When in doubt, go read the backend serializer/view
before guessing a request/response shape.

## Shipped (v1 — "core wallet")

See `progress-tracker.md` for the live checklist. Scaffolding, cookie-auth backend
integration, full auth flow, wallet home, asset detail + chart, transaction history,
notifications, profile, send/receive, signal implementation and team invites. See `core-wallet-web.md`
for transfer validation, precision, rollout and verification details.

## Next Increments, In Order

1. **Camera QR scanning.** Add scan-to-fill to the shipped send flow; manual entry and
   paste are available. Receiving already has a locally generated address QR.
2. **PWA.** `vite-plugin-pwa` for a manifest + installable "Add to Home Screen" + basic
   app-shell caching. Not offline-capable in any deep sense (this is a live-data app) —
   just installability and a faster repeat-load.
3. **Web Push.** Firebase Web SDK + a service worker for background notifications, mirroring
   the Android FCM registration flow (`POST /api/auth/devices/fcm-token/`). Requires the
   PWA service-worker groundwork from #2 first.
4. **Services store** — same priority order product decides for
   Android; port screen-by-screen once send/receive and PWA are solid.
5. **Messaging (Firestore chat).** Same Firebase custom-token bridge Android uses
   (`POST /api/messaging/auth/firebase-token/`) — the Firestore Web SDK is a drop-in
   analog of the Android SDK for this. Larger effort; do after the above.
6. **KYC submission.** Lower priority for a first web pass; KYC *status* is
   already read-only visible in Profile.

## Standing Engineering Tracks

### Design-System Fidelity
`src/styles/tokens.css` must track `the optional Android client/context/ui-tokens.md` — if the Android
theme changes (new semantic alias, new raw color), port it here in the same change, don't
let the two drift silently.

### Backend Contract Fidelity
Before adding a new API call, read the actual Django serializer/view in `hyperapp`
(don't assume from the Android Kotlin DTOs — those can lag). Response field names are
copied verbatim into TypeScript types in `src/api/*.ts` — no renaming for "nicer" casing.

### Auth Hygiene
Any new authenticated flow goes through the existing `src/lib/http.ts` client — never a
one-off `fetch`. Any new backend endpoint that issues tokens needs a cookie-setting `web/`
counterpart (see `accounts/web_views.py` in the backend) before this app can use it.

## How To Add A Screen

1. Check `context/architecture.md`'s folder structure and an existing feature (e.g.
   `features/wallet/`) for the shape to match.
2. Add the API types/functions to the relevant `src/api/<domain>.ts` file — verify field
   names against the actual backend serializer first.
3. Build the screen under `src/features/<feature>/`, promoting anything reused to
   `src/components/shared/` on its second use.
4. Add every user-facing string to both `en` and `ar` in `src/i18n/translations.ts`.
5. Wire the route in `src/App.tsx`.
6. Update `context/progress-tracker.md`.
