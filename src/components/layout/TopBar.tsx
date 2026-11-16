import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";

export function TopBar({ title, back, action }: { title: string; back?: boolean; action?: ReactNode }) {
  const navigate = useNavigate();
  const t = useT();
  return (
    <header className="app-page-header sticky top-0 z-10 flex items-center gap-3 bg-app-background px-4 py-4">
      {back && (
        <button onClick={() => navigate(-1)} aria-label={t("common.back")} className="app-header-back">
          <ChevronLeft className="h-6 w-6 rtl:rotate-180" />
        </button>
      )}
      <h1 className="flex-1 text-title text-app-primary">{title}</h1>
      {action}
    </header>
  );
}
