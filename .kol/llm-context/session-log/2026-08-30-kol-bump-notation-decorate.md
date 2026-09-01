# Session: KOL bump ×5 + NotationPanel decorate seam consumed

**Date:** 2026-08-30 (work executed 2026-08-27)
**Agent:** Grim (Claude Fable 5)
**Summary:** All five stale KOL packages bumped to latest in one pass, and the `NotationPanelMoveDecorations` remainder executed — `ReviewPanel.jsx`'s local `MoveCell` replaced by the DS `NotationPanel`'s `decorate` seam. Browser-verified on the four routes at 1280 and `/analysis` at 390.

## Changes Made

### Files Modified
- `package.json` / `pnpm-lock.yaml` — kol-chess 0.7.1→0.8.0 · kol-component 0.79.0→0.108.0 · kol-framework 0.25.0→0.28.0 · kol-icons 0.18.0→0.22.0 · kol-theme 0.58.1→0.72.0 (kol-dashboards 0.2.3 was already latest)
- `src/engine/ReviewPanel.jsx` — `MoveCell` and the local move rows deleted; the review list is `<NotationPanel notationPairs activePly onSelectPly decorate />`, where `decorate(entry)` returns the classification `Badge` for every non-`excellent` move and `null` otherwise
- `lobby/outbox/NotationPanelMoveDecorations.md` — state line + ✅ block: remainder executed 2026-08-27

### Features Added/Removed
- Nothing user-facing. The review move list is now DS chrome (ghost `Button` cells on the panel's three-column grid, selection owned by the panel) instead of a local re-authoring — the last raw `<button>` in `src/` is gone.

## Current State

### Working
- Build green; oxlint clean in `src/` (one pre-existing fast-refresh warning in `EngineContext.jsx`).
- Playwright at 1280 over `/`, `/analysis` (Review pass: 16 cells from the panel, 13 badged, the 3 `excellent` moves bare), `/database` (Query run → kol `Table` with column profiles + history `Tag`; Learn: 8 lessons + 8 recipes), `/stats` (full 27,200 set, charts): zero console errors. `/analysis` at 390: no horizontal overflow, fluid board 350px, 15 `.chess-coord--fluid` labels.
- Theme 0.72 references 98 font URLs; every one exists in `public/fonts/`. Every kol-component / kol-framework / kol-chess / kol-dashboards symbol the app imports is still exported after the bump.
- `pnpm outdated "@kolkrabbi/*"` agreed with `npm view` on all five — the workspace-level release-age exclude holds.
- Screenshots: `_tmp/2026-08-27-kol-bump/` (analysis-review, stats, 390-analysis).

### Known Issues
- Pre-existing, unchanged: at 1280 with the 256px rail the swap-zone pane (material/notation ⟷ engine ⟷ review) clips at the playback frame — the rail-pinned-to-board-height geometry noted 2026-08-27. Collapsing the rail restores the width.

## Next Steps
1. Decide whether `/analysis` opens with the SideNav collapsed (`:root[data-sidenav="collapsed"]` is the framework contract) — a design call carried from 2026-08-27.
2. Nothing owed to the lobby: both outbox receipts are 🟢 with their remainders executed.
