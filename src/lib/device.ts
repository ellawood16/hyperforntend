/**
 * Web analog of the optional Android client's DeviceMetadataProvider. Sent as body fields
 * on every register/login call — the backend's `extract_request_metadata`
 * (accounts/services/security_metadata.py) reads these exact keys.
 *
 * device_id is the one field that matters most: login hard-requires it, and
 * it drives the banned-device and new-device-challenge checks. Android uses
 * the SSAID, which survives app reinstalls. The web has nothing that durable
 * — this is a UUID persisted in localStorage, which means:
 *   - it resets if the user clears site data, uses a private window, or
 *     switches browsers, so a banned web user can get a fresh one more
 *     easily than a banned Android user can;
 *   - legitimate users will see the "new device" email-code challenge more
 *     often after clearing storage — safe, just a mild extra step.
 * This is the realistic ceiling for a browser; flagged here rather than
 * buried, in case it's ever worth pairing with another signal server-side.
 */

const DEVICE_ID_KEY = "hyperapp_device_id";
const MARKETING_KEY = "hyperapp_marketing";

function uuid(): string {
  if ("randomUUID" in crypto) return crypto.randomUUID();
  // Fallback for older browsers without crypto.randomUUID.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // Storage unavailable (private mode / blocked) — degrade to a
    // session-lived id rather than sending an empty device_id, which the
    // backend rejects outright on login.
    return uuid();
  }
}

function parseBrowser(ua: string): { name: string; version: string } {
  const patterns: [RegExp, string][] = [
    [/Edg\/([\d.]+)/, "Edge"],
    [/OPR\/([\d.]+)/, "Opera"],
    [/Chrome\/([\d.]+)/, "Chrome"],
    [/Firefox\/([\d.]+)/, "Firefox"],
    [/Version\/([\d.]+).*Safari/, "Safari"],
  ];
  for (const [re, name] of patterns) {
    const match = ua.match(re);
    if (match) return { name, version: match[1] };
  }
  return { name: "Browser", version: "" };
}

function parsePlatform(ua: string): string {
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
}

export type DeviceMetadata = {
  device_id: string;
  device_name: string;
  os_name: string;
  os_version: string;
  app_version: string;
  timezone: string;
  language: string;
  country_hint: string;
};

/** APP_VERSION is stamped at build time (see vite.config.ts define, or falls
 * back to the package version) — purely informational, unlike Android there
 * is no app-store version gate on the web. */
const APP_VERSION = "0.1.0";

export function getDeviceMetadata(language: "en" | "ar"): DeviceMetadata {
  const ua = navigator.userAgent;
  const browser = parseBrowser(ua);
  const platform = parsePlatform(ua);
  const region = navigator.language.split("-")[1];

  return {
    device_id: getDeviceId(),
    device_name: `${browser.name} on ${platform}`,
    os_name: "Web",
    os_version: browser.version ? `${browser.name} ${browser.version}` : browser.name,
    app_version: APP_VERSION,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language,
    country_hint: region ?? "",
  };
}

export type MarketingAttribution = {
  marketing_source: string;
  marketing_campaign: string;
  marketing_referrer: string;
};

/** Captured once on first landing (see main.tsx) and persisted so it still
 * rides along on a registration that happens several page views later. */
export function captureMarketingAttribution(): void {
  try {
    if (localStorage.getItem(MARKETING_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const attribution: MarketingAttribution = {
      marketing_source: params.get("utm_source") ?? "",
      marketing_campaign: params.get("utm_campaign") ?? "",
      marketing_referrer: document.referrer || "",
    };

    if (attribution.marketing_source || attribution.marketing_campaign || attribution.marketing_referrer) {
      localStorage.setItem(MARKETING_KEY, JSON.stringify(attribution));
    }
  } catch {
    // Storage unavailable — attribution is best-effort, never block on it.
  }
}

export function getMarketingAttribution(): MarketingAttribution {
  try {
    const raw = localStorage.getItem(MARKETING_KEY);
    if (raw) return JSON.parse(raw) as MarketingAttribution;
  } catch {
    // ignore
  }
  return { marketing_source: "", marketing_campaign: "", marketing_referrer: "" };
}
