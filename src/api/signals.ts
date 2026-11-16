import { http } from "@/lib/http";
export type ActiveSignal = { id: number; code: string; network: string; symbol: string; direction: "buy" | "sell"; minimum_balance: string; expires_at: string; created_at: string };
export const getActiveSignals = () => http.get<ActiveSignal[]>("/api/signals/active/");

export type SignalCode = { code: string; network: string; symbol: string };
export type SignalPreview = {
  code: string;
  profit_type: "percent" | "fixed_usdt" | "deposit_daily";
  profit_percent: string | null;
  profit_amount: string | null;
  deposit_total: string | null;
  minimum_balance: string;
  available_usdt: string;
  settlement_network: string;
  expires_at: string;
};
export type SignalResult = {
  id: number;
  outcome: "profit" | "loss" | "pending";
  result_amount: string | null;
  settle_at?: string;
  balance: string;
  settlement_network: string;
};
export const previewSignal = (data: SignalCode) => http.post<SignalPreview>("/api/signals/preview/", data);
export type SignalOrder = {id: number; symbol: string; direction: "buy" | "sell"; entry_amount: string; settle_at: string | null; status: "pending" | "completed"; result_amount: string | null; created_at: string};
export const getSignalOrders = () => http.get<SignalOrder[]>("/api/signals/orders/");
export const implementSignal = (data: SignalCode & { direction: "buy" | "sell"; entry_amount: string }) =>
  http.post<SignalResult>("/api/signals/implement/", data);
