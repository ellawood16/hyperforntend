import { http } from "@/lib/http";
import type { Paginated } from "./types";

export type Transaction = {
  id: number;
  type: string;
  tx_type: string;
  network: string;
  network_code: string;
  token: string;
  token_symbol: string;
  amount: string;
  balance_after: string;
  tx_hash: string | null;
  status: string;
  reference: string | null;
  created_at: string;
  is_internal: boolean;
};

export function getTransactions(page = 1, category: "all" | "transfers" | "signals" = "transfers") {
  return http.get<Paginated<Transaction>>("/api/transactions/", { page, category });
}
