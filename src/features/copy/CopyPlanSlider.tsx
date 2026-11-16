import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CopyPlan } from "@/api/copyTrade";
import { useI18n } from "@/i18n/I18nProvider";
import { CopyPlanCard } from "./CopyPlanCard";

export function CopyPlanSlider({ plans, enabled, title, onSelect }: {
  plans: CopyPlan[];
  enabled: boolean;
  title: string;
  onSelect: (plan: CopyPlan) => void;
}) {
  const { t, language } = useI18n();
  const viewport = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ index: 0, visible: 1 });
  const last = Math.max(0, plans.length - position.visible);
  const current = Math.min(position.index, last);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = () => {
      const card = element.firstElementChild;
      if (!card) return;
      const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
      const step = card.getBoundingClientRect().width + gap;
      if (!step) return;
      const visible = Math.max(1, Math.floor((element.clientWidth + gap + 1) / step));
      const index = Math.max(0, Math.min(plans.length - visible, Math.round(Math.abs(element.scrollLeft) / step)));
      setPosition(previous => previous.index === index && previous.visible === visible ? previous : { index, visible });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.addEventListener("scroll", measure, { passive: true });
    return () => { observer.disconnect(); element.removeEventListener("scroll", measure); };
  }, [plans.length, language]);

  const move = (index: number) => {
    const element = viewport.current;
    const card = element?.firstElementChild;
    if (!element || !card) return;
    const target = Math.max(0, Math.min(last, index));
    const step = card.getBoundingClientRect().width + (parseFloat(getComputedStyle(element).columnGap) || 0);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left: (language === "ar" ? -1 : 1) * target * step, behavior: reducedMotion ? "instant" : "smooth" });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Leave keyboard interactions on the cards' Copy buttons untouched.
    if (event.target !== event.currentTarget) return;
    const forward = language === "ar" ? "ArrowLeft" : "ArrowRight";
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      move(event.key === "Home" ? 0 : event.key === "End" ? last : current + (event.key === forward ? 1 : -1));
    }
  };

  return <section className="copy-plan-slider-row" aria-label={title}>
    <div className="copy-slider-heading"><h3>{title}<span>{plans.length}</span></h3><div className="copy-slider-controls">
      <button type="button" disabled={current === 0} onClick={() => move(current - 1)} aria-label={t("copyTrade.previous", { group: title })}><ChevronLeft className="rtl:rotate-180" aria-hidden="true" /></button>
      <button type="button" disabled={current >= last} onClick={() => move(current + 1)} aria-label={t("copyTrade.next", { group: title })}><ChevronRight className="rtl:rotate-180" aria-hidden="true" /></button>
    </div></div>
    {plans.length ? <>
      <div className="copy-plan-slider" ref={viewport} tabIndex={0} role="region" aria-label={title} onKeyDown={onKeyDown}>
        {plans.map(plan => <CopyPlanCard key={plan.id} plan={plan} enabled={enabled} compact onSelect={onSelect} />)}
      </div>
      <p className="copy-slider-range" aria-live="polite" aria-atomic="true">{t("copyTrade.showing", { first: String(current + 1), last: String(Math.min(plans.length, current + position.visible)), total: String(plans.length) })}</p>
    </> : <p className="copy-slider-empty">{t("copyTrade.emptyGroup")}</p>}
  </section>;
}
