import { useState } from "react";
import { brandConfig } from "@/config/site";
import { AnonHeaderMenu } from "./AnonHeaderMenu";
import { useQuery } from "@tanstack/react-query";
import { Bell, Globe2, Search, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { getWallet } from "@/api/wallet";
import { tokenIconUrl } from "@/lib/tokenIcons";
import { useI18n } from "@/i18n/I18nProvider";

export function AppHeader() {
  const { t, language, setLanguage } = useI18n();
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const query = search.trim().toLocaleLowerCase();
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: getWallet, staleTime: 30_000, enabled: Boolean(query) });
  const matches = wallet.data?.assets.filter(asset => [asset.symbol, asset.name, asset.display_code].some(value => value.toLocaleLowerCase().includes(query))).slice(0, 5) ?? [];
  return <header className="app-main-header">
    {brandConfig.style !== "anon" && <nav className="app-header-actions" aria-label={t("wallet.actions")}>
      <Link className="app-header-notifications" to="/notifications" aria-label={t("nav.notifications")}><Bell size={20} aria-hidden="true"/></Link>
      <label className="app-header-language"><Globe2 size={20} aria-hidden="true"/><select value={language} onChange={event => setLanguage(event.target.value === "ar" ? "ar" : "en")} aria-label={t("profile.language")}><option value="en">{t("profile.languageEnglish")}</option><option value="ar">{t("profile.languageArabic")}</option></select></label>
    </nav>}
    <div className="app-header-search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
      <label><Search size={17} aria-hidden="true"/><input type="search" value={search} onChange={event => setSearch(event.target.value)} onFocus={() => setFocused(true)} onKeyDown={event => { if (event.key === "Escape") { setFocused(false); setSearch(""); } }} placeholder={t("market.search")} aria-label={t("market.search")} aria-controls={focused && query ? "header-token-results" : undefined} /></label>
      {focused && query && <div id="header-token-results" className="app-header-results" aria-label={t("market.search")}>
        {wallet.isPending && <p role="status">{t("common.loading")}</p>}
        {wallet.isError && <button type="button" onClick={() => void wallet.refetch()}>{t("common.retry")}</button>}
        {!wallet.isPending && !wallet.isError && matches.length === 0 && <p role="status">{t("market.noResults")}</p>}
        {matches.map(asset => <Link key={`${asset.network}-${asset.symbol}`} to={`/asset/${encodeURIComponent(asset.network)}/${encodeURIComponent(asset.symbol)}`} onClick={() => { setSearch(""); setFocused(false); }}>
          {tokenIconUrl(asset.symbol, asset.icon_url) ? <img src={tokenIconUrl(asset.symbol, asset.icon_url)!} alt=""/> : <Search size={18} aria-hidden="true"/>}<strong>{asset.display_code || asset.symbol}</strong><small>{asset.network_name}</small>
        </Link>)}
      </div>}
    </div>
    {brandConfig.style === "anon" ? <AnonHeaderMenu /> : <Link className="app-header-profile" to="/profile" aria-label={t("nav.profile")}><UserRound size={21} aria-hidden="true"/></Link>}
  </header>;
}
