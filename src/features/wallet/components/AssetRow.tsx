import { Link } from "react-router-dom";
import type { WalletAsset } from "@/api/wallet";
import { cn } from "@/lib/cn";
import { tokenIconUrl } from "@/lib/tokenIcons";

export function AssetRow({ asset, hideBalances = false }: { asset: WalletAsset; hideBalances?: boolean }) {
  const icon = tokenIconUrl(asset.symbol, asset.icon_url);
  return (
    <Link
      to={`/asset/${asset.network}/${asset.symbol}`}
      className="flex items-center gap-3 rounded-card px-4 py-3 hover:bg-app-surface-soft"
    >
      {icon ? (
        <img src={icon} alt="" className="h-10 w-10 rounded-full bg-app-surface-soft" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-app-icon-container text-label text-app-on-icon-container">
          {asset.symbol.slice(0, 2)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-body-lg text-app-primary">{asset.symbol}</p>
        <p className="text-label text-app-secondary">{hideBalances ? "••••••" : asset.amount_display}</p>
      </div>
      <div className="text-end">
        <p className="text-body-lg text-app-primary">{hideBalances ? "••••••" : asset.value_usd_display}</p>
        <p className={cn("text-label", asset.is_price_change_positive ? "text-app-price-up" : "text-app-price-down")}>
          {asset.price_change_24h}
        </p>
      </div>
    </Link>
  );
}
