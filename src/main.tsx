import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { captureMarketingAttribution } from "@/lib/device";
import "./styles/globals.css";
import { brandConfig } from "@/config/site";

document.documentElement.dataset.brandStyle = brandConfig.style;
document.documentElement.style.setProperty("--brand-accent", brandConfig.accent);
for (const [key, value] of Object.entries(brandConfig.colors)) {
  document.documentElement.style.setProperty(`--brand-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value);
}
document.title = brandConfig.name;

captureMarketingAttribution();

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Service worker registration failed", error);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
