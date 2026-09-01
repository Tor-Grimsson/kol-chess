# ChessBoardFluidCoordinates — fluid boards keep desktop-sized coordinate labels

**Filed:** 2026-08-26 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ChessBoardFluidCoordinates.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-26 — chess 0.7.1 + theme 0.58.1; remainder executed here 2026-08-26

## Why it went there

`ChessBoard` is consumed, not built (ARCHITECTURE §2) — Stage passes `size="fluid"`
and has no knob for the coordinate chrome; the label sizing is decided inside the
package. Source: the 2026-08-26 mobile scan (`_tmp/2026-08-26-mobile-scan/`).

## Remainder here once it ships

bump kol-chess; re-shoot `/analysis` at 390

## ✅ RETURNED — 2026-08-26 · kol-chess@0.7.1 · kol-theme@0.58.1

`ChessBoard size="fluid"` sizes its coordinates from the square: `.chess-board--fluid` is a container (`container-type: inline-size`) and the coordinate wrappers wear `.chess-coord--fluid` — the helper voice at `clamp(7px, 2.2cqw, 12px)` with `max(2px, 0.8cqw)` inset — instead of the desktop `p-2` + `kol-helper-12` the prop fell through to. Measured on the showcase board: 390 → 35px squares, 7px labels, 2.2px inset; 1200 → 56px squares, 9.9px, 3.6px. Fixed sizes untouched.

**Remainder here:** none — executed 2026-08-26: kol-chess 0.7.1 + kol-theme 0.58.1 bumped, `/analysis` re-shot at 390 with `.chess-coord--fluid` confirmed (45px square, 7.9px label).

✅ **Remainder executed 2026-08-26 same session:** kol-chess 0.7.1 + kol-theme 0.58.1 bumped, build green. Re-shot `/analysis` at 390 (`_tmp/2026-08-26-mobile-scan/390-analysis-fixed.png`): a1 square 45px, `.chess-coord--fluid` present, label 7.9px with 2.9px inset; at 1280 a 69px square gets 12px / 4.4px. `.chess-board--fluid` computes `container-type: inline-size`. Zero console errors.
