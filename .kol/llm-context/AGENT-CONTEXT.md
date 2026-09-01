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
- 2026-09-01 — [The personality model: chessops migration, a policy net on 974,566 positions replacing the 3-move book (42.93% move-match), /play as a lobby, /bot dissecting the Python](session-log/2026-09-01-personality-model-play-lobby.md)
- 2026-08-31 — [Play & Insight: /play (9 master opponents, clocks, notation), /insights (autopsy + suggestions + engine sample), /bot; book pipeline; kol-chess package linked and the board prototyped](session-log/2026-08-31-play-insights-masters-linked-board.md)
- 2026-08-30 — [NavRail migration (kol-shell app tier, board 448→664px) + /settings page + KOL bump ×5 + lobby brought to the six-section standard](session-log/2026-08-30-navrail-migration-lobby-standard.md)
- 2026-08-30 — [KOL bump ×5 (chess 0.8.0 · component 0.108.0 · framework 0.28.0 · icons 0.22.0 · theme 0.72.0) + NotationPanel decorate seam consumed in ReviewPanel](session-log/2026-08-30-kol-bump-notation-decorate.md)
- 2026-08-27 — [DS-compliance pass: AppShell · .kol-page · SectionText · SectionCardItem · ContentText/CodeBlock · Table/Tag; NotationPanel seam filed](session-log/2026-08-27-ds-compliance-pass.md)

> DS briefs live in `docs/DESIGN-SYSTEM-AUDIT*.md` (1.0 usage audit → 2.0 → 3.0 board-interactivity → **4.0 archive load-entire-set** — all resolved). Defects/asks are UPSTREAM in `@kolkrabbi/kol-chess` + `kol-theme` — fixes land in the **kol-ds** repo (previewed in its showcase), then republish + bump here. Do not fix them in this repo.

---

## Status at a glance

<!-- Short bullet summary of where the project is. Example:
- v0.1 — runtime-verified on X. Records Y files end-to-end.
- Packaging — not yet distributed.
- Smoke tests — items #1–#3 passed; #4–#10 pending.
-->

- **Eight pages in kol-shell's `AppShell`** (2026-08-31 Play & Insight; NavRail migration 2026-08-30 underneath): flat 48px `NavRail` — Overview · Board · Play · Database · Statistics · Insights · The bot, Settings pinned below the rule. `/` landing · `/analysis` board · **`/play`** a LOBBY until a game exists (2026-09-01) — big New game, the eleven opponents as DS `ContentRow variant="roster"` rows, and **no board and no book fetched on arrival**; New game opens a `FullscreenOverlay` sheet with a grouped time-control preset grid, then the board mounts with clocks flanking it · `/database` Query/Browse/Learn (+ opening recipes O1–O6) · `/stats` (+ King's Gambit / Dutch / French pillar cards) · **`/insights`** diagnosis, opening autopsy, suggestions, sampled engine pass · **`/bot`** how the model is made · `/settings`. **Law:** a local build of anything the DS ships is a defect — search kol-component/kol-shell/kol-framework and the estate first.
- **THE BOT IS A TRAINED MODEL NOW (2026-09-01), not a book.** `train/` — seven Python files — turns whole games into **974,566 samples** and fine-tunes a 2.36M-param residual tower with the **rating as an input plane**, so one model covers 1100–1900. Shipped as ONNX, run through `onnxruntime-web` in `src/play/personality.js`: 1.2s first load, 5ms per move, legal-move masked. **42.93% move-match** on held-out whole games against a 2.44% baseline (17.6×), top-3 68.23%, after 4 CPU epochs. It reproduces his repertoire unprompted — e4 100%, then f4 76% — having never seen the book. Loss was still falling at epoch 4: it stopped on budget, not convergence. The old book survives ONLY for the opening (it answered ~3 moves — `MAX_PLY 30` and `MIN_SEEN 2` kept 5.9% of what it observed); everything after it was a generic engine at a fixed Elo and is now the model. Book moves also carry **think-time** derived from the `[%clk]` records the pipeline used to discard. Nine masters stay book+engine — no archive to train on.
- **Engine analysis + review** — opt-in live engine (Stockfish 18 lite, d18, MultiPV 3, eval bar/lines/badges/opening strip) and one-click **Game Review** (sequential d14 pass, Lichess win%/accuracy math, brilliant→blunder tiers, per-side accuracy, navigable badged move list). Plan: `../llm-plan/02-engine-analysis.md` (fully executed).
- **Stack:** React 19 · Vite 8 · Tailwind CSS v4 · pnpm · **KOL DS** (`kol-theme@0.115.0` / `kol-component@0.148.0` / `kol-icons@0.25.0` / `kol-framework@0.36.0` / `kol-shell@0.31.0` / `kol-chess@0.10.0` / `kol-dashboards@0.3.0`, all latest 2026-09-01) · **`chessops`** (the rules engine; `chess.js` is a devDependency kept only for the differential test) · `onnxruntime-web` · `stockfish` · `gsap` · `@duckdb/duckdb-wasm` · CodeMirror (sql). **Python lives in `train/`** — a 3.9 venv, torch 2.2.2 CPU-only (this iMac's Radeon is unreachable by PyTorch).
- **Data:** B2-CDN adapter (`@kolkrabbi/kol-chess/data`) — 27,200 chess.com games, progressive month load.

---

## What works

- Full chess analysis UI renders — SVG board (themes/piece sets), PGN playback, notation, variation tree, filterable game-archive table with live chess.com data. Zero console errors.
- Data adapter loads real games on demand (verified: Nov 2020 month loaded, 4 games).

## What's pending

**NOTHING OWED (2026-09-01).** All five receipts read `remainder: none` — the DS shipped `dests` (960 unblocked), `touch="drawer"`, `ContentRow variant="roster"` and a collection column floor, all consumed and verified the same night. Unowned decisions remain: the artifacts' home (19 MB in `public/books/` + a 9.4 MB model, repo vs B2 CDN) and whether the local `Clock` graduates into the chess package.

## Active known issues

- **The theme toggle lives on `/settings` (2026-08-30).** kol-shell's `NavRail` deliberately carries neither settings nor a toggle (dropped upstream in 0.16.0), so `SettingsPage.jsx` passes `ThemeToggle` into `SettingsScaffold`'s `themeToggle` node slot — reachable by the rail's bottom rung or `,`. `data-theme` is still stamped pre-paint by the boot script in `index.html` (reads `localStorage['kol-theme']`). **The canvas is the framework's, not ours** — `src/index.css` has no `body { background }` rule; kol-framework.css sets `html, body` (verified dark repaints to `rgb(18,18,21)`). Don't re-add a local body rule.
- **The chess package is NOT symlinked** (unlinked 2026-08-31; `kol-chess@0.10.0` is the published copy). `scripts/link-chess-package.mjs` still exists for board work — `--status` says which state you are in — and the bulletin's `kol-link <pkg>` now supersedes it. **`vite.config.js`'s `resolve.dedupe` stays load-bearing** for any future link: a symlinked package resolves its own imports from the DS monorepo, which gave a second React. `alias` is the wrong fix — it flattens the exports map and 500s subpath imports.
- **`onnxruntime-web` must NOT be given a `wasmPaths` override pointing at `public/`.** It loads its wasm by dynamic import; Vite marks that request `?import`, and a file served raw from `public/` cannot answer a module request — 500, and the model silently never loads. Left alone the assets resolve through the module graph (dev serves them, Rollup emits them).
- **A kol-theme bump needs `rm -rf node_modules/.vite` and a dev restart** or the browser keeps serving the previous CSS: a new class silently does not exist while its inline custom property already does. Cost an hour on 2026-09-01 and was nearly filed as a DS defect.
- **Clock flagging is now verified live** (watched 1+0 hit 0:00 — "Flagged — you lose on time", board locks) and all nine masters reply in book with zero console errors. **Still logic-only: the promotion picker** — its contract is locked in `src/play/promotion.test.js` (detection, all four pieces, capture-promotions, underpromotion) but no game has reached the 8th rank in a browser.
- **lichess explorer API is 401/auth-gated** (since ≤2026-07-15) — novelty flag uses bundled-book depth instead; token/proxy upgrade parked in `../llm-plan/02-engine-analysis.md` Phase 3.
- **pnpm's release-age gate vs same-day KOL publishes** — `pnpm-workspace.yaml` now excludes the whole `'@kolkrabbi/*'` scope from `minimumReleaseAge` (the per-version excludes pnpm auto-adds re-gate every new publish). `pnpm outdated "@kolkrabbi/*"` is trustworthy again — it agreed with `npm view` on all five (2026-08-30). *(Brief 3.0 board interactivity + the `atomic` icon miss are both RESOLVED — console is fully clean.)*
- **ALL KOL packages must stay in `optimizeDeps.exclude`** (chess/icons/component/framework/dashboards/**shell** — raw source; `import.meta.glob` dies under esbuild prebundle, and a prebundled *importer* of kol-icons can carry a broken copy after any dep-graph change). New KOL dep → add it to the exclude list in the same breath. kol-chess + kol-component src stay in `@source`. **CJS under an excluded package must be force-included** — `optimizeDeps.include: ['@kolkrabbi/kol-component > react-syntax-highlighter']` (2026-08-26; without it dev serves raw CJS `lowlight` and the app is blank). Icons vanish anyway → `rm -rf node_modules/.vite` + restart dev.

DS fonts live in `public/fonts/` — exactly what theme ≥0.51 references: `right-grotesk/` (lowercase — vite's static server is case-strict) and `jetbrains-mono/` holding only the two **Variable** woff2s. Unreferenced leftovers went to `_tmp/2026-08-26-unused-fonts/`. **Mobile law (2026-08-26):** DS questions (touch floor = 24px, table scroll) are ruled in kol-ds-ui's lobby ledger — check it before calling anything a defect; package defects go there as tickets (receipts in `lobby/outbox/`), never as consumer overrides. Favicon is `public/favicon/favicon-kol-ds.svg`, wired in `index.html`.

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
| `src/Shell.jsx` | kol-**shell** `AppShell` + `NavRail`: `NAV_ITEMS` · `BOTTOM_ITEMS` (Settings) · `LOGOMARK` · `settingsPath`/`settingsKey` · `navKeys`; `?embed=1` = bare Outlet. `touch` left at `shell` on purpose — `bare`/`overlay` discard the mobile layout | nav entries, rail props |
| `src/SettingsPage.jsx` | DS `SettingsScaffold` — Settings/About tabs, `ThemeToggle` in the `themeToggle` slot, `SettingsRow align="fill"` (default `end` strands text on a wide page) | shortcut list, links |
| `src/PageHeader.jsx` | `SectionText` h1 (+meta) and the `TabsRow` strip when tabs/action exist | strip anatomy |
| `src/App.jsx` | board page: PageHeader tabs + Games overlay + paste; sets `--chess-stage-reserve` | overlayActions |
| `src/board/` | `Stage.jsx` board-left/rail-right geometry at lg+, plain stacked scroll below · `Rail.jsx` composes the rail from kol-chess elements, swap zone controls⟷engine⟷review | rail clamp + stage pr, pane wiring, GamePicker min-w-0 |
| `src/engine/AnalysisPanel.jsx` | `EngineTab` — eval bar / lines / badges / opening strip; tab = intent (no toggle) | classification thresholds, strip layout |
| `src/engine/` | `uci.js` pure parse/classify + review math · `useEngine.js` worker lifecycle · `reviewRunner.js` d14 pass · `ReviewPanel.jsx` review UI (`NotationPanel decorate` rows) | depth/multipv constants, tier thresholds |
| `src/stats/` | `aggregate.js` pure metrics over gameMeta · `StatsPage.jsx` the `/stats` dashboard | metric defs, card composition, opening-family heuristic |
| `src/openings/` | bundled TSV + EPD index + book-depth logic | swap TSV on lichess update |
| `src/lib/resolveGame.js` | PGN/URL → externalGame (archive lookup) | chess.com URL shapes |
| `src/index.css` | Tailwind + kol-theme + **kol-framework.css** + `@source` chess/component/dashboards/framework/shell | keep `@source` lines or classes vanish; no body rule — framework owns the canvas |
| `src/database/LearnTab.jsx` | `LESSONS` (SQL curriculum) + `RECIPES` (Find games F1–F8) | copy is content, editable |
| `vite.config.js` | `optimizeDeps.exclude` — ALL 6 kol packages · nested `include` for CJS deps · **`resolve.dedupe`** for react + the sibling KOL packages (the link depends on it) | don't drop any of the three |
| `src/play/` | `PlayPage` game surface · `NewGameDialog` (ShellDrawer) · `styleBook.js` the book reader · `opponents.js` who you can face · `timeControls.js` the clock ladder · `BotPage` | opponent list, presets, weighting |
| `src/insights/` | `diagnose.js` metadata findings · `autopsy.js` line walker · `phaseSample.js` + `EngineSample` the sampled d14 pass | thresholds, sample sizes |
| `scripts/` | `build-style-book.mjs` (player-agnostic) · `build-master-books.mjs` · `build-suggestions.mjs` · `link-chess-package.mjs` | re-run after new games |
| `public/books/` | every book artifact, **fetched not imported** — 19 MB, one file per opponent | rebuild via scripts |
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
