import { Link } from "react-router-dom";
import { useT } from "@/i18n/I18nProvider";
import { Skeleton } from "@/components/shared/Skeleton";
import type { WalletHomeModel } from "../useWalletHome";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Eye, EyeOff, ReceiptText, WalletCards } from "lucide-react";
import { ErrorState } from "@/components/shared/ErrorState";
import { AssetRow } from "../components/AssetRow";

export function BinanceWalletHome({ model }: { model: WalletHomeModel }) {
  const t = useT();
  const { isPending, isError, wallet, displayMoney, balanceHidden, setBalanceHidden, assets, visibleAssets, setVisibleAssetCount, refetch } = model;
  return <main className="brand-wallet brand-wallet--dark">

    <section className="brand-balance" aria-labelledby="brand-balance-title">
      <div className="brand-balance-label"><span id="brand-balance-title">{t("wallet.totalBalance")}</span><button type="button" aria-label={t(balanceHidden ? "wallet.showBalance" : "wallet.hideBalance")} onClick={() => setBalanceHidden(!balanceHidden)}>{balanceHidden ? <Eye size={18} /> : <EyeOff size={18} />}</button></div>
      {isPending ? <Skeleton className="h-12 w-48" /> : isError ? <p>{t("wallet.balanceUnavailable")}</p> : <p className="brand-balance-amount" dir="ltr">{displayMoney(wallet?.total_balance)}</p>}
      <Link className="brand-deposit" to="/receive">{t("wallet.receive")} <ArrowDownLeft size={18}/></Link>
    </section>
    <nav className="brand-actions" aria-label={t("wallet.actions")}>
      <Link to="/send"><ArrowUpRight /><span>{t("wallet.send")}</span></Link>
      <Link to="/receive"><ArrowDownLeft /><span>{t("wallet.receive")}</span></Link>
      <Link to="/market"><WalletCards /><span>{t("market.title")}</span></Link>
      <Link to="/activity"><ReceiptText /><span>{t("wallet.activity")}</span></Link>
    </nav>
    <section className="brand-assets" aria-labelledby="brand-assets-title">
      <div className="brand-section-heading"><h2 id="brand-assets-title">{t("wallet.assets")}</h2><Link to="/market">{t("market.title")} <ChevronRight size={16}/></Link></div>
      {isPending && <Skeleton className="h-16 w-full rounded-card" />}
      {isError && <ErrorState message={t("wallet.balanceUnavailable")} onRetry={() => refetch()} />}
      {wallet && visibleAssets.length > 0 && <div className="brand-asset-list">{visibleAssets.map(asset => <AssetRow key={`${asset.network}-${asset.symbol}`} asset={asset} hideBalances={balanceHidden} />)}</div>}
      {wallet && assets.length === 0 && <p className="text-app-secondary">{t("wallet.noAssets")}</p>}
      {wallet && assets.length > visibleAssets.length && <button className="brand-load-more" onClick={() => setVisibleAssetCount(count => count + 10)}>{t("wallet.loadMore")}</button>}
    </section>
  </main>;
}
