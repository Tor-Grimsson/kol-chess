---
title: Design system brief 2.0 — engine-analysis seams
type: audit
status: active
updated: 2026-07-15
description: Brief for the kol-ds repo agent — what kol-chess built app-side (Stockfish analysis), which seams the chess package must grow to host it, and the post-0.2.0 defects to fix in the same pass.
aliases:
  - ds-audit-2
  - ds-brief-2.0
tags:
  - project/kol-chess
  - domain/design-system
sources:
  - "@kolkrabbi/kol-chess/src"
  - "@kolkrabbi/kol-theme"
  - src/pages/Analyse.jsx
  - src/engine
  - src/openings
related:
  - "[[DESIGN-SYSTEM-AUDIT|audit 1.0]]"
  - "[[DESIGN-SYSTEM-AUDIT-3.0|brief 3.0]]"
---

# Design system brief 2.0 — engine-analysis seams

**Audience: the kol-ds repo agent.** Sequel to [[DESIGN-SYSTEM-AUDIT|audit 1.0]] (whose layout fixes shipped in `@kolkrabbi/kol-chess@0.2.0` — confirmed landed). kol-chess has since built a full engine-analysis feature *app-side*, was forced to fork the layout to mount it, and the fork is being deleted. This brief is what the package must grow so the feature lives in the **existing** `ChessAnalysisLayout` view instead.

## 1. What the consumer built (stays consumer-side)

kol-chess now has, verified working:

| module | what it does |
|---|---|
| `src/engine/useEngine.js` | Stockfish 18 lite-single WASM in a Web Worker (no COOP/COEP), UCI over postMessage, streams `{fen, depth, lines}` at MultiPV 3 up to d18; stop→bestmove→next search on position change |
| `src/engine/uci.js` | pure UCI `info` parsing, white-perspective normalization, UCI→SAN, eval-swing move classification (≥50 inaccuracy / ≥100 mistake / ≥300 blunder cp) |
| `src/openings/` | 3,803 lichess named lines (CC0 TSV) → EPD-keyed index; deepest-name lookup + "left named theory at move N" flag (lichess explorer API is now 401-gated — no network dependency) |
| `EnginePanel` / `OpeningStrip` | eval bar, top-3 SAN lines, classification `Badge`, opening/ECO strip — **needs to render inside `ChessControlsProvider`** because it reads `snapshots` + `moveIndex` via `useChessControls()` |

Per kol-chess ARCHITECTURE §2, the engine stays app-side. The package only needs to give it somewhere to stand.

## 2. The seams to add — `ChessAnalysisLayout` (the actual ask)

The layout currently owns everything internally: it instantiates the provider inside `ChessBoardWithControls` and exposes only `chessData` + `overlayActions`. That forced the consumer fork. Add:

1. **`panel` prop** — a ReactNode rendered **inside the provider**, in the board column above the board (compact strip, `flex-shrink-0`; the 100dvh no-scroll ruling holds — budget the board's `max-w` for ~90px of strip). Contract: the node may call `useChessControls()`; nothing else.
2. **Controlled `externalGame` prop** — layout currently manages `loadedGame` purely from the archive table. Accept an optional consumer-driven `externalGame` (paste flow lives in the consumer) that merges with table-loads: latest wins.
3. **Fix: table-load must activate the game.** `ChessControlsContext.jsx` (~line 132): the selection effect keeps `prev` when it still exists in the list, so a table-loaded/external game is prepended to the dropdown but never becomes active. Select `externalGame.id` whenever `externalGame` changes.

With those three, the consumer deletes its `/analyse` fork: home view = board + engine strip + paste + archive, one view.

## 3. Defects to fix in the same pass (post-0.2.0 addendum)

| # | defect | fix |
|---|---|---|
| 1 | **Unlayered theme CSS defeats responsive utilities** — `kol-components-atoms.css` is unlayered, so `.kol-btn { display:inline-flex }` outranks layered Tailwind utilities; `lg:hidden` on the Board-settings button (`AlternativeControlsMock.jsx:284`) never applies → mobile-only gear shows on desktop | wrap theme component CSS in `@layer components` |
| 2 | **Dropdown list styled with package-internal Tailwind utilities** — consumers who don't `@source` kol-component's src get an unstyled panel list (`Dropdown.jsx:163`) | move panel-list styling to `kol-dd-*` classes, or document the required `@source` line in the package README |
| 3 | **kol-icons prebundle trap** — `iconData.js` builds maps with `import.meta.glob`; esbuild prebundling leaves them empty (all icons "not found" in dev). Consumers must `optimizeDeps.exclude` the package | document in README (or ship the exclude via a vite plugin hint); also migrate `arrow-downright` into kol-icon-set-v1 |
| 4 | ~~ThemeToggle missing~~ **wrong — it ships in `@kolkrabbi/kol-framework`** (the app-shell tier: sidenav, layout, theme toggle, footer). Audit 1.0's "no theme toggle in the DS" only looked at kol-component. | consumer adds `kol-framework` and mounts the toggle in `overlayActions` — no DS work needed |

## 4. Acceptance (preview in showcase)

- [ ] `chess-apparatus` showcase set renders `ChessAnalysisLayout` with a dummy `panel` reading `useChessControls()` — strip visible, no page scroll at 100dvh
- [ ] Loading a game from the archive table **switches the board** to it, not just the dropdown
- [ ] Controlled `externalGame` from outside activates the same way
- [ ] Board-settings gear hidden at `lg+`; dropdown list styled without consumer `@source`
- [ ] One changeset publish → kol-chess bumps once, mounts `panel` + paste + `ThemeToggle`, deletes `/analyse`

## The loop, unchanged from 1.0

Fix in `kol-ds` → preview in its `showcase` → one changeset publish → kol-chess bumps. No forks, no vendoring.
