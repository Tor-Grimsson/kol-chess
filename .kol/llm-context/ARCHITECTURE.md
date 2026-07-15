---
_template:
  version: 1
  path: .kol/llm-context/ARCHITECTURE.md
  sync: skip
---

# kol-chess — Architecture

Load-bearing decisions and constraints. Anything in this document is "we chose this deliberately and it has downstream consequences." Do not revisit without explicit reason. For decision history (alternatives considered, rejections, and evolution), see `../HISTORY.md`.

---

<!--
Structure each decision as:
  ## §N — [short rule / invariant]
  [One to three sentences explaining what the rule is and why it holds.]
  **Consequence:** [what this enables or forbids downstream]
  **Do not revisit** unless [specific condition that would flip it]

Keep sections short. If it's growing into a session-log-style narrative, it belongs in a session log, not here.

Example:
-->

## §1 — Built on the published KOL design system

kol-chess runs on Vite + React 19 + Tailwind CSS v4 (pnpm) and depends on the published KOL design system: `@kolkrabbi/kol-theme` (tokens + CSS), `@kolkrabbi/kol-component`, `@kolkrabbi/kol-icons`. Started DS-free, then adopted the DS to consume `@kolkrabbi/kol-chess` (§2), which hard-requires it.

**Consequence:** styling flows from KOL tokens/theme, not freestyle CSS. `index.css` must `@import "@kolkrabbi/kol-theme"`. Component chrome (buttons, dropdowns, tables) comes from `kol-component` — don't re-author what the DS provides.

**Do not revisit** unless the app drops the KOL chess package.

---

## §2 — Chess system is consumed, not built

The entire chess feature is the published npm package `@kolkrabbi/kol-chess` (v0.1.0, source in public `Tor-Grimsson/kol-ds`), rendered via `<ChessAnalysisLayout chessData={...} />`. We are a consumer — board, PGN playback, notation, variation tree, game archive, and the B2-CDN data adapter (`@kolkrabbi/kol-chess/data`) all live upstream.

**Consequence:** don't fork or vendor chess UI here — file board/playback/data changes against `Tor-Grimsson/kol-ds`. The package ships raw JSX + `import.meta.glob`, so it's Vite-locked and excluded from `optimizeDeps`; Tailwind must `@source` its `src`. No chess engine/evaluation ships — Stockfish-style analysis would be net-new, app-side.

**Do not revisit** unless we outgrow the upstream package and need bespoke board logic.

---

## §N — Non-goals (do not reopen)

Stated design limits. Opening discussion on any of these requires explicit user ask:

- [Non-goal 1]
- [Non-goal 2]
- [Non-goal 3]
