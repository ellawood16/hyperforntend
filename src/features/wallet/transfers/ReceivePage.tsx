import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check } from "lucide-react";
import { getWallet } from "@/api/wallet";
import { useT } from "@/i18n/I18nProvider";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/shared/Button";
import { Skeleton } from "@/components/shared/Skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { AssetPicker, assetKey } from "./AssetPicker";
import { AddressQr } from "./AddressQr";
import { isWalletAddress } from "./amounts";

export function ReceivePage() {
  const t = useT();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(`${params.get("network") ?? "bsc"}:${params.get("symbol") ?? "USDT"}`);
  const [feedback, setFeedback] = useState("");
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: getWallet });
  // The wallet's address and existing deposit processor currently support BSC.
  const assets = wallet.data?.assets.filter(item => item.network === "bsc" && item.supports_deposits && !item.is_internal) ?? [];
  const asset = assets.find(item => assetKey(item) === selected) ?? assets[0];
  const address = wallet.data?.address ?? "";
  const copy = async () => {
    try { await navigator.clipboard.writeText(address); setFeedback("common.copied"); }
    catch { setFeedback("transfer.copyError"); }
  };
  return <div className="asset-detail-view"><TopBar back title={t("wallet.receive")} /><div className="space-y-6 px-4 pb-6">
    {wallet.isPending ? <Skeleton className="h-80 w-full" /> : wallet.isError && !wallet.data ? <ErrorState onRetry={() => wallet.refetch()} /> : asset && isWalletAddress(address) ? <>
      <AssetPicker assets={assets} value={assetKey(asset)} onChange={value => { setSelected(value); setFeedback(""); }} />
      <AddressQr address={address} label={t("transfer.qrLabel", { token: asset.symbol, network: asset.network_name })} />
      <p className="text-center text-body text-app-secondary">{t("transfer.receiveWarning", { token: asset.symbol, network: asset.network_name })}</p>
      <div className="space-y-2"><p className="text-label text-app-secondary">{t("transfer.yourAddress")}</p><p dir="ltr" className="select-all break-all text-center font-mono text-body text-app-primary">{address}</p></div>
      <Button fullWidth onClick={() => void copy()}>{feedback === "common.copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{t("transfer.copyAddress")}</Button>
      {typeof navigator.share === "function" && <Button fullWidth variant="ghost" onClick={async () => {
        try { await navigator.share({ title: t("wallet.receive"), text: `${asset.symbol} · ${asset.network_name}\n${address}` }); }
        catch (err) { if (!(err instanceof DOMException && err.name === "AbortError")) setFeedback("transfer.shareError"); }
      }}>{t("transfer.share")}</Button>}
      <p role="status" className="text-center text-label text-app-secondary">{feedback && t(feedback)}</p>
    </> : <p className="text-body text-app-secondary">{t("transfer.receiveUnavailable")}</p>}
  </div></div>;
}
