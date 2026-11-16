import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { Button } from "@/components/shared/Button";
import { TextField } from "@/components/shared/TextField";

export function ForgotPasswordRequestStep({
  initialEmail,
  onSubmit,
  loading,
  error,
}: {
  initialEmail: string;
  onSubmit: (email: string) => void;
  loading: boolean;
  error?: string;
}) {
  const t = useT();
  const [email, setEmail] = useState(initialEmail);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email.trim().toLowerCase());
      }}
    >
      <TextField
        label={t("auth.emailLabel")}
        type="email"
        autoFocus
        value={email}
        error={error}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" loading={loading} fullWidth disabled={!email}>
        {t("common.continue")}
      </Button>
    </form>
  );
}
