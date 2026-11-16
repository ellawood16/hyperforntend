import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWallet } from "@/api/wallet";
import { brandConfig } from "@/config/site";
import { useT } from "@/i18n/I18nProvider";
import { TopBar } from "@/components/layout/TopBar";
import { useAssetDetail } from "./details/useAssetDetail";
import { ChartFocus } from "./details/ChartFocus";
import { tokenIconUrl } from "@/lib/tokenIcons";

export function AssetDetailPage() {
  const { network = "bsc", symbol = "" } = useParams<{ network: string; symbol: string }>();
  const data = useAssetDetail(network, symbol);
  const [open, setOpen] = useState(false);
  const t = useT();
  const wallet = useQuery({queryKey: ["wallet"], queryFn: getWallet});
  const icon = tokenIconUrl(symbol, data.asset?.icon_url);
  if (brandConfig.style === "apple") return <main className="apple-asset-page">
    <header className="apple-asset-header"><button type="button" onClick={() => setOpen(true)}>{icon && <img className="apple-token-icon" src={icon} alt="" />}{symbol}/USDT <span>⌄</span></button><Link to="/" aria-label={t("common.back")}>←</Link></header>
    <ChartFocus key={`${network}:${symbol}`} data={data} />
    {open && <div className="apple-picker-backdrop" onClick={() => setOpen(false)}><section role="dialog" aria-modal="true" aria-label={t("market.title")} className="apple-picker" onClick={event => event.stopPropagation()}><header><h2>{t("market.title")}</h2><button onClick={() => setOpen(false)} aria-label={t("common.cancel")}>×</button></header>{wallet.data?.assets.map(asset => <Link key={`${asset.network}-${asset.symbol}`} to={`/asset/${encodeURIComponent(asset.network)}/${encodeURIComponent(asset.symbol)}`} onClick={() => setOpen(false)}><span className="apple-token-row">{tokenIconUrl(asset.symbol, asset.icon_url) ? <img className="apple-token-icon" src={tokenIconUrl(asset.symbol, asset.icon_url)!} alt="" /> : <span className="apple-token-fallback">{asset.symbol.slice(0, 1)}</span>}<strong>{asset.symbol}</strong></span><span>{asset.network_name}</span></Link>)}</section></div>}
  </main>;
  return <div className="asset-detail-view">
    <TopBar back title={data.asset?.symbol ?? symbol} />
    <div className="px-4 sm:px-6">
      <p className="mb-4 text-label text-app-secondary">{symbol} · {data.asset?.network_name ?? network.toUpperCase()}</p>
      <ChartFocus key={`${network}:${symbol}`} data={data} />
    </div>
  </div>;
}
