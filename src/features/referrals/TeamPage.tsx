import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, BadgeCheck, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Copy, Gift, Hourglass, Info, Users } from "lucide-react";
import { getReferrals, type ReferralRow } from "@/api/referrals";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/shared/Button";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { useAuth } from "@/state/AuthContext";

type InviteeProps = {
  summary: Awaited<ReturnType<typeof getReferrals>> | undefined;
  onRetry: () => void;
  loading: boolean;
  error: boolean;
  fetching: boolean;
  transitioning: boolean;
  direction: "next" | "previous";
  page: number;
  setPage: (page: number) => void;
  language: "en" | "ar";
};

export function TeamPage({ embedded = false }: { embedded?: boolean }) {
  const t = useT();
  const { language } = useI18n();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const summary = useQuery({
    queryKey: ["referrals", page, 3],
    queryFn: () => getReferrals(page, 3),
    placeholderData: keepPreviousData,
  });
  const link = user?.memo ? `${window.location.origin}/r/${encodeURIComponent(user.memo)}` : "";
  const changePage = (next: number) => {
    setDirection(next > page ? "next" : "previous");
    setPage(next);
  };
  const inviteeProps = { summary: summary.data, onRetry: () => summary.refetch(), loading: summary.isPending, error: summary.isError, fetching: summary.isFetching, transitioning: summary.isPlaceholderData, direction, page, setPage: changePage, language };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
    }
  };
  const shareFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
  const shareTelegram = `https://t.me/share/url?url=${encodeURIComponent(link)}`;

  return <div className={`referral-reference${embedded ? " referral-embedded" : ""}`}>
    {!embedded && <TopBar title={t("referral.team")} back />}
    <div className="referral-reference-content">
      {!embedded && <header className="referral-reference-hero"><div className="referral-orb" aria-hidden="true"/><p>{t("referral.eyebrow")}</p><h1>{language === "ar" ? "ادعُ أصدقاءك، واكسب" : "Invite friends, earn"} <em><ReferralRates/></em></h1><p>{t("referral.heroSubtitle")}</p></header>}
      <section className="referral-reference-card">
        <div className="referral-commission"><span>{t("referral.rewardRateLabel")}</span><strong><ReferralRates/></strong><small>{t("referral.rewardRateShort")}</small></div>
        <div className="referral-invite-panel"><div className="referral-link-row"><span>{t("referral.networkYou")}</span><strong dir="ltr">{user?.memo || "—"}</strong><button type="button" disabled={!user?.memo} aria-label={t("common.copy")} onClick={() => { if (user?.memo) void navigator.clipboard.writeText(user.memo).then(() => setCopied(true)).catch(() => setCopyError(true)); }}><Copy size={17}/></button></div><div className="referral-link-row"><span>{t("referral.yourLink")}</span><strong dir="ltr">{link || t("referral.codeUnavailable")}</strong><button type="button" disabled={!link} onClick={() => void copy()} aria-label={t("common.copy")}><Copy size={17}/></button></div>
          <div className="referral-share-actions"><a className="referral-share-facebook" href={link ? shareFacebook : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!link}><span className="referral-social-facebook">f</span><small>Facebook</small></a><a className="referral-share-telegram" href={link ? shareTelegram : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!link}><span><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.5 3.5 18 20c-.2 1.1-.9 1.4-1.8.9l-5.1-3.8-2.5 2.4c-.3.3-.5.5-1 .5l.4-5.2 9.4-8.5c.4-.4-.1-.6-.6-.2L5.1 13.4.1 11.8c-1.1-.4-1.1-1.1.2-1.6L19.8 2.7c.9-.3 1.9.2 1.7.8Z"/></svg></span><small>Telegram</small></a><button className={`referral-share-copy${copied ? " is-copied" : ""}`} type="button" disabled={!link} onClick={() => void copy()}><span>{copied ? <Check size={20}/> : <Copy size={20}/>}</span><small>{t(copied ? "common.copied" : "common.copy")}</small></button></div>{copyError && <p role="alert">{t("referral.copyError")}</p>}</div>
      </section>
      {!embedded && <>
      <section className="referral-overview" aria-label={t("referral.overview")}>
        <h2 className="text-title font-semibold">{t("referral.overview")}</h2>
        <div className="referral-metrics">
          <div><Users size={19} className="text-app-verified" aria-hidden="true"/><strong>{summary.data?.total_invited ?? "—"}</strong><span>{t("referral.total")}</span></div>
          <div><BadgeCheck size={19} className="text-app-success" aria-hidden="true"/><strong>{summary.data?.valid_invited ?? "—"}</strong><span>{t("referral.qualified")}</span></div>
          <div><Gift size={19} className="text-app-warning" aria-hidden="true"/><strong>{summary.data ? formatUsdt(summary.data.lifetime_rewards_usdt, language) : "—"}</strong><span>{t("referral.lifetimeRewards")} · USDT</span></div>
        </div>
      </section>
      <section className="referral-info"><h2>{t("referral.infoTab")}</h2><article><i aria-hidden="true"/><h3>{t("referral.heroTitle")}</h3><p>{t("referral.rewardRule")}</p></article><article><i aria-hidden="true"/><h3>{t("referral.examplesTitle")}</h3><p>{t("referral.exampleOneTitle")}: {t("referral.exampleDeposit", {amount: "100"})} → {t("referral.exampleOneReward", {amount: formatUsdt("8", language)})}</p><p>{t("referral.exampleWaveTitle")}: {t("referral.exampleWaveReward", {amount: formatUsdt("6", language)})}</p></article></section>
      <section className="referral-members"><InviteeContent {...inviteeProps}/></section></>}
    </div>
  </div>;

}

function ReferralRates() {
  const t = useT();
  return <span className="referral-rate-values" dir="ltr"><span className="referral-rate referral-rate-direct">{t("referral.directRateValue")}</span><span className="referral-rate-join">{t("referral.rateJoin")}</span><span className="referral-rate referral-rate-second">{t("referral.secondRateValue")}</span></span>;
}

function InviteeContent(props: InviteeProps) {
  const t = useT();
  const referrals = props.summary?.referrals ?? [];
  return <section aria-labelledby="referral-invitees-heading">
    <div className="mb-3 flex items-end justify-between gap-3">
      <div><h2 id="referral-invitees-heading" className="text-title text-app-primary">{t("referral.invitedUsers")}</h2><p className="mt-1 text-label text-app-secondary">{t("referral.listSubtitle")}</p></div>
    </div>
    {props.loading && !props.summary && <p className="py-5 text-body text-app-secondary">{t("common.loading")}</p>}
    {props.error && <div className="py-4"><p role="alert" className="text-body text-app-secondary">{t("referral.listError")}</p><Button variant="secondary" className="mt-3" onClick={props.onRetry}>{t("common.retry")}</Button></div>}
    {props.summary && !props.error && referrals.length === 0 && <div className="py-6">
      <p className="text-body text-app-primary">{t("referral.noInvites")}</p><p className="mt-1 text-label text-app-secondary">{t("referral.emptyInviteHint")}</p>
    </div>}
    {props.summary && !props.error && referrals.length > 0 && <>
      <div className="referral-invitee-viewport" tabIndex={0} role="region" aria-label={t("referral.invitedUsers")} onKeyDown={event => {
        if (event.target !== event.currentTarget || props.fetching) return;
        const nextKey = props.language === "ar" ? "ArrowLeft" : "ArrowRight";
        const previousKey = props.language === "ar" ? "ArrowRight" : "ArrowLeft";
        if (event.key === nextKey && props.page < props.summary!.total_pages) { event.preventDefault(); props.setPage(props.page + 1); }
        if (event.key === previousKey && props.page > 1) { event.preventDefault(); props.setPage(props.page - 1); }
      }}>
      <div key={props.summary.page} className={`referral-invitee-list referral-slide-${props.direction}${props.transitioning ? " referral-slide-loading" : ""}`} aria-busy={props.fetching}>
        {referrals.map((referral, index) => <InviteeRow key={`${referral.created_at}-${index}`} referral={referral} language={props.language} index={index} />)}
      </div>
      </div>
      {props.summary.total_pages > 1 && <nav aria-label={t("referral.pages")} className="referral-carousel-controls">
        <button type="button" aria-label={t("referral.previous")} disabled={props.page === 1 || props.fetching} onClick={() => props.setPage(props.page - 1)}><ChevronLeft className="rtl:rotate-180" size={20} aria-hidden="true"/></button>
        <span className="text-label text-app-secondary" aria-live="polite">{t("referral.pageOf", { page: String(props.summary.page), total: String(props.summary.total_pages) })}</span>
        <button type="button" aria-label={t("referral.next")} disabled={props.page >= props.summary.total_pages || props.fetching} onClick={() => props.setPage(props.page + 1)}><ChevronRight className="rtl:rotate-180" size={20} aria-hidden="true"/></button>
      </nav>}
    </>}
  </section>;
}

function InviteeRow({ referral, language, index }: { referral: ReferralRow; language: "en" | "ar"; index: number }) {
  const t = useT();
  const paid = referral.reward_status === "paid";
  const name = referral.referred_name || t("referral.unnamedUser");
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join("");
  const hasDeposit = referral.first_deposit_amount !== null;
  return <article className="referral-invitee-card" style={{ animationDelay: `${Math.min(index, 7) * 35}ms` }}>
    <header className="referral-invitee-header">
      <span className={`referral-avatar${referral.valid ? " referral-avatar-qualified" : ""}`} aria-hidden="true">{initials}</span>
      <div className="min-w-0 flex-1"><h3 className="break-words font-semibold">{name}</h3><p className={`referral-account-status${referral.status === "active" ? " referral-account-active" : ""}`}><span aria-hidden="true"/>{t(`referral.accountStatus.${referral.status}`)}</p></div>
      <span className={`referral-qualification${referral.valid ? " is-qualified" : ""}`}>{referral.valid ? <BadgeCheck size={14} aria-hidden="true"/> : <Clock3 size={14} aria-hidden="true"/>}{t(referral.valid ? "referral.statusValid" : "referral.statusNotValid")}</span>
    </header>
    <dl className="referral-invitee-values">
      <div><dt><ArrowDownToLine size={15} aria-hidden="true"/>{t("referral.totalDepositedShort")}</dt><dd>{formatUsdt(referral.total_usdt_deposited, language)} <small>USDT</small></dd></div>
      <div><dt><Gift size={15} aria-hidden="true"/>{t("referral.rewardAmount")}</dt><dd className={paid ? "text-app-success" : "text-app-secondary"}>{paid ? formatUsdt(referral.reward_amount, language) : "—"}{paid && <small> USDT</small>}</dd></div>
    </dl>
    <footer className={`referral-reward-state${paid ? " is-paid" : ""}`}>{paid ? <Check size={15} aria-hidden="true"/> : referral.reward_status === "awaiting_deposit" ? <Hourglass className="referral-waiting-icon" size={15} aria-hidden="true"/> : <Clock3 size={15} aria-hidden="true"/>}<span>{t(`referral.rewardStatus.${referral.reward_status}`)}</span></footer>
    {hasDeposit && <details className="referral-deposit-details"><summary><span><Info size={14} aria-hidden="true"/>{t("referral.depositDetails")}</span><ChevronDown size={15} aria-hidden="true"/></summary><dl>
      <div><dt>{t("referral.firstDepositColumn")}</dt><dd>{formatUsdt(referral.first_deposit_amount!, language)} USDT</dd></div>
      {referral.first_deposit_at && <div><dt><CalendarDays size={13} aria-hidden="true"/>{t("referral.firstDepositDate")}</dt><dd>{formatDate(referral.first_deposit_at, language)}</dd></div>}
      {referral.first_deposit_status && <div><dt>{t("referral.depositStatusLabel")}</dt><dd>{t(`referral.depositStatus.${referral.first_deposit_status}`)}</dd></div>}
      {referral.qualifying_deposit_amount && <div><dt>{t("referral.qualifyingAmount")}</dt><dd>{formatUsdt(referral.qualifying_deposit_amount, language)} USDT</dd></div>}
    </dl></details>}
  </article>;
}

function formatUsdt(value: string, language: "en" | "ar"): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat(language === "ar" ? "ar" : "en-US", { maximumFractionDigits: 2 }).format(amount);
}

function formatDate(iso: string, language: "en" | "ar"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return date.toLocaleDateString(language === "ar" ? "ar" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}
