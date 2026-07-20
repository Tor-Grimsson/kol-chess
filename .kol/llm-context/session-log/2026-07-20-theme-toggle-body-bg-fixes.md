# Session: theme toggle — boot stamp, body background, toggle placement

**Date:** 2026-07-20
**Agent:** Grim (Claude Opus 4.8)
**Summary:** "Theme toggle not working" turned out to be three separate faults — no boot stamp, an unthemed page `<body>`, and a mismatched/overlapping toggle placement between the board and stats views. All fixed consumer-side; one real defect filed upstream.

## Changes Made

### Files Modified
- `index.html` — added a pre-paint theme boot script: reads `localStorage['kol-theme']` and stamps `document.documentElement.dataset.theme` (defaults `light`). Makes a saved choice apply on every route (the toggle only mounted inside the archive overlay, so its own re-stamp never ran on load) and makes the explicit attr win over kol-framework `getInitialTheme`'s stale `matchMedia` seed → no inverted first click, no FOUC.
- `src/index.css` — added a `body { background-color: var(--kol-surface-primary); color: var(--kol-surface-on-primary) }` rule. **This was the actual "bg still white" fix** — the DS themes components but never paints the page canvas, so `<body>` stayed browser-white in both themes. Now it flips with `data-theme`.
- `src/App.jsx` — moved `ThemeToggle` out of the Games-overlay `overlayActions` up to the board view's top-right, left of the Stats button (matches the stats-page header order). Overlay now shows only Paste · Close.
- `src/stats/StatsPage.jsx` — header top padding `py-3` → `pt-11 pb-8 md:pt-15 md:pb-12` to match the board toggle's `top-11/top-15` offset; toggle kept **in-flow** (`justify-between` + `mb-6`) so its height is reserved and there's a real gap below (a brief detour making it `absolute` overhung the first card — reverted).

### Features Added/Removed
- None — bug fixes + layout consistency only.

## Current State

### Working
- Toggle flips light/dark, persists across reload and across both routes, page canvas included. Toggle sits in the same top-right spot on board and stats.

### Known Issues
- **Upstream (kol-framework) — file against kol-ds:** `getInitialTheme` (theme.js) still falls back to `matchMedia` for React state even though kol-theme 0.11.1 deliberately dropped the OS-follow auto-dark block (light-first policy). State can read "dark" while the DOM/CSS render light. Neutralized here by the boot script (explicit attr wins), but the framework should default to `light` absent an explicit choice.

## Next Steps
1. **File the kol-framework `getInitialTheme` defect** against kol-ds (brief it — it's the last real theme bug, only masked here).
2. Nothing else open — the scoped triple remains shipped/verified.
