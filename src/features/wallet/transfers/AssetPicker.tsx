import type { WalletAsset } from "@/api/wallet";
import { useT } from "@/i18n/I18nProvider";

export const assetKey = (asset: WalletAsset) => `${asset.network}:${asset.symbol}`;
export function AssetPicker({ assets, value, onChange, disabled = false }: {
  assets: WalletAsset[]; value: string; onChange: (value: string) => void; disabled?: boolean;
}) {
  const t = useT();
  return <label className="flex flex-col gap-2 text-label text-app-secondary">{t("transfer.asset")}
    <select disabled={disabled} value={value} onChange={event => onChange(event.target.value)} className="min-h-12 rounded-chip bg-app-input px-4 py-3 text-body text-app-primary">
      {assets.map(asset => <option key={assetKey(asset)} value={assetKey(asset)}>{asset.symbol} · {asset.network_name}</option>)}
    </select>
  </label>;
}
