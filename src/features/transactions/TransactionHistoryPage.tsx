import { useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { TopBar } from "@/components/layout/TopBar";
import { Skeleton } from "@/components/shared/Skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/shared/Button";
import { getTransactions, type Transaction } from "@/api/transactions";
import { formatDateTime, formatDecimal2 } from "@/lib/format";
import { cn } from "@/lib/cn";

function TxRow({ tx, language }: { tx: Transaction; language: "en" | "ar" }) {
  const t = useT();
  const negative = ["withdrawal", "withdraw", "send", "signal_loss", "clawback"].includes(tx.tx_type);
  const title = tx.tx_type === "clawback" ? t("tx.balanceDeduction") : tx.tx_type === "admin_bonus" ? t("tx.balanceCredit") : tx.tx_type === "signal_profit" ? t("signal.profit") : tx.tx_type === "signal_loss" ? t("signal.loss") : t(negative ? "tx.sent" : "tx.received");
  return (
    <div className="flex items-center gap-3 rounded-card px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-body-lg capitalize text-app-primary">{title}</p>
        <p className="text-label text-app-secondary">{formatDateTime(tx.created_at, language)}</p>
      </div>
      <div className="text-end">
        <p dir="ltr" className={cn("text-body-lg", negative ? "text-app-primary" : "text-app-price-up")}>
          {negative ? "-" : "+"}
          {formatDecimal2(tx.amount.replace(/^[+-]/, ""))} {tx.token_symbol}
        </p>
        <p className="text-label capitalize text-app-secondary">{t(["confirmed", "paid", "completed"].includes(tx.status) ? "tx.completed" : ["failed", "rejected"].includes(tx.status) ? "tx.failed" : "tx.pending")}</p>
      </div>
    </div>
  );
}

export function TransactionHistoryPage() {
  const t = useT();
  const { language } = useI18n();
  const [category, setCategory] = useState<"transfers" | "signals">("transfers");

  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["transactions", category],
    queryFn: ({ pageParam }) => getTransactions(pageParam, category),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
  });

  const transactions = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div>
      <TopBar title={t("tx.title")} />
      <div className="px-4">
        <div className="copy-tabs" role="group" aria-label={t("tx.title")}>
          {(["transfers", "signals"] as const).map((tab) => <button key={tab} type="button"
            aria-pressed={category === tab} onClick={() => setCategory(tab)}
            className="text-body">
            {t(tab === "transfers" ? "tx.transfers" : "signal.signals")}
          </button>)}
        </div>
        {isPending && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isPending && !isError && transactions.length === 0 && <EmptyState
          message={t(category === "transfers" ? "tx.emptyTransfers" : "tx.emptySignals")}
          action={<Link to={category === "transfers" ? "/receive" : "/market"}
            className="inline-flex min-h-12 items-center justify-center rounded-chip bg-app-action px-6 py-3 text-body font-semibold text-app-on-action">
            {t(category === "transfers" ? "wallet.receive" : "market.title")}
          </Link>} />}

        {transactions.map((tx) => (
          <TxRow key={tx.id} tx={tx} language={language} />
        ))}

        {hasNextPage && (
          <div className="py-4 text-center">
            <Button variant="secondary" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
              {t("tx.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
