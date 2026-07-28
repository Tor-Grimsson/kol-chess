---
title: Theme
type: reference
status: active
updated: 2026-07-28
description: The theme law (explicit > system > light), the pre-paint data-theme stamp, the body-canvas rule, and the --chess-stage-reserve knob.
aliases:
  - theme
tags:
  - project/kol-chess
  - domain/design-system
  - domain/color
sources:
  - index.html
  - src/index.css
related:
  - "[[../01-architecture/INDEX|architecture]]"
---

# Theme

## The law

**Explicit > system > light** (kol-theme ≥ 0.11.6):

1. An **explicit choice** (the toggle) always wins.
2. No explicit choice → follow the **OS setting**.
3. No OS signal → **light**.

## How it's enforced

- **The veto stamp** (`index.html`, pre-paint): a boot script reads `localStorage['kol-theme']` and stamps `document.documentElement.dataset.theme` **only if** the stored value is `dark` or `light`. No stored choice → **no stamp**, so the theme CSS's `:root:not([data-theme])` system-follow rule runs. Stamping pre-paint means no FOUC and no inverted first click.
- **The toggle** sits top-right on the board and stats pages (not in any overlay) and persists to the same `localStorage` key (`THEME_STORAGE_KEY 'kol-theme'` in kol-framework's theme.js).

## The page canvas

The DS themes **components**, never the page. `src/index.css` owns the canvas:

```css
body {
  background-color: var(--kol-surface-primary);
  color: var(--kol-surface-on-primary);
}
```

Drop this and the page stays browser-white in dark mode.

## The stage reserve knob

`--chess-stage-reserve` — the height (chrome above + below the board) subtracted from the viewport when the square board caps its own width (`src/board/Stage.jsx`). Default `200px`; set it on any ancestor to re-budget the board when surrounding chrome changes.
