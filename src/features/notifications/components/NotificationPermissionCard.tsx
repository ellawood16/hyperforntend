import { useCallback, useEffect, useState } from "react";
import { registerWebPushSubscription } from "@/api/notifications";
import { Button } from "@/components/shared/Button";
import { useT } from "@/i18n/I18nProvider";
import { getDeviceId } from "@/lib/device";
import {
  isInAppBrowser,
  isIosPushContextMissing,
  readyWebPushWorker,
  requestWebPushSubscription,
  webPushErrorKey,
} from "@/lib/webPush";

type PushStatus = "checking" | "unsupported" | "needed" | "blocked" | "enabled" | "in_app" | "ios_home";

function supportsPush(): boolean {
  return Boolean(import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY)
    && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

function isPermissionDenied(): boolean {
  return Notification.permission === "denied";
}

function statusMessageKey(status: PushStatus): string {
  switch (status) {
    case "blocked":
      return "referral.pushDenied";
    case "in_app":
      return "referral.pushInAppBrowser";
    case "ios_home":
      return "referral.pushIosHomeScreen";
    case "unsupported":
      return "referral.pushUnsupported";
    case "enabled":
      return "referral.notificationsEnabled";
    default:
      return "referral.pushPromptBody";
  }
}

export function NotificationPermissionCard() {
  const t = useT();
  const [status, setStatus] = useState<PushStatus>("checking");
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!supportsPush()) { setStatus("unsupported"); return; }
    if (isInAppBrowser()) { setStatus("in_app"); return; }
    if (isIosPushContextMissing()) { setStatus("ios_home"); return; }
    if (isPermissionDenied()) { setStatus("blocked"); return; }
    if (Notification.permission !== "granted") { setStatus("needed"); return; }
    try {
      const registration = await readyWebPushWorker();
      const subscription = await registration.pushManager.getSubscription();
      setStatus(subscription ? "enabled" : "needed");
    } catch {
      setStatus("needed");
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    const onReturn = () => { if (document.visibilityState === "visible") void refreshStatus(); };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [refreshStatus]);

  const enable = async () => {
    if (isInAppBrowser()) { setStatus("in_app"); return; }
    if (isIosPushContextMissing()) { setStatus("ios_home"); return; }
    if (isPermissionDenied()) {
      setStatus("blocked");
      setShowGuide(true);
      return;
    }
    setLoading(true);
    setErrorKey(null);
    try {
      const subscription = await requestWebPushSubscription();
      await registerWebPushSubscription(getDeviceId(), subscription);
      setStatus("enabled");
      setShowGuide(false);
    } catch (error) {
      console.error("web push enable failed", error);
      const key = webPushErrorKey(error);
      setErrorKey(key);
      if (key === "referral.pushInAppBrowser") setStatus("in_app");
      else if (key === "referral.pushIosHomeScreen") setStatus("ios_home");
      else {
        await refreshStatus();
        if (isPermissionDenied()) setShowGuide(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return <section className="rounded-card bg-app-surface p-4 sm:p-5" aria-label={t("referral.notificationTitle")}>
    <h2 className="mb-2 text-title-md text-app-primary">{t("referral.notificationTitle")}</h2>
    <p className="mb-4 text-body text-app-secondary">{t(statusMessageKey(status))}</p>
    {(status === "needed" || status === "blocked") && <Button fullWidth loading={loading} onClick={enable}>
      {t("referral.enableNotifications")}
    </Button>}
    {status === "blocked" && showGuide && <div className="mt-4 rounded-chip bg-app-surface-soft p-4 text-body text-app-primary">
      <p className="mb-2 font-semibold">{t("referral.pushSettingsTitle")}</p>
      <p>{t("referral.pushSettingsBrowser")}</p>
      <p className="mt-2">{t("referral.pushSettingsAndroid")}</p>
      <Button variant="secondary" className="mt-3" onClick={() => void refreshStatus()}>{t("referral.pushCheckAgain")}</Button>
    </div>}
    {errorKey && status === "needed" && <p role="alert" className="mt-3 text-label text-app-danger">{t(errorKey)}</p>}
  </section>;
}
