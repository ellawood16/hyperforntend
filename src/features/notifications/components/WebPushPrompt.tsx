import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { registerWebPushSubscription } from "@/api/notifications";
import { Button } from "@/components/shared/Button";
import { useT } from "@/i18n/I18nProvider";
import { getDeviceId } from "@/lib/device";
import { readyWebPushWorker, requestWebPushSubscription, webPushErrorKey } from "@/lib/webPush";
import { useAuth } from "@/state/AuthContext";

type PromptState = "checking" | "needed" | "blocked" | "enabled";

function dismissedKey(userId: number): string {
  return `hyperapp_push_prompt_dismissed_${userId}`;
}

export function WebPushPrompt() {
  const t = useT();
  const { user } = useAuth();
  const [state, setState] = useState<PromptState>("checking");
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || !("Notification" in window)
      || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    let cancelled = false;
    setState("checking");
    try {
      setDismissed(sessionStorage.getItem(dismissedKey(user.id)) === "1");
    } catch {
      setDismissed(false);
    }

    if (Notification.permission === "denied") {
      setState("blocked");
    } else if (Notification.permission === "default") {
      setState("needed");
    } else {
      // A granted browser permission is not enough: the push subscription
      // must also be saved for this Django account.
      void readyWebPushWorker()
        .then((registration) => registration.pushManager.getSubscription())
        .then(async (subscription) => {
          if (!subscription || cancelled) return false;
          const json = subscription.toJSON();
          if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return false;
          await registerWebPushSubscription(getDeviceId(), json);
          return true;
        })
        .then((registered) => { if (!cancelled) setState(registered ? "enabled" : "needed"); })
        .catch(() => { if (!cancelled) setState("needed"); });
    }
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!user || !import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || !("Notification" in window)
    || !("serviceWorker" in navigator) || !("PushManager" in window)
    || state === "checking" || state === "enabled" || dismissed) return null;

  const enable = async () => {
    setLoading(true);
    setErrorKey(null);
    try {
      const subscription = await requestWebPushSubscription();
      await registerWebPushSubscription(getDeviceId(), subscription);
      setState("enabled");
    } catch (error) {
      console.error("web push enable failed", error);
      setErrorKey(webPushErrorKey(error));
      if (Notification.permission === "denied") setState("blocked");
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    try { sessionStorage.setItem(dismissedKey(user.id), "1"); } catch { /* Storage can be unavailable. */ }
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-app-background/80 p-4 sm:items-center" role="presentation">
      <section role="dialog" aria-modal="true" aria-label={t("referral.notificationTitle")}
        className="w-full max-w-md rounded-sheet bg-app-surface p-6 shadow-xl">
        <h2 className="mb-2 text-title-md text-app-primary">{t("referral.notificationTitle")}</h2>
        <p className="mb-5 text-body text-app-secondary">{t(state === "blocked" ? "referral.pushDenied" : "referral.pushPromptBody")}</p>
        {errorKey && state !== "blocked" && <p role="alert" className="mb-3 text-label text-app-danger">{t(errorKey)}</p>}
        {state === "needed" && <Button fullWidth loading={loading} onClick={enable}>{t("referral.enableNotifications")}</Button>}
        {state === "blocked" && <Link to="/notifications" onClick={dismiss}
          className="inline-flex w-full items-center justify-center rounded-chip bg-app-action px-6 py-3 text-body font-semibold text-app-on-action">
          {t("referral.pushOpenSettings")}
        </Link>}
        <Button fullWidth variant="ghost" className="mt-3" onClick={dismiss}>{t("referral.later")}</Button>
      </section>
    </div>
  );
}
