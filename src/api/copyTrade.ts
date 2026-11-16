import { http } from "@/lib/http";

export type CopyPlan = { id: number; name: string; description: string; avatar: string; duration_days: number; profit_percent: string; min_investment: string; chart_data: number[]; copiers: number };
export type CopyRecord = { id: number; plan: string; amount: string; profit_percent: string; profit: string; duration_days: number; release_at: string; settled_at: string | null };
export const getCopyPlans = () => http.get<{enabled: boolean; plans: CopyPlan[]}>("/api/signals/copy/plans/");
export const getCopyHistory = () => http.get<CopyRecord[]>("/api/signals/copy/history/");
export const startCopy = (plan_id: number, amount: string) => http.post("/api/signals/copy/start/", {plan_id, amount});
