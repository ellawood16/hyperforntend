import { NavLink, useLocation } from "react-router-dom";
import { Wallet, ChartNoAxesCombined, Receipt, User, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { brandConfig } from "@/config/site";

const ITEMS = [
  { to: "/", icon: Wallet, labelKey: "nav.wallet" },
  { to: "/market", icon: ChartNoAxesCombined, labelKey: "nav.market" },
  { to: "/activity", icon: Receipt, labelKey: "nav.activity" },
  { to: "/profile", icon: User, labelKey: "nav.profile" },
] as const;

export function BottomNav() {
  const t = useT();
  const path = useLocation().pathname;
  const tradePath = path.startsWith("/asset/") ? path : "/asset/bsc/BTCB";
  const items = brandConfig.style === "apple" ? [ITEMS[0], ITEMS[2], { to: tradePath, icon: ChartNoAxesCombined, labelKey: "market.title" }, ITEMS[3]] : brandConfig.style === "binance" ? [ITEMS[0], ITEMS[1], { to: "/receive", icon: ArrowDownLeft, labelKey: "wallet.receive" }, ITEMS[2], ITEMS[3]] : [ITEMS[0], { to: "/send", icon: ArrowUpRight, labelKey: "wallet.send" }, { to: "/receive", icon: ArrowDownLeft, labelKey: "wallet.receive" }, ITEMS[2], ITEMS[3]];
  return (
    <nav className="brand-bottom-nav fixed inset-x-0 bottom-0 z-20 border-t border-app bg-app-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {items.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-caption",
                isActive ? "text-app-primary" : "text-app-secondary",
              )
            }
          >
            {brandConfig.style === "apple" ? <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{to === "/" ? <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/> : to === "/activity" ? <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></> : to.startsWith("/asset") ? <><path d="M3 19h18M4 15l5-5 4 3 7-8"/><path d="M16 5h4v4"/></> : <><circle cx="12" cy="8" r="3.5"/><path d="M5 21c0-4 3-6 7-6s7 2 7 6"/></>}</svg> : <Icon className="h-5 w-5" />}
            {t(labelKey)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
