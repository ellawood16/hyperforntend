import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getWallet, type WalletAsset } from "@/api/wallet";
import { createWithdraw, getWithdrawFees, type WithdrawResult } from "@/api/transfers";
import { ApiError } from "@/api/types";
import { inputAmount, isWalletAddress, units, withdrawQuote } from "./amounts";

export function useSendFlow(asset: WalletAsset) {
  const client = useQueryClient();
  const lock = useRef(false);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"recipient" | "amount" | "review">("recipient");
  const [review, setReview] = useState<ReturnType<typeof withdrawQuote>>();
  const [result, setResult] = useState<WithdrawResult>();
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState("");
  const validAddress = isWalletAddress(address.trim());
  const validAmount = inputAmount(amount, asset.decimals);
  const invalidate = () => Promise.all([
    client.invalidateQueries({ queryKey: ["wallet"] }),
    client.invalidateQueries({ queryKey: ["transactions"] }),
  ]);
  async function freshQuote() {
    if (!validAddress || !validAmount) throw new Error("transfer.invalidInput");
    const [wallet, fees] = await Promise.all([
      client.fetchQuery({ queryKey: ["wallet"], queryFn: getWallet, staleTime: 0 }),
      client.fetchQuery({ queryKey: ["withdraw-fees"], queryFn: getWithdrawFees, staleTime: 0 }),
    ]);
    const current = wallet.assets.find(item => item.network === asset.network && item.symbol === asset.symbol);
    if (!current?.supports_withdrawals || !fees[asset.symbol]) throw new Error("transfer.unavailable");
    if (address.trim().toLowerCase() === wallet.address.toLowerCase()) throw new Error("transfer.sameAddress");
    if (units(amount) > units(current.available_balance)) throw new Error("transfer.insufficient");
    const quote = withdrawQuote(amount, fees[asset.symbol]);
    if (!quote.valid) throw new Error("transfer.belowMinimum");
    return quote;
  }
  async function submit(confirm: boolean) {
    if (lock.current || uncertain || result) return;
    lock.current = true;
    setBusy(true); setError("");
    let sent = false;
    try {
      const quote = await freshQuote();
      if (!confirm) { setReview(quote); setStep("review"); return; }
      if (!review || quote.fee !== review.fee || quote.net !== review.net) {
        setReview(quote); setError("transfer.feeChanged"); return;
      }
      sent = true;
      const response = await createWithdraw({ amount, address: address.trim(), currency: asset.symbol, token_symbol: asset.symbol, network_code: asset.network });
      setResult(response);
      void invalidate();
    } catch (err) {
      if (err instanceof ApiError && err.code === "withdrawals_off") {
        setError("transfer.paused");
      } else if (sent && (!(err instanceof ApiError) || err.status >= 500)) {
        setUncertain(true); setError("transfer.uncertain"); void invalidate();
      } else if (err instanceof Error && err.message.startsWith("transfer.")) {
        setError(err.message);
      } else if (err instanceof ApiError) {
        setError(err.code === "withdrawals_off" ? "transfer.paused" : err.code === "account_frozen" ? "transfer.frozen" : "transfer.rejected");
      } else setError("transfer.loadError");
    } finally { lock.current = false; setBusy(false); }
  }
  return { address, setAddress, amount, setAmount, step, setStep, review, result, busy, uncertain, error, setError, validAddress, validAmount, submit };
}
