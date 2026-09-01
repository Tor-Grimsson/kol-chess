# Playbook — Play & Insight

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** A `/play` page that plays like *me* (my own games as the book, sliced by year and 100-point rating bucket), a `/insights` page that names my strengths, weaknesses and where my openings break — King's Gambit and Dutch specifically — plus opening-query recipes on `/database` and KG/Dutch cards on `/stats`. Grand plan beyond this: shogi, and the chess-shogi hybrid.

**Standing rules (non-negotiable):**
- Reuse before building — `ChessBoard interactive/onMove`, `epdOf()`, `openingFamily()`, `computeOpenings()` all already exist. A local build of what the DS or this repo ships is a defect.
- 71 MB of PGN never enters the browser. Anything needing the whole corpus is a precompute that ships an artifact.
- No claim about my play without the number behind it in this file.
- DS defects go to kol-ds-ui's lobby, never a consumer override.

**Status legend:** `✓` done+verified · `~` in progress · `⤺` reverted · `▣` quarantined · `★` rescued

---

[22:48] · phase-0/scoping · —
  what → scoping run opened; goal is a phased roadmap, not code
  note → user asked for feasibility + roadmap only; nothing built this pass

[22:49] · phase-0/data · src/database/duck.js:20-50
  what → DuckDB `games` table is metadata only — 12 columns, no moves
  note → `eco` is NOT a 3-char code: it holds the full chess.com opening URL
  note → so "query by opening" is already possible; LearnTab F3 does it with ILIKE

[22:50] · phase-0/data · src/data/sample-games.js:130-150
  what → full move text EXISTS on the CDN at `pgn/by-month/<month>.json`, 106 files
  verify → probed 2020-11 ✓ (4 games, 9 KB), shape is `{gameId: pgnString}`
  note → PGN headers carry `[ECOUrl]` (opening NAME) and `[WhiteElo]`/`[BlackElo]`

[22:51] · phase-0/budget · —
  what → measured corpus size: 2,532–2,642 bytes/game across 3 sampled months
  note → 27,200 × ~2.6 KB ≈ **71 MB** raw PGN — decides everything
  note → verdict: no runtime book-building in the browser; precompute offline, ship an artifact

[22:52] · phase-0/premise-check · —
  what → user's "best version would be 1900" checked against the real histogram
  note → max player rating in the set is **1917**; the 1900 bucket holds **429 games**
  note → volume sits at 1700 (6,404) · 1600 (6,097) · 1500 (5,347) · 1400 (3,131) · 1800 (2,475)
  note → 1900 is buildable but leaves book almost immediately — flagged to user, his call

[22:53] · phase-0/openings · —
  what → the two named openings measured
  note → King's Gambit **3,908 games, 52.9% score, 3,766 as White** — the main White weapon
  note → Dutch **1,866 games, 49.0%, 0 as White** — the main Black weapon
  note → biggest family overall is French **5,910** (4,315 as Black), 49.0% — bigger than either named one
  note → 3,494 distinct opening URLs in the set

[22:54] · phase-0/weakness-signal · —
  what → terminations give a real weakness read with ZERO engine cost
  note → 12,938 losses: **loss-checkmate 5,064 (39%)** · loss-resignation 6,243 · loss-time 1,597
  note → against win-time 4,268 vs loss-time 1,597 — the clock is a strength, not the leak
  note → so Insights phase 1 ships free; the engine tier is a separate, later phase

[22:55] · phase-0/reuse · —
  what → inventory of what must NOT be rebuilt
  note → `ChessBoard interactive + onMove` — click-to-move w/ legal move gen, already wired in Stage.jsx
  note → `epdOf()` (openingBook.js) — FEN minus counters = transposition-safe key; the personal book's key fn
  note → `openingFamily()` + `computeOpenings()` (aggregate.js) — opening classification already done
  note → engine: `UCI_LimitStrength` ✓ `UCI_Elo` ✓ `Skill Level` ✓ all present in the bundled Stockfish 18 lite

[22:56] · phase-0/verdict · —
  what → roadmap drafted in 6 phases; P1 is same-session cheap, P2 is the real build
  note → shogi + hybrid deferred to P6 — needs a non-chess rules engine and board, no reuse from kol-chess
  note → nothing written to src/ this pass

[23:01] · phase-0/CORRECTION · user ruling
  what → shogi + the chess-shogi variant are OUT of this scope entirely
  note → they are a separate session; carried here as a one-line note only, never a phase
  ⤺ → my "Phase 6" was scope I invented; withdrawn

[23:01] · phase-0/CORRECTION · user ruling — openings transpose
  what → an opening is reached by MOVE ORDER, often not by direct choice: A transitions into B
  why → `eco` is chess.com's TERMINAL classification, so "French 5,910" silently includes
        games that arrived there by transposition and were never a French by intent
  note → consequence 1: the book must be keyed by POSITION, not by opening label —
         `epdOf()` already does exactly this, so the play model is unaffected ✓
  note → consequence 2: every opening STAT and the autopsy must distinguish
         "arrived here" from "chose this" — the move path is the truth, the label is a summary
  note → French is in scope as a first-class opening alongside KG + Dutch

[23:01] · phase-0/CORRECTION · user ruling — the model must use the whole set
  what → slicing to a 429-game 1900 bucket and calling it the model is wrong
  why → user: "wouldn't the base characteristic be the set as a whole with skill/strength
        increase?" — discarding 26,771 games to honour a rating label is a worse model
  ⤺ → my "1700 is the real peak-me, 1900 is a novelty" framing is withdrawn as the DESIGN;
       it stands only as a note about how much book depth a hard slice has
  note → NEW ARCHITECTURE, three separable layers:
         · STYLE  = the whole 27,200-game corpus — repertoire and move preference. Who I am.
         · PERIOD = year/bucket as an OVERLAY that re-weights the same book, not a hard filter
                    (falls back to full-corpus weight when a slice is thin — so 1900 still plays)
         · STRENGTH = a dial: `UCI_Elo` out of book, and how sharply the book prefers
                      my better-scoring moves over all my moves
  note → user: "we have to take some liberties for an interesting model, at least as an option"
         → both modes ship: full-corpus (default, deep) and period-authentic (thin, honest)

[23:01] · phase-0/scope-locked · —
  what → scope frozen for /kol-goal; everything the user asked for, nothing invented
  note → /play · /insights (+ opening autopsy + suggestions) · /database recipes · /stats cards
  note → shogi + variant: noted, not scoped, not built

[23:33] · P1/stats · src/stats/aggregate.js + StatsPage.jsx
  what → `computeNamedOpening` + three pillar cards (KG · Dutch · French)
  note → splits games I PLAYED from games played AT me; they are different questions
  note → subtitle carries the transposition caveat on every card, not in a doc nobody opens
  verify → 7/7 unit tests ✓ · rendered at 1280 ✓
  ★ → KG 3,766g 53.1% RISES with rating (44%@1100 → 58%@1900); Dutch 1,866g FALLS (51%@1200 → 41%@1900)

[23:33] · P1/database · src/database/LearnTab.jsx
  what → O1–O6 opening recipes; eco is a URL so the lesson is "get a name out of it"
  verify → all six executed against DuckDB in-browser ✓ (25/45/29/8/20/9 rows, zero SQL errors)
  note → O5 "openings that beat me" returns French Exchange 372 losses — matches the autopsy independently

[23:33] · P2/precompute · scripts/build-style-book.mjs
  what → 106 CDN PGN files → position book keyed by epdOf(fen)
  note → 27,150 games · 258,596 positions → 15,283 after prune · 2.70 MB (0.36 MB gzip)
  ⤺ → manual replay from the standard start CRASHED on `[SetUp "1"]` games (2024-01);
       reading each verbose move's own `before` FEN is correct for every game, no special case
  ★ → the book IS a style signature: e4 13,391× vs d4 99× from the start position

[23:33] · P2/play · src/play/{styleBook.js,opponent.js,PlayPage.jsx}
  what → three layers land: STYLE (whole corpus) · PERIOD (re-weight, blended) · STRENGTH (UCI_Elo + sharpness)
  why → user ruling: the model must not discard 26,771 games to honour a 429-game label
  verify → 12/12 unit tests ✓ incl. the liberty case (empty slice degrades to style, never goes silent)
  verify → played e4 in-browser → bot answered d5, "played 868× from this position, 47%" ✓
  ★ → era overlay is real: vs 1.e4 it answers e6 in 2017 and e5 in 2025

[23:33] · P3/insights · src/insights/diagnose.js + InsightsPage.jsx
  what → 12 findings, zero engine cost; weaknesses ordered first
  note → every finding compares him to HIMSELF — no invented benchmark anywhere in the file
  ★ → 39.1% of 12,937 losses end in mate · clock is a STRENGTH (win-on-time 2.7× loss-on-time)

[23:33] · P5/autopsy · src/insights/autopsy.js + reply-book.json
  what → walks a line alternating my book and a new opponent-reply book
  why → the play book alone stops at my first move; a line needs their half to be walkable
  verify → 6/6 unit tests ✓
  ★ → KG move 3: Nf3 1,186g 53.9% but Bc4 scored 59% over 404g · Dutch 3...e6 48.3% vs b6 65% (20g)

[23:33] · P5/suggestions · scripts/build-suggestions.mjs
  ⤺ → FIRST DESIGN SCRAPPED. Ranked named openings one move off the repertoire by
       opportunity × novelty; top hits were Ware Opening, Sodium Attack, Lemming Defense.
       The metric worked; the PREMISE was wrong — "has a name in the TSV" says nothing
       about quality, so unplayed-but-named surfaces moves nobody plays because they lose
  note → grounding a suggestion in an opening's FAME is not grounding it at all
  ★ → rebuilt on his own results: a move played ≥12× that outscored his habit by ≥8 pts.
       47 hits. Bc4 65.9% vs Nf3 49.3% · h4 67% vs Bc4 52% · b6 65% vs e6 48.3%

[23:33] · P4/engine · src/insights/{phaseSample.js,EngineSample.jsx}
  what → benchmarked FIRST as the task required: d14 = 376 ms/position on this machine
  note → so the full 27,200-game archive is ~7 DAYS — a sweep was never an option, now measured not assumed
  note → samples POSITIONS not games (wider coverage per second); 2 searches per move, before+after
  verify → 150-position run completed in-browser ✓
  ★ → opening 2.4% loss · middlegame 4.8% · endgame 7.2% — he leaks 3× more in the endgame,
       which is the same finger the 39% mate-rate points at

[23:33] · P6/mobile · src/insights/*.jsx
  what → /insights overflowed at 390 (doc 407) — my own fixed 5-col autopsy grid, not the DS
  note → checked the DS ledger BEFORE calling it a defect: TableMobileScroll (2026-08-26) ruled
         `.kol-table-wrapper` scrolls by design, cut columns ARE the affordance, no fade
  after → same treatment applied to my three grids; doc back to exactly 390, containers scroll ✓

[23:33] · P6/lobby · lobby/outbox/DashCardBadgePropIsDead.md
  what → filed to kol-ds-ui: four dash cards destructure `badge` and none forward it to CardHeader
  note → renders as nothing, React cannot warn, cost is the silence; /insights uses `icon` instead
  note → remainder here: none

──────────── MILESTONE: Play & Insight — all 10 goal items ──────────── [23:33]
  new pages: /play · /insights · (settings + nav rewired)
  new scripts: build-style-book.mjs · build-suggestions.mjs
  artifacts: style-book 2.70 MB · reply-book 1.62 MB · suggestions
  tests: 41/41 ✓ · build ✓ · lint 1 (pre-existing) · 7 routes × 1280/390, zero console errors
  filed out: DashCardBadgePropIsDead → kol-ds-ui (🔵)
  NOT in scope, as ruled: shogi and the chess-shogi variant — noted, not built

════════ PHASE 2 — /play as a real game surface ════════

[23:51] · P7/scoping · user ruling
  what → /play is an opponent, not yet a game page; add what's missing
  ask → time controls · variants · other bots (old masters) · extras toggle (default OFF) · mobile · a page about the bot
  note → masters named: Fischer, Friðrik (Ólafsson), Larsen, Tal, Botvinnik, Petrosian, Keres, Alekhine, Capablanca

[23:51] · P7/feasibility · measured, not assumed
  ✓ → master PGN IS obtainable: pgnmentor.com per-player archives, all 9 return 200
       (Fischer 167 KB · Tal 440 KB · Capablanca 114 KB · Alekhine 333 KB · Petrosian 337 KB
        Botvinnik 186 KB · Keres 303 KB · Larsen 542 KB · Olafsson 176 KB — zipped)
  note → so master bots reuse the EXISTING pipeline unchanged: same epdOf key, same book shape.
         We derive statistics from game scores; we do not redistribute the PGN
  ✓ → engine: `UCI_Chess960` present in our Stockfish 18 lite · `UCI_Variant` absent (that is Fairy-Stockfish)
  ✗ → VARIANTS ARE BLOCKED ON THE RULES LAYER, measured: chess.js 1.4.0 loads a shuffled
       back rank and generates moves, but offers NO castling in a 960 position even with the
       path cleared. So Chess960 is not honestly deliverable, and Atomic/Horde/KotH/Antichess/
       Crazyhouse are further out — chess.js has no variant support at all
  note → `fairy-stockfish` is not on npm. A variant tier means a NEW rules dependency,
         which is an architecture call and the user's to make — flagged, not silently added

[23:51] · P7/scope-locked · —
  in  → notation · resign · takeback · promotion picker · game-over · CLOCK with lichess/chess.com
        presets · master bots · extras toggle (default off) · mobile pass · /about-the-bot page
  out → variants, pending his ruling on a variant rules engine
  note → dataset answer for the about page: JSON artifact, built by a Node ESM script
         (scripts/build-style-book.mjs), read by browser JS. No Python anywhere in it

[00:08] · P7/masters · scripts/build-master-books.mjs + build-style-book.mjs
  what → builder made PLAYER-AGNOSTIC (--pgn/--player/--out); masters cost a flag, not a second implementation
  note → 9 books, 13,024 games: fischer 827 · tal 2431 · capablanca 597 · alekhine 1654
         petrosian 1893 · botvinnik 891 · keres 1571 · larsen 2268 · olafsson 892
  ★ → they reproduce their own repertoires unprompted: Fischer e4 396x(78%), Capablanca/Petrosian d4,
       Larsen c4 first, and Fischer/Tal/Petrosian all answer 1.e4 with c5
  note → source pgnmentor; we derive statistics and do NOT redistribute the PGN (stays in _tmp/)
  note → empty marginals dropped from the artifact — historical PGN has no Elo, cut Fischer 0.88 → 0.74 MB

[00:08] · P7/conditioning · T9
  what → builder now records opponent-rating band (`o`) and time class (`t`) per move
  why → a move's score was averaged over whoever was across the board
  note → `timeClass` derives from the TimeControl header the way lichess does, off base seconds
  ⚠ → RECORDED, NOT YET USED at move time — the reader still ignores `o`/`t`. Named on /bot as half-done

[00:08] · P7/game-surface · src/play/PlayPage.jsx + timeControls.js
  what → notation (kol-chess NotationPanel) · resign · takeback (drops the PAIR) · promotion picker · clocks
  note → time controls are the lichess/chess.com ladder, and the CLASS is derived (base + 40×inc), not asserted
  note → engine think-time now scales with the control instead of a flat 500ms
  ⤺ → REAL BUG CAUGHT IN THE BROWSER: move list rendered "1. c5 —", my own move missing.
       Cause: the page rebuilt state as `new Chess(fen)` every turn, and a FEN carries a POSITION,
       not a history — so every rebuild silently discarded the game. Fixed by making the SAN list
       the state and deriving the board from it; takeback became a slice
  verify → after fix: "1. e4 c5" ✓ · clocks 3:02/2:56 with the +2 increment credited to each mover ✓
           resign freezes the board ✓ · takeback drops both plies ✓ · 47/47 tests ✓

[00:08] · P7/extras · user ruling — default OFF
  what → one ToggleSwitch splits gameplay from info; persisted in localStorage
  note → visible by default: board, clocks, status, opponent, time control, move list, resign/takeback
  note → behind the switch: book candidates, last-reply provenance, era/band/sharpness
  note → opponent + time control deliberately NOT extras — every chess site asks those before a game

[00:08] · P7/mobile · 390
  what → /play with extras ON and /bot both overflowed; both were MY fixed grids, not the DS
  after → doc back to exactly 390 on all 8 routes, zero console errors, board 302px
  ★ → NEARLY FILED A FALSE DEFECT: measured a 12px ToggleSwitch and started to call it a
       touch-floor breach. Checked kol-ds-ui's ledger first (the standing rule) — `MobileTouchFloor`
       ruled 2026-08-26 and theme 0.51.0 ships `.toggle-switch--bare::before { height: 24px }`,
       an invisible hit extent, with the law "the floor never moves the drawn size". 12px drawn
       is the RULED design; getBoundingClientRect measures the layout box, not the pseudo. No defect

[00:08] · P7/bot-page · src/play/BotPage.jsx → /bot
  what → answers his questions directly: format (JSON from a Node ESM script, no Python anywhere),
         how it is built, the three layers, hard limits, improvement path, where AI helps
  note → "can AI help" says YES to a policy net (the Maia shape) and to engine-scored candidates,
         and NO to prompting an LLM into a personality — the honest split
  note → numbers on the page are read live from the artifacts, so they cannot drift from the build

[00:08] · P7/variants · BLOCKED, reported not silently solved
  ✗ → chess.js 1.4.0 offers no castling in a 960 position even with the path cleared, and no
       variant rules at all; `fairy-stockfish` is not on npm. Our Stockfish has UCI_Chess960 but
       that only helps once the RULES layer can represent it
  note → a variant tier = a new rules dependency = an architecture call, his to make. Not added

──────────── MILESTONE: /play as a game surface ──────────── [00:08]
  new: /bot page · 9 master opponents · clocks · notation · resign · takeback · promotion · extras toggle
  scripts: build-master-books.mjs · build-style-book.mjs now player-agnostic
  artifacts: 16.0 MB raw in src/, 0.08–0.36 MB gzipped each, loaded one at a time
  tests 47/47 ✓ · build ✓ · lint 1 (pre-existing) · 8 routes × 1280/390, zero console errors
  open: variants (needs a rules engine — his call) · o/t marginals recorded but not yet read

════════ PHASE 3 — fix locally first, then link ════════

[00:32] · P8/user-rulings · three corrections to my plan
  ⤺ → "is it premature to ticket ds? maybe lets solve things locally before making requests"
       — I was about to file a `dests` seam having never tried to build it. A ticket from a
       working prototype names the prop, the diff and what was proved; mine was a guess.
       This does NOT breach the no-consumer-override law: that bans SHIPPING a permanent
       local fork of DS chrome, not prototyping to find where the seam belongs
  ? → "might we make [this repo] the owner of the package? seems unnecessary round trip"
       — measured: kol-chess is the ONLY external consumer. 23 files / 416 KB, one real dep
       (chess.js), peer-deps on component/theme/icons for its chrome. The round trip is real
  → ruling taken: kill the PAIN (workspace link) before changing OWNERSHIP; decide on evidence
  ⚠ → moving the package would rewrite ARCHITECTURE §2 ("consumed, not built"). Flagged as a
       deliberate edit if it happens, never a drift

[00:32] · P8/audit · answering "did you follow lichess UI / DS / responsive / touch"
  ✗ → NO modal, popup or dialog anywhere in /play. Controls are inline; "New game" fires
       immediately. DS ships ModalProvider/useModal/ShellDrawer/FullscreenOverlay — used none
  ✗ → DEFECT FOUND BY HIS QUESTION: changing the time control RESETS A LIVE GAME
       (`onChange={(id) => newGame(myColour, id)}`) — the exact thing an options→start step prevents
  ~ → components: DS for atoms (ChessBoard, NotationPanel, Button, Dropdown, Badge, ToggleSwitch,
       SectionText, ContentText, CodeBlock); hand-rolled the Clock, promotion row, extras panel,
       candidate list, autopsy rows, suggestions table (~10 raw layout divs in PlayPage)
  ✗ → responsive: only `lg:` used for the whole layout, `sm:` twice. Verified at 1280 and 390 ONLY.
       768 (iPad portrait) never looked at — layout is fully stacked there
  ~ → touch: DS board is `<div onClick>` so a TAP works, but there is NO drag-and-drop, no
       role/tabIndex (so no keyboard either), no touch-action. Tested with synthetic mouse only.
       "Optimised for mobile" was too strong — it is "works at 390"

[00:32] · P8/variants · package answer, proven not assumed
  ✓ → `chessops` 0.15.1 (lichess's own) is the one package: Chess960 + all seven variants
       (crazyhouse/atomic/antichess/kingofthehill/3check/racingkings/horde), ships chessops/pgn too
  ✓ → PROOF on `4k3/8/8/8/8/8/8/RK6 w A -`: chessops offers king b1→a1 (castle onto rook);
       chess.js on the same position offers no castling at all. chess.js 1.4.0 IS latest — not a bump
  ⚠ → a package alone is NOT enough: @kolkrabbi/kol-chess uses chess.js INTERNALLY in
       ChessBoard.jsx / ChessControlsContext.jsx, so the board would still refuse a 960 castle
  note → engine: our Stockfish already has UCI_Chess960; other variants would need fairy-stockfish-nnue.wasm
  note → we have zero 960 games, so a 960 opponent is engine-only — no book, no personality

[00:32] · P8/scope · "does that solve for everything?" — no, and said so
  note → linking solves the round trip and enables prototyping. TWO of ~nine threads.
  note → most of what he caught is LOCAL and needs nothing from the DS: the reset, the modal
         flow, the breakpoints. Those go first precisely because they are unblocked

[00:53] · P8/T1-T2 · src/play/PlayPage.jsx + NewGameDialog.jsx
  what → new game → options → Start, on the DS drawer; settings leave the live sidebar
  ⤺ → first tried `FullscreenOverlay` (the repo's Games-panel precedent) — WRONG PART.
       Measured: `.kol-overlay` is OPAQUE surface-primary, so a 460px options panel floated
       in a full-screen sheet its own colour with no card. The DS's own docstring settles it:
       ShellDrawer is "a panel over a dimming backdrop", FullscreenOverlay "fills the viewport"
  after → ShellDrawer brings Escape, backdrop click, scroll lock, focus trap and focus return free
  verify → played 1.e4, Tal replied c6, opened the dialog, changed the control to 1+0, CANCELLED
           → game and clocks survived intact ✓ The destructive reset is structurally gone

[00:53] · P8/T3 · layout
  what → clocks moved to FLANK THE BOARD (opponent above, you below) — what both sites do
  why → not decoration: it is what makes 768 work without a breakpoint. In the sidebar they
        fell below the fold the moment the sidebar stacked, which is what 768 does
  verify → 390 · 768 · 1024 · 1280 · 1440 · 844×390 landscape — zero overflow, zero offenders

[00:53] · P8/T4 · touch
  verify → real TouchEvent sequence (not a synthetic click) moved a piece ✓ `touch-action: manipulation`

[00:53] · P8/T6 · conditioning now READ, not just recorded
  what → sliceCount takes four marginals (year · my band · OPPONENT band · time class)
  note → combining takes the SMALLEST, an honest upper bound — the builder stores marginals,
         never the joint, so a product would invent precision that is not there
  note → the % shown stays whole-history and the UI SAYS so: `s` is not stored per marginal,
         so "62%" under an opponent filter would otherwise read as "62% against that band"
  ★ → my own book rebuilt: opponent bands 300→2600, time classes blitz 12,476 / bullet 670 / daily 202

[00:53] · P8/T7 · artifacts
  ✗ → measured the real cost: each book compiled to a JS CHUNK — style-book was 4.0 MB of
       JavaScript, parsed by the JS engine instead of JSON.parse
  after → moved to public/books/ and fetched; book chunks gone from the bundle entirely
  note → 19 MB still committed. Deliberate: gitignoring breaks a clone and CI. The natural
         long-term home is the B2 CDN beside the 71 MB of PGN — his call, not started

[00:53] · P8/T9 · the link
  what → scripts/link-chess-package.mjs symlinks node_modules/@kolkrabbi/kol-chess → DS source
  note → package.json untouched: git-invisible, clone and CI still install the published copy
  ⤺ → TWO resolution traps, both measured, both real: (1) the DS monorepo has its OWN react, so
       the linked package ran a second React; (2) it also dragged in kol-component's UNPUBLISHED
       source — ~30 MIME errors loading SVGs this app never asked for
  ⤺ → `alias` fixed the origin and BROKE the exports map: the bare specifier became a literal
       path, so `@kolkrabbi/kol-component/utilities/motion` 404'd and kol-shell's NavRail 500'd
  ★ → `dedupe` is the right tool — pins one copy, leaves each package's exports map alone
  verify → link live: Vite serves ChessBoard.jsx from the DS path with HMR, single React, 0 errors

[00:53] · P8/T5 · the prototype that replaced a guess
  what → drag + square semantics built in the LINKED DS source, +79 lines, verified in this app
  note → POINTER events, not HTML5 DnD: dragstart/drop never fire on touch, so an HTML5 version
         would have added drag for exactly the devices that already worked
  note → drag reuses the click path (pointerdown selects, pointerup commits) so tap is untouched
  verify → all three inputs move pieces: drag ✓ click ✓ keyboard (Enter) ✓ — "1. e4 e6 2. d4 d5 3. Nf3 dxe4"
  → filed as ChessBoardInputAndVariantSeam WITH the diff attached; only the `dests` seam
    (the actual design call) left open

[00:53] · P8/T8 · Clock stays local
  → a chess clock is DOMAIN furniture, not kol-component's. Its natural home is the chess
    package, and bundling that ask into the board ticket would make one clean ticket into two
    muddled ones. Revisit when the board ticket lands

──────────── MILESTONE: local fixes, then the link ──────────── [00:53]
  fixed locally, needing nothing from anyone: destructive reset · new-game flow · 768 and every
  other breakpoint · touch · conditioning read · artifacts off the bundle
  filed with evidence: ChessBoardInputAndVariantSeam (🔵) + the working diff
  scoped, not started: .kol/llm-plan/03-chessops-migration.md (blocked on the DS ruling)
  tests 51/51 ✓ · build ✓ · lint 1 (pre-existing) · 8 routes × 390 clean with the link ACTIVE
  ⚠ LEFT LINKED — the prototype lives in the kol-ds-ui working tree, not here. Nothing is forked
    in this repo. `node scripts/link-chess-package.mjs --unlink` restores the published package
