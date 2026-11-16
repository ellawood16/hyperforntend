import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, BookOpen, Check, ChevronRight, Globe2, Headset, Info, Menu, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nProvider";
import { brandConfig } from "@/config/site";
import { AnonMenuContent, type AnonMenuView } from "./AnonMenuContent";
import "./anon-header-menu.css";

export function AnonHeaderMenu() {
  const { t, language, setLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AnonMenuView>("menu");
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const interruptedMotion = useRef<{ transform: string; opacity: string } | null>(null);

  useEffect(() => {
    const sheet = dialog.current;
    const content = panel.current;
    if (!sheet || !content || (!open && !sheet.open)) return;
    if (open && !sheet.open) sheet.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const offset = window.getComputedStyle(sheet).direction === "rtl" ? "-100%" : "100%";
    // Start from the current position if the user reverses an unfinished transition.
    const currentTransform = interruptedMotion.current?.transform ?? (open ? `translateX(${offset})` : "translateX(0)");
    const currentOpacity = interruptedMotion.current?.opacity ?? (open ? "0" : "1");
    interruptedMotion.current = null;
    const animations = [
      content.animate([
        { transform: currentTransform },
        { transform: open ? "translateX(0)" : `translateX(${offset})` },
      ], { duration: reduced ? 0 : open ? 340 : 240, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "forwards" }),
      sheet.animate([{ opacity: currentOpacity }, { opacity: open ? 1 : 0 }], { duration: reduced ? 0 : 240, fill: "forwards" }),
    ];
    let cancelled = false;
    void Promise.all(animations.map(animation => animation.finished)).then(() => {
      if (!cancelled && !open) {
        sheet.close();
        document.body.style.overflow = previousOverflow;
      }
    }).catch(() => { /* A reversed transition cancels the previous animations. */ });
    return () => {
      cancelled = true;
      if (animations.some(animation => animation.playState === "running")) {
        interruptedMotion.current = { transform: window.getComputedStyle(content).transform, opacity: window.getComputedStyle(sheet).opacity };
      }
      animations.forEach(animation => animation.cancel());
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      heading.current?.focus({ preventScroll: true });
      panel.current?.scrollTo({ top: 0 });
    }
  }, [view, open]);
  useEffect(() => {
    const sheet = dialog.current;
    return () => sheet?.close();
  }, []);

  const close = () => setOpen(false);
  const title = view === "menu" ? t("common.menu") : t(`anonMenu.${view}`);
  return <div className="anon-header-menu">
    <Link to="/notifications" aria-label={t("nav.notifications")}><Bell size={20} aria-hidden="true" /></Link>
    <button type="button" aria-label={t("common.menu")} aria-haspopup="dialog" aria-controls="anon-header-sheet" aria-expanded={open} onClick={() => { setView("menu"); setOpen(true); }}><Menu size={22} aria-hidden="true" /></button>
    <dialog ref={dialog} id="anon-header-sheet" className="anon-header-sheet" aria-labelledby="anon-menu-heading" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div ref={panel} className="anon-header-sheet-panel">
        <header className="anon-menu-heading">
          {view !== "menu" && <button type="button" aria-label={t("common.back")} onClick={() => setView("menu")}><ArrowLeft className="rtl:rotate-180" size={20} /></button>}
          <h2 ref={heading} id="anon-menu-heading" tabIndex={-1}>{title}</h2>
          <button type="button" aria-label={t("common.close")} onClick={close}><X size={22} aria-hidden="true" /></button>
        </header>
        {view === "menu" ? <>
          <p className="anon-menu-eyebrow">{brandConfig.name}</p>
          <Link className="anon-menu-kyc" to="/profile/identity" onClick={close}><ShieldCheck size={26} aria-hidden="true" /><span><strong>{t("profile.identity")}</strong><small>{t("anonMenu.kycHint")}</small></span><ChevronRight className="rtl:rotate-180" size={18} aria-hidden="true" /></Link>
          <nav className="anon-menu-links" aria-label={t("common.menu")}>
            {([{ key: "how", Icon: BookOpen }, { key: "support", Icon: Headset }, { key: "about", Icon: Info }] as const).map(({ key, Icon }) => <button type="button" key={key} onClick={() => setView(key)}><Icon size={21} aria-hidden="true" /><span>{t(`anonMenu.${key}`)}</span><ChevronRight className="rtl:rotate-180" size={17} aria-hidden="true" /></button>)}
          </nav>
          <section className="anon-menu-language" aria-labelledby="anon-menu-language-title">
            <h3 id="anon-menu-language-title"><Globe2 size={18} aria-hidden="true" />{t("profile.language")}</h3>
            <div role="group" aria-label={t("profile.language")}>
              {(["en", "ar"] as const).map(option => <button key={option} type="button" aria-pressed={language === option} onClick={() => setLanguage(option)}><span lang={option}>{t(option === "en" ? "profile.languageEnglish" : "profile.languageArabic")}</span>{language === option && <Check size={16} aria-hidden="true" />}</button>)}
            </div>
          </section>
        </> : <AnonMenuContent view={view} onClose={close} />}
      </div>
    </dialog>
  </div>;
}
