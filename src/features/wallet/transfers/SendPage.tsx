import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWallet, type WalletAsset } from "@/api/wallet";
import { getWithdrawFees } from "@/api/transfers";
import { useT } from "@/i18n/I18nProvider";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/shared/Button";
import { TextField } from "@/components/shared/TextField";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/shared/Skeleton";
import { AssetPicker, assetKey } from "./AssetPicker";
import { useSendFlow } from "./useSendFlow";
import { displayAmount } from "@/lib/amounts";
import { normalizeAmount, spendable, units, withdrawQuote } from "./amounts";

export function SendPage() {
  const t = useT();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(`${params.get("network") ?? "bsc"}:${params.get("symbol") ?? "USDT"}`);
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: getWallet });
  const assets = wallet.data?.assets.filter(asset => asset.network === "bsc" && asset.supports_withdrawals && !asset.is_internal) ?? [];
  const asset = assets.find(item => assetKey(item) === selected) ?? assets[0];
  return <div className="asset-detail-view"><TopBar back title={t("wallet.send")} /><div className="px-4 pb-6">
    {wallet.isPending ? <Skeleton className="h-80 w-full" /> : wallet.isError && !wallet.data ? <ErrorState onRetry={() => wallet.refetch()} /> : asset ?
      <SendForm key={assetKey(asset)} asset={asset} picker={busy => <AssetPicker assets={assets} value={assetKey(asset)} onChange={setSelected} disabled={busy} />} />
      : <p className="text-body text-app-secondary">{t("transfer.noAssets")}</p>}
  </div></div>;
}

function SendForm({ asset, picker }: { asset: WalletAsset; picker: (disabled: boolean) => ReactNode }) {
  const t = useT();
  const flow = useSendFlow(asset);
  const fees = useQuery({ queryKey: ["withdraw-fees"], queryFn: getWithdrawFees });
  const config = fees.data?.[asset.symbol];
  const quote = flow.validAmount && config ? withdrawQuote(flow.amount, config) : undefined;
  const sufficient = flow.validAmount && units(flow.amount) <= units(asset.available_balance);
  const reviewRows = (gross: string, fee: string, net: string) => <dl className="space-y-4 text-body">
    {[[t("transfer.network"), asset.network_name], [t("transfer.recipient"), flow.address.trim()], [t("transfer.totalDebit"), `${displayAmount(gross)} ${asset.symbol}`], [t("transfer.fee"), `${displayAmount(fee)} ${asset.symbol}`], [t("transfer.recipientGets"), `${displayAmount(net)} ${asset.symbol}`]].map(([label, value]) =>
      <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-app-secondary">{label}</dt><dd dir="ltr" className="max-w-full break-all text-app-primary">{value}</dd></div>)}
  </dl>;
  if (flow.result) return <div role="status" className="space-y-6">
    <h2 className="text-headline">{t(flow.result.status === "paid" ? "transfer.sent" : "transfer.submitted")}</h2>
    <p className="text-body text-app-secondary">{t(flow.result.status === "pending_review" ? "transfer.awaitingApproval" : flow.result.status === "paid" ? "transfer.sentDescription" : "transfer.processing")}</p>
    {reviewRows(flow.result.amount, flow.result.fee_amount, flow.result.net_amount)}
    {flow.result.tx_hash && <p dir="ltr" className="break-all text-label text-app-secondary">{flow.result.tx_hash}</p>}
    <Link to="/activity" className="inline-flex rounded-chip bg-app-action px-6 py-3 text-body text-app-on-action">{t("transfer.viewHistory")}</Link>
  </div>;
  return <form className="space-y-6" onSubmit={event => {
    event.preventDefault();
    if (flow.step === "recipient") { if (flow.validAddress) { flow.setError(""); flow.setStep("amount"); } }
    else void flow.submit(flow.step === "review");
  }}>
    {picker(flow.busy || flow.step === "review" || flow.uncertain)}
    <p className="text-label text-app-secondary">{t(`transfer.step_${flow.step}`)}</p>
    {flow.step === "recipient" && <>
      <TextField id="send-address" autoFocus label={t("transfer.recipient")} dir="ltr" value={flow.address} onChange={event => flow.setAddress(event.target.value)} autoComplete="off" spellCheck={false} placeholder="0x…" error={flow.address && !flow.validAddress ? t("transfer.invalidAddress") : undefined} />
      <Button type="button" variant="ghost" onClick={async () => { try { flow.setAddress((await navigator.clipboard.readText()).trim()); } catch { flow.setError("transfer.pasteError"); } }}>{t("transfer.pasteAddress")}</Button>
      <p className="text-body text-app-secondary">{t("transfer.networkWarning", { token: asset.symbol, network: asset.network_name })}</p>
    </>}
    {flow.step === "amount" && <>
      <TextField label={t("transfer.amount")} id="send-amount" autoFocus dir="ltr" inputMode="decimal" value={flow.amount} disabled={flow.busy} onChange={event => flow.setAmount(normalizeAmount(event.target.value))} placeholder="0.00" error={flow.amount && !flow.validAmount ? t("transfer.amountPrecision") : flow.validAmount && !sufficient ? t("transfer.insufficient") : undefined} />
      <div className="flex items-center justify-between gap-3 text-label text-app-secondary"><span>{t("detail.available")}: <bdi>{spendable(asset.available_balance, asset.decimals)} {asset.symbol}</bdi></span><Button type="button" variant="ghost" disabled={flow.busy} onClick={() => flow.setAmount(spendable(asset.available_balance, asset.decimals))}>{t("transfer.max")}</Button></div>
      {fees.isPending && <p className="text-label text-app-secondary">{t("transfer.loadingFees")}</p>}
      {fees.isError && <ErrorState onRetry={() => fees.refetch()} />}
      {fees.data && !config && <p role="alert" className="text-body text-app-danger">{t("transfer.unavailable")}</p>}
      {config && <p className="text-label text-app-secondary">{t("transfer.minimum")}: <bdi>{displayAmount(config.min_withdraw)} {asset.symbol}</bdi></p>}
      {quote && <p className="text-body text-app-secondary">{t("transfer.fee")}: <bdi>{displayAmount(quote.fee)} {asset.symbol}</bdi> · {t("transfer.recipientGets")}: <bdi>{displayAmount(quote.net)} {asset.symbol}</bdi></p>}
      {quote && !quote.valid && <p className="text-label text-app-danger">{t("transfer.belowMinimum")}</p>}
    </>}
    {flow.step === "review" && flow.review && <>
      {reviewRows(flow.amount, flow.review.fee, flow.review.net)}
      <p className="text-body text-app-secondary">{t("transfer.reviewHint")}</p>
    </>}
    {flow.error && <p role="alert" className="text-body text-app-danger">{t(flow.error)}</p>}
    {flow.uncertain ? <Link to="/activity" className="inline-flex py-3 text-body underline">{t("transfer.viewHistory")}</Link> : <>
      <Button fullWidth type="submit" loading={flow.busy} disabled={flow.step === "recipient" ? !flow.validAddress : flow.step === "amount" ? !flow.validAmount || !sufficient || !quote?.valid : false}>
        {t(flow.step === "review" ? "transfer.confirm" : flow.step === "amount" ? "transfer.review" : "common.continue")}
      </Button>
      {flow.step !== "recipient" && <Button fullWidth type="button" variant="ghost" disabled={flow.busy} onClick={() => { flow.setError(""); flow.setStep(flow.step === "review" ? "amount" : "recipient"); }}>{t("common.back")}</Button>}
    </>}
  </form>;
}
