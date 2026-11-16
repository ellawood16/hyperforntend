import { useState } from "react";
import { Smartphone, X } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";

const DISMISSED_UNTIL_KEY = "hyperapp_android_install_dismissed_until";
const DISMISS_DAYS = 30;

function canOfferAndroidApp(): boolean {
  if (!import.meta.env.VITE_ANDROID_APK_URL?.trim() || !/Android/i.test(navigator.userAgent)
    || window.matchMedia("(display-mode: standalone)").matches) return false;
  try {
    return Number(localStorage.getItem(DISMISSED_UNTIL_KEY) ?? 0) < Date.now();
  } catch {
    return true;
  }
}

export function AndroidInstallBanner() {
  const t = useT();
  const [visible, setVisible] = useState(canOfferAndroidApp);
  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
    } catch { /* Storage can be unavailable. */ }
    setVisible(false);
  };

  return <>
    <div aria-hidden="true" className="h-24" />
    <aside aria-label={t("referral.androidOfferTitle")}
      className="fixed inset-x-0 z-30 border-t border-app bg-app-surface px-3 py-3 shadow-xl bottom-[calc(4rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-app-accent-soft text-app-accent" aria-hidden="true">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-app-primary">{t("referral.androidOfferTitle")}</p>
          <p className="text-label text-app-secondary">{t("referral.androidOfferBody")}</p>
        </div>
        <a href={import.meta.env.VITE_ANDROID_APK_URL?.trim()} className="shrink-0 rounded-chip bg-app-accent px-3 py-2 text-label font-semibold text-white">
          {t("referral.androidOfferAction")}
        </a>
        <button type="button" onClick={dismiss} aria-label={t("common.close")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-app-secondary">
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  </>;
}
