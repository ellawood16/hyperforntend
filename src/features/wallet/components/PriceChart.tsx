import { useEffect, useMemo, useRef, useState } from "react";
import type { CandleChart, MarketCandle } from "@/api/wallet";
import { loadTradingView, type TradingChart, type ChartSeries } from "@/lib/tradingView";
import { useI18n, useT } from "@/i18n/I18nProvider";

function aggregate(candles: MarketCandle[], interval: number) {
  const groups = new Map<number, MarketCandle[]>();
  for (const candle of candles) {
    const time = Math.floor(candle.time / (900 * interval)) * 900 * interval;
    groups.set(time, [...(groups.get(time) ?? []), candle]);
  }
  return [...groups.entries()].sort(([a], [b]) => a - b).map(([time, rows]) => ({
    time, open: Number(rows[0].open), high: Math.max(...rows.map(c => Number(c.high))),
    low: Math.min(...rows.map(c => Number(c.low))), close: Number(rows[rows.length - 1].close),
    volume: rows.reduce((sum, c) => sum + Number(c.volume), 0),
  })).filter(c => [c.time, c.open, c.high, c.low, c.close, c.volume].every(Number.isFinite));
}

export function PriceChart({ chart, offline = false }: {chart: CandleChart; offline?: boolean; embedded?: boolean}) {
  const { language } = useI18n();
  const t = useT();
  const mount = useRef<HTMLDivElement>(null);
  const instance = useRef<TradingChart | null>(null);
  const priceSeries = useRef<ChartSeries | null>(null);
  const volumeSeries = useRef<ChartSeries | null>(null);
  const [interval, setInterval] = useState(1);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const fittedInterval = useRef<number | null>(null);
  const candles = useMemo(() => aggregate(chart.candles, interval), [chart.candles, interval]);
  const latest = candles.at(-1);
  const first = candles[0];
  const change = latest && first?.open ? (latest.close - first.open) / first.open * 100 : 0;
  const number = (value: number) => new Intl.NumberFormat(language, {maximumFractionDigits: Math.abs(value) < 1 ? 8 : 2}).format(value);

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | undefined;
    setFailed(false);
    void loadTradingView().then(library => {
      if (cancelled || !mount.current) return;
      const css = getComputedStyle(document.documentElement);
      const color = (name: string) => css.getPropertyValue(name).trim();
      const api = library.createChart(mount.current, {
        autoSize: true,
        layout: {background: {type: "solid", color: color("--app-background")}, textColor: color("--app-text-secondary"), attributionLogo: true, fontSize: 11},
        grid: {vertLines: {color: color("--app-divider")}, horzLines: {color: color("--app-divider")}},
        rightPriceScale: {borderColor: color("--app-border"), scaleMargins: {top: .12, bottom: .28}},
        timeScale: {timeVisible: true, secondsVisible: false, borderColor: color("--app-border"), rightOffset: 5},
        crosshair: {mode: 0},
        handleScroll: {mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false},
      });
      const precision = latest?.close && latest.close < 1 ? 8 : 2;
      priceSeries.current = api.addSeries(library.CandlestickSeries, {
        upColor: color("--app-price-up"), downColor: color("--app-price-down"),
        wickUpColor: color("--app-price-up"), wickDownColor: color("--app-price-down"),
        borderVisible: false, priceFormat: {type: "price", precision, minMove: 10 ** -precision},
      });
      volumeSeries.current = api.addSeries(library.HistogramSeries, {priceFormat: {type: "volume"}, priceScaleId: "", priceLineVisible: false, lastValueVisible: false});
      // Overlay volume uses its own scale at the bottom of the candle pane.
      const scale = api as TradingChart & {priceScale(id: string): {applyOptions(options: Record<string, unknown>): void}};
      scale.priceScale("").applyOptions({scaleMargins: {top: .82, bottom: 0}});
      instance.current = api;
      observer = new MutationObserver(() => {
        const next = getComputedStyle(document.documentElement);
        const get = (name: string) => next.getPropertyValue(name).trim();
        api.applyOptions({layout: {background: {type: "solid", color: get("--app-background")}, textColor: get("--app-text-secondary")}, grid: {vertLines: {color: get("--app-divider")}, horzLines: {color: get("--app-divider")}}});
        priceSeries.current?.applyOptions({upColor: get("--app-price-up"), downColor: get("--app-price-down"), wickUpColor: get("--app-price-up"), wickDownColor: get("--app-price-down")});
      });
      observer.observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme", "style"]});
      fittedInterval.current = null;
      setReady(true);
    }).catch(() => {if (!cancelled) setFailed(true);});
    return () => {cancelled = true; observer?.disconnect(); instance.current?.remove(); instance.current = null; priceSeries.current = null; volumeSeries.current = null;};
    // Recreate only when loading is retried; backend updates are applied below.
  }, [attempt]);

  useEffect(() => {
    if (!ready || !priceSeries.current || !volumeSeries.current) return;
    const css = getComputedStyle(document.documentElement);
    priceSeries.current.setData(candles.map(({time, open, high, low, close}) => ({time, open, high, low, close})));
    volumeSeries.current.setData(candles.map(c => ({time: c.time, value: c.volume, color: c.close >= c.open ? css.getPropertyValue("--app-price-up").trim() : css.getPropertyValue("--app-price-down").trim()})));
    if (candles.length && fittedInterval.current !== interval) {instance.current?.timeScale().fitContent(); fittedInterval.current = interval;}
  }, [candles, ready, interval]);

  return <section className="tradingview-market" aria-label={t("chart.title")} dir="ltr">
    <div className="trade-price-hero"><strong className={change >= 0 ? "text-app-price-up" : "text-app-price-down"}>{latest ? number(latest.close) : "—"}</strong><span className={change >= 0 ? "text-app-price-up" : "text-app-price-down"}>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</span><small>{chart.quote_currency}</small></div>
    <div className="trade-intervals"><span>{language === "ar" ? "الفاصل" : "Interval"}</span>{[{label: "15m", value: 1}, {label: "1h", value: 4}, {label: "4h", value: 16}, {label: "1d", value: 96}].map(item => <button key={item.value} aria-pressed={interval === item.value} onClick={() => setInterval(item.value)}>{item.label}</button>)}<button onClick={() => instance.current?.timeScale().scrollToRealTime()}>{t("chart.latest")}</button></div>
    <div className="tradingview-ohlc"><strong>{chart.market_symbol ?? chart.symbol}</strong>{latest && <span>O <b>{number(latest.open)}</b> H <b>{number(latest.high)}</b> L <b>{number(latest.low)}</b> C <b>{number(latest.close)}</b> · {t("chart.volume")} {number(latest.volume)}</span>}</div>
    <div className="tradingview-canvas" ref={mount}/>
    {failed && <div role="alert" className="tradingview-feedback"><p>{t("detail.loadingMarket")} · {t("common.somethingWrong")}</p><button onClick={() => {setReady(false); setAttempt(value => value + 1);}}>{t("common.retry")}</button></div>}
    {!failed && !ready && <p className="tradingview-feedback" role="status">{t("common.loading")}</p>}
    {ready && candles.length === 0 && <p className="tradingview-feedback" role="status">{t(chart.status === "unavailable" ? "chart.unavailable" : offline || chart.status === "stale" ? "chart.stale" : "chart.warming_up")}</p>}
    {candles.length > 0 && (offline || chart.status === "stale") && <p className="tradingview-feedback" role="status">{t("chart.stale")}</p>}
    <small className="tradingview-attribution">TradingView Lightweight Charts™ · Copyright © 2025 TradingView, Inc. <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer">TradingView</a></small>
  </section>;
}
