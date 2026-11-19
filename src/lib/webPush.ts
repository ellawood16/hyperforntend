import { ApiError } from "@/api/types";

function normalizePublicKey(value: string): string {
  return value.trim().replace(/^"+|"+$/g, "").replace(/\s+/g, "");
}

function applicationServerKeyBytes(value: string): Uint8Array {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function keyBytesEqual(left: ArrayBuffer | null, right: Uint8Array): boolean {
  if (!left || left.byteLength !== right.byteLength) return false;
  const view = new Uint8Array(left);
  for (let i = 0; i < view.length; i += 1) {
    if (view[i] !== right[i]) return false;
  }
  return true;
}

function applicationServerKeySource(bytes: Uint8Array): ArrayBuffer {
  // Some browsers reject a Uint8Array view; pass an exact ArrayBuffer copy.
  return Uint8Array.from(bytes).buffer;
}

export async function readyWebPushWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
  try {
    await registration.update();
  } catch {
    // Update is best-effort; an existing worker can still subscribe.
  }
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("web_push_worker_timeout")), 10000);
    void navigator.serviceWorker.ready.then(
      (ready) => { window.clearTimeout(timer); resolve(ready); },
      (error: unknown) => { window.clearTimeout(timer); reject(error); },
    );
  });
}

async function subscribeWithPublicKey(
  registration: ServiceWorkerRegistration,
  publicKey: string,
): Promise<PushSubscription> {
  const keyBytes = applicationServerKeyBytes(publicKey);
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    const existingKey = existing.options.applicationServerKey ?? null;
    if (keyBytesEqual(existingKey, keyBytes)) return existing;
    // VAPID key rotated — drop the stale subscription before creating a new one.
    await existing.unsubscribe();
  }
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKeySource(keyBytes),
  });
}

export async function requestWebPushSubscription(): Promise<PushSubscriptionJSON> {
  const publicKey = normalizePublicKey(import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY ?? "");
  if (!publicKey) throw new Error("web_push_not_configured");
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("web_push_unsupported");
  }

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  if (permission !== "granted") throw new Error("web_push_permission_denied");

  const registration = await readyWebPushWorker();
  let subscription: PushSubscription;
  try {
    subscription = await subscribeWithPublicKey(registration, publicKey);
  } catch (error) {
    const name = error instanceof DOMException || error instanceof Error ? error.name : "";
    if (name === "AbortError" || name === "NotAllowedError") throw new Error("web_push_permission_denied");
    if (name === "DataError" || name === "InvalidAccessError") throw new Error("web_push_invalid_key");
    throw new Error("web_push_subscribe_failed");
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error("web_push_subscribe_failed");
  }
  return json;
}

/** Map enable-flow failures to referral.* translation keys. */
export function webPushErrorKey(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return "referral.pushAuthFailed";
    if (error.status === 429) return "referral.pushRateLimited";
    return "referral.pushRegisterFailed";
  }
  const code = error instanceof Error ? error.message : "";
  switch (code) {
    case "web_push_not_configured":
      return "referral.pushNotConfigured";
    case "web_push_unsupported":
      return "referral.pushUnsupported";
    case "web_push_permission_denied":
      return "referral.pushDenied";
    case "web_push_worker_timeout":
      return "referral.pushWorkerFailed";
    case "web_push_invalid_key":
      return "referral.pushInvalidKey";
    case "web_push_subscribe_failed":
      return "referral.pushSubscribeFailed";
    default:
      return "referral.pushFailed";
  }
}
