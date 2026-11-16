import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowRight, ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import { Button } from "@/components/shared/Button";
import { siteConfig } from "@/config/site";

const scenes = ["wallet", "send", "track"] as const;
type Scene = typeof scenes[number];

function Coin({ symbol, className = "" }: { symbol: string; className?: string }) {
  return <img src={`/icons/apk/${symbol.toLowerCase()}.svg`} alt={symbol} className={className} width="64" height="64" draggable="false" />;
}

function WalletArtwork({ scene }: { scene: Scene }) {
  const t = useT();
  return (
    <div className="onboarding-art" data-scene={scene} aria-hidden="true">
      <div className="onboarding-halo" />
      <div className="onboarding-orbit onboarding-orbit-outer" />
      <div className="onboarding-orbit onboarding-orbit-inner" />
      <div className="onboarding-coin onboarding-coin-btc"><Coin symbol="BTC" /></div>
      <div className="onboarding-coin onboarding-coin-bnb"><Coin symbol="BNB" /></div>
      <div className="onboarding-coin onboarding-coin-usdc"><Coin symbol="USDC" /></div>
      <div className="onboarding-spark onboarding-spark-one"><Sparkles /></div>
      <div className="onboarding-spark onboarding-spark-two"><Sparkles /></div>
      <div key={scene} className="onboarding-art-center">
        {scene === "wallet" && <div className="onboarding-wallet-card">
          <div className="onboarding-card-top"><span className="onboarding-apk-icon onboarding-wallet-icon" /><span>{siteConfig.name}</span><span className="onboarding-card-dot" /></div>
          <span className="onboarding-card-label">{t("auth.onboarding.yourWallet")}</span>
          <div className="onboarding-card-coins"><Coin symbol="USDT" /><Coin symbol="BTC" /><Coin symbol="BNB" /><Coin symbol="USDC" /></div>
          <div className="onboarding-card-bottom"><span>BEP20</span><span>••••  ••••</span><ArrowUpRight /></div>
        </div>}
        {scene === "send" && <div className="onboarding-transfer">
          <div className="onboarding-transfer-route"><span className="onboarding-apk-icon onboarding-send-icon" /><span className="onboarding-transfer-line" /><Check /></div>
          <Coin symbol="USDT" className="onboarding-usdt-hero" />
          <div className="onboarding-transfer-caption"><span className="onboarding-status-dot" />{t("auth.onboarding.sendReceive")}</div>
        </div>}
        {scene === "track" && <div className="onboarding-market-card">
          <div className="onboarding-card-top"><Coin symbol="BTC" /><div><strong>BTC</strong><span>{t("auth.onboarding.marketView")}</span></div><span className="onboarding-live-dot" /></div>
          <svg className="onboarding-chart" viewBox="0 0 260 110" fill="none"><path className="onboarding-chart-grid" d="M0 25H260M0 55H260M0 85H260" /><path className="onboarding-chart-line" d="M2 90L22 79L43 84L63 57L84 65L104 42L125 54L146 28L166 40L188 19L208 30L231 12L258 21" /></svg>
          <div className="onboarding-market-bars">{Array.from({ length: 18 }, (_, i) => <span key={i} />)}</div>
          <div className="onboarding-card-bottom"><span>{t("auth.onboarding.illustration")}</span><ArrowUpRight /></div>
        </div>}
      </div>
      <div className="onboarding-float-chip onboarding-chip-top"><span className="onboarding-status-dot" />{t("auth.onboarding.bep20")}</div>
      <div className="onboarding-float-chip onboarding-chip-bottom"><Coin symbol="USDT" /><span>USDT</span><ArrowUpRight /></div>
    </div>
  );
}

export function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  const t = useT();
  const [active, setActive] = useState(0);
  const scene = scenes[active];
  return (
    <main className="onboarding" data-scene={scene}>
      <header className="onboarding-header">
        <div className="onboarding-wordmark"><span className="onboarding-brand-icon"><span className="onboarding-apk-icon onboarding-wallet-icon" /></span>{siteConfig.name}</div>
        <span className="onboarding-edition">{t("auth.onboarding.walletForEveryDay")}</span>
      </header>
      <div className="onboarding-main">
        <WalletArtwork scene={scene} />
        <div className="onboarding-content">
          <nav className="onboarding-steps" aria-label={t("auth.onboarding.explore")}>
            {scenes.map((item, index) => <button key={item} type="button" aria-current={index === active ? "step" : undefined} aria-label={t(`auth.onboarding.${item}Title`)} onClick={() => setActive(index)}><span>0{index + 1}</span><span className="onboarding-step-line" /></button>)}
          </nav>
          <div key={scene} className="onboarding-copy" aria-live="polite" aria-atomic="true">
            <p className="onboarding-eyebrow">{t(`auth.onboarding.${scene}Label`)}</p>
            <h1>{t(`auth.onboarding.${scene}Title`)}</h1>
            <p className="onboarding-description">{t(`auth.onboarding.${scene}Body`)}</p>
          </div>
          <div className="onboarding-features">
            <span><span className="onboarding-apk-icon onboarding-wallet-icon" />{t("auth.onboarding.hold")}</span>
            <span><span className="onboarding-apk-icon onboarding-send-icon" />{t("auth.onboarding.send")}</span>
            <span><ArrowDownLeft />{t("auth.onboarding.receive")}</span>
          </div>
          <div className="onboarding-actions">
            <Button fullWidth onClick={onContinue} className="onboarding-cta">{t("auth.onboarding.getStarted")}<ArrowRight className="h-5 w-5 rtl:rotate-180" /></Button>
            <div className="onboarding-pagination"><span dir="ltr">0{active + 1} / 03</span><div><button type="button" disabled={active === 0} onClick={() => setActive(active - 1)} aria-label={t("auth.onboarding.previous")}><ChevronLeft className="rtl:rotate-180" /></button><button type="button" disabled={active === scenes.length - 1} onClick={() => setActive(active + 1)} aria-label={t("auth.onboarding.next")}><ChevronRight className="rtl:rotate-180" /></button></div></div>
          </div>
        </div>
      </div>
      <footer className="onboarding-footer"><span className="onboarding-status-dot" />{t("auth.onboarding.footer")}</footer>
    </main>
  );
}
