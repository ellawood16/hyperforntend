<!-- UI tokens: the design-system values the agent must use for all styling. -->

# UI Tokens — hyperapp (Web App)

Ported 1:1 from `the optional Android client/context/ui-tokens.md`. The source of truth here is
**`src/styles/tokens.css`** — this doc explains how to use it, not a second copy of the
values (don't let the two drift; if you change one, check the other).

> Dark-first, like the Android app. Both themes are fully defined in `tokens.css`.

## How To Use

Prefer the semantic utility classes (generated in `tokens.css`'s `@layer utilities`) —
they express *intent*, matching the Android `App*` alias names:

```tsx
// Correct — semantic utility (intent)
<div className="bg-app-background text-app-primary" />

// Correct — Tailwind utility generated from a @theme token
<div className="rounded-card" />

// NEVER — hardcoded color/radius in a component
<div style={{ background: "#050505", borderRadius: "16px" }} />
```

Raw hex values live **only** in `tokens.css`'s `@theme` block.

## Semantic Classes

| Class                        | Android equivalent      | Use for                       |
| ----------------------------- | ------------------------ | ------------------------------ |
| `bg-app-background`          | `AppBackground`          | screen background              |
| `bg-app-surface`             | `AppSurface`              | cards, sheets, rows            |
| `bg-app-surface-soft`        | `AppSurfaceSoft`          | subtle raised surface          |
| `text-app-primary`           | `AppTextPrimary`          | primary text                   |
| `text-app-secondary`         | `AppTextSecondary`        | muted/secondary text           |
| `border-app` / `divide-app`  | `AppBorder`               | borders / dividers             |
| `bg-app-action` + `text-app-on-action` | `AppAction`/`AppOnAction` | **primary CTA** |
| `bg-app-accent` / `bg-app-accent-soft` | `AppAccent`/`AppAccentSoft` | small orange emphasis **only** |
| `text-app-success` / `text-app-danger` | `AppSuccess`/`AppDanger` | status states |
| `text-app-price-up` / `text-app-price-down` | `AppPriceUp`/`AppPriceDown` | price/percentage movement |

> **Action vs Accent:** same rule as Android — the primary CTA is `bg-app-action` (near-black
> in light, white in dark), *not* orange. `bg-app-accent` is for small emphasis only.

## Typography

7-role scale, matching Android's: `text-display` (38px, hero numbers), `text-headline`
(24px, screen titles), `text-title` (18px, section headers), `text-title-md` (16px,
emphasis body), `text-body-lg` (16px), `text-body` (14px, default), `text-label` (12px),
`text-caption` (10px). Never inline a `font-size`/`line-height` — use these classes.

## Spacing

**No custom spacing tokens.** Tailwind's default 4px-step scale already lines up 1:1 with
Android's `Spacing.*`: `p-1`=4px(xs), `p-2`=8px(sm), `p-3`=12px(md), `p-4`=16px(lg — default
screen edge padding), `p-5`=20px(xl), `p-6`=24px(xxl), `p-8`=32px(xxxl).

## Shapes

| Class            | Radius | Android equivalent  | Usage                           |
| ----------------- | ------ | -------------------- | -------------------------------- |
| `rounded-chip`    | 12px   | `AppShapes.chip`    | tags, inputs                     |
| `rounded-card`    | 16px   | `AppShapes.card`    | cards, list rows                 |
| `rounded-sheet`   | 24px   | `AppShapes.sheet`   | modals, large panels             |
| `rounded-full`    | 50%    | `AppShapes.pill`    | fully-rounded capsules (built into Tailwind, no custom token needed) |

## Invariants

- Never hardcode a color/radius/font-size in a component — use the classes above.
- The only brand accent is `--color-accent-orange` (`#F2570A`). Primary CTA is
  `bg-app-action` (neutral), not the accent.
- Keep market-direction colors (`price-up`/`price-down`) separate from status
  (`success`/`danger`), same as Android.
- If `the optional Android client/context/ui-tokens.md` changes, port the change to `tokens.css` in the
  same session — don't let the two design systems drift.
