import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { Button } from "@/components/shared/Button";
import { TextField } from "@/components/shared/TextField";
import { checkAvailability, type EmailNextStep } from "@/api/auth";
import { ApiError } from "@/api/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailStep({ onResolved }: { onResolved: (email: string, nextStep: EmailNextStep) => void }) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [canRetry, setCanRetry] = useState(false);

  const submit = async (value = email) => {
    const trimmed = value.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError(t("auth.emailLabel"));
      setCanRetry(false);
      return;
    }
    setError(undefined);
    setCanRetry(false);
    setLoading(true);
    try {
      const result = await checkAvailability(trimmed);
      if (!result.next_step || !["register", "verify_email", "login"].includes(result.next_step)) {
        setError(t("common.somethingWrong"));
        setCanRetry(true);
        return;
      }
      onResolved(trimmed, result.next_step);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.somethingWrong"));
      setCanRetry(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <TextField
        label={t("auth.emailLabel")}
        type="email"
        autoFocus
        placeholder={t("auth.emailPlaceholder")}
        value={email}
        error={error}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(undefined);
          setCanRetry(false);
        }}
      />
      <Button type="submit" loading={loading} fullWidth>
        {t("common.continue")}
      </Button>
      {canRetry && (
        <Button type="button" variant="secondary" loading={loading} fullWidth onClick={() => submit(email)}>
          {t("auth.retryEmailCheck")}
        </Button>
      )}
    </form>
  );
}
