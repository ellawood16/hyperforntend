import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useAssetDetail } from "../details/useAssetDetail";
import { DetailTabs } from "../details/DetailTabs";
import { ActivitySection, BalanceSection, DetailDisclosure, MarketSection, TokenInformation, WalletActions } from "../details/AssetDetailSections";

import { ChartFocus } from "../details/ChartFocus";

export function AssetDetailPrototypes() {
  const t = useT();
  const { network = "bsc", symbol = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const requested = params.get("layout");
  const variant = requested && ["1", "2", "3"].includes(requested) ? requested : "1";
  const [walletTab, setWalletTab] = useState("market");
  const data = useAssetDetail(network, symbol);
  const { asset } = data;

  return <div className="asset-detail-view px-4 py-6 sm:px-6">
    <div className="mb-4 flex items-center justify-between gap-4">
      <Link to={`/asset/${encodeURIComponent(network)}/${encodeURIComponent(symbol)}`} className="inline-flex min-h-12 items-center gap-2 text-body text-app-secondary"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t("common.back")}</Link>
      <span className="text-label text-app-secondary">{t("detail.preview")}</span>
    </div>
    <details className="mb-6" open>
      <summary className="min-h-12 cursor-pointer py-3 text-body font-semibold text-app-primary">{t("detail.compare")}</summary>
      <div className="flex flex-wrap gap-x-6" role="group" aria-label={t("detail.compare")}>
        {["1", "2", "3"].map(id => <button key={id} type="button" aria-pressed={variant === id}
          onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.set("layout", id); return next; }, { replace: true })}
          className={cn("min-h-12 border-b-2 py-3 text-body font-semibold", variant === id
            ? "border-[var(--app-accent)] text-app-primary" : "border-transparent text-app-secondary")}>
          {id} · {t(`detail.layout${id}`)}
        </button>)}
      </div>
      <p className="mt-3 text-label text-app-secondary">{t(`detail.layout${variant}Hint`)}</p>
    </details>

    <header className="mb-6 flex items-center gap-3">
      {asset?.icon_url || asset?.logo_url ? <img src={asset.icon_url || asset.logo_url!} alt="" className="h-10 w-10 shrink-0 object-contain" onError={event => { event.currentTarget.hidden = true; }} /> : null}
      <div className="min-w-0 flex-1"><h1 className="truncate text-headline text-app-primary">{asset?.symbol ?? symbol}</h1><p className="mt-1 text-label text-app-secondary">{symbol} · {asset?.network_name ?? network.toUpperCase()}</p></div>
      {variant !== "1" && <div className="text-end"><p className="text-body font-semibold tabular-nums text-app-primary" dir="ltr">{asset?.price_updated_at ? formatUsd(asset.price_usd) : "—"}</p><p className="text-label text-app-secondary">{t("detail.walletPrice")}</p></div>}
    </header>

    {/* Continuous reading: chart, ownership, action, then secondary details. */}
    {variant === "1" && <div className="mx-auto max-w-3xl space-y-8">
      <MarketSection data={data} />
      <div className="grid gap-6 sm:grid-cols-2"><BalanceSection data={data} compact /><div className="sm:self-center"><WalletActions data={data} /></div></div>
      <div className="space-y-2"><DetailDisclosure title={t("detail.tokenInfo")}><TokenInformation data={data} /></DetailDisclosure><DetailDisclosure title={t("detail.activity")}><ActivitySection /></DetailDisclosure></div>
    </div>}

    {/* Ownership stays visible while the secondary area changes in place. */}
    {variant === "2" && <div className="mx-auto max-w-3xl space-y-8">
      <div className="grid gap-6 sm:grid-cols-2"><BalanceSection data={data} /><div className="sm:self-center"><WalletActions data={data} /></div></div>
      <DetailTabs label={t("detail.sections")} selected={walletTab} onSelect={setWalletTab} tabs={[
        { id: "market", label: t("detail.market"), content: <MarketSection data={data} /> },
        { id: "history", label: t("detail.history"), content: <ActivitySection /> },
        { id: "information", label: t("detail.information"), content: <TokenInformation data={data} /> },
      ]} />
    </div>}

    {variant === "3" && <ChartFocus key={`${network}:${symbol}`} data={data} />}
  </div>;
}
