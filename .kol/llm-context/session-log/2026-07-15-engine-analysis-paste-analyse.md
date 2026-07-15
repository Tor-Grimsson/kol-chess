# Session: Engine analysis + paste-and-analyse (plan P1–P3)

**Date:** 2026-07-15
**Agent:** Grim (Claude Fable 5)
**Summary:** Bumped all four KOL packages, then built the full engine-analysis arc from `llm-plan/02-engine-analysis.md`: `/analyse` route (PGN paste + own-game URL lookup), Stockfish WASM engine layer (eval bar, top-3 lines, move classification), and opening strip with novelty flag. P3 optional items assessed, all deferred.

## Changes Made

### Files Modified
- `package.json` / lockfile — KOL pkgs → kol-chess 0.2.0, kol-component 0.10.0, kol-icons 0.6.0, kol-theme 0.7.5; added `chess.js`, `stockfish`
- `pnpm-workspace.yaml` — release-age excludes (pnpm-written) + `allowBuilds: stockfish: false` (postinstall is just a symlink; we copy builds ourselves)
- `src/main.jsx` — `/analyse` route
- `src/pages/Analyse.jsx` — new; paste box → resolved game under own `ChessControlsProvider` (board + rail from package exports) + EnginePanel + OpeningStrip
- `src/lib/resolveGame.js` (+test) — URL parse → CDN-index lookup; PGN validate → externalGame
- `src/engine/uci.js`, `useEngine.js` (+test) — UCI parse/classify + worker lifecycle
- `src/openings/openingBook.js`, `openings.js`, `openings.tsv` (+test) — 3,803 lichess named lines (CC0), EPD index, book depth
- `public/engine/` — stockfish-18-lite-single js+wasm (re-copy on stockfish bump)

### Features Added/Removed
- `/analyse`: paste PGN or own chess.com URL → full analysis view
- Engine: single-threaded Stockfish 18 lite (no COOP/COEP), MultiPV 3, d18; eval bar; SAN lines; blunder/mistake/inaccuracy badges (eval-swing thresholds)
- Opening strip: ECO + name + "left named theory at move N"

## Current State

### Working
- Everything above browser-verified: URL game loads from CDN, scholar's-mate blunder badge fires, Scandinavian novelty flag correct. Tests 10/10, build ✓, 0 console errors.
- KOL 0.2.0 layout fixes confirmed landing (100dvh board-anchored stage, `overlayActions` slot).

### Known Issues
- **lichess explorer API now 401/auth-gated** — masters-DB novelty rescoped to bundled-book depth; token/proxy upgrade parked in plan Phase 3.
- ~~kol-icons warnings~~ fixed post-log: dev-only, consumer-side — icon maps are `import.meta.glob`-built, so kol-icons must be in `optimizeDeps.exclude` (it is now). Only `arrow-downright` genuinely remains legacy upstream.
- `pnpm outdated` hides same-day publishes (default `minimumReleaseAge`) — check the registry directly.

## Next Steps
1. User verifies the DS-audit defect list against 0.2.0 in the browser.
2. Consumer-side `<ThemeToggle/>` in the `overlayActions` slot once the DS ships one.
3. Statistics dashboard — parked in `llm-plan/02` "Later"; scope when this arc closes.
