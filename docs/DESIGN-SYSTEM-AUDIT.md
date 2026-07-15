---
title: Design system usage audit
type: audit
status: active
updated: 2026-07-15
description: Point-in-time audit of kol-chess's KOL design-system usage — what's inconsistent, where it lives, and which repo owns the fix.
aliases:
  - ds-audit
tags:
  - project/kol-chess
  - domain/design-system
sources:
  - "@kolkrabbi/kol-chess/src"
  - "@kolkrabbi/kol-theme"
  - src/App.jsx
related:
  - "[[documentation/00-overview/INDEX|overview]]"
  - "[[DESIGN-SYSTEM-AUDIT-2.0|brief 2.0]]"
---

# Design system usage audit

Snapshot of how kol-chess consumes the KOL design system, taken **2026-07-15**. The headline: our own code is clean — nearly every defect lives **upstream** in the DS-authored packages `@kolkrabbi/kol-chess` and `@kolkrabbi/kol-theme`, so the fixes land in the `kol-ds` repo, not here.

## What we render

Our consumer code imports exactly one component:

```jsx
// src/App.jsx
import { ChessAnalysisLayout } from '@kolkrabbi/kol-chess'
import * as chessData from '@kolkrabbi/kol-chess/data'
```

`ChessAnalysisLayout` renders two children, which in turn build everything from `@kolkrabbi/kol-component` primitives (`Button`, `Dropdown`, `Input`, `Pill`, `Table`, `Tag`):

| Rendered | Is | Owns |
|---|---|---|
| `ChessAnalysisLayout` | DS component | the single-column page layout |
| ↳ `GameArchiveTable` | DS component | the whole top block — status card, the **"Browse Games"** header (`<h3>`, not its own component), filters, the table |
| ↳ `ChessBoardWithControls` | DS component | the board + right-side control panel |

## Findings

Every row below is a defect in the **DS packages**, evidenced by `file:line`. Our consumer code (`src/`) contains **0** raw `<button>/<input>/<select>/<a>` and no ad-hoc styling.

| # | Defect | What's wrong | Evidence |
|---|---|---|---|
| 1 | **Button usage inconsistent** | Every button is `size="sm"` — no hierarchy. Same load-month action is `variant="primary"` **and** `outline`. Icon chrome rendered loud `primary` (should be `ghost`/`quiet`). "clickable ply" is `primary` in one place, `outline` in another. Destructive "remove" is a `primary` with red hacked via `className` (no `danger` variant exists). Playback reimplemented in 4 files. Badge concept rendered 3 ways (`Pill` / `Tag` / raw `<span>`). | `GameArchiveTable.jsx:400,411`; `AlternativeControlsMock.jsx:163`; `VariationTree.jsx:40,51,97`; `PlaybackControls.jsx:37` |
| 2 | **No theme toggle** | The DS exports `ToggleSwitch/ViewToggle/…` but **none touch `data-theme`**. Light/dark works (`:root` = light, `[data-theme="dark"],.dark` = dark, + `prefers-color-scheme` fallback) — the control to flip it doesn't exist. | `kol-color.css:13`; `kol-base-tokens.css:51` |
| 3 | **Hyperlink has no color** | No `--kol-link*` token and no global `a {}` rule anywhere. The chess link's `.analysis-table__link { color: accent }` **loses** to `.kol-table a { color: fg-88 }` (higher specificity, same layer), and `--kol-accent-primary` is ink anyway. Links read as body text, underline only. | `chess.css:538`; `kol-components-organisms.css:207`; `kol-color.css:33` |
| 4 | **Table transparent borders overlap** | Every border is `--kol-fg-08` = **92% transparent**. The wrapper border sits on a separate layer from the `border-collapse` table over a gradient bg → stacked alphas composite into darker seams. Consumer chrome also mixes translucent `border-fg-08` vs opaque `border-oq-16` for the same thing. | `kol-components-organisms.css:46,75,79,194`; `kol-opacity.css:34` |
| 5 | **Size usage inconsistent** | `kol-mono-12` is overloaded across 3 roles (section heading / meta / eyebrow). Sibling panel titles at 16px vs 12px. The eyebrow-label role is split 12px vs 10px. Body copy is 14px above the table, 12px inside it. | `GameArchiveTable.jsx:356,377`; `AlternativeControlsMock.jsx:191,263` |
| 6 | **Page scrolls needlessly** | `ChessAnalysisLayout` is one tall single column — the archive is stacked above the board, and there's a `window.scrollTo({top:0})` hack fighting it. Fix = collapse the archive behind a DS `Accordion`; low blast radius, touches only `ChessAnalysisLayout`. | `ChessAnalysisLayout.jsx:13`; `GameArchiveTable.jsx:220` |
| 7 | **Inline elements** | The search field **is** a component (`<Input>`). But the Chess.com cell is a **raw `<a>`**, and there are ~4 hand-rolled `<div onClick>` dropdowns/disclosures that should be `Dropdown`/`Accordion`. | `GameArchiveTable.jsx:316`; `GameSelector.jsx:11`; `AlternativeControlsMock.jsx:259,352,409` |

### Bonus rot

- **Dead duplicate:** `GameSelector.jsx` is exported but never imported — its markup is inlined verbatim in `AlternativeControlsMock`.
- **Forbidden auto-casing** (violates the no-`text-transform` / no-`charAt().toUpperCase()` rule): `.kol-table-cell-title { text-transform: uppercase }` and JS-side `charAt(0).toUpperCase()`. `GameArchiveTable.jsx:96,110,201,278`; `kol-components-organisms.css:91`.

## Where the fixes go

**One repo: `kol-ds`.** All of the above is DS code — buttons, borders, link color, sizes, the layout/scroll, plus a new `ThemeToggle` component. You cannot fix them from kol-chess without vendoring the package.

The loop, no bouncing:

1. Fix everything in `kol-ds`, previewed live in its `showcase` app (`pnpm dev` renders this exact view via `showcase/src/sets/chess-apparatus.jsx`, HMR against local `packages/{chess,theme}`).
2. One changeset publish at the end.
3. kol-chess bumps the version once, and mounts `<ThemeToggle/>`.

The only genuinely consumer-side line is mounting the toggle; the page shell is already in `src/App.jsx`. See [[documentation/00-overview/INDEX|overview]] for the stack this sits on.

## Addendum — post-0.2.0 findings (2026-07-15, evening)

Found while exercising the bumped packages. #1–2 are **upstream (kol-ds)**; #3–4 were consumer-side and are already fixed here.

| # | defect | detail | where |
|---|---|---|---|
| 1 | **Unlayered theme CSS defeats responsive utilities** | `kol-components-atoms.css` ships unlayered, so `.kol-btn { display:inline-flex }` outranks every layered Tailwind utility — `lg:hidden` on the Board-settings button (correctly authored upstream) never applies, so the mobile-only gear shows on desktop. Any responsive hiding of a kol Button fails identically. Fix: wrap theme component CSS in `@layer components`. | `kol-components-atoms.css:211`; `AlternativeControlsMock.jsx:284` |
| 2 | **Table-load doesn't activate the loaded game** | `ChessControlsProvider`'s selection effect keeps `prev` if it's still in the list, so a game loaded from the archive table is prepended to the dropdown but never becomes the active board game. Fix: select `externalGame.id` when `externalGame` changes. | `ChessControlsContext.jsx:132-140` |
| 3 | ~~Dropdown panel unstyled~~ **fixed consumer-side** | kol-component styles its dropdown list with Tailwind utilities in its own src; consumer `@source` only covered kol-chess → classes never generated. Fixed: `@source ".../kol-component/src"` in `index.css`. | `src/index.css` |
| 4 | ~~Icons missing in dev~~ **fixed consumer-side** | kol-icons' `import.meta.glob` iconData dies under esbuild prebundle → `optimizeDeps.exclude` it (dev-only symptom; earlier "legacy names" diagnosis was wrong — only `arrow-downright` is genuinely legacy). | `vite.config.js` |
