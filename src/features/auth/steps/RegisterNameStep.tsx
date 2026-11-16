import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { Button } from "@/components/shared/Button";
import { TextField } from "@/components/shared/TextField";

export function RegisterNameStep({ onSubmit }: { onSubmit: (firstName: string, lastName: string) => void }) {
  const t = useT();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(firstName.trim(), lastName.trim());
      }}
    >
      <TextField label={t("auth.firstNameLabel")} autoFocus value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <TextField label={t("auth.lastNameLabel")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <Button type="submit" fullWidth disabled={!firstName.trim() || !lastName.trim()}>
        {t("common.continue")}
      </Button>
    </form>
  );
}
