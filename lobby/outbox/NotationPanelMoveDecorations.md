# NotationPanelMoveDecorations — a per-move decoration seam on the notation rows

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/NotationPanelMoveDecorations.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-27 — kol-chess 0.8.0; remainder executed here 2026-08-27

## Why it went there

`NotationPanel` is consumed, not built (ARCHITECTURE §2). The review pane's
`MoveCell` in `src/engine/ReviewPanel.jsx` is the last local re-authoring of DS
chrome after the 2026-08-27 compliance pass, and it exists only because the
panel has no seam to hang a `Badge` on a move.

## Remainder here once it ships

bump kol-chess; replace `MoveCell` with `<NotationPanel decorate={…} />`, delete the local rows

## ✅ RETURNED — 2026-08-27 · kol-chess@0.8.0

`NotationPanel` takes `decorate(entry) => node`, rendered trailing inside each move cell after the SAN — a `Badge`, an eval delta, or nothing (`null` renders nothing). Selection, disabled state and `onSelectPly` stay the panel's; sidelines are untouched. Measured on the showcase demo: 12 move cells, 2 decorated, the badge sits 41px in behind the SAN, a click on a decorated move moves selection to it.

**Remainder here:** none — executed 2026-08-27: kol-chess 0.8.0 bumped, `src/engine/ReviewPanel.jsx` renders `<NotationPanel decorate={…} />`, local `MoveCell` and rows deleted, verified on `/analysis` Review (16 cells, 13 badged, zero console errors).

✅ **Remainder executed 2026-08-27 same day:** kol-chess 0.8.0 bumped (with component 0.108.0 · framework 0.28.0 · icons 0.22.0 · theme 0.72.0), build green. `src/engine/ReviewPanel.jsx` — `MoveCell` and the local rows deleted; the review list is `<NotationPanel notationPairs activePly onSelectPly decorate />` with the `Badge` returned from `decorate` for every non-`excellent` classification. Verified on `/analysis` Review at 1280: 16 move cells from the panel, 13 badged (the 3 `excellent` moves bare), zero console errors.
