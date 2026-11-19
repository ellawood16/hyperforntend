import { Link } from "react-router-dom";
import { Button } from "@/components/shared/Button";
import { useT } from "@/i18n/I18nProvider";

export function NotFoundPage() {
  const t = useT();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center bg-app-background">
      <div>
        <p className="mb-2 text-headline text-app-accent" aria-hidden="true">404</p>
        <h1 className="mb-2 text-title text-app-primary">{t("common.notFoundTitle")}</h1>
        <p className="text-body text-app-secondary">{t("common.notFoundBody")}</p>
      </div>
      <Link to="/" className="w-full">
        <Button fullWidth>{t("common.goHome")}</Button>
      </Link>
    </main>
  );
}
