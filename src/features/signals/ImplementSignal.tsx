import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardPaste, Check, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { brandConfig } from "@/config/site";
import { useT, useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/shared/Button";
import { previewSignal, implementSignal, type SignalPreview, type SignalResult } from "@/api/signals";
import { ApiError } from "@/api/types";
import { formatDecimal2 } from "@/lib/format";
import { inputAmount, normalizeAmount, units } from "@/lib/amounts";
import { cn } from "@/lib/cn";

const CODE_PATTERN = /^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/;

function formatCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9).match(/.{1,3}/g)?.join("-") ?? "";
}

export function ImplementSignal({ network, symbol }: { network: string; symbol: string }) {
  const t = useT();
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const dialog = useRef<HTMLDialogElement>(null);
  const prefillsApplied = useRef(false);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [entry, setEntry] = useState("");
  const [direction, setDirection] = useState<"buy" | "sell">();
  const [preview, setPreview] = useState<SignalPreview>();
  const [result, setResult] = useState<SignalResult>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const apple = brandConfig.style === "apple";
  const validCode = CODE_PATTERN.test(code);
  const validEntry = inputAmount(entry);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);

  useEffect(() => {
    if (prefillsApplied.current) return;
    const rawCode = searchParams.get("code");
    const rawDirection = searchParams.get("direction");
    const nextCode = rawCode ? formatCode(rawCode) : "";
    const nextDirection = rawDirection === "buy" || rawDirection === "sell" ? rawDirection : undefined;
    if (!CODE_PATTERN.test(nextCode) && !nextDirection) return;
    prefillsApplied.current = true;
    if (CODE_PATTERN.test(nextCode)) setCode(nextCode);
    if (nextDirection) setDirection(nextDirection);
    setPreview(undefined);
    setResult(undefined);
    setError(undefined);
    setEntry("");
    setOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("code");
    next.delete("direction");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const changeCode = (value: string) => {
    setCode(formatCode(value));
    setPreview(undefined);
    setError(undefined);
  };
  const submit = async () => {
    if (submitting.current) return;
    if (!validCode || !validEntry || !direction) { setError(t("signalErrors.signal_input_invalid")); return; }
    if (preview && (Date.parse(preview.expires_at) <= Date.now() || units(entry) > units(preview.available_usdt))) {
      setPreview(undefined); setError(t(Date.parse(preview.expires_at) <= Date.now() ? "signalErrors.signal_unavailable" : "signalErrors.signal_amount")); return;
    }
    submitting.current = true;
    setError(undefined);
    setBusy(true);
    try {
      const data = { code, network, symbol };
      if (apple && direction) {
        const outcome = await implementSignal({ ...data, direction, entry_amount: entry });
        setResult(outcome);
        await queryClient.invalidateQueries({ queryKey: ["wallet"] });
        await queryClient.invalidateQueries({ queryKey: ["transactions"] });
        await queryClient.invalidateQueries({ queryKey: ["active-signals"] });
        await queryClient.invalidateQueries({ queryKey: ["signal-orders"] });
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } else if (!preview) {
        setPreview(await previewSignal(data));
      } else if (direction) {
        const outcome = await implementSignal({ ...data, direction, entry_amount: entry });
        setResult(outcome);
        await queryClient.invalidateQueries({ queryKey: ["wallet"] });
        await queryClient.invalidateQueries({ queryKey: ["transactions"] });
        await queryClient.invalidateQueries({ queryKey: ["active-signals"] });
        await queryClient.invalidateQueries({ queryKey: ["signal-orders"] });
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    } catch (err) {
      const key = err instanceof ApiError ? `signalErrors.${err.code}` : "";
      setError(key && t(key) !== key ? t(key) : t("common.somethingWrong"));
    } finally { submitting.current = false; setBusy(false); }
  };

  return <>
    {apple ? <div className="grid grid-cols-2 gap-3">{(["buy", "sell"] as const).map(side => <button key={side} type="button" className={`apple-signal-${side}`} onClick={() => { setCode(""); setEntry(""); setDirection(side); setPreview(undefined); setResult(undefined); setError(undefined); setOpen(true); }}>{t(side === "buy" ? "signal.buy" : "signal.sell")}</button>)}</div> : <Button fullWidth onClick={() => { setCode(""); setEntry(""); setDirection(undefined); setPreview(undefined); setResult(undefined); setError(undefined); setOpen(true); }}>{t("signal.open")}</Button>}
    <dialog ref={dialog} aria-labelledby="signal-title" onCancel={(event) => { event.preventDefault(); if (!busy) setOpen(false); }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-full w-full max-w-none overflow-y-auto rounded-t-sheet border-0 bg-app-surface p-6 text-app-primary backdrop:bg-raw-black/60">
      <div className="mb-4 flex items-center justify-between"><h2 id="signal-title" className="text-title">{symbol} · {t("signal.submit")}</h2>{apple && <button type="button" disabled={busy} aria-label={t("common.cancel")} onClick={() => setOpen(false)}><X /></button>}</div>
      {result ? <div role="status" className="flex flex-col gap-4">
        <p className="text-title">{result.outcome === "pending" ? (language === "ar" ? "تم فتح الأمر · التسوية خلال دقيقة" : "Order opened · settles in one minute") : t(result.outcome === "profit" ? "signal.profit" : "signal.loss")}</p>
        {result.result_amount !== null && <p className={result.outcome === "profit" ? "text-app-price-up" : "text-app-price-down"}>{formatDecimal2(result.result_amount)} USDT</p>}
        <p>{t("signal.balance")}: {formatDecimal2(result.balance)} USDT</p>
        <Button onClick={() => setOpen(false)}>{t("common.done")}</Button>
      </div> : <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <label className="text-label" htmlFor="signal-code">{t("signal.code")}</label>
        <div className="flex items-center rounded-chip bg-app-surface-soft px-4">
          <input id="signal-code" autoFocus dir="ltr" placeholder="XXX-XXX-XXX" value={code} disabled={busy} maxLength={11}
            onChange={(event) => changeCode(event.target.value)} className="min-w-0 flex-1 border-0 bg-transparent py-4 text-body-lg outline-none" />
          <button type="button" aria-label={t("signal.paste")} disabled={busy} onClick={async () => {
            try { changeCode(await navigator.clipboard.readText()); } catch { setError(t("signal.pasteError")); }
          }}><ClipboardPaste className="h-5 w-5" /></button>
        </div>
        <label htmlFor="signal-entry" className="text-center text-label text-app-secondary">{t("signal.entry")}</label>
        <input id="signal-entry" inputMode="decimal" value={entry} disabled={busy} onChange={(event) => { setEntry(normalizeAmount(event.target.value)); setPreview(undefined); }}
          dir="ltr" className="w-full border-0 bg-transparent py-6 text-center text-display text-app-primary outline-none" placeholder="0.00" />
        {!apple && <div className="flex gap-3">
          {(["buy", "sell"] as const).map((side) => <button type="button" key={side} disabled={busy} aria-pressed={direction === side}
            onClick={() => { setDirection(side); setPreview(undefined); }} className={cn("flex flex-1 items-center justify-center gap-2 rounded-chip py-3 font-semibold text-pure-white", side === "buy" ? "bg-app-success" : "bg-app-danger", direction === side && "ring-2 ring-pure-white ring-offset-2 ring-offset-[var(--app-surface)]")}>
            {direction === side && <Check aria-hidden="true" className="h-4 w-4" />}{t(side === "buy" ? "signal.buy" : "signal.sell")}
          </button>)}
        </div>}
        {preview && <div className="text-body text-app-secondary" role="status">
          <p>{t("signal.balance")}: {formatDecimal2(preview.available_usdt)} USDT ({preview.settlement_network})</p>
          <p>{t("signal.minimum")}: {formatDecimal2(preview.minimum_balance)} USDT</p>
          {preview.profit_type === "fixed_usdt"
            ? <p>{t("signal.riskFixed", { amount: formatDecimal2(preview.profit_amount ?? "0") })}</p>
            : preview.profit_type === "deposit_daily"
              ? <p>{t("signal.riskDaily", { amount: formatDecimal2(preview.profit_amount ?? "0") })}</p>
              : <p>{t("signal.risk", { percent: formatDecimal2(preview.profit_percent ?? "0") })}</p>}
          <p>{t("signal.expires")}: {new Date(preview.expires_at).toLocaleString(language)}</p>
        </div>}
        {entry && !validEntry && <p className="text-label text-app-danger">{t("transfer.amountPrecision")}</p>}
        {error && <p role="alert" className="text-body text-app-danger">{error}</p>}
        <Button type="submit" loading={busy} disabled={!validCode || !validEntry || !direction}>
          {t(apple || preview ? "signal.submit" : "signal.review")}
        </Button>
        {!apple && <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>{t("common.cancel")}</Button>}
      </form>}
    </dialog>
  </>;
}
