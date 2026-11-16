import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Headset, MessageCircle, Radio, X } from "lucide-react";
import { brandConfig } from "@/config/site";
import { useT } from "@/i18n/I18nProvider";

export function FloatingSupport() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const options = [
    { url: brandConfig.telegramSupportUrl.trim(), title: "floatingSupport.account", Icon: MessageCircle },
    { url: brandConfig.telegramChannelUrl.trim(), title: "floatingSupport.channel", Icon: Radio },
  ];
  return <div className="floating-support" ref={root}>
    {open && <section id="floating-support-panel" className="floating-support-panel" aria-label={t("floatingSupport.title")} tabIndex={-1} ref={panel}>
      <h2>{t("floatingSupport.title")}</h2>
      {options.map(({ url, title, Icon }) => {
        const content = <><Icon size={20} aria-hidden="true"/><span><strong>{t(title)}</strong><small>{t(url ? "floatingSupport.openTelegram" : "floatingSupport.unavailable")}</small></span>{url && <ArrowUpRight size={17} aria-hidden="true"/>}</>;
        return url ? <a key={title} href={url} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>{content}</a> : <button key={title} type="button" disabled>{content}</button>;
      })}
    </section>}
    <button ref={trigger} className="floating-support-trigger" type="button" aria-label={t(open ? "common.close" : "floatingSupport.title")} aria-expanded={open} aria-controls={open ? "floating-support-panel" : undefined} onClick={() => setOpen(value => !value)}>{open ? <X size={23} aria-hidden="true"/> : <Headset size={24} aria-hidden="true"/>}</button>
  </div>;
}
