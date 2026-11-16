# Asset detail design review

Open any wallet asset → Compare asset detail layouts. Direct routes: `/asset/:network/:symbol/prototypes?layout=1`, `layout=2`, `layout=3`. Authenticated, real-data previews only. The user selected Chart focus. It now powers the normal web asset route and Android asset detail screen; the comparison route remains available as a design reference.

## Revised interaction patterns

1. **Open overview**: a continuous, constrained-width page. Market first, compact balance and actions next, then native expandable token-information and history sections. No extra navigation to read details.
2. **Wallet first**: the ownership balance is the hero and stays above the Market / History / Information tabs. Only the secondary content changes. Same structure on narrow screens.
3. **Chart focus**: the chart occupies the wider workspace. Balance, information and history are initially hidden inside a user-controlled inspector. A neutral signal action remains in a sticky footer above global navigation. Opening the inspector doesn't replace the chart. This is deliberately different from the continuous overview on phones as well as desktop.

The preview selector itself uses text and an underline, and can be collapsed. Sections have no card fill, enclosing border, or rounded box. Whitespace, proximity, and semantic typography provide grouping. Only actionable controls retain button treatment. Orange is used for small selected-state indicators and chart direction, not content surfaces or the primary CTA.

## Rules and research applied

Read `the optional Android client/context/ui-rules.md`: avoid over-boxing, theme tokens, 4/8 spacing, four type roles, neutral primary CTA, bilingual RTL, local loading/error states, shared components. Reused Button, ImplementSignal, PriceChart, Skeleton and ErrorState. Preview data fetching is separated into `useAssetDetail`; sections and tabs are reusable feature components.

Research reviewed for this revision:
- [NN/g: Visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/): establish importance before styling; use scale and whitespace/proximity; enclosing boundaries only if needed.
- [NN/g: Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): keep primary tasks visible, disclose secondary details on request. Critical chart status/reference information remains visible in every layout.
- [NN/g: Tabs, used right](https://www.nngroup.com/articles/tabs-used-right/): use tabs for related alternative views, with a clear relationship between selection and content.
- [W3C APG: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): tablist/tab/tabpanel associations, selected state, roving tab stops, arrow/Home/End focus, manual Enter/Space activation. Arrow directions follow the interface language. Mounted panels retain chart controls when hidden.
- [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): controls need adequate dimensions or spacing. Primary preview controls, tab targets and chart buttons use at least a 48px minimum height.
- [TradingView layout guide](https://www.tradingview.com/support/solutions/43000746975-tradingview-layouts-a-quick-guide/): separating chart workspace from secondary workflow and preserving settings informs the focus variant. These prototypes do not claim TradingView feature parity.

## Behavior and review boundaries

- Wallet and chart queries load independently, with local retry states. A chart refresh failure keeps cached data visible with delayed status rather than replacing it with a second error panel.
- Available and reserved funds are separated; numeric balances are two-decimal, LTR isolates in both locales.
- Token contract copying gives polite success/failure feedback. Native assets do not show a meaningless copy action. Token metadata stays on the same page.
- Send/receive/convert remain explicitly unavailable because the web money-movement flows are not implemented. The existing signal flow works and can change a real account balance.
- History explicitly links to the full wallet history. No asset-filtered history or fabricated recent activity is implied.
- Focus outlines are scoped to the previews. Native disclosures support keyboard operation and expanded state. Pointer-hover chart readings no longer continuously announce through a live region.
- Chart surfaces can be embedded without background/rounding; the normal chart keeps its existing presentation.

Validation: web entry bundled with the installed native esbuild executable; whitespace checks passed; EN/AR prototype-key parity reviewed. Node/npm are unavailable here, so a full TypeScript/Vite build has not run. Brave headless launch was attempted but failed with `setsockopt: Operation not permitted` in this sandbox; visual, responsive and screen-reader validation remain pending. Research and source review are not a substitute for user testing or proof of full accessibility compliance.

## Selected implementation

Production asset UI lives in `src/features/wallet/details/`: ChartFocus, shared sections, keyboard-accessible DetailTabs, and useAssetDetail. The prototype reuses the same ChartFocus component. No preview selector appears in the regular asset page. Asset routes use a wider responsive shell; other routes keep the existing width.

Fixed signal direction buttons: the old `bg-app-price-up` / `bg-app-price-down` background utilities did not exist. Buy now uses the defined green `bg-app-success`; Sell uses red `bg-app-danger`. Both stay colored, with a checkmark and focus/selection ring for the selected direction. The signal submit action stays neutral.
