# Core wallet web flows

## Routes and scope

- `/send`: existing backend BSC withdrawals, asset/network selection, address with paste, amount/Max, current fees, review and result. Linked from wallet home and each supported asset inspector.
- `/receive`: supported deposit asset selection, actual wallet address, local QR, copy and optional native sharing. Uses the existing BSC wallet address; internal tokens and networks without this receive/fee contract are excluded.
- Signals: existing asset detail dialog submits preview then implement; now validates generated-code alphabet and positive six-decimal entry, prevents duplicate in-flight submissions, resets preview after editing and checks expiry/available USDT. Backend remains authoritative for VIP/minimum/one-use/outcome/withdrawal-review rules.

## Money and request handling

Transfer arithmetic uses integer units at 18 decimal places. Withdrawals accept at most six fractional places, matching the backend serializer. Max floors to supported precision. Fee selection exactly follows backend `amount > threshold`; fee is deducted from the entered amount. Balance and fees are fetched again before review and confirmation. A changed fee requires a fresh confirmation. Review preserves meaningful tiny fee amounts rather than rounding them to zero.

A request with an unknown outcome (connection failure or server error after submission) shows an explicit check-history result and disables immediate retry. The existing withdrawal endpoint has no idempotency-key contract; this UI guard does not provide server-level idempotency across tabs/reloads. Client auth continues through centralized cookie/CSRF HTTP handling.

The backend now validates the destination address before the manual-review fund-lock branch. Transfers still obey all existing pause, freeze, spend guard, balance, token and admin approval rules. No live transfer was submitted during development.

## History and notifications

Web history defaults to `category=transfers`, with backend filtering to deposit/bnb_deposit/withdrawal **before pagination**. Bonus, sweep and other internal ledger rows are hidden in this view. Existing `all` API consumers are unchanged. Signals remain in their own tab. Display labels are Sent/Received, statuses are localized, and amounts use two decimal places without floating-point rounding.

Deposit notifications use structured amount/token fields to render localized two-decimal copy instead of the backend message containing 18 decimals. Signal notification presentation remains intact.

## QR dependency

The installed npm registry was unreachable, so a licensed copy of the already available QR encoder was bundled into `src/vendor/`. Attribution, version and source are documented there. It generates QR matrices locally; no receiving address is sent to an external QR service. The rendered four-module-quiet-zone matrix was decoded independently using ZXing and matched the exact test address.

## Validation and rollout

- `npm test`: 8 focused tests covering threshold boundaries, minimum/net fees, exact balances, precision limits, Max rounding, invalid destinations, localized numeric input, display rounding, and rendered deposit notification copy.
- `npm run build`: TypeScript and Vite production build passed.
- Backend `manage.py test transactions withdraw trading_signals --noinput`: 49 tests passed, including new pre-pagination filtering/user isolation and destination rejection before money is reserved.
- No database migration required. Deploy backend first (new `transfers` category and early address validation), then web. Android behavior is unchanged except benefiting from backend address validation.
- Interactive browser/device checks and live chain delivery are still pending. Existing backend RPC/hot-wallet/scanner configuration is needed for real deposits and sends.
