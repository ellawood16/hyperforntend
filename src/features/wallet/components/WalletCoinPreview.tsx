import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getPriceChart, type WalletAsset } from "@/api/wallet";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { tokenIconUrl } from "@/lib/tokenIcons";

export function WalletCoinPreview({ assets, hidden = false }: { assets: WalletAsset[]; hidden?: boolean }) {
  const t = useT();
  const coins = ["BTC", "ETH", "USDT"].map(symbol => ({
    label: symbol,
    asset: assets.find(asset => asset.network === "bsc" && asset.symbol === (symbol === "BTC" ? "BTCB" : symbol)),
  })).sort((left, right) => Number(right.asset?.value_usd ?? 0) - Number(left.asset?.value_usd ?? 0));
  return <section className="wallet-coin-preview" aria-label={t("wallet.assets")}>
    {coins.map(({ label, asset }) => asset ? <Coin key={label} label={label} asset={asset} hidden={hidden}/> : <div className="wallet-coin-row" key={label}>{tokenIconUrl(label) ? <img src={tokenIconUrl(label)!} alt="" /> : <span className="wallet-coin-fallback">{label[0]}</span>}<strong>{label}</strong><span className="text-app-secondary">—</span></div>)}
  </section>;
}

function Coin({ label, asset, hidden }: { label: string; asset: WalletAsset; hidden: boolean }) {
  const { language } = useI18n();
  const t = useT();
  const chart = useQuery({
    queryKey: ["wallet-mini-chart", asset.network, asset.symbol],
    queryFn: () => getPriceChart(asset.network, asset.symbol, "24h"),
    refetchInterval: 10_000, staleTime: 5_000, refetchIntervalInBackground: false,
  });
  const price = chart.data?.latest.price_usd ?? asset.price_usd;
  const change = Number(chart.data?.latest.change_24h ?? asset.price_change_24h.replace(/[%+,]/g, ""));
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const previous = useRef(price);
  useEffect(() => {
    const before = Number(previous.current), after = Number(price);
    previous.current = price;
    if (!Number.isFinite(before) || !Number.isFinite(after) || before === after) return;
    setFlash(after > before ? "up" : "down");
    const timer = window.setTimeout(() => setFlash(null), 1000);
    return () => window.clearTimeout(timer);
  }, [price]);
  const values = (chart.data?.points ?? []).map(point => Number(point.price_usd)).filter(Number.isFinite);
  const low = Math.min(...values), high = Math.max(...values), range = high - low;
  const path = values.map((value, index) => `${index ? "L" : "M"}${index / Math.max(values.length - 1, 1) * 100},${range ? 32 - (value - low) / range * 28 : 18}`).join(" ");
  const rising = Number.isFinite(change) && change >= 0;
  const formattedPrice = Number.isFinite(Number(price)) ? new Intl.NumberFormat(language, {style: "currency", currency: "USD", maximumFractionDigits: Number(price) < 1 ? 6 : 2}).format(Number(price)) : "—";
  const icon = tokenIconUrl(asset.symbol, asset.icon_url);
  return <Link className="wallet-coin-row" to={`/asset/${encodeURIComponent(asset.network)}/${encodeURIComponent(asset.symbol)}`}>
    {icon ? <img src={icon} alt=""/> : <span className="wallet-coin-fallback">{label[0]}</span>}
    <div className="wallet-coin-name"><strong>{label}</strong><small>{hidden ? "••••••" : `${asset.amount_display} ${label}`}</small></div>
    <div className={`wallet-coin-chart ${rising ? "text-app-price-up" : "text-app-price-down"}`}>
      {values.length > 1 ? <svg viewBox="0 0 100 36" role="img" aria-label={`${label} · 24h`}><path d={path} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg> : <span className="text-app-secondary">—</span>}
    </div>
    <div className="wallet-coin-price"><strong className={flash ? `coin-price-flash coin-price-flash--${flash}` : ""} key={`${price}-${flash}`}>{formattedPrice}</strong><small className={rising ? "text-app-price-up" : "text-app-price-down"}>{Number.isFinite(change) ? `${change > 0 ? "+" : ""}${change.toFixed(2)}%` : "—"}{chart.isError && <span className="sr-only"> · {t("common.somethingWrong")}</span>}</small></div>
  </Link>;
}
