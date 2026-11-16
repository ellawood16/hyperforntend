import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownLeft, Copy, ChevronDown } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { formatDecimal2, formatUsd } from "@/lib/format";
import { Button } from "@/components/shared/Button";
import { Skeleton } from "@/components/shared/Skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { PriceChart } from "../components/PriceChart";
import { ImplementSignal } from "@/features/signals/ImplementSignal";
import type { AssetDetailData } from "./useAssetDetail";

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="min-w-0"><h2 className="mb-4 text-body font-semibold text-app-primary">{title}</h2>{children}</section>;
}

export function MarketSection({ data }: { data: AssetDetailData }) {
  const { chart, network, symbol } = data;
  const t = useT();
  return <section aria-label={t("chart.title")} className="min-w-0">
    {chart.isPending && <div role="status" aria-label={t("detail.loadingMarket")}><Skeleton className="h-80 w-full" /></div>}
    {chart.isError && !chart.data && <ErrorState onRetry={() => chart.refetch()} />}
    {chart.data && <PriceChart key={`${network}:${symbol}`} chart={chart.data} offline={chart.isError} embedded />}
  </section>;
}

export function BalanceSection({ data, compact = false }: { data: AssetDetailData; compact?: boolean }) {
  const { wallet, asset, symbol } = data;
  const t = useT();
  return <DetailSection title={t("detail.holdings")}>
    {wallet.isPending ? <div role="status" aria-label={t("detail.loadingBalance")}><Skeleton className="h-24 w-full" /></div> : wallet.isError ? <ErrorState onRetry={() => wallet.refetch()} /> : asset ? <>
      <p className={`${compact ? "text-headline" : "text-display"} tabular-nums text-app-primary`} dir="ltr">{formatUsd(asset.value_usd)}</p>
      <p className="mt-2 text-body text-app-secondary" dir="ltr">{formatDecimal2(asset.amount)} {symbol}</p>
      <dl className="mt-6 grid grid-cols-2 gap-4 text-body">
        <div><dt className="text-label text-app-secondary">{t("detail.available")}</dt><dd className="mt-2 break-all tabular-nums text-app-primary" dir="ltr">{formatDecimal2(asset.available_balance)} {symbol}</dd></div>
        <div><dt className="text-label text-app-secondary">{t("detail.locked")}</dt><dd className="mt-2 break-all tabular-nums text-app-primary" dir="ltr">{formatDecimal2(asset.locked_balance)} {symbol}</dd></div>
      </dl>
    </> : <p className="text-body text-app-secondary">{t("detail.notFound")}</p>}
  </DetailSection>;
}

export function WalletActions({ data, signal = true }: { data: AssetDetailData; signal?: boolean }) {
  const t = useT();
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      {data.asset?.supports_withdrawals && !data.asset.is_internal && data.network === "bsc" && <Link className="flex min-h-12 items-center justify-center gap-2 rounded-chip bg-app-surface-soft px-4 text-body text-app-primary" to={`/send?network=${encodeURIComponent(data.network)}&symbol=${encodeURIComponent(data.symbol)}`}><ArrowUpRight className="h-4 w-4" />{t("wallet.send")}</Link>}
      {data.asset?.supports_deposits && !data.asset.is_internal && data.network === "bsc" && <Link className="flex min-h-12 items-center justify-center gap-2 rounded-chip bg-app-surface-soft px-4 text-body text-app-primary" to={`/receive?network=${encodeURIComponent(data.network)}&symbol=${encodeURIComponent(data.symbol)}`}><ArrowDownLeft className="h-4 w-4" />{t("wallet.receive")}</Link>}
    </div>
    {signal && <ImplementSignal network={data.network} symbol={data.symbol} />}
  </div>;
}

export function TokenInformation({ data }: { data: AssetDetailData }) {
  const { asset, network, chart, wallet } = data;
  const t = useT();
  const [copyState, setCopyState] = useState("");
  if (wallet.isPending) return <Skeleton className="h-24 w-full" />;
  if (wallet.isError && !asset) return <ErrorState onRetry={() => wallet.refetch()} />;
  return <dl className="space-y-6 text-body">
    <div className="flex justify-between gap-4"><dt className="text-app-secondary">{t("detail.network")}</dt><dd className="text-app-primary">{asset?.network_name ?? network.toUpperCase()}</dd></div>
    <div className="flex justify-between gap-4"><dt className="text-app-secondary">{t("detail.marketSource")}</dt><dd className="text-end text-app-primary">{chart.data?.reference_label ?? chart.data?.market_symbol ?? t("detail.unavailable")}</dd></div>
    <div><dt className="mb-2 text-app-secondary">{t("detail.contract")}</dt><dd className="flex items-start gap-2"><span dir="ltr" className="min-w-0 flex-1 select-all break-all font-mono text-label text-app-primary">{asset ? (asset.contract_address || t(asset.is_native ? "detail.native" : "detail.unavailable")) : t("detail.unavailable")}</span>{asset?.contract_address && <Button variant="ghost" className="min-h-12 min-w-12 p-3" aria-label={t("common.copy")} onClick={async () => {
      try { await navigator.clipboard.writeText(asset.contract_address); setCopyState("common.copied"); }
      catch { setCopyState("detail.copyFailed"); }
    }}><Copy className="h-4 w-4" /></Button>}</dd><dd role="status" className="mt-2 text-label text-app-secondary">{copyState && t(copyState)}</dd></div>
  </dl>;
}

export function ActivitySection() {
  const t = useT();
  return <div className="space-y-4"><p className="text-body text-app-secondary">{t("detail.activityHint")}</p><Link to="/activity" className="inline-flex min-h-12 items-center gap-2 text-body font-semibold text-app-primary underline underline-offset-4">{t("detail.openHistory")}<ArrowUpRight className="h-4 w-4" /></Link></div>;
}

export function DetailDisclosure({ title, children }: { title: string; children: ReactNode }) {
  return <details className="group"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-body font-semibold text-app-primary [&::-webkit-details-marker]:hidden">{title}<ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary><div className="pt-4 pb-6">{children}</div></details>;
}
