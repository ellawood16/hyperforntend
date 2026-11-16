import { Clock3, Users } from "lucide-react";
import type { CopyPlan } from "@/api/copyTrade";
import { Button } from "@/components/shared/Button";
import { useT } from "@/i18n/I18nProvider";
import { formatCompactAmount } from "@/lib/format";

export function CopyPlanCard({ plan, enabled, compact = false, onSelect }: {
  plan: CopyPlan;
  enabled: boolean;
  compact?: boolean;
  onSelect: (plan: CopyPlan) => void;
}) {
  const t = useT();
  const points = Array.isArray(plan.chart_data) ? plan.chart_data.filter(Number.isFinite) : [];
  const low = Math.min(...points);
  const range = Math.max(...points) - low || 1;
  const path = points.map((value, i) => `${i ? "L" : "M"}${i * 120 / Math.max(points.length - 1, 1)},${40 - (value - low) / range * 36}`).join(" ");
  return <article className={`copy-plan${compact ? " copy-plan-compact" : ""}${enabled ? "" : " copy-plan-disabled"}`}>
    <header>
      <div className="copy-plan-person">{plan.avatar ? <img src={plan.avatar} alt="" /> : <span>{plan.name[0]}</span>}<strong>{plan.name}</strong></div>
      <span className={`copy-plan-availability${enabled ? "" : " copy-plan-availability-paused"}`} title={t(enabled ? "copyTrade.available" : "copyTrade.paused")}><span className="copy-status-dot" aria-hidden="true" /><span className="sr-only">{t(enabled ? "copyTrade.available" : "copyTrade.paused")}</span></span>
    </header>
    <div className="copy-plan-duration"><Clock3 aria-hidden="true" /><span>{t("copyTrade.days", { count: String(plan.duration_days) })}</span></div>
    <div className="copy-plan-return"><div><strong dir="ltr">+{formatCompactAmount(plan.profit_percent)}%</strong><p>{t("copyTrade.planReturn")}</p></div>{points.length > 1 && <svg viewBox="0 0 120 45" aria-hidden="true"><path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}</div>
    <div className="copy-plan-stats"><div><strong dir="ltr">{formatCompactAmount(plan.min_investment)} <small>USDT</small></strong><span>{t("copyTrade.minimum")}</span></div><div><strong><Users aria-hidden="true" />{plan.copiers}</strong><span>{t("copyTrade.copiers")}</span></div></div>
    {plan.description && !compact && <p>{plan.description}</p>}
    <Button fullWidth disabled={!enabled} onClick={() => onSelect(plan)} className="copy-plan-action">{t("common.copy")}</Button>
  </article>;
}
