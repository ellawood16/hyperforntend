import { http } from "@/lib/http";

export type WithdrawFee = { fee: string; threshold: string; below_threshold_fee: string; min_withdraw: string };
export type WithdrawRequest = { amount: string; address: string; network_code: string; token_symbol: string; currency: string };
export type WithdrawResult = WithdrawRequest & {
  id: number; fee_amount: string; net_amount: string;
  status: "pending_review" | "processing" | "approved" | "rejected" | "paid" | "failed";
  tx_hash: string | null; created_at: string;
};
export const getWithdrawFees = () => http.get<Record<string, WithdrawFee>>("/api/withdraw/fees/");
export const createWithdraw = (request: WithdrawRequest) => http.post<WithdrawResult>("/api/withdraw/create/", request);
