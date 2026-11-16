import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppHeader } from "@/components/layout/AppHeader";
import { FloatingSupport } from "@/components/layout/FloatingSupport";
import { WebPushPrompt } from "@/features/notifications/components/WebPushPrompt";
import { SignalArrival } from "@/features/signals/SignalArrival";
import { brandConfig } from "@/config/site";
import { useT } from "@/i18n/I18nProvider";
import { Wallet, ChartNoAxesCombined, Receipt, User, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export function AppShell() {
  const path = useLocation().pathname;
  const t = useT();
  const wide = path === "/" || path === "/market" || path.startsWith("/asset/") || path === "/profile" || path === "/team";
  return (
    <div className={`app-shell app-shell--${brandConfig.style} mx-auto min-h-screen pb-24 ${wide ? "max-w-6xl" : "max-w-lg"}`}>
      {brandConfig.style === "binance" && <aside className="app-sidebar"><Link to="/" className="app-sidebar-brand">{brandConfig.name}</Link><nav>{[
        { to: "/", label: t("nav.wallet"), Icon: Wallet },
        { to: "/market", label: t("nav.market"), Icon: ChartNoAxesCombined },
        { to: "/activity", label: t("nav.activity"), Icon: Receipt },
        { to: "/profile", label: t("nav.profile"), Icon: User },
      ].map(({to, label, Icon}) => <NavLink key={to} to={to} end={to === "/"}><Icon size={19}/>{label}</NavLink>)}</nav><div className="app-sidebar-actions"><Link to="/send"><ArrowUpRight size={18}/>{t("wallet.send")}</Link><Link to="/receive"><ArrowDownLeft size={18}/>{t("wallet.receive")}</Link></div></aside>}
      <div className="app-content">{(["/", "/activity", "/market", "/profile"].includes(path) || path.startsWith("/asset/")) && <AppHeader/>}<Outlet /></div>
      <WebPushPrompt />
      <SignalArrival />
      <BottomNav />
      <FloatingSupport key={path}/>
    </div>
  );
}
