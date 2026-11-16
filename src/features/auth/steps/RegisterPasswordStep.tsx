import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { Button } from "@/components/shared/Button";
import { TextField } from "@/components/shared/TextField";

export function RegisterPasswordStep({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (password: string) => void;
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
        value={password}
        error={error}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" loading={loading} fullWidth disabled={password.length < 8}>
        {t("auth.createAccount")}
      </Button>
    </form>
  );
}
