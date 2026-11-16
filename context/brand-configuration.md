# Frontend brand configuration

Edit `src/config/brand.json` before building a brand deployment. `style` accepts
`apple`, `anon`, or `binance`. The Anon style uses the configured palette and a
light default; Binance uses a dark trading-inspired layout; Apple uses a light
monochrome layout. The old `classic` and `dark` values map to Apple and Binance.
Set `name`, `supportEmail`, `accent`, and the palette values for the brand.
The visitor's saved light/dark preference takes precedence over the default.

Set `icons.favicon` for the browser tab icon (SVG, PNG, or ICO),
`icons.appleTouch` for the Apple home-screen icon (PNG), and `icons.pwa192` /
`icons.pwa512` for installed-app and notification icons (192×192 and 512×512 PNG).
Place each brand's images in `public/icons/` and use paths such as
`/icons/my-brand.svg`. The bundled Hyperapp images are the default. The 512px
image should have enough padding to work as a maskable icon.
The HTML, web app manifest, and service worker are generated from these settings;
rebuild and deploy after changing them (restart Vite during development).
The service worker cache version changes with the brand settings so an updated
deployment replaces the previous brand's cached shell.

The floating support menu reads `telegramSupportUrl` and `telegramChannelUrl`
from the same `src/config/brand.json`. Set full `https://t.me/...` links for the
support account and channel. Empty values keep the corresponding option disabled
with a "Coming soon" label. The button appears above the bottom navigation on
authenticated pages. Rebuild after setting the links.

The API origin is set separately through `VITE_API_BASE`. Keep this aligned
with the backend's `brand.json`. Rebuild the frontend after changing the file.
