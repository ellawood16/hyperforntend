import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Radio, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getActiveSignals, type ActiveSignal } from "@/api/signals";
import { useT } from "@/i18n/I18nProvider";

export function SignalArrival() {
  const signals = useQuery({queryKey: ["active-signals"], queryFn: getActiveSignals, refetchInterval: 10_000});
  const [arrival, setArrival] = useState<ActiveSignal | null>(null);
  const seen = useRef(new Set<number>());
  const dismiss = useCallback(() => setArrival(null), []);
  useEffect(() => {
    const newest = signals.data?.find(signal => !seen.current.has(signal.id));
    signals.data?.forEach(signal => seen.current.add(signal.id));
    if (newest) setArrival(newest);
  }, [signals.data]);
  return arrival ? <SignalToast key={arrival.id} signal={arrival} onDismiss={dismiss}/> : null;
}

function SignalToast({ signal, onDismiss }: { signal: ActiveSignal; onDismiss: () => void }) {
  const t = useT();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const start = useRef<{ x: number; at: number } | null>(null);
  const remaining = useRef(12_000);
  const paused = hovered || focused || dragging;
  const buy = signal.direction === "buy";
  useEffect(() => {
    if (paused || exiting) return;
    const started = Date.now();
    const timer = window.setTimeout(onDismiss, remaining.current);
    return () => { window.clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (Date.now() - started)); };
  }, [paused, exiting, onDismiss]);
  useEffect(() => {
    if (!exiting) return;
    const timer = window.setTimeout(onDismiss, 200);
    return () => window.clearTimeout(timer);
  }, [exiting, onDismiss]);
  return <aside className={`signal-arrival signal-toast${buy ? " signal-toast-buy" : " signal-toast-sell"}${dragging ? " is-dragging" : ""}${exiting ? ` is-exiting-${exiting}` : ""}`} aria-label={t("signalArrival.title")}
    style={{ transform: exiting ? `translateX(${exiting === "left" ? "-" : ""}110vw)` : `translateX(${offset}px)`, opacity: exiting ? 0 : Math.max(.3, 1 - Math.abs(offset) / 300) }}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
    onKeyDown={event => { if (event.key === "Escape") onDismiss(); }}
    onPointerDown={event => {
      if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0) || (event.target as Element).closest("a, button")) return;
      start.current = { x: event.clientX, at: Date.now() };
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }}
    onPointerMove={event => { if (start.current) setOffset(event.clientX - start.current.x); }}
    onPointerUp={event => {
      if (!start.current) return;
      const distance = event.clientX - start.current.x;
      const fast = Math.abs(distance) > 24 && Math.abs(distance) / Math.max(1, Date.now() - start.current.at) > .6;
      if (Math.abs(distance) >= 72 || fast) setExiting(distance < 0 ? "left" : "right");
      else setOffset(0);
      start.current = null;
      setDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }}
    onPointerCancel={() => { start.current = null; setOffset(0); setDragging(false); }}>
    <div className="signal-toast-icon" aria-hidden="true"><Radio size={25}/></div>
    <div className="signal-toast-content" role="status"><p className="signal-toast-title"><span aria-hidden="true"/>{t("signalArrival.title")}</p><p className="signal-toast-pair"><strong>{signal.symbol}</strong><span className="signal-toast-side">{t(buy ? "signal.buy" : "signal.sell")}</span></p></div>
    <div className="signal-toast-actions"><Link className="signal-toast-open" to={`/asset/${encodeURIComponent(signal.network)}/${encodeURIComponent(signal.symbol)}`} onClick={onDismiss}>{t("signalArrival.open")}<ArrowRight size={15} className="rtl:rotate-180" aria-hidden="true"/></Link>
    <button className="signal-toast-close" type="button" onClick={onDismiss} aria-label={t("common.close")}><X size={17} aria-hidden="true"/></button></div>
    <div className="signal-toast-lifetime" aria-hidden="true"><span style={{animationPlayState: paused ? "paused" : "running"}}/></div>
  </aside>;
}
