# Session: Play & Insight — the bot, the masters, and a linked board prototype

**Date:** 2026-08-31
**Agent:** Grim (Claude Fable 5)
**Summary:** Three new pages (`/play`, `/insights`, `/bot`), a position-book pipeline over 27,150 of my games plus nine old masters, opening stats and SQL recipes — then a review pass that found the play page was an opponent rather than a game, and a rebuild that fixed it locally before anything was asked of the DS.

## Changes Made

### New — the book pipeline
- `scripts/build-style-book.mjs` — walks the 106 CDN PGN files (~71 MB, cached in `_tmp/`), replays each game, emits a position book keyed by `epdOf(fen)` → my move → `{n, s, y, b, o, t}`. **Player-agnostic** (`--pgn/--player/--out`), so the masters cost a flag, not a second implementation. Also emits `reply-book` (opponent replies) for the autopsy
- `scripts/build-master-books.mjs` — nine masters from pgnmentor (13,024 games): Fischer · Tal · Capablanca · Alekhine · Petrosian · Botvinnik · Keres · Larsen · Ólafsson. Statistics derived; PGN not redistributed
- `scripts/build-suggestions.mjs` — moves I played ≥12× that outscored my habit by ≥8 points
- `scripts/link-chess-package.mjs` — symlink `@kolkrabbi/kol-chess` to the DS source. `package.json` untouched, so clone/CI still install the published copy

### New — pages
- `src/play/` — `PlayPage` · `NewGameDialog` (DS `ShellDrawer`) · `styleBook.js` (+test) · `opponent.js` · `opponents.js` · `timeControls.js` (+test) · `BotPage.jsx`
- `src/insights/` — `InsightsPage` · `diagnose.js` · `autopsy.js` (+test) · `OpeningAutopsy` · `Suggestions` · `phaseSample.js` · `EngineSample`
- `src/stats/aggregate.js` — `computeNamedOpening` + `NAMED_OPENINGS` (+test); three pillar cards on `/stats`
- `src/database/LearnTab.jsx` — opening recipes O1–O6, all six verified against DuckDB in-browser
- `src/main.jsx` · `src/Shell.jsx` — `/play`, `/insights`, `/bot` routed and railed

### Modified
- `public/books/` — all artifacts moved here from `src/` and **fetched, not imported**: as modules they compiled to JS chunks (style-book was 4.0 MB of JavaScript parsed as code)
- `vite.config.js` — `resolve.dedupe` for react/react-dom + the three sibling KOL packages; required by the link
- `src/play/styleBook.js` — reads four marginals (year · my band · opponent band · time class); combining takes the smallest, an honest upper bound
- `~/dev/projects/kol-ds-ui/packages/chess/src/apparatus/ChessBoard.jsx` — **prototype only, in the linked tree**: pointer drag + `role`/`tabIndex`/`aria-label`/`aria-pressed`/Enter

## Current State

### Working
- **`/play`** — new game → options → Start on a DS drawer; clocks flank the board (opponent above, you below, as both sites do, which is what makes 768 work without a breakpoint); lichess/chess.com time-control ladder with derived classes; notation, resign, takeback, promotion picker; extras toggle **default off**, persisted
- **The model plays like its subject** — from the start: e4 13,391× vs d4 99×. As White it goes e4→f4 (King's Gambit); vs 1.d4 it plays f5. Era overlay is real: vs 1.e4 it answers e6 in 2017, e5 in 2025. Masters reproduce themselves — Fischer e4 78%, Capablanca/Petrosian d4, Larsen c4
- **`/insights`** — 12 metadata findings (39.1% of 12,937 losses end in mate; the clock is a strength at 2.7×), opening autopsy (KG move 3: Nf3 53.9% but **Bc4 59% over 404 games**), 47 grounded suggestions, and a sampled engine pass (opening 2.4% / middlegame 4.8% / **endgame 7.2%** loss)
- **`/bot`** — how it is made, in his words: JSON from a Node ESM script, no Python. Numbers read live from the artifacts
- 51/51 tests · build green · 8 routes × 390/768/1024/1280/1440/landscape, zero console errors, zero overflow

### Known Issues
- **Drag + keyboard a11y live in the kol-ds-ui working tree, NOT here.** They exist only while the symlink is active; `pnpm install` or `--unlink` reverts the board to click-only. Nothing is forked in this repo
- **Verified at logic level only:** the promotion picker (contract proven in node — 4 moves, correct SAN for Q/R/B/N — but no test game reached the 8th rank) and clock flagging (unit-tested, never watched hit zero in a browser)
- **Never played end-to-end:** 6 of the 9 masters (verified statistically by their opening moves only)
- **The book→engine cliff** — in book it is the player, one move later it is Stockfish. Named on `/bot`; untouched
- **Variants/960 impossible today** — chess.js 1.4.0 is latest and offers no 960 castling (measured against chessops on the same position) and no variant rules; the DS board also generates legality internally
- **19 MB of artifacts committed** in `public/books/` — deliberate (gitignoring breaks clone + CI); the B2 CDN beside the PGN is the natural home, unowned

## Next Steps
1. Rule on `ChessBoardInputAndVariantSeam` — the `dests` seam and chess.js → chessops. `.kol/llm-plan/03-chessops-migration.md` is scoped and waits on it
2. On ship: unlink, bump kol-chess, drop the local `touch-action` wrapper in `PlayPage.jsx`
3. Decide the artifacts' home (repo vs CDN) and whether the `Clock` graduates into the chess package
