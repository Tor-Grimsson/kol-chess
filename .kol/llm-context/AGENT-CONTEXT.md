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
- 🏁 2026-07-28 — [MILESTONE: UI consistency sweep — uniform buttons, flush tabs, justify-between stage, app-composed rail, vault docs](session-log/2026-07-28-MILESTONE-ui-consistency-sweep.md)
- 2026-07-20 — [theme toggle: boot stamp + body surface bg + toggle placement](session-log/2026-07-20-theme-toggle-body-bg-fixes.md)
- 🏁 2026-07-16 — [MILESTONE: the scoped triple — game review · archive load-all · stats dashboard](session-log/2026-07-16-MILESTONE-review-loadall-stats.md)
- 2026-07-15 — [scope: archive load-all (brief 4.0) + game review + stats dashboard](session-log/2026-07-15-scope-archive-loadall-review-stats.md)
- 2026-07-15 — [0.4.1 bump, overlay header, engine icon fix](session-log/2026-07-15-0-4-1-header-icon-fixes.md)

> DS briefs live in `docs/DESIGN-SYSTEM-AUDIT*.md` (1.0 usage audit → 2.0 → 3.0 board-interactivity → **4.0 archive load-entire-set** — all resolved). Defects/asks are UPSTREAM in `@kolkrabbi/kol-chess` + `kol-theme` — fixes land in the **kol-ds** repo (previewed in its showcase), then republish + bump here. Do not fix them in this repo.

---

## Status at a glance

<!-- Short bullet summary of where the project is. Example:
- v0.1 — runtime-verified on X. Records Y files end-to-end.
- Packaging — not yet distributed.
- Smoke tests — items #1–#3 passed; #4–#10 pending.
-->

- **Four pages in one Shell** (2026-07-28 restructure + sweep): `/` landing (pipeline story, uniform button row) · `/analysis` board — app-composed Stage/Rail from kol-chess 0.5.2 elements, PageHeader tabs Controls·Engine·Review as direct intent (tab = activation, no inner buttons), interactive board, Games overlay, paste flow · `/database` Query(DuckDB-WASM)/Browse/Learn · `/stats` dashboard over the full 27,200-game set (`src/stats/aggregate.js`). One PageHeader anatomy everywhere; ThemeToggle top-right.
- **Engine analysis + review** — opt-in live engine (Stockfish 18 lite, d18, MultiPV 3, eval bar/lines/badges/opening strip) and one-click **Game Review** (sequential d14 pass, Lichess win%/accuracy math, brilliant→blunder tiers, per-side accuracy, navigable badged move list). Plan: `../llm-plan/02-engine-analysis.md` (fully executed).
- **Stack:** React 19 · Vite 8 · Tailwind CSS v4 · pnpm · **KOL DS** (`kol-theme@0.11.7` / `kol-component@0.12.2` / `kol-icons@0.7.1` / `kol-framework@0.5.4` / `kol-chess@0.5.2` / `kol-dashboards@0.2.0`) · `chess.js` · `stockfish` · `@duckdb/duckdb-wasm` · CodeMirror (sql).
- **Data:** B2-CDN adapter (`@kolkrabbi/kol-chess/data`) — 27,200 chess.com games, progressive month load.

---

## What works

- Full chess analysis UI renders — SVG board (themes/piece sets), PGN playback, notation, variation tree, filterable game-archive table with live chess.com data. Zero console errors.
- Data adapter loads real games on demand (verified: Nov 2020 month loaded, 4 games).

## What's pending

**Nothing open — 🏁 all scoped arcs closed (2026-07-28 UI-consistency capstone above).** The sweep (uniform buttons · flush tabs · justify-between stage · app-composed rail with direct-intent engine/review · vault docs) is shipped and browser-verified on published packages (chess 0.5.2 · component 0.12.2). Speculative-only items live in plan files: masters-novelty token (`../llm-plan/02-engine-analysis.md` Phase 3, needs the user's lichess token) · app shell (`../llm-plan/01-parking-lot.md` — partially superseded: Shell exists since the restructure).

## Active known issues

- **Theme is consumer-driven (2026-07-20).** The DS themes components but NOT the page canvas — `src/index.css` sets `body { background: var(--kol-surface-primary) }` (don't drop it or the page goes white in dark). `data-theme` is stamped pre-paint by a boot script in `index.html` (reads `localStorage['kol-theme']`); the toggle lives at the App/StatsPage top-right (not the overlay). **Upstream defect to file:** kol-framework `getInitialTheme` still seeds React state from `matchMedia` despite theme 0.11.1 dropping OS-follow — masked here by the boot script's explicit attr.
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
| `src/App.jsx` | board view: layout + `panel` + paste popover + ThemeToggle + Stats nav | paste UX, overlayActions |
| `src/board/` | `Stage.jsx` board-left/rail-right geometry · `Rail.jsx` composes the rail from kol-chess 0.5.2 elements (Mock retired), swap zone controls⟷engine⟷review | rail clamp + stage pr, pane wiring |
| `src/engine/AnalysisPanel.jsx` | `EngineTab` — eval bar / lines / badges / opening strip; tab = intent (no toggle) | classification thresholds, strip layout |
| `src/engine/` | `uci.js` pure parse/classify + review math · `useEngine.js` worker lifecycle · `reviewRunner.js` d14 pass · `ReviewPanel.jsx` review UI | depth/multipv constants, tier thresholds |
| `src/stats/` | `aggregate.js` pure metrics over gameMeta · `StatsPage.jsx` the `/stats` dashboard | metric defs, card composition, opening-family heuristic |
| `src/openings/` | bundled TSV + EPD index + book-depth logic | swap TSV on lichess update |
| `src/lib/resolveGame.js` | PGN/URL → externalGame (archive lookup) | chess.com URL shapes |
| `src/index.css` | Tailwind + theme import + `@source` chess/component/dashboards pkgs | keep `@source` lines or classes vanish |
| `vite.config.js` | `optimizeDeps.exclude` — ALL 5 kol packages | don't drop — source-only pkgs |
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
