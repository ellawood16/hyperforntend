import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "../src/i18n/I18nProvider";
import { NotificationRow } from "../src/features/notifications/components/NotificationRow";
import type { AppNotification } from "../src/api/notifications";

const deposit: AppNotification = {
  id: 1, type: "deposit", level: "success", title: "USDT received",
  message: "You received 1.235000000000000000 USDT.", amount: "1.235000000000000000", token: "USDT",
  network: "bsc", tx_hash: null, reference_id: null, metadata: {}, is_read: false, read_at: null,
  created_at: "2026-10-13T06:00:00Z",
};
test("deposit notification uses a rounded two-decimal localized message", () => {
  const client = new QueryClient();
  const html = renderToStaticMarkup(createElement(QueryClientProvider, { client },
    createElement(I18nProvider, null, createElement(NotificationRow, { notification: deposit, language: "en" }))));
  assert.match(html, /1\.24/);
  assert.doesNotMatch(html, /1\.235000000000000000/);
  client.clear();
});
