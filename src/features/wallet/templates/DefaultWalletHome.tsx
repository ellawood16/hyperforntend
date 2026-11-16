import { Link } from "react-router-dom";
import { useT } from "@/i18n/I18nProvider";
import { Skeleton } from "@/components/shared/Skeleton";
import type { WalletHomeModel } from "../useWalletHome";
import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Eye, EyeOff, ReceiptText, Users, WalletCards } from "lucide-react";
import { ErrorState } from "@/components/shared/ErrorState";
import { AssetRow } from "../components/AssetRow";

export function DefaultWalletHome({ model }: { model: WalletHomeModel }) {
  const t = useT();
  const { isPending, isError, wallet, displayMoney, balanceHidden, setBalanceHidden, assets, visibleAssets, setVisibleAssetCount, refetch } = model;
  return <main className="wallet-home px-4 pb-8 pt-5 sm:px-6 lg:px-8">

    <div className="wallet-home-overview mb-6 grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
      <section className="wallet-hero rounded-sheet p-5 sm:p-6" aria-labelledby="wallet-balance-heading">
        <div className="relative z-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-body text-app-secondary">
              <WalletCards className="h-5 w-5 text-app-accent" />
              <span id="wallet-balance-heading">{t("wallet.totalBalance")}</span>
            </div>
            <button type="button" onClick={() => setBalanceHidden((hidden) => !hidden)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-app-surface-soft text-app-secondary hover:text-app-primary"
              aria-label={t(balanceHidden ? "wallet.showBalance" : "wallet.hideBalance")}>
              {balanceHidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>

          {isPending ? <Skeleton className="mb-6 h-12 w-52" /> : isError ?
            <p className="mb-6 text-body text-app-secondary">{t("wallet.balanceUnavailable")}</p> :
            <p className="mb-6 break-words text-display tracking-tight text-app-primary" dir="ltr">{displayMoney(wallet?.total_balance)}</p>}

          <div className="flex flex-wrap gap-3">
            <Link to="/send" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-chip bg-app-action px-5 py-3 text-body font-semibold text-app-on-action transition-transform hover:-translate-y-0.5 sm:flex-none">
              <ArrowUpRight className="h-4 w-4" />{t("wallet.send")}
            </Link>
            <Link to="/receive" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-chip bg-app-surface-soft px-5 py-3 text-body font-semibold text-app-primary transition-transform hover:-translate-y-0.5 sm:flex-none">
              <ArrowDownLeft className="h-4 w-4" />{t("wallet.receive")}
            </Link>
          </div>
        </div>
      </section>

      <nav aria-label={t("wallet.actions")} className="wallet-quick-links flex flex-col justify-center divide-app divide-y">
        <QuickLink to="/market" icon={<WalletCards className="h-5 w-5" />} title={t("market.title")} detail={t("wallet.browseAssets")} />
        <QuickLink to="/activity" icon={<ReceiptText className="h-5 w-5" />} title={t("wallet.activity")} detail={t("wallet.activityHint")} />
        <QuickLink to="/team" icon={<Users className="h-5 w-5" />} title={t("referral.team")} detail={t("wallet.teamHint")} />
      </nav>
    </div>

    <section className="wallet-assets" aria-labelledby="wallet-assets-heading">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id="wallet-assets-heading" className="text-title text-app-primary">{t("wallet.assets")}</h2>
        <Link to="/market" className="inline-flex min-h-11 items-center gap-1 text-body text-app-secondary hover:text-app-primary">{t("market.title")}<ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /></Link>
      </div>
      {isPending && <Skeleton className="h-16 w-full rounded-card" />}
      {isError && <ErrorState message={t("wallet.balanceUnavailable")} onRetry={() => refetch()} />}
      {wallet && visibleAssets.length > 0 && <div className="divide-app divide-y">
        {visibleAssets.map((asset) => <AssetRow key={`${asset.network}-${asset.symbol}`} asset={asset} hideBalances={balanceHidden} />)}
      </div>}
      {wallet && assets.length === 0 && <div className="py-6 text-body text-app-secondary">
        <p>{t("wallet.noAssets")}</p>
        <Link to="/market" className="mt-3 inline-block text-app-primary underline underline-offset-4">{t("wallet.browseAssets")}</Link>
      </div>}
      {wallet && assets.length > visibleAssets.length && <div className="flex justify-center pt-4">
        <button type="button" onClick={() => setVisibleAssetCount((count) => count + 10)} className="min-h-11 rounded-chip bg-app-surface-soft px-5 text-body font-semibold text-app-primary hover:bg-app-surface">
          {t("wallet.loadMore")}
        </button>
      </div>}
    </section>

  </main>;
}

function QuickLink({ to, icon, title, detail }: { to: string; icon: ReactNode; title: string; detail: string }) {
  return <Link to={to} className="group flex min-h-16 items-center gap-3 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-accent">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center text-app-accent">{icon}</span>
    <span className="min-w-0 flex-1"><span className="block text-body font-semibold text-app-primary">{title}</span><span className="block truncate text-label text-app-secondary">{detail}</span></span>
    <ChevronRight className="h-4 w-4 shrink-0 text-app-secondary transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
  </Link>;
}
