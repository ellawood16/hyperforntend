import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "../src/i18n/I18nProvider";
import { TransactionHistoryPage } from "../src/features/transactions/TransactionHistoryPage";
import type { Transaction } from "../src/api/transactions";

test("history renders admin deductions with a minus and credits with a plus", () => {
  const client = new QueryClient();
  const base: Transaction = {
    id: 1, type: "clawback", tx_type: "clawback", network: "bsc", network_code: "bsc",
    token: "USDT", token_symbol: "USDT", amount: "10.000000000000000000", balance_after: "90",
    tx_hash: null, status: "confirmed", reference: "bonus:deduction", created_at: "2026-11-15T00:00:00Z", is_internal: false,
  };
  client.setQueryData(["transactions", "transfers"], {
    pages: [{ count: 2, next: null, previous: null, results: [base, { ...base, id: 2, type: "admin_bonus", tx_type: "admin_bonus", amount: "4", reference: "bonus:credit" }] }],
    pageParams: [1],
  });
  try {
    const html = renderToStaticMarkup(<QueryClientProvider client={client}><I18nProvider><MemoryRouter><TransactionHistoryPage /></MemoryRouter></I18nProvider></QueryClientProvider>);
    assert.match(html, /Balance deduction/);
    assert.match(html, /-10\.00 USDT/);
    assert.doesNotMatch(html, /\+10\.00 USDT/);
    assert.match(html, /Balance credit/);
    assert.match(html, /\+4\.00 USDT/);
  } finally { client.clear(); }
});
