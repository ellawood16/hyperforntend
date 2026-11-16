# TradingView chart integration

`PriceChart` uses TradingView Lightweight Charts 5.0.9, loaded from the pinned
unpkg standalone production script. Chart loading requires browser access to
unpkg.com; failures show a retry action. The local environment had no Node/npm
and could not resolve that CDN, so browser verification remains required.

Backend BSC candles remain the data source. Larger timeframes are aggregated
from those 15-minute candles. Chart instances are disposed on unmount, update
with backend data, preserve the viewport during polling, and follow theme changes.

Lightweight Charts is Apache-2.0 licensed. Visible TradingView attribution and
the built-in logo/link are enabled. Upstream license and notice:
https://github.com/tradingview/lightweight-charts/blob/v5.0.9/LICENSE
https://github.com/tradingview/lightweight-charts/blob/v5.0.9/NOTICE

The full Advanced Charts drawing toolbar requires access to TradingView's
separately distributed library. It is not included in Lightweight Charts.
