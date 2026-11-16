import { http } from "@/lib/http";

export type WalletAsset = {
  network: string;
  network_name: string;
  chain_id: number;
  symbol: string;
  name: string;
  display_code: string;
  contract_address: string;
  decimals: number;
  is_native: boolean;
  coingecko_id: string | null;
  group: string;
  supports_deposits: boolean;
  supports_withdrawals: boolean;
  is_internal: boolean;
  amount: string;
  amount_display: string;
  locked_balance: string;
  available_balance: string;
  value_usd: string;
  value_usd_display: string;
  price_usd: string;
  price_change_24h: string;
  is_price_change_positive: boolean;
  price_provider: string | null;
  price_updated_at: string | null;
  icon_url: string | null;
  logo_url: string | null;
};

export type Wallet = {
  address: string;
  balance: string;
  bnb_balance: string;
  usdt_balance: string;
  locked_balance: string;
  available_balance: string;
  total_balance: string;
  assets: WalletAsset[];
};

export function getWallet() {
  return http.get<Wallet>("/api/wallet/");
}

export type ChartRange = "1h" | "24h" | "7d" | "30d";

export type PriceChartPoint = { time: string; price_usd: string };

export type PriceChart = {
  network: string;
  network_name: string;
  chain_id: number;
  symbol: string;
  name: string;
  display_code: string;
  contract_address: string;
  decimals: number;
  group: string;
  range: ChartRange;
  latest: {
    price_usd: string;
    change_24h: string;
    provider: string | null;
    provider_updated_at: string | null;
    updated_at: string | null;
  };
  points: PriceChartPoint[];
};

export function getPriceChart(network: string, symbol: string, range: ChartRange) {
  return http.get<PriceChart>("/api/wallet/tokens/price-chart/", { network, symbol, range });
}

export type MarketCandle = {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closed: boolean;
};
export type CandleChart = {
  symbol: string;
  network: string;
  interval: "15m";
  quote_currency: string | null;
  market_symbol: string | null;
  reference_label: string | null;
  status: "live" | "stale" | "unavailable" | "warming_up";
  last_updated: string | null;
  server_time: string;
  candles: MarketCandle[];
};
export function getCandleChart(network: string, symbol: string) {
  return http.get<CandleChart>("/api/wallet/tokens/candles/", { network, symbol, interval: "15m", limit: 500 });
}
