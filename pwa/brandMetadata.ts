import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import brand from "../src/config/brand.json";
import manifestTemplate from "./manifest.json";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function imageType(path: string): string {
  const extension = path.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  return ({ svg: "image/svg+xml", png: "image/png", webp: "image/webp", ico: "image/x-icon" })[extension ?? ""] ?? "image/png";
}

export function brandMetadata(settings = brand): Plugin {
  const manifest = JSON.stringify({
    ...manifestTemplate,
    name: settings.name,
    short_name: settings.name,
    icons: [
      { src: settings.icons.pwa192, sizes: "192x192", type: imageType(settings.icons.pwa192), purpose: "any" },
      { src: settings.icons.pwa512, sizes: "512x512", type: imageType(settings.icons.pwa512), purpose: "any maskable" },
    ],
  }, null, 2);
  const workerTemplate = readFileSync(new URL("./sw.js", import.meta.url), "utf8");
  const version = createHash("sha256").update(JSON.stringify(settings)).update(workerTemplate).digest("hex").slice(0, 12);
  const worker = workerTemplate
    .replace("__BRAND_CONFIG__", () => JSON.stringify({ name: settings.name, icons: settings.icons }))
    .replace("__BRAND_VERSION__", version);
  const files = [
    { fileName: "manifest.webmanifest", source: manifest, type: "application/manifest+json" },
    { fileName: "sw.js", source: worker, type: "application/javascript" },
  ];

  return {
    name: "brand-metadata",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const values: Record<string, string> = {
          BRAND_NAME: settings.name,
          BRAND_FAVICON: settings.icons.favicon,
          BRAND_APPLE_TOUCH: settings.icons.appleTouch,
        };
        return html.replace(/%BRAND_(?:NAME|FAVICON|APPLE_TOUCH)%/g, (token) => escapeHtml(values[token.slice(1, -1)]));
      },
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const file = files.find(({ fileName }) => request.url?.split("?")[0] === `/${fileName}`);
        if (!file) return next();
        response.setHeader("Content-Type", file.type);
        response.setHeader("Cache-Control", "no-cache");
        response.end(file.source);
      });
    },
    generateBundle() {
      for (const file of files) this.emitFile({ type: "asset", fileName: file.fileName, source: file.source });
    },
  };
}
