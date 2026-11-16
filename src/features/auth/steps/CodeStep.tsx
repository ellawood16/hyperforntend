import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import { Button } from "@/components/shared/Button";

/** Shared 6-digit-code form used by email verification, login challenge, and
 * password reset confirm — same shape, different submit handler per caller. */
export function CodeStep({
  onSubmit,
  onResend,
  loading,
  resendLoading,
  error,
  initialCode = "",
  submitLabel,
}: {
  onSubmit: (code: string) => void;
  onResend?: () => void;
  loading: boolean;
  resendLoading?: boolean;
  error?: string;
  initialCode?: string;
  submitLabel?: string;
}) {
  const t = useT();
  const [code, setCode] = useState(initialCode.replace(/\D/g, "").slice(0, 6));
  const [clipboardError, setClipboardError] = useState(false);

  const pasteCode = async () => {
    setClipboardError(false);
    try {
      const pasted = await navigator.clipboard.readText();
      const digits = pasted.replace(/\D/g, "").slice(0, 6);
      if (!digits) throw new Error("Clipboard did not contain a code");
      setCode(digits);
    } catch {
      setClipboardError(true);
    }
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(code);
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="verification-code" className="text-label text-app-secondary">
          {t("auth.codeLabel")}
        </label>
        <div className="flex items-center gap-3">
          <input
            id="verification-code"
            inputMode="numeric"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="min-w-0 flex-1 border-b border-app bg-transparent px-1 py-3 text-body-lg tracking-[0.25em] text-app-primary outline-none focus:border-b-[var(--app-text-primary)]"
          />
          <button type="button" onClick={pasteCode} className="shrink-0 rounded-chip bg-app-surface-soft px-3 py-2 text-label font-semibold text-app-primary hover:bg-app-surface-muted">
            {t("auth.pasteCode")}
          </button>
        </div>
        {error && <p className="text-label text-app-danger">{error}</p>}
      </div>
      {clipboardError && <p role="status" className="text-label text-app-secondary">{t("auth.clipboardError")}</p>}
      {onResend && (
        <button
          type="button"
          onClick={onResend}
          disabled={resendLoading}
          className="self-start text-label text-app-secondary underline disabled:opacity-50"
        >
          {t("auth.resendCode")}
        </button>
      )}
      <Button type="submit" loading={loading} fullWidth disabled={code.length !== 6}>
        {submitLabel ?? t("common.continue")}
      </Button>
    </form>
  );
}
