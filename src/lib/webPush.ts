function applicationServerKeyBytes(value: string): Uint8Array {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function readyWebPushWorker(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js");
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("web_push_worker_timeout")), 10000);
    void navigator.serviceWorker.ready.then(
      (registration) => { window.clearTimeout(timer); resolve(registration); },
      (error: unknown) => { window.clearTimeout(timer); reject(error); },
    );
  });
}

export async function requestWebPushSubscription(): Promise<PushSubscriptionJSON> {
  const publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY?.trim();
  if (!publicKey) throw new Error("web_push_not_configured");
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("web_push_unsupported");
  }

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  if (permission !== "granted") throw new Error("web_push_permission_denied");

  const registration = await readyWebPushWorker();
  const subscription = await registration.pushManager.getSubscription()
    ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKeyBytes(publicKey) as BufferSource,
    });

  return subscription.toJSON();
}
