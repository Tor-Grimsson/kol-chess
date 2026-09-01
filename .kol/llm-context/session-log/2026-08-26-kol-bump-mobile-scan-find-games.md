# Session: KOL bump ×3, mobile scan + fixes, Find-games recipes

**Date:** 2026-08-26
**Agent:** Grim (Claude Haiku 4.5)
**Summary:** All six KOL packages brought from a month behind to latest (three rounds in one day), two bump regressions fixed, first mobile/tablet scan run and its findings fixed here or ruled/fixed upstream, and a "Find games" recipe block added to the Learn tab.

## Changes Made

### Files Modified
- `package.json` — kol-chess 0.5.2→**0.7.1** · kol-component 0.12.2→**0.79.0** · kol-dashboards 0.2.0→**0.2.3** · kol-framework 0.5.4→**0.25.0** · kol-icons 0.7.1→**0.18.0** · kol-theme 0.11.7→**0.58.1**
- `vite.config.js` — `optimizeDeps.include: ['@kolkrabbi/kol-component > react-syntax-highlighter']` (kol-component ≥0.68 pulls a CJS chain; excluded parent + raw CJS = blank app in dev)
- `public/fonts/` — `Right-Grotesk/` → `right-grotesk/` (theme ≥0.51 asks lowercase; vite's static server is case-strict), `JetBrainsMono-Variable.woff2` + `-Italic-Variable` added from kol-ds-ui. `Right-Grotesk-Text/` + the four static JetBrains weights → `_tmp/2026-08-26-unused-fonts/` (unreferenced)
- `src/database/LearnTab.jsx` — `RECIPES` F1–F8 "Find games" block below the lessons (one question per card, one value to swap, every card returns `url`); shared `Card` render
- `src/App.jsx` + `src/board/Stage.jsx` — stacked (<lg) analysis no longer height-fenced: the `h-[calc(100dvh-232px)]` frame and the rail wrapper's `overflow-hidden` are `lg`-only; the page scrolls, notation sits in flow
- `src/board/Rail.jsx` — `GamePicker` gets `[&>div:first-child]:min-w-0 [&_.kol-dd-trigger]:overflow-hidden` so the star + settings gear stay on-screen at 390 (upstream note in a `ponytail:` comment)
- `docs/documentation/03-database/INDEX.md` — Learn bullet + HOW-TO reflect `RECIPES`
- `lobby/outbox/ChessBoardFluidCoordinates.md` — new: receipt for the ticket filed to kol-ds-ui (🟢 closed same day, remainder executed)
- `.gitignore` — `_tmp/`

### Features Added/Removed
- **Find games** recipes on `/database` → Learn (F1 opponent · F2 wins as black · F3 opening via `eco ILIKE` · F4 month · F5 date range · F6 rated blitz ≥1800 · F7 upsets · F8 stacked filters).
- Mobile: analysis page scrolls as a page below `lg`; picker row fits at 390; board coordinates scale with the square (kol-chess 0.7.1 via lobby ticket).

## Current State

### Working
- Four pages × 390 / 768 / 1024 / 1280: zero console errors, zero horizontal overflow, fonts + icons load. Build green on every bump.
- DS rulings applied, not patched: touch floor is **24px** (`MobileTouchFloor`, theme 0.51.0 — the 26/32/40 button scale clears it); `.kol-table-wrapper` scrolls by design (`TableMobileScroll`). Nothing consumer-side for either.
- Lobby loop proven end to end: `ChessBoardFluidCoordinates` filed → closed upstream as chess 0.7.1 + theme 0.58.1 → bumped + 390 re-shot here, receipt synced.

### Known Issues
- None open. Screenshots for the day in `_tmp/2026-08-26-mobile-scan/` (gitignored).

## Next Steps
1. Real-device pass (iOS Safari) for the analysis page — headless Chromium only so far; touch drag on the board untested.
2. Rail below `lg` is now natural height — if a long game's notation makes the page too tall on phones, cap the notation pane, not the page.
