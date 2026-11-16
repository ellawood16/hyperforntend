import type { WithdrawFee } from "@/api/transfers";
import { units, decimal } from "@/lib/amounts";
export { units, decimal, inputAmount, spendable, normalizeAmount } from "@/lib/amounts";

export function withdrawQuote(amount: string, config: WithdrawFee) {
  const gross = units(amount);
  const fee = units(gross > units(config.threshold) ? config.fee : config.below_threshold_fee);
  return { fee: decimal(fee), net: gross > fee ? decimal(gross - fee) : "0", valid: gross > fee && gross >= units(config.min_withdraw) };
}

export function isWalletAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value) && !/^0x0{40}$/.test(value);
}
