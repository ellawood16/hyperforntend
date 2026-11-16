import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { Button } from "@/components/shared/Button";
import { TextField } from "@/components/shared/TextField";

export function ForgotPasswordConfirmStep({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (code: string, newPassword: string, confirmPassword: string) => void;
  loading: boolean;
  error?: string;
}) {
  const t = useT();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(code, newPassword, confirmPassword);
      }}
    >
      <TextField
        label={t("auth.codeLabel")}
        inputMode="numeric"
        autoFocus
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
      />
      <TextField
        label={t("auth.newPasswordLabel")}
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <TextField
        label={t("auth.confirmPasswordLabel")}
        type="password"
        value={confirmPassword}
        error={mismatch ? t("auth.confirmPasswordLabel") : error}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <Button
        type="submit"
        loading={loading}
        fullWidth
        disabled={code.length !== 6 || newPassword.length < 8 || mismatch}
      >
        {t("auth.resetPassword")}
      </Button>
    </form>
  );
}
