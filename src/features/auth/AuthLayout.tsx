import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";

export function AuthLayout({
  children,
  onBack,
  title,
  subtitle,
}: {
  children: ReactNode;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}) {
  const t = useT();
  return (
    <div className="onboarding-auth">
      <div className="onboarding-auth-nav">
        {onBack && (
          <button type="button" onClick={onBack} aria-label={t("common.back")} className="onboarding-auth-back">
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
        )}
      </div>
      {(title || subtitle) && (
        <div className="onboarding-auth-heading">
          {title && <h1>{title}</h1>}
          {subtitle && <p>{subtitle}</p>}
        </div>
      )}
      <div className="onboarding-auth-body">{children}</div>
    </div>
  );
}
