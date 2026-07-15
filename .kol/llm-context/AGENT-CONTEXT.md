---
_template:
  version: 1
  path: .kol/llm-context/AGENT-CONTEXT.md
  sync: skip
---

# kol-chess — Agent Context

Chess analysis and game database — a web app to analyse positions and browse a game database.

Current project state + operational reference. Updated at the end of each significant session.

For chronological detail see `session-log/`. For load-bearing decisions see `ARCHITECTURE.md`. For decision history / alternatives considered see `../HISTORY.md`. For speculative future work see `../llm-plan/`.

**Last updated:**
- 2026-07-15 — [0.4.1 bump, overlay header, engine icon fix](session-log/2026-07-15-0-4-1-header-icon-fixes.md)
- 2026-07-15 — [brief 3.0 resolved upstream, bump to chess 0.4.0](session-log/2026-07-15-brief-3-consumer-bump.md)
- 2026-07-15 — [engine toggle, icons round 2, brief 3.0](session-log/2026-07-15-engine-toggle-dead-features-brief-3.md)
- 🏁 2026-07-15 — [MILESTONE: engine analysis arc closed](session-log/2026-07-15-MILESTONE-engine-analysis.md)
- 2026-07-15 — [engine analysis + paste-and-analyse](session-log/2026-07-15-engine-analysis-paste-analyse.md)

> DS-usage audit lives at `docs/DESIGN-SYSTEM-AUDIT.md`. Its ~9 defects are UPSTREAM in `@kolkrabbi/kol-chess` + `kol-theme` — fixes land in the **kol-ds** repo (previewed in its showcase), then republish + bump here. Do not fix them in this repo.

---

## Status at a glance

<!-- Short bullet summary of where the project is. Example:
- v0.1 — runtime-verified on X. Records Y files end-to-end.
- Packaging — not yet distributed.
- Smoke tests — items #1–#3 passed; #4–#10 pending.
-->

- **One view** — home `<ChessAnalysisLayout>` (kol-chess 0.4.1) carries everything: **interactive board** (click-to-move, inline amber sidelines in notation, edit-mode placement with the full six-piece palette — brief 3.0 + follow-up, resolved upstream), playback, archive overlay, **engine panel via the `panel` slot**, paste flow (PGN or own chess.com URL) via `overlayActions` (toggle left · Paste+Close paired right), ThemeToggle. The `/analyse` fork is deleted.
- **Engine analysis** — opt-in ("Engine" button in the panel, default off; worker exists only while on): Stockfish 18 WASM (single-threaded lite, d18, MultiPV 3), eval bar, SAN lines, move-classification badges, opening strip (3,803 bundled named lines + book-depth flag). Plan: `../llm-plan/02-engine-analysis.md` (arc complete; Game Review + stats dashboard parked in its "Later").
- **Stack:** React 19 · Vite 8 · Tailwind CSS v4 · pnpm · **KOL DS** (`kol-theme@0.9.1` / `kol-component@0.11.0` / `kol-icons@0.7.0` / `kol-framework@0.5.0` / `kol-chess@0.4.1`) · `chess.js` · `stockfish`.
- **Data:** B2-CDN adapter (`@kolkrabbi/kol-chess/data`) — 27,200 chess.com games, progressive month load.

---

## What works

- Full chess analysis UI renders — SVG board (themes/piece sets), PGN playback, notation, variation tree, filterable game-archive table with live chess.com data. Zero console errors.
- Data adapter loads real games on demand (verified: Nov 2020 month loaded, 4 games).

## What's pending

Nothing open — the engine-analysis arc is 🏁 closed. Future work is parked: stats dashboard + masters-novelty token in `../llm-plan/02-engine-analysis.md`, app shell in `../llm-plan/01-parking-lot.md`.

## Active known issues

- **lichess explorer API is 401/auth-gated** (since ≤2026-07-15) — novelty flag uses bundled-book depth instead; token/proxy upgrade parked in `../llm-plan/02-engine-analysis.md` Phase 3.
- **pnpm's release-age gate vs same-day KOL publishes** — `pnpm-workspace.yaml` now excludes the whole `'@kolkrabbi/*'` scope from `minimumReleaseAge` (the per-version excludes pnpm auto-adds re-gate every new publish). Still verify against the registry directly (`npm view <pkg> version`), not `pnpm outdated`. *(Brief 3.0 board interactivity + the `atomic` icon miss are both RESOLVED — console is fully clean.)*
- **ALL KOL packages must stay in `optimizeDeps.exclude`** (chess/icons/component/framework — raw source; `import.meta.glob` dies under esbuild prebundle, and a prebundled *importer* of kol-icons can carry a broken copy after any dep-graph change). New KOL dep → add it to the exclude list in the same breath. kol-chess + kol-component src stay in `@source`. Icons vanish anyway → `rm -rf node_modules/.vite` + restart dev.

DS fonts now live in `public/fonts/` (`jetbrains-mono/`, `Right-Grotesk/`, `Right-Grotesk-Text/`) — every theme-referenced `@font-face` src resolves 200. Favicon is `public/favicon/favicon-kol-ds.svg`, wired in `index.html`.

---

## Key files and their roles

<!-- Table of the most important files. Example:
| file | role | hot edit points |
|---|---|---|
| `src/main.js` | entry point | `init()`, `render()` |
| ... |
-->

| file | role | hot edit points |
|---|---|---|
| `src/App.jsx` | the one view: layout + `panel` + paste popover + ThemeToggle | paste UX, overlayActions |
| `src/engine/AnalysisPanel.jsx` | eval bar / lines / badges / opening strip — renders in the `panel` slot | classification thresholds, strip layout |
| `src/engine/` | `uci.js` pure parse/classify · `useEngine.js` worker lifecycle | depth/multipv constants |
| `src/openings/` | bundled TSV + EPD index + book-depth logic | swap TSV on lichess update |
| `src/lib/resolveGame.js` | PGN/URL → externalGame (archive lookup) | chess.com URL shapes |
| `src/index.css` | Tailwind + theme import + `@source` chess & component pkgs | keep `@source` lines or classes vanish |
| `vite.config.js` | `optimizeDeps.exclude: [kol-chess, kol-icons]` | don't drop — source-only pkgs |
| `public/engine/` | stockfish-18-lite-single js+wasm | re-copy from `node_modules/stockfish/bin` on bump |

---

## Critical consistency seams

<!-- Document any "if you change X, you must also change Y" requirements. These are the places that silently break when split and usually trip up new agents. -->

### [Seam name]

[Description of the duplication or tight coupling, and the rule for keeping it in sync.]

---

## Roadmap (prioritized)

<!-- Numbered list, ordered by impact-per-effort. Example:
1. **Feature X.** Description. ~N lines.
2. ...
-->

---

## Known gotchas

<!-- Bucket for bugs, quirks, performance traps, or environment-specific weirdness that agents should know about. Structure each as a small heading + 2-3 sentence explanation + planned fix. -->

### [Gotcha name]

[Description + fix plan if any.]

---

## Debugging recipes

<!-- Short reference for "how do I debug X?" questions. Example:
**Logs:** `path/to/log` — look for pattern X.
**Reload loop:** after editing Y, do Z.
-->

---

## Contracts the next agent should not quietly break

<!-- Invariants that must not drift. Example:
- `DEFAULTS` in file A must match `DEFAULT_CONFIG` in file B.
- Message type X is referenced in files Y, Z — rename = grep all.
-->

---

## Open architecture explorations

<!-- Pointer to ../llm-plan/ if it carries real speculative work. Otherwise delete this section. -->
