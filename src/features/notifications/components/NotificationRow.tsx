import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { markNotificationRead, type AppNotification } from "@/api/notifications";
import { useT } from "@/i18n/I18nProvider";
import { formatDateTime, formatDecimal2 } from "@/lib/format";
import { cn } from "@/lib/cn";
import { SignalImplementAction } from "../templates/SignalImplementAction";

function signalHref(network: string, symbol: string, code: string, direction: "buy" | "sell") {
  const params = new URLSearchParams({ code, direction });
  return `/asset/${encodeURIComponent(network)}/${encodeURIComponent(symbol)}?${params.toString()}`;
}

export function NotificationRow({ notification, language }: { notification: AppNotification; language: "en" | "ar" }) {
  const t = useT();
  const queryClient = useQueryClient();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const markRead = useMutation({
    mutationFn: () => markNotificationRead(notification.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyState]);
  const read = () => { if (!notification.is_read && !markRead.isPending) markRead.mutate(); };
  const metadata = notification.metadata ?? {};
  const code = notification.type === "signal" && typeof metadata.code === "string" && /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/i.test(metadata.code) ? metadata.code.toUpperCase() : null;
  const direction = metadata.direction === "buy" || metadata.direction === "sell" ? metadata.direction : null;
  const symbol = typeof metadata.symbol === "string" ? metadata.symbol : null;
  const network = typeof metadata.network === "string" ? metadata.network : null;
  const minimum = typeof metadata.minimum_balance === "string" && /^\d+(\.\d+)?$/.test(metadata.minimum_balance)
    ? formatDecimal2(metadata.minimum_balance)
    : null;
  const expiry = typeof metadata.expires_at === "string" && Number.isFinite(Date.parse(metadata.expires_at)) ? metadata.expires_at : null;
  const signal = code && direction && symbol && network
    ? { code, direction, symbol, network, minimum, expiry }
    : null;
  const deposit = notification.type === "deposit" && notification.amount != null && notification.token
    ? { amount: formatDecimal2(notification.amount), token: notification.token } : null;
  return <article className="py-6">
    <button type="button" onClick={read} className="flex min-h-10 w-full items-center gap-2 text-start">
      <span className={cn("min-w-0 flex-1 text-body", !notification.is_read ? "font-semibold text-app-primary" : "text-app-secondary")}>
        {signal ? `${signal.symbol} · ${t(`signal.${signal.direction}`)}` : deposit ? t("notif.depositTitle", { token: deposit.token }) : notification.title}
      </span>
      {!notification.is_read && <><span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-app-action" /><span className="sr-only">{t("notif.unread")}</span></>}
      {!code && <time dateTime={notification.created_at} className="text-label text-app-secondary">{formatDateTime(notification.created_at, language)}</time>}
    </button>
    {code && <div className="my-2 flex items-center gap-3">
      <code dir="ltr" className="select-all text-headline font-semibold tracking-wide text-app-primary">{code}</code>
      <button type="button" aria-label={t(copyState === "copied" ? "common.copied" : "notif.copyCode")} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-chip text-app-secondary hover:bg-app-surface-soft hover:text-app-primary" onClick={async () => {
        try { await navigator.clipboard.writeText(code); setCopyState("copied"); read(); }
        catch { setCopyState("error"); }
      }}>{copyState === "copied" ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}</button>
    </div>}
    {signal ? <div className="space-y-1 text-label text-app-secondary">
      {signal.minimum && <p>{t("signal.minimum")}: {signal.minimum} USDT</p>}
      {signal.expiry && <p>{t("signal.expires")}: <time dateTime={signal.expiry}>{formatDateTime(signal.expiry, language)}</time></p>}
    </div> : deposit ? <p className="text-body text-app-secondary">{t("notif.depositBody", { amount: deposit.amount, token: deposit.token })}</p>
      : notification.type !== "signal" ? <p className="text-body text-app-secondary">{notification.message}</p> : null}
    {signal && (
      <div className="mt-3">
        <SignalImplementAction
          implemented={notification.implemented}
          to={signalHref(signal.network, signal.symbol, signal.code, signal.direction)}
          onActivate={read}
        />
      </div>
    )}
    <span role="status" className={copyState === "error" ? "mt-2 block text-label text-app-secondary" : "sr-only"}>
      {copyState === "copied" ? t("common.copied") : copyState === "error" ? t("notif.copyError") : ""}
    </span>
    {markRead.isError && <p role="alert" className="mt-2 text-label text-app-secondary">{t("notif.readError")}</p>}
  </article>;
}
