import { AlertCircle } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { Button } from "./Button";

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-app-danger" />
      <p className="text-body text-app-secondary">{message ?? t("common.somethingWrong")}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
