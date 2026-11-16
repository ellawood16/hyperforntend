import { CopyPositionCard } from "@/features/copy/CopyPositionCard";
import { useCopyHistory } from "@/features/copy/useCopyHistory";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getActiveSignals, getSignalOrders } from "@/api/signals";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { formatDateTime, formatCompactAmount } from "@/lib/format";

function countdown(end: string | null, now: number) {
  const seconds = Math.max(0, Math.ceil(((end ? Date.parse(end) : now) - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function TradePositions() {
  const { language } = useI18n();
  const t = useT(), ar = language === "ar";
  const client = useQueryClient();
  const [tab, setTab] = useState<"positions" | "orders">("positions");
  const [visible, setVisible] = useState(4);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const active = useQuery({queryKey: ["active-signals"], queryFn: getActiveSignals, refetchInterval: 10_000});
  const history = useQuery({queryKey: ["signal-orders"], queryFn: getSignalOrders, refetchInterval: 3000});
  const copies = useCopyHistory();
  const activeCopies = copies.data?.filter(copy => !copy.settled_at) ?? [];
  const completed = history.data?.filter(order => order.status === "completed").length ?? 0;
  useEffect(() => { if (completed) {void client.invalidateQueries({queryKey: ["wallet"]}); void client.invalidateQueries({queryKey: ["transactions"]});} }, [completed, client]);
  const signals = active.data?.filter(signal => Date.parse(signal.expires_at) > now) ?? [];
  const records = history.data ?? [];
  const positions = [
    ...activeCopies.map(copy => ({ kind: "copy" as const, copy })),
    ...signals.map(signal => ({ kind: "signal" as const, signal })),
  ];
  return <section className="trade-positions">
    <div className="copy-tabs" role="group" aria-label={ar ? "التداول" : "Trade"}>{(["positions", "orders"] as const).map(value => <button key={value} aria-pressed={tab === value} onClick={() => {setTab(value); setVisible(4);}}>{value === "positions" ? `${ar ? "المراكز" : "Positions"} (${positions.length})` : (ar ? "الأوامر والسجل" : "Open orders")}</button>)}</div>
    {(tab === "positions" ? (active.isPending || copies.isPending) : history.isPending) && <p>{t("common.loading")}</p>}
    {(tab === "positions" ? (active.isError || copies.isError) : history.isError) && <button onClick={() => tab === "positions" ? Promise.all([active.refetch(), copies.refetch()]) : history.refetch()}>{t("common.retry")}</button>}
    {tab === "positions" ? <>
      {!active.isPending && !copies.isPending && !active.isError && !copies.isError && positions.length === 0 && <div className="trade-empty"><span aria-hidden="true">◇</span><p>{t("copyPosition.empty")}</p></div>}
      {positions.slice(0, visible).map(position => { if (position.kind === "copy") return <CopyPositionCard copy={position.copy} key={`copy-${position.copy.id}`}/>; const signal = position.signal; return <article className="trade-signal-card" key={`signal-${signal.id}`}><header><strong>{signal.symbol}</strong><span className={signal.direction === "buy" ? "text-app-price-up" : "text-app-price-down"}>{t(signal.direction === "buy" ? "signal.buy" : "signal.sell")}</span><time dir="ltr">{countdown(signal.expires_at, now)}</time></header><dl><div><dt>{t("signal.code")}</dt><dd dir="ltr">{signal.code}</dd></div><div><dt>{t("signal.minimum")}</dt><dd>{formatCompactAmount(signal.minimum_balance)} USDT</dd></div></dl><Link to={`/asset/${signal.network}/${signal.symbol}`}>{ar ? "فتح العملة" : "Open token"} →</Link></article>;})}
      {positions.length > visible && <button className="trade-load-more" onClick={() => setVisible(v => v + 4)}>{t("tx.loadMore")}</button>}
    </> : <>
      {!history.isPending && !history.isError && records.length === 0 && <div className="trade-empty"><span aria-hidden="true">◇</span><p>{t("tx.emptySignals")}</p></div>}
      {records.slice(0, visible).map(order => {const pending = order.status === "pending", loss = Number(order.result_amount) < 0; return <div className="apple-signal-row" key={order.id}><span className={pending ? "trade-pending" : loss ? "apple-loss" : "apple-profit"}>{pending ? "◷" : loss ? "↘" : "↗"}</span><span><strong>{order.symbol} · {pending ? (ar ? "قيد التنفيذ" : "Pending") : t(loss ? "signal.loss" : "signal.profit")}</strong><small>{formatDateTime(order.created_at, language)}</small></span><b dir="ltr" className={pending ? "text-app-secondary" : loss ? "text-app-price-down" : "text-app-price-up"}>{pending ? countdown(order.settle_at, now) : `${loss ? "−" : "+"}${formatCompactAmount((order.result_amount ?? "0").replace(/^[+-]/, ""))} USDT`}</b></div>;})}
      {records.length > visible && <button className="trade-load-more" onClick={() => setVisible(v => v + 4)}>{t("tx.loadMore")}</button>}
    </>}
  </section>;
}
