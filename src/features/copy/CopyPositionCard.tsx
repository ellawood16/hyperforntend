import { useEffect, useState } from "react";
import { Clock3, Copy, CircleCheck } from "lucide-react";
import type { CopyRecord } from "@/api/copyTrade";
import { useI18n } from "@/i18n/I18nProvider";
import { formatCompactAmount, formatDateTime } from "@/lib/format";
import { decimal, units } from "@/lib/amounts";

export function CopyPositionCard({ copy }: { copy: CopyRecord }) {
  const { t, language } = useI18n();
  const [now, setNow] = useState(Date.now());
  const complete = Boolean(copy.settled_at);
  useEffect(() => {
    if (complete) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [complete]);
  const remaining = Math.max(0, Math.ceil((Date.parse(copy.release_at) - now) / 1000));
  const days = Math.floor(remaining / 86400);
  const clock = [Math.floor(remaining % 86400 / 3600), Math.floor(remaining % 3600 / 60), remaining % 60].map(v => String(v).padStart(2, "0")).join(":");
  const progress = complete ? 100 : Math.max(0, Math.min(100, 100 * (1 - remaining / (Math.max(1, copy.duration_days) * 86400))));
  const expected = decimal(units(copy.amount) * units(copy.profit_percent) / (100n * 10n ** 18n));
  return <article className="copy-position-card">
    <header><span className="copy-position-icon"><Copy size={20} aria-hidden="true"/></span><div><small>{t("copyPosition.type")}</small><h3>{copy.plan}</h3></div><span className={`copy-status${complete ? " copy-status-complete" : ""}`}>
      {complete ? <CircleCheck size={14} aria-hidden="true"/> : <span className="copy-status-dot" aria-hidden="true"/>}{t(complete ? "copyPosition.completed" : "copyPosition.active")}
    </span></header>
    <dl className="copy-position-values"><div><dt>{t("copyPosition.invested")}</dt><dd dir="ltr">{formatCompactAmount(copy.amount)} <small>USDT</small></dd></div><div><dt>{t(complete ? "copyPosition.profit" : "copyPosition.expected")}</dt><dd className="text-app-price-up" dir="ltr">+{formatCompactAmount(complete ? copy.profit : expected)} <small>USDT</small></dd></div></dl>
    <div className="copy-position-terms"><span>{formatCompactAmount(copy.profit_percent)}% · {t("copyPosition.days", { count: String(copy.duration_days) })}</span><span>{formatDateTime(copy.release_at, language)}</span></div>
    {!complete && <div className="copy-position-timer"><div><span><Clock3 size={15} aria-hidden="true"/>{t(remaining ? "copyPosition.remaining" : "copyPosition.settling")}</span><time dir="ltr">{days > 0 && `${t("copyPosition.days", { count: String(days) })} · `}{clock}</time></div><div className="copy-position-track" role="progressbar" aria-label={t("copyPosition.progress")} aria-valuenow={Math.floor(progress)} aria-valuemin={0} aria-valuemax={100}><span style={{width: `${progress}%`}}/></div></div>}
  </article>;
}
