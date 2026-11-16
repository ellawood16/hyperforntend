import { ArrowDownLeft, ArrowUpRight, ChartNoAxesCombined, Copy, Eye, EyeOff, ReceiptText, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/shared/Skeleton";
import { useT } from "@/i18n/I18nProvider";
import { AssetRow } from "../components/AssetRow";
import type { WalletHomeModel } from "../useWalletHome";
import "./anon-wallet.css";

const SHORTCUTS = [
  { to: "/market", icon: ChartNoAxesCombined, label: "market.title" },
  { to: "/activity", icon: ReceiptText, label: "wallet.activity" },
  { to: "/team", icon: Users, label: "wallet.teamManagement" },
  { to: "/copy", icon: Copy, label: "wallet.copyTrade" },
] as const;

export function AnonWalletHome({ model }: { model: WalletHomeModel }) {
  const t = useT();
  const { wallet, isPending, isError, refetch, balanceHidden, setBalanceHidden, displayMoney, assets, visibleAssets, setVisibleAssetCount } = model;
  return <main className="anon-wallet-home">
    <section className="anon-wallet-balance" aria-labelledby="anon-balance-title">
      <div className="anon-wallet-balance-label">
        <span id="anon-balance-title">{t("wallet.totalBalance")}</span>
        <button type="button" aria-label={t(balanceHidden ? "wallet.showBalance" : "wallet.hideBalance")} onClick={() => setBalanceHidden(hidden => !hidden)}>
          {balanceHidden ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
      {isPending ? <Skeleton className="h-12 w-48" /> : isError ? <p>{t("wallet.balanceUnavailable")}</p> : <p className="anon-wallet-amount" dir="ltr">{displayMoney(wallet?.total_balance)}</p>}
    </section>
    <nav className="anon-wallet-transfers" aria-label={t("wallet.actions")}>
      <Link to="/send"><ArrowUpRight aria-hidden="true" />{t("wallet.send")}</Link>
      <Link to="/receive"><ArrowDownLeft aria-hidden="true" />{t("wallet.receive")}</Link>
    </nav>
    <nav className="anon-wallet-shortcuts" aria-label={t("wallet.actions")}>
      {SHORTCUTS.map(({ to, icon: Icon, label }) => <Link to={to} key={to}>
        <span className="anon-wallet-shortcut-icon"><Icon aria-hidden="true" /></span>
        <span>{t(label)}</span>
      </Link>)}
    </nav>
    <section className="anon-wallet-assets" aria-labelledby="anon-assets-title">
      <h2 id="anon-assets-title">{t("wallet.assets")}</h2>
      {isPending && <Skeleton className="h-16 w-full rounded-card" />}
      {isError && <ErrorState message={t("wallet.balanceUnavailable")} onRetry={() => refetch()} />}
      {wallet && visibleAssets.length > 0 && <div className="anon-wallet-asset-list">{visibleAssets.map(asset => <AssetRow key={`${asset.network}-${asset.symbol}`} asset={asset} hideBalances={balanceHidden} />)}</div>}
      {wallet && assets.length === 0 && <p className="text-app-secondary">{t("wallet.noAssets")}</p>}
      {wallet && assets.length > visibleAssets.length && <button type="button" className="anon-wallet-load-more" onClick={() => setVisibleAssetCount(count => count + 10)}>{t("wallet.loadMore")}</button>}
    </section>
  </main>;
}
