import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { brandMetadata } from "./pwa/brandMetadata";

export default defineConfig({
  plugins: [react(), brandMetadata()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        cookieDomainRewrite: "",
        configure(proxy) {
          proxy.on("proxyReq", (proxyReq, req) => {
            // Same-origin GETs omit Origin; Django's CSRF bootstrap requires it.
            // Preserve explicit origins so Django can reject unapproved callers.
            if (!req.headers.origin && (req.method === "GET" || req.method === "HEAD")) {
              proxyReq.setHeader("Origin", "http://localhost:5173");
            }
          });
        },
      },
    },
  },
});
