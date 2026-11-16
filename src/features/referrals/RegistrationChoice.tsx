import { Button } from "@/components/shared/Button";
import { useT } from "@/i18n/I18nProvider";

const ANDROID_APK_URL = import.meta.env.VITE_ANDROID_APK_URL?.trim();

export function RegistrationChoice({ onWeb }: { onWeb: () => void }) {
  const t = useT();
  const isAndroid = /Android/i.test(navigator.userAgent);

  return (
    <div className="flex flex-col gap-5 text-center">
      <div className="text-headline text-app-success">✓</div>
      <h1 className="text-title text-app-primary">{t("referral.readyTitle")}</h1>
      <p className="text-body text-app-secondary">{t("referral.readyBody")}</p>

      {isAndroid && ANDROID_APK_URL && (
        <>
          <Button fullWidth variant="secondary" onClick={() => window.location.assign(ANDROID_APK_URL)}>
            {t("referral.installWebApp")}
          </Button>
          <p className="text-label text-app-secondary">{t("referral.installInstructions")}</p>
        </>
      )}

      <Button fullWidth variant="ghost" onClick={onWeb}>{t("referral.continueWeb")}</Button>
    </div>
  );
}
