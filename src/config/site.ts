import brand from "./brand.json";

export const siteConfig = {
  name: brand.name,
  apiBase: import.meta.env.DEV
    ? window.location.origin
    : (import.meta.env.VITE_API_BASE as string | undefined) ?? window.location.origin,
  supportEmail: brand.supportEmail,
};

export const brandConfig = {
  ...brand,
  style: brand.style === "classic" ? "apple" : brand.style === "dark" ? "binance" : brand.style,
};
