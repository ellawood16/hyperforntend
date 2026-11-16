# Hyperapp frontend

The authenticated React/TypeScript frontend for the white-label Django wallet API in `../../backend`. It provides email authentication, wallet balances and asset charts, sends and receives, transaction history, trading signals, copy trading, referrals, notifications, profile settings, bilingual English/Arabic support and themes.

Authentication uses httpOnly backend cookies and CSRF-protected requests. The frontend never handles wallet private keys. Vite proxies local `/api` requests to port 8000. Production origins are deployment configuration; see `../../README.md`.

No Android or marketing website project is bundled. PWA installation and browser push remain available.
