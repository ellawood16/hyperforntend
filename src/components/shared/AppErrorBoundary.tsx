import { Component, type ErrorInfo, type ReactNode } from "react";
import { useT } from "@/i18n/I18nProvider";
import { Button } from "./Button";

type Props = { children: ReactNode };
type State = { failed: boolean };

function AppCrashFallback() {
  const t = useT();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="mb-2 text-headline text-app-primary">{t("common.appErrorTitle")}</h1>
        <p className="text-body text-app-secondary">{t("common.appErrorBody")}</p>
      </div>
      <Button fullWidth onClick={() => window.location.reload()}>
        {t("common.reload")}
      </Button>
    </main>
  );
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application rendering failed", error, info);
  }

  render() {
    return this.state.failed ? <AppCrashFallback /> : this.props.children;
  }
}
