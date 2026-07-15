---
title: Design system brief 3.0 — board interactivity
type: audit
status: active
updated: 2026-07-15
description: Brief for the kol-ds repo agent — the chess board cannot receive input and variations render nowhere; the package needs a board-input layer and a real variation surface.
aliases:
  - ds-brief-3.0
tags:
  - project/kol-chess
  - domain/design-system
sources:
  - "@kolkrabbi/kol-chess/src"
related:
  - "[[DESIGN-SYSTEM-AUDIT-2.0|brief 2.0]]"
  - "[[DESIGN-SYSTEM-AUDIT|audit 1.0]]"
---

# Design system brief 3.0 — board interactivity

**Audience: the kol-ds repo agent.** Brief 2.0's seams shipped and the consumer switch is done — this is the next tranche. User-reported, source-confirmed: the interactive half of the chess package is a half-build (the rail is literally named `AlternativeControlsMock`).

## The defects

| # | defect | detail | where |
|---|---|---|---|
| 1 | **Pieces cannot move — ever** | `ChessBoard` is a pure SVG renderer: zero pointer handlers, no interaction props. Edit mode's palette selects a piece with nowhere to put it; "can't move pieces" is by construction, not a broken handler. | `ChessBoard.jsx` (no `on*` at all); `AlternativeControlsMock.jsx:100,219` |
| 2 | **New variation goes nowhere visible** | `handleAddVariation` collects SAN via `window.prompt` (twice) and stores into context — but the only component that renders `userVariations`, `VariationTree`, is an **unused import**: mounted nowhere in the live view. `NotationPanel` shows mainline only. | `AlternativeControlsMock.jsx:10` (dead import), `80-88`; `VariationTree.jsx:31` |

## The ask

1. **Board-input layer** — click-to-move (tap piece, tap target) at minimum, drag optional; legal-move validation via `chess.js` (already a package dep); emits moves into the controls context so stepping/notation stay coherent.
2. **Variations surfaced** — user moves off the mainline create a sideline rendered **inline in the notation** (chess.com-style indented sidelines), or at minimum mount `VariationTree`. Board input from #1 is the natural entry; that kills the `window.prompt` flow outright.
3. **Edit mode earns its toggle** — with #1 in place, edit mode = free piece placement using the existing palette; without input it should not render at all.

## Acceptance (preview in showcase)

- [ ] Click-to-move plays a legal move from the current position; illegal targets no-op
- [ ] An off-mainline move creates a sideline visible in the notation and navigable
- [ ] Edit-mode palette placement lands pieces on the board
- [ ] `window.prompt` gone
- [ ] One changeset publish → kol-chess bumps once

## The loop, unchanged

Fix in `kol-ds` → preview in its `showcase` → one changeset publish → kol-chess bumps.

---

## Resolution (2026-07-15, kol-ds agent)

Shipped in **kol-chess 0.4.0 + kol-theme 0.9.0**; this repo bumped same night (plus the stale `kol-framework ^0.3.4` → `^0.5.0` pin).

| # | ask | how it landed |
|---|---|---|
| 1 | Board-input layer | `ChessBoard` gained `interactive` + `onMove` — click-to-move with legal-target marks (theme: `.chess-square--selected/--target/--target-capture`), legality via `chess.js`; `ChessBoardWithControls` wires it to the provider's new `playMove` |
| 2 | Variations surfaced | Off-mainline moves branch a **sideline** (flat, one level — `{ parentPly, moves[] }` in context); `NotationPanel` renders them inline as indented `(1.Na3 e5)` rows, navigable; stepping/playback/lastMove are cursor-aware; Copy PGN emits real inline `(...)` variations. `window.prompt` flow and its rail button deleted |
| 3 | Edit mode | Palette selection moved into context (`editPlacement`); board reports raw squares in edit mode → `placePiece` (place / clear); position collapses to a setup snapshot |

Acceptance verified live ×2 (kol-ds showcase + this app on the published versions): legal move plays · illegal no-ops · sideline visible + navigable both directions and through the branch point · palette placement lands and clears · `window.prompt` gone (grep clean).

**API note:** context keys `userVariations` / `addUserVariation` / `removeUserVariation` / `getPgnWithUserVariations` are replaced by `sidelines` / `activeSideline` / `playMove` / `goToSidelineMove` / `removeSideline` / `getPgnWithVariations`; `activeFen` + `selectPly` newly exposed. This app touches none of the removed keys (verified).

**Out of scope, spotted during the bump:** `AnalysisPanel.jsx:92` requests icon `"atomic"`, which no set carries — pre-existing app-side miss, renders blank; needs a v1 icon name or `registerIcons()`.
