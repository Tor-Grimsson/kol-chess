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

## Game review — ✅ SHIPPED (2026-07-16; scoped 2026-07-15)

Chess.com-style one-click **Game Review** over the loaded game: batch engine pass, classify every move, accuracy % per side, summary card. **All app-side, depends on nothing upstream** — `useEngine` (worker lifecycle) + `uci.js` (single-move parse/classify) + the opening index (book-depth flag) already provide the parts.

### The math — public standard (all three reference repos implement variants of the Lichess/chess.com model)

1. **Eval → Win%** (Lichess logistic, mover's POV):
   `winPct = 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)`
   `cp` = centipawns; clamp mate scores to ±~10000cp (→ 100% / 0%).
2. **Per-move accuracy** from the win% the move gave up (before vs after, mover's POV):
   `acc = 103.1668 * exp(-0.04354 * (winBefore - winAfter)) - 3.1669`, clamp [0,100].
3. **Game accuracy per side** = mean of two aggregates over that side's moves: a **volatility-weighted mean** (weights = stddev of win% over a sliding ~2–8-ply window) and the **harmonic mean** of per-move accuracies. Average the two (Lichess method; chess.com is close).
4. **Move classification** by centipawn loss (best-move eval − played-move eval) / win% drop:
   - **Best** — matched engine top move · **Excellent/Good** — small loss (tiered <~20 / <~50 cp)
   - **Inaccuracy** — win% drop ~5–10 (cp ~50–100) · **Mistake** — ~10–20 (cp ~100–200) · **Blunder** — >20 (cp >200–300)
   - **Book** — still in the opening (we already compute book depth)
   - **Brilliant / Great** — heuristics needing the MultiPV lines + a material delta: *brilliant* = a sound sacrifice (played move sheds material yet is best/near-best and keeps you winning-or-level); *great* = the only non-losing move (every alternative drops a tier). Exact tuning: crib from the references.

### App-side build (net-new)

| piece | what |
|---|---|
| `reviewRunner` | sequential pass over every ply of the loaded game, **fixed depth ~14** (lighter than live d18, for speed), one position at a time through the existing worker; collect best-move + played-move eval. Progress state (n/total). |
| `uci.js` (extend) | add win% + per-move accuracy funcs + brilliant/great heuristics alongside the existing single-move classifier |
| accuracy aggregator | per-side game accuracy from the two-aggregate blend above |
| summary UI | accuracy % per side · per-category counts (badges already exist in `AnalysisPanel`) · move list with badges, navigable |

### References (lift the math, not the UI — READMEs don't expose the algorithms; exact constants live in each repo's `src/`, crib at build time)

| repo | worth | lift |
|---|---|---|
| [Chesskit](https://github.com/GuillaumeSD/Chesskit) (Next/TS, Stockfish) | most mature, cleanest TS | exact classification thresholds + accuracy impl |
| [Wazir](https://github.com/shreyashchandra/Wazir) (extension, SF 17.1 lite, "win-probability accuracy") | confirms the win%-based model | accuracy formula sanity-check |
| [Brilliant-Chess](https://github.com/wdeloo/Brilliant-Chess) (Next/TS) | name says it | brilliant/great detection heuristic specifically |

### Constraints

Single worker, sequential — a ~40-move game at d14 is a few seconds; **show progress**. No upstream dependency.

## Later — statistics dashboard

**Scoped out to its own plan → [[03-statistics-dashboard]]** (built on the published `@kolkrabbi/kol-dashboards` package; depends on brief 4.0's load-entire-set path).

## Constraints

- ARCHITECTURE §2 holds: chess UI lives upstream, engine/eval is app-side net-new — this plan conforms
- Package is source-only/Vite-locked: keep `optimizeDeps.exclude` and the Tailwind `@source` line intact
