import { CopyPositionCard } from "./CopyPositionCard";
import { CopyPlanCard } from "./CopyPlanCard";
import { CopyPlanSlider } from "./CopyPlanSlider";
import { useCopyHistory } from "./useCopyHistory";
import { formatCompactAmount } from "@/lib/format";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCopyPlans, startCopy, type CopyPlan } from "@/api/copyTrade";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/shared/Button";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nProvider";

export function CopyTradePage({ preview = false }: { preview?: boolean }) {
  const { language, t } = useI18n();
  const ar = language === "ar";
  const [tab, setTab] = useState<"plans" | "copies">("plans");
  const plans = useQuery({queryKey: ["copy-plans"], queryFn: getCopyPlans});
  const history = useCopyHistory(!preview);
  const client = useQueryClient();
  const [selected, setSelected] = useState<CopyPlan | null>(null);
  const [amount, setAmount] = useState("");
  const start = useMutation({mutationFn: () => startCopy(selected!.id, amount), onSuccess: async () => {
    setSelected(null);
    await Promise.all([client.invalidateQueries({queryKey: ["copy-history"]}), client.invalidateQueries({queryKey: ["wallet"]})]);
  }});
  return <section className={`copy-page${preview ? " copy-page-preview" : ""}`}>{!preview && <TopBar back title={ar ? "نسخ التداول" : "Copy trading"}/>}<div className="copy-page-body">
    {preview && <div className="copy-preview-heading"><h2>{ar ? "نسخ التداول" : "Copy trading"}</h2><Link to="/copy">{ar ? "عرض المزيد" : "See more"} <span aria-hidden="true">→</span></Link></div>}
    {!preview && <div className="copy-tabs" role="group" aria-label={ar ? "أقسام نسخ التداول" : "Copy trading sections"}>
      <button type="button" aria-pressed={tab === "plans"} onClick={() => setTab("plans")}>{ar ? "نسخ التداول" : "Copy trading"}</button>
      <button type="button" aria-pressed={tab === "copies"} onClick={() => setTab("copies")}>{ar ? "نسخي" : "My copies"}</button>
    </div>}
    {(preview || tab === "plans") && <>
    {plans.data && !plans.data.enabled && <p className="copy-disabled-notice">{ar ? "نسخ التداول متوقف حالياً. تستمر النسخ الحالية حتى موعد دفعها." : "Copy trading is currently unavailable. Existing copies continue until their scheduled payout."}</p>}
    {plans.isPending && <p className="text-app-secondary">{ar ? "جارٍ التحميل…" : "Loading…"}</p>}
    {plans.isError && <button onClick={() => plans.refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</button>}
    {!preview && plans.data?.plans.length === 0 && <p className="text-app-secondary">{ar ? "لا توجد خطط حالياً." : "No plans available yet."}</p>}
    {plans.data && (preview ? <div className="copy-preview-sliders">
      <CopyPlanSlider title={t("copyTrade.thirtyDays")} plans={plans.data.plans.filter(plan => plan.duration_days === 30)} enabled={plans.data.enabled} onSelect={plan => {setSelected(plan); setAmount(plan.min_investment);}} />
      <CopyPlanSlider title={t("copyTrade.otherDurations")} plans={plans.data.plans.filter(plan => plan.duration_days !== 30)} enabled={plans.data.enabled} onSelect={plan => {setSelected(plan); setAmount(plan.min_investment);}} />
    </div> : plans.data.plans.map(plan => <CopyPlanCard key={plan.id} plan={plan} enabled={plans.data.enabled} onSelect={plan => {setSelected(plan); setAmount(plan.min_investment);}} />))}
    </>}
    {!preview && tab === "copies" && <>{history.isPending && <p className="text-app-secondary">{ar ? "جارٍ التحميل…" : "Loading…"}</p>}{history.isError && <button onClick={() => history.refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</button>}{history.data?.length === 0 && <p className="text-app-secondary">{ar ? "لا توجد نسخ بعد." : "No copies yet."}</p>}{history.data?.map(item => <CopyPositionCard copy={item} key={item.id}/>)}</>}
    {selected && <div className="apple-picker-backdrop" onClick={() => !start.isPending && setSelected(null)}><section className="apple-picker" role="dialog" aria-modal="true" aria-label={selected.name} onClick={e => e.stopPropagation()}><header><h2>{selected.name}</h2><button disabled={start.isPending} aria-label={ar ? "إغلاق" : "Close"} onClick={() => setSelected(null)}>×</button></header><p>{formatCompactAmount(selected.profit_percent)}% · {selected.duration_days} {ar ? "يوم" : "days"}</p><label>{ar ? "المبلغ (USDT)" : "Amount (USDT)"}<input className="copy-amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}/></label>{start.isError && <p role="alert" className="text-app-danger">{start.error instanceof Error ? start.error.message : (ar ? "تعذر بدء النسخ" : "Unable to start copy")}</p>}<Button fullWidth loading={start.isPending} disabled={!amount} onClick={() => start.mutate()}>{ar ? "تأكيد" : "Confirm"}</Button></section></div>}
  </div></section>;
}
