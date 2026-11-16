import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { Button } from "@/components/shared/Button";
import { TextField } from "@/components/shared/TextField";

export function LoginPasswordStep({
  onSubmit,
  onForgotPassword,
  loading,
  error,
}: {
  onSubmit: (password: string) => void;
  onForgotPassword: () => void;
  loading: boolean;
  error?: string;
}) {
  const t = useT();
  const [password, setPassword] = useState("");

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(password);
      }}
    >
      <TextField
        label={t("auth.passwordLabel")}
        type="password"
        autoFocus
        placeholder={t("auth.passwordPlaceholder")}
        value={password}
        error={error}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="button"
        onClick={onForgotPassword}
        className="self-start text-label text-app-secondary underline"
      >
        {t("auth.forgotPassword")}
      </button>
      <Button type="submit" loading={loading} fullWidth disabled={!password}>
        {t("auth.login")}
      </Button>
    </form>
  );
}
