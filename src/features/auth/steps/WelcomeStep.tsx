import { ArrowDownLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { Button } from "@/components/shared/Button";
import { onboardingScenes, type OnboardingScene } from "../OnboardingShell";

export function WelcomeStep({
  active,
  onActiveChange,
  onContinue,
}: {
  active: number;
  onActiveChange: (index: number) => void;
  onContinue: () => void;
}) {
  const t = useT();
  const scene = onboardingScenes[active] as OnboardingScene;

  return (
    <>
      <nav className="onboarding-steps" aria-label={t("auth.onboarding.explore")}>
        {onboardingScenes.map((item, index) => (
          <button
            key={item}
            type="button"
            aria-current={index === active ? "step" : undefined}
            aria-label={t(`auth.onboarding.${item}Title`)}
            onClick={() => onActiveChange(index)}
          >
            <span>0{index + 1}</span>
            <span className="onboarding-step-line" />
          </button>
        ))}
      </nav>
      <div key={scene} className="onboarding-copy" aria-live="polite" aria-atomic="true">
        <p className="onboarding-eyebrow">{t(`auth.onboarding.${scene}Label`)}</p>
        <h1>{t(`auth.onboarding.${scene}Title`)}</h1>
        <p className="onboarding-description">{t(`auth.onboarding.${scene}Body`)}</p>
      </div>
      <div className="onboarding-features">
        <span>
          <span className="onboarding-apk-icon onboarding-wallet-icon" />
          {t("auth.onboarding.hold")}
        </span>
        <span>
          <span className="onboarding-apk-icon onboarding-send-icon" />
          {t("auth.onboarding.send")}
        </span>
        <span>
          <ArrowDownLeft />
          {t("auth.onboarding.receive")}
        </span>
      </div>
      <div className="onboarding-actions">
        <Button fullWidth onClick={onContinue} className="onboarding-cta">
          {t("auth.onboarding.getStarted")}
          <ArrowRight className="h-5 w-5 rtl:rotate-180" />
        </Button>
        <div className="onboarding-pagination">
          <span dir="ltr">0{active + 1} / 03</span>
          <div>
            <button
              type="button"
              disabled={active === 0}
              onClick={() => onActiveChange(active - 1)}
              aria-label={t("auth.onboarding.previous")}
            >
              <ChevronLeft className="rtl:rotate-180" />
            </button>
            <button
              type="button"
              disabled={active === onboardingScenes.length - 1}
              onClick={() => onActiveChange(active + 1)}
              aria-label={t("auth.onboarding.next")}
            >
              <ChevronRight className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
