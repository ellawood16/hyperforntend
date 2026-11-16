import { Link } from "react-router-dom";
import { useT } from "@/i18n/I18nProvider";
import { Skeleton } from "@/components/shared/Skeleton";
import type { WalletHomeModel } from "../useWalletHome";
import { Eye, EyeOff } from "lucide-react";
import { ApkIcon } from "@/components/shared/ApkIcon";
import { TeamPage } from "@/features/referrals/TeamPage";
import { CopyTradePage } from "@/features/copy/CopyTradePage";
import { WalletCoinPreview } from "../components/WalletCoinPreview";

export function AppleWalletHome({ model }: { model: WalletHomeModel }) {
  const t = useT();
  const { isPending, isError, wallet, displayMoney, balanceHidden, setBalanceHidden, assets } = model;
  return <main className="apple-home">

    <section className="apple-home-balance" aria-label={t("wallet.totalBalance")}>
      <div className="apple-balance-line">{isPending ? <Skeleton className="h-14 w-52"/> : isError ? <p className="text-body text-app-secondary">{t("wallet.balanceUnavailable")}</p> : <p dir="ltr">{displayMoney(wallet?.total_balance)}</p>}<button type="button" aria-label={t(balanceHidden ? "wallet.showBalance" : "wallet.hideBalance")} onClick={() => setBalanceHidden(value => !value)}>{balanceHidden ? <Eye size={20}/> : <EyeOff size={20}/>}</button></div>
      <div className="apple-home-actions"><Link to="/send"><span><ApkIcon name="send" /></span>{t("wallet.send")}</Link><Link to="/receive"><span><ApkIcon name="qr" /></span>{t("wallet.receive")}</Link></div>
    </section>
    <WalletCoinPreview assets={assets} hidden={balanceHidden}/>
    <CopyTradePage preview />
    <TeamPage embedded />
  </main>;
}
