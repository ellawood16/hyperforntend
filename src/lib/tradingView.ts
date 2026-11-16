/** Pinned TradingView Lightweight Charts standalone build (Apache-2.0). */
export type ChartSeries = {
  setData(data: Record<string, unknown>[]): void;
  applyOptions(options: Record<string, unknown>): void;
};
export type TradingChart = {
  addSeries(type: unknown, options?: Record<string, unknown>, paneIndex?: number): ChartSeries;
  applyOptions(options: Record<string, unknown>): void;
  timeScale(): { fitContent(): void; scrollToRealTime(): void };
  remove(): void;
};
type Library = {
  createChart(element: HTMLElement, options: Record<string, unknown>): TradingChart;
  CandlestickSeries: unknown;
  HistogramSeries: unknown;
};
let pending: Promise<Library> | undefined;

export function loadTradingView(): Promise<Library> {
  const host = window as unknown as { LightweightCharts?: Library };
  if (host.LightweightCharts) return Promise.resolve(host.LightweightCharts);
  if (pending) return pending;
  pending = new Promise<Library>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/lightweight-charts@5.0.9/dist/lightweight-charts.standalone.production.js";
    script.async = true;
    const timer = window.setTimeout(() => {script.remove(); reject(new Error("Chart library timed out"));}, 20000);
    script.onload = () => {
      window.clearTimeout(timer);
      if (host.LightweightCharts) {
        resolve(host.LightweightCharts);
      } else {
        reject(new Error("Chart library unavailable"));
      }
    };
    script.onerror = () => {window.clearTimeout(timer); script.remove(); reject(new Error("Chart library unavailable"));};
    document.head.appendChild(script);
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}
