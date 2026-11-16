# Hyperapp frontend

React 19, TypeScript and Vite wallet frontend. The Django API lives in `../backend`.

Run `npm ci` and `npm run dev`, then open http://localhost:5173. The development proxy forwards `/api` to port 8000.

Set identity, support contacts and theme in `src/config/brand.json`. Install metadata and icons live in `index.html` and `public/`. Set `VITE_API_BASE` for production using `.env.example`; blank uses the frontend origin.

Run `npm run build`, `npm test` and `npm run lint` before deployment. See `../README.md` for full setup and `context/brand-configuration.md` for theme options.
