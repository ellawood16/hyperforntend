import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "../src/i18n/I18nProvider";
import { NotificationRow } from "../src/features/notifications/components/NotificationRow";
import type { AppNotification } from "../src/api/notifications";

const deposit: AppNotification = {
  id: 1, type: "deposit", level: "success", title: "USDT received",
  message: "You received 1.235000000000000000 USDT.", amount: "1.235000000000000000", token: "USDT",
  network: "bsc", tx_hash: null, reference_id: null, metadata: {}, implemented: false, is_read: false, read_at: null,
  created_at: "2026-10-13T06:00:00Z",
};

const signal: AppNotification = {
  id: 2, type: "signal", level: "info", title: "New signal arrived · BTCB",
  message: "Buy · Code ABC-DEF-GH2. Result: +/−5% of your entry. Expires 12:00 UTC.",
  amount: null, token: null, network: null, tx_hash: null, reference_id: "9",
  metadata: {
    code: "ABC-DEF-GH2", direction: "buy", symbol: "BTCB", network: "bsc",
    profit_type: "percent", profit_percent: "5", minimum_balance: "50",
    expires_at: "2026-10-13T12:00:00Z",
  },
  implemented: false, is_read: false, read_at: null, created_at: "2026-10-13T06:00:00Z",
};

function renderRow(notification: AppNotification) {
  const client = new QueryClient();
  const html = renderToStaticMarkup(createElement(QueryClientProvider, { client },
    createElement(MemoryRouter, null,
      createElement(I18nProvider, null, createElement(NotificationRow, { notification, language: "en" })))));
  client.clear();
  return html;
}

test("deposit notification uses a rounded two-decimal localized message", () => {
  const html = renderRow(deposit);
  assert.match(html, /1\.24/);
  assert.doesNotMatch(html, /1\.235000000000000000/);
});

test("signal notification hides profit terms and offers implement deep link", () => {
  const html = renderRow(signal);
  assert.match(html, /ABC-DEF-GH2/);
  assert.match(html, /Implement/);
  assert.match(html, /\/asset\/bsc\/BTCB\?code=ABC-DEF-GH2&amp;direction=buy/);
  assert.doesNotMatch(html, /\+\/−5%/);
  assert.doesNotMatch(html, /of your entry/);
});

test("implemented signal notification shows done state", () => {
  const html = renderRow({ ...signal, implemented: true });
  assert.match(html, /Implemented/);
  assert.doesNotMatch(html, /href="\/asset\/bsc\/BTCB/);
});
