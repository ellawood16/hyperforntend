import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, BookOpen, Check, ChevronLeft, ChevronRight, ClipboardPaste, Clock3, Mail, MessageCircle, Radio, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { brandConfig } from "@/config/site";
import { useT } from "@/i18n/I18nProvider";

export type AnonMenuView = "menu" | "about" | "support" | "how";

export function AnonMenuContent({ view, onClose }: { view: Exclude<AnonMenuView, "menu">; onClose: () => void }) {
  const t = useT();
  if (view === "how") return <AnonSignalGuide onClose={onClose} />;
  if (view === "about") return <div className="anon-menu-content">
    <span className="anon-menu-feature-icon"><ShieldCheck size={32} aria-hidden="true" /></span>
    <h3>{brandConfig.name}</h3><p>{t("anonMenu.aboutBody", { name: brandConfig.name })}</p>
    <div className="anon-menu-note"><BookOpen size={20} aria-hidden="true" /><p>{t("anonMenu.aboutDetails")}</p></div>
  </div>;
  return <div className="anon-menu-content">
    <h3>{t("anonMenu.supportTitle")}</h3><p>{t("anonMenu.supportBody")}</p>
    <div className="anon-menu-links">
      <Link to="/messages" onClick={onClose}><MessageCircle size={21} aria-hidden="true" /><span>{t("anonMenu.inAppSupport")}</span><ChevronRight className="rtl:rotate-180" size={17} aria-hidden="true" /></Link>
      {brandConfig.telegramSupportUrl.trim() && <a href={brandConfig.telegramSupportUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={21} aria-hidden="true" /><span>{t("floatingSupport.account")}</span></a>}
      {brandConfig.telegramChannelUrl.trim() && <a href={brandConfig.telegramChannelUrl} target="_blank" rel="noopener noreferrer"><Radio size={21} aria-hidden="true" /><span>{t("floatingSupport.channel")}</span></a>}
      {brandConfig.supportEmail && !brandConfig.supportEmail.endsWith("@example.com") && <a href={`mailto:${brandConfig.supportEmail}`}><Mail size={21} aria-hidden="true" /><span>{brandConfig.supportEmail}</span></a>}
    </div>
    <div className="anon-menu-note"><ShieldCheck size={20} aria-hidden="true" /><p>{t("anonMenu.supportNote")}</p></div>
  </div>;
}

function AnonSignalGuide({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [step, setStep] = useState(0);
  return <div className="anon-signal-guide">
    <p className="anon-menu-eyebrow">{t("anonMenu.signalGuide")}</p>
    <div className="anon-guide-progress" role="group" aria-label={t("anonMenu.guideSteps")}>
      {Array.from({ length: 5 }, (_, index) => <button key={index} type="button" aria-label={t("anonMenu.stepNumber", { number: String(index + 1) })} aria-current={step === index ? "step" : undefined} onClick={() => setStep(index)}>{index + 1}</button>)}
    </div>
    <div className="anon-guide-screen" aria-label={t("anonMenu.exampleScreen")}>
      <div className="anon-guide-screen-bar"><span />{t("anonMenu.exampleScreen")}<span /></div>
      <GuideScreen step={step} />
    </div>
    <section className="anon-guide-instruction" aria-live="polite" aria-atomic="true">
      <h3>{t(`anonMenu.step${step + 1}Title`)}</h3><p>{t(`anonMenu.step${step + 1}Body`)}</p>
    </section>
    <div className="anon-guide-controls">
      <button type="button" disabled={step === 0} onClick={() => setStep(value => value - 1)}><ChevronLeft size={18} className="rtl:rotate-180" />{t("anonMenu.previous")}</button>
      {step < 4 ? <button type="button" onClick={() => setStep(value => value + 1)}>{t("anonMenu.next")}<ChevronRight size={18} className="rtl:rotate-180" /></button> : <Link to="/market" onClick={onClose}>{t("market.title")}<ChevronRight size={18} className="rtl:rotate-180" /></Link>}
    </div>
  </div>;
}

function GuideScreen({ step }: { step: number }) {
  const t = useT();
  return <div className="anon-guide-screen-body" aria-hidden="true">
    {step === 0 && <><strong>{t("market.title")}</strong><div className="anon-guide-chart"><svg viewBox="0 0 240 70" fill="none"><path d="M0 58 24 43 48 49 72 22 96 31 120 15 144 25 168 9 192 16 216 7 240 3" stroke="currentColor" strokeWidth="3" /></svg></div>{["BTC", "ETH", "USDT"].map(symbol => <div key={symbol} className="anon-guide-mini-row"><span>{symbol}</span><ChevronRight size={16} /></div>)}<div className="anon-guide-faux-action">{t("signalArrival.open")} · BTC</div></>}
    {step === 1 && <><strong>BTC · {t("signal.open")}</strong><small>{t("signal.code")}</small><div className="anon-guide-faux-field"><span dir="ltr">XXX-XXX-XXX</span><ClipboardPaste size={18} /></div><p>{t("anonMenu.codeHint")}</p><div className="anon-guide-faux-action">{t("signal.open")}</div></>}
    {step === 2 && <><strong>{t("signal.entry")}</strong><div className="anon-guide-amount" dir="ltr">0.00 <small>USDT</small></div><div className="anon-guide-directions"><span><ArrowDownLeft size={18} />{t("signal.buy")}</span><span><ArrowUpRight size={18} />{t("signal.sell")}</span></div><div className="anon-guide-faux-action">{t("signal.review")}</div></>}
    {step === 3 && <><strong>{t("signal.review")}</strong>{["signal.balance", "signal.minimum", "signal.expires"].map(key => <div className="anon-guide-mini-row" key={key}><span>{t(key)}</span><span>—</span></div>)}<div className="anon-guide-risk">{t("anonMenu.reviewHint")}</div><div className="anon-guide-faux-action">{t("signal.submit")}</div></>}
    {step === 4 && <><span className="anon-guide-success"><Check size={30} /></span><strong>{t("anonMenu.orderOpened")}</strong><div className="anon-guide-mini-row"><span>BTC</span><Clock3 size={18} /></div><p>{t("anonMenu.trackHint")}</p><div className="anon-guide-faux-action">{t("wallet.activity")}</div></>}
  </div>;
}
