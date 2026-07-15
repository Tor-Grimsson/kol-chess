# kol-chess — engine analysis + paste-and-analyse

Agreed 2026-07-15 · **P1 + P2 shipped and browser-verified same day** · P3 assessed — all items deferred (verdicts below) · **consumer switch complete same evening**: engine panel + paste + ThemeToggle live on the home `ChessAnalysisLayout` via the brief-2.0 seams (kol-chess 0.3.0), `/analyse` fork deleted. Live journal: `../llm-context/playbook/2026-07-15-engine-analysis.md`.

---

## Goal

Chess.com-style analysis: client-side engine eval + move classification + opening/novelty awareness, plus a paste-a-game entry point.

## Phase 1 — `/analyse` route

- Paste box accepting PGN (chess.com Share dialog copies it) or a chess.com URL of **own** games (parse game ID → lookup against the CDN index)
- Render via package exports: `createSnapshotsFromPgn` + `ChessControlsProvider` + `ChessBoardWithSidebar` / `NotationPanel` / `VariationTree`
- Chrome from kol-component: `Textarea`, `Input`, `Button`, `TabsRow`, `Badge`, `EmptyState`
- No infra, no upstream changes

## Phase 2 — engine + openings

- Stockfish WASM in a Web Worker (npm `stockfish` or `lila-stockfish-web`); **single-threaded first** — no COOP/COEP requirement; UCI over postMessage
- Eval bar + MultiPV top-3 lines + move classification (eval-swing thresholds → inaccuracy/mistake/blunder)
- Opening strip: bundle `lichess-org/chess-openings` TSV (CC0, ~3,800 lines) for name/ECO **and** book depth — "left named theory at move N". ~~explorer.lichess.ovh masters query~~ (API went 401/auth-gated, verified 2026-07-15; true masters-DB novelty now needs a lichess API token or proxy — moved to Phase 3)
- Bespoke widgets (eval bar, lines panel, opening strip) are chess apparatus: build app-side, lobby upstream into the kol-chess package once proven

## Phase 3 — optional (assessed 2026-07-15, all deferred)

- Tiny proxy (Cloudflare Worker) for arbitrary chess.com URLs — official API has no game-by-URL endpoint; the callback API is CORS-blocked. **Deferred:** out-of-repo infra (owner's account + deploy); PGN paste already covers arbitrary games at zero infra.
- Upstream eval-bar slot in `ChessAnalysisLayout` — file against kol-ds. **Deferred:** app-side panel proven today; promote via /kol-lobby when it should reach the archive browser too.
- Multithreaded engine → needs COOP/COEP headers in dev + hosting. **Deferred:** lite-single reaches d18 in ~2–3s/position — depth does not disappoint.
- True masters-DB novelty (lichess explorer via API token, or proxy). **Deferred:** needs the owner's lichess token — his call.

## Later — game review

Chess.com-style one-click **Game Review**: batch engine pass over every position (fixed depth ~14, sequential in the existing worker), classify all moves at once, accuracy % per side, summary card (best/blunder counts). All app-side — `useEngine`/`uci.js` already provide the parts; needs a review runner + summary UI + progress state. User asked for it 2026-07-15 ("where is game review???"). Depends on nothing upstream.

**Open-source references (user-supplied 2026-07-15, evaluate before building — lift the classification/accuracy math, not the UI):**
- https://github.com/GuillaumeSD/Chesskit
- https://github.com/shreyashchandra/Wazir
- https://github.com/wdeloo/Brilliant-Chess

## Later — statistics dashboard

Stats over the 27,200-game archive: win rates by opening / colour / time control, rating over time, opponent spread. Data is already CDN-side (full index + month files); DS ships `Table` and the chart-adjacent atoms. **Not scoped yet — scope when the engine arc closes.**

## Constraints

- ARCHITECTURE §2 holds: chess UI lives upstream, engine/eval is app-side net-new — this plan conforms
- Package is source-only/Vite-locked: keep `optimizeDeps.exclude` and the Tailwind `@source` line intact
