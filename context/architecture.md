<!-- System architecture: how this app is structured and how data flows. -->

# Architecture — hyperapp (Web App)

## Stack

| Layer      | Tool                                | Purpose                                    |
| ---------- | ------------------------------------ | ------------------------------------------ |
| Framework  | React 19 + TypeScript, Vite 7        | SPA, no SSR — an authenticated dashboard app has no SEO need |
| Routing    | React Router 7                       | `/auth`, `/`, `/asset/:network/:symbol`, `/activity`, `/notifications`, `/profile` |
| Server state | TanStack Query                     | Caching, retry, loading/error state — the Repository-layer equivalent |
| Styling    | Tailwind CSS v4 (`@theme`)           | Utility classes generated from `src/styles/tokens.css` |
| Auth       | httpOnly cookies                     | Set by the backend's `/api/auth/web/*` views |

## Folder Structure

```
src/
├── main.tsx / App.tsx        # entry, provider tree, routes
├── styles/                   # tokens.css (design system), globals.css
├── config/site.ts            # API base URL
├── i18n/                     # translations.ts, I18nProvider, useT
├── lib/                      # http.ts (fetch client), device.ts, format.ts, cn.ts
├── api/                      # typed domain clients: auth.ts, wallet.ts, transactions.ts, notifications.ts
├── state/                    # AuthContext, ThemeContext, QueryProvider
├── routes/                   # ProtectedRoute/GuestRoute, AppShell (bottom-nav layout)
├── components/                # shared/ (Button, TextField, Skeleton, …), layout/ (TopBar, BottomNav)
└── features/                 # auth/, wallet/, transactions/, notifications/, profile/
```

Feature folders follow the same shape as `the optional Android client`'s `features/<feature>/` where
it applies (a `<Feature>Page.tsx` entry, `components/` for feature-local pieces) — not
identical (no ViewModel layer; React Query + hooks fill that role), but the same instinct:
promote a component to `components/shared/` on its second use, don't fork it.

## Auth: httpOnly Cookies, Not localStorage

The wallet is custodial (backend signs/sweeps on-chain), so there's no wallet-SDK/private-key
concern here — but session tokens are still bearer-equivalent credentials, and unlike Android
(which can use scoped app storage), a browser SPA has no storage a same-origin XSS can't also
reach. **So tokens never enter JS-reachable state at all.**

```
Browser (fetch, credentials: "include")
      │
Django (accounts/web_views.py) — WebLoginView / WebTokenRefreshView / WebLogoutView
      │  sets/clears httpOnly access_token + refresh_token cookies
      │  (accounts/services/web_cookies.py) — host-only, no Domain attribute,
      │  so they're only ever sent to api.example.com, never to app.example.com's
      │  own JS or the marketing site
CookieOrHeaderJWTAuthentication (accounts/authentication.py)
      │  Bearer header first (Android, unaffected) → falls back to the cookie
      │  on unsafe methods: double-submit CSRF check (csrf_web cookie vs X-CSRF-Token header)
```

- `src/lib/http.ts` is the **only** place that talks to the network. Every domain module in
  `src/api/` goes through it. It always sends `credentials: "include"`, obtains
  a CSRF token from `GET /api/auth/web/csrf/` and attaches `X-CSRF-Token` on unsafe methods, and
  on a 401 does **one** refresh-then-retry (`POST /api/auth/web/token/refresh/`) before
  giving up and calling the registered "unauthenticated" handler.
- `AuthContext` (`src/state/AuthContext.tsx`) owns session bootstrap: on mount it calls
  `GET /api/auth/user/` — success means an existing cookie session is still valid (e.g. a
  page refresh), failure means show the auth flow. It also registers as `http.ts`'s
  unauthenticated handler so a session that dies mid-app (revoked token, expired refresh)
  drops the user back to `/auth` from anywhere.
- **Never** add a token to `localStorage`/`sessionStorage`/a JS variable that outlives a
  single request. If a future feature seems to need that, it's a sign the cookie design
  needs extending, not bypassing — flag it instead of working around it.

## Device Metadata & the `device_id` Tradeoff

`src/lib/device.ts` is the web analog of the Android app's `DeviceMetadataProvider`. Every
register/login/challenge-confirm call sends `device_id`, `device_name`, `os_name` (`"Web"`),
`os_version`, `app_version`, `timezone`, `language`, `country_hint` — the exact body keys
`accounts/services/security_metadata.py::extract_request_metadata` reads on the backend.

**`device_id` is a UUID persisted in `localStorage`, not a hardware identifier.** Android's
SSAID survives app reinstalls; nothing on the web survives clearing site data / a private
window / a different browser. Consequences, by design (the realistic ceiling for a browser,
not an oversight):

- The backend's banned-device block (`is_device_blocked`) and new-device-challenge
  (`is_trusted_device`) systems both key on `device_id` — a banned web user can get a fresh
  one more easily than a banned Android user can.
- A legitimate user who clears storage will see the new-device email-code challenge again —
  safe, just a mild extra step, not a security hole for them.

If this ever needs hardening, the fix is another *server-side* signal layered onto the
existing check (IP-based, etc.), not a client-side workaround — `device_id` generation
itself should stay exactly this simple.

## Design System

`src/styles/tokens.css` ports `the optional Android client`'s `ui/theme/` 1:1 — same raw palette, same
semantic `App*`-style aliases (as CSS variables + Tailwind utility classes), same 7-role
type scale, same four shape radii, dark-first. See `ui-tokens.md`. Tailwind's default
4px-step spacing scale already lines up with the Android `Spacing.*` scale, so there are no
custom spacing tokens — `p-4` (16px) *is* `Spacing.lg`.

## Invariants

- All network calls go through `src/lib/http.ts` — never a raw `fetch` in a component.
- Never store an auth token outside the httpOnly cookie the backend sets.
- Never hardcode a color/radius/font-size in a component — use the semantic
  `bg-app-*`/`text-app-*` utility classes or `rounded-chip`/`rounded-card`/`rounded-sheet`.
- Every user-facing string goes through `src/i18n/` (`en` + `ar`) — no bare string literals
  in JSX.
- Money amounts from the API are strings (`Decimal` on the backend) — never coerce to
  `number` for anything beyond display formatting.


## Browser authentication update — 2026-10-12

All three cookies (access, refresh, CSRF) are httpOnly and API-host-only by default.
The app cannot read API cookies through document.cookie. Instead the HTTP client
retrieves the CSRF token from GET /api/auth/web/csrf/ with credentials, keeping it
only in memory for in-flight requests. It fetches again for subsequent mutations
so another tab's login does not leave a permanently stale token.
The endpoint requires an Origin explicitly listed in CORS_ALLOWED_ORIGINS and
returns Cache-Control: no-store. Login, challenge confirmation, refresh, and
cookie-authenticated mutations validate both Origin and the matching CSRF header.
Bearer authentication retains its CSRF-free path. Challenge confirmation ignores
stale access cookies, since it establishes a new session.

This supports app/api subdomains on the same site. Unrelated brand domains need
a separate cookie/proxy deployment design; SameSite=Lax is still intentional.
Production must explicitly allow the app origin in CORS_ALLOWED_ORIGINS and use
secure cookies. Browser end-to-end verification remains pending.


## Environment selection

Development always uses the page origin and Vite's /api proxy to local Django
at 127.0.0.1:8000. Production builds use Vercel VITE_API_BASE (deployed API).
Ordinary Django manage.py commands default to development settings and SQLite.
Production WSGI/ASGI and container DJANGO_SETTINGS_MODULE select production and
PostgreSQL. See the backend context/environment-setup.md for the deployment
requirement and optional development integration configuration.
