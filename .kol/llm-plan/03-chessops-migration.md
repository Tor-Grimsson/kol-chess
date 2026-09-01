# chessops migration — scope, not a start

**Written:** 2026-08-31 · **Status:** ✅ CONSUMER HALF DONE — 2026-08-31
**Ruling:** Chess960 is a standing user requirement. `dests` filed back to
kol-ds-ui as ruled IN; this migration is its consumer half and did not wait for
the board.

**Executed 2026-08-31.** Every one of the 14 call sites is off chess.js and on
`src/lib/rules.js`, a chessops-backed adapter that keeps chess.js's surface so
the ports were import swaps. chess.js is now a devDependency, kept ONLY for the
differential test that proves parity. 87/87 tests, build green.

- The book rebuilt **byte-identical** across all 15,283 position entries. The
  only change is `meta.games` 27,150 → 27,200: fifty **Chess960 games** chess.js
  could not parse and silently skipped. Their positions prune out at `minSeen 2`,
  which is why no entry moved. Displayed counts across the app now agree.
- Castling is normalised in the adapter: chessops encodes every castle as
  king-onto-rook, consumers expect the king's landing square. Where the two
  collide (common in 960) the rook square wins, because from/to alone cannot
  otherwise say whether a castle or a king step was meant.
- chessops is LENIENT where chess.js refuses — it ignores a spurious capture
  flag and resolves to the same intended move. Documented and tested; it is what
  27k scraped chess.com PGNs want.

**What is left is not ours:** kol-ds-ui shipping the `dests` prop plus
king-onto-rook castling on `ChessBoard`. Until then 960 is readable and
buildable here but not playable — the board still generates its own legality.

---

## Why

Chess960 and every variant are unreachable today, and it is not a bump away:
**chess.js 1.4.0 is the latest release and has no variant support and no 960
castling.** Measured on `4k3/8/8/8/8/8/8/RK6 w A -` (king b1, rook a1, back rank
otherwise clear, castling genuinely legal):

| library | result |
|---|---|
| `chessops` 0.15.1 | king b1 → **a1** c1 a2 b2 c2 — castles onto the rook square |
| `chess.js` 1.4.0 | Ra2…Ra8 Ka2 Kb2 Kc2 Kc1 — **no castling offered at all** |

`chessops` is lichess's own rules library: Chess960 plus Crazyhouse, Atomic,
Antichess, King of the Hill, Three-check, Racing Kings and Horde, and it ships
`chessops/pgn`. One dependency (`@badrap/result`), ~1 MB.

## The blocker that is not ours

`@kolkrabbi/kol-chess` uses chess.js **internally** — `ChessBoard.jsx`,
`ChessControlsContext.jsx`, `utils/chessFen.js`. Migrating our own 12 files
would leave the board still refusing a 960 castle. **The DS decides first**; this
plan is what we do once it has.

## Scope here, if it is ruled in

14 call sites — 12 in `src/`, 2 build scripts:

| file | uses chess.js for |
|---|---|
| `src/engine/uci.js` · `reviewRunner.js` | SAN↔UCI, replaying a line, material |
| `src/engine/uci.test.js` | fixtures |
| `src/openings/openingBook.js` + test | replaying the named-lines TSV to an EPD |
| `src/insights/autopsy.js` (injected) · `autopsy.test.js` · `OpeningAutopsy.jsx` | walking a line |
| `src/insights/phaseSample.js` | reading a game's moves out of PGN |
| `src/lib/resolveGame.js` | PGN → game |
| `src/play/PlayPage.jsx` | legality, turn, game-over |
| `scripts/build-style-book.mjs` · `build-suggestions.mjs` | replaying 27k games |

**Do it wholesale or not at all.** Two rules libraries in one app means two
answers to "is this move legal", and the estate's own convention (kill
redundancy, one way to express a concept) says that is worse than either
library alone.

## Order

0. **Wait for the DS ruling.** Nothing below is worth starting without it.
1. `chessops` alongside chess.js, behind one adapter module — `src/lib/rules.js`
   exposing only what we use (legal moves, move, fen/epd, turn, isOver, SAN).
2. Port the **build scripts** first: they are pure node, have no UI, and the
   book artifact is byte-comparable before and after. That is the cheapest real
   proof the port is faithful.
3. Port `openingBook` + `autopsy` (pure, well tested), then the engine helpers,
   then `PlayPage`.
4. Delete chess.js and the adapter's chess.js branch in the same change that
   removes the last import. An adapter kept "just in case" is the two-libraries
   problem wearing a wrapper.
5. Variants last, and only the ones the DS board can actually render.

## Costs to state plainly

- `chessops` is lower-level than chess.js: no `move('e4')` from SAN without
  going through `parseSan`, and positions are `Result`-wrapped. The adapter is
  where that ergonomics gap gets paid, once.
- Our book artifacts are keyed by EPD, which both libraries produce identically
  — **the books do not need rebuilding**. Verified: `epdOf` is a string slice.
- Non-960 variants need a variant ENGINE too (`fairy-stockfish-nnue.wasm`);
  our Stockfish has `UCI_Chess960` but cannot evaluate atomic or horde.
- We have **zero 960 games**, so a 960 opponent is engine-only — no book, no
  personality. Worth knowing before anyone expects "Fischer at 960".
