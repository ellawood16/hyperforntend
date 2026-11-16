import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { Button } from "@/components/shared/Button";
import { ImplementSignal } from "@/features/signals/ImplementSignal";
import type { AssetDetailData } from "./useAssetDetail";
import { DetailTabs } from "./DetailTabs";
import { ActivitySection, BalanceSection, MarketSection, TokenInformation, WalletActions } from "./AssetDetailSections";
import { brandConfig } from "@/config/site";
import { TradePositions } from "@/features/signals/TradePositions";

export function ChartFocus({ data }: { data: AssetDetailData }) {
  const t = useT();
  const [inspectorTab, setInspectorTab] = useState("balance");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  if (brandConfig.style === "apple") return <div className="apple-chart-focus"><MarketSection data={data}/><TradePositions/><div className="trade-entry-actions"><ImplementSignal network={data.network} symbol={data.symbol}/></div></div>;
  return <div className="space-y-6">
    <MarketSection data={data} />
    <div>
      <Button variant="ghost" fullWidth aria-expanded={inspectorOpen} aria-controls="asset-inspector" onClick={() => setInspectorOpen(value => !value)} className="justify-between px-0">
        {t("detail.inspector")}{inspectorOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      <div id="asset-inspector" hidden={!inspectorOpen}>
        <DetailTabs label={t("detail.inspector")} selected={inspectorTab} onSelect={setInspectorTab} tabs={[
          { id: "balance", label: t("detail.holdings"), content: <div className="grid gap-6 sm:grid-cols-2"><BalanceSection data={data} compact /><WalletActions data={data} signal={false} /></div> },
          { id: "information", label: t("detail.information"), content: <TokenInformation data={data} /> },
          { id: "history", label: t("detail.history"), content: <ActivitySection /> },
        ]} />
      </div>
    </div>
    <footer className="sticky bottom-24 z-10 bg-app-background py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-label text-app-secondary">{data.symbol} · {t("chart.frame")}</p>
        <div className="w-full sm:w-auto sm:min-w-64"><ImplementSignal network={data.network} symbol={data.symbol} /></div>
      </div>
    </footer>
  </div>;
}
