import { http } from "@/lib/http";

export type ReferralSummary = {
  total_invited: number;
  second_level_invited: number;
  valid_invited: number;
  vip_invited: number;
  lifetime_rewards_usdt: string;
  direct_rewards_usdt: string;
  second_level_rewards_usdt: string;
  page: number;
  total_pages: number;
  referrals: ReferralRow[];
};

export type ReferralRow = {
  referred_name: string;
  email_verified: boolean;
  valid: boolean;
  status: "awaiting_verification" | "inactive" | "active";
  total_usdt_deposited: string;
  first_deposit_amount: string | null;
  first_deposit_at: string | null;
  first_deposit_status: "confirming" | "processing" | "completed" | null;
  qualifying_deposit_amount: string | null;
  reward_status:
    | "paid"
    | "awaiting_deposit"
    | "deposit_below_threshold"
    | "deposit_threshold_not_met"
    | "legacy_deposit_no_reward"
    | "reward_pending";
  reward_amount: string;
  created_at: string;
};

export function getReferrals(page = 1, pageSize = 10) {
  return http.get<ReferralSummary>("/api/referral/my-referrals/", { page, page_size: pageSize });
}

export function checkInvite(code: string) {
  return http.get<{ valid: true }>(`/api/referral/invite/${encodeURIComponent(code)}/`);
}
