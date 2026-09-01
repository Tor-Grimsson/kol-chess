# ChessBoard: drag-and-drop, square semantics, and a `dests` seam

**Filed:** 2026-08-31 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ChessBoardInputAndVariantSeam.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟠 `addressed` · synced 2026-08-31 — kol-chess 0.9.0 (§1 drag + §2 a11y) shipped and consumed. §3 `dests` was RULED IN by the user the same day and relayed; the row now waits on kol-ds-ui to ship it, not on a decision here.

## Why it went there

`ChessBoard` generates its own legal moves internally (ARCHITECTURE §2 — the
chess system is consumed, not built here), so no prop, wrapper or stylesheet on
this side can add drag, add keyboard access, or supply legality for a variant.
Forking is the only consumer-side route and the estate forbids it.

Filed WITH a working prototype rather than as a request, on the user's ruling
2026-08-31: the package was symlinked into this repo
(`scripts/link-chess-package.mjs`) and the drag + a11y fix was built and
verified against the live source before the ticket was written. The diff is
attached to the entry.

## Remainder here

**Remainder here:** none — chess.js → chessops DONE 2026-08-31 (14 call sites, 87/87 tests). Waiting on kol-ds-ui to ship `dests`; 960 is not playable until it does.
The ship half is done (see RETURNED below): unlinked, kol-chess `^0.9.0`, the
local `touch-action: manipulation` wrapper dropped from `PlayPage.jsx` because
0.9.0's squares set `touch-action: none` themselves. What is left is one
conditional: if the `dests` seam is ruled in, this repo migrates chess.js →
chessops alongside it (12 files + 2 build scripts, scoped but not started).
Nothing here is forked or overridden, and never was.

## ✅ RETURNED — 2026-08-31 · 🟠 addressed · §3 🔴 needs-ruling

**Shipped: `@kolkrabbi/kol-chess` 0.9.0** — §1 (pointer drag, mouse+touch+pen)
and §2 (a11y: `role`/`tabIndex`/`aria-label`/`aria-pressed`/Enter+Space). 29
browser checks green, zero console errors.

The prototype carried a defect it did not predict: **the click after a
selecting press never fires** — the press re-renders the square, React replaces
the mousedown target, and the browser drops the click for want of a common
ancestor. The `skipClickRef` latch therefore ate the *next* real click instead.
Fixed upstream with two rules: a press on your own piece is authoritative, and
the latch resets on every pointerdown.

**Remainder here — EXECUTED 2026-08-31:** unlinked
(`node scripts/link-chess-package.mjs --unlink`), bumped `@kolkrabbi/kol-chess`
`^0.8.0 → ^0.9.0`, and dropped the local `touch-action: manipulation` wrapper in
`src/play/PlayPage.jsx` — 0.9.0's squares set `touch-action: none` themselves
(`ChessBoard.jsx:256`), which supersedes it. 67/67 tests, build green.

## §3 — RULED 2026-08-31: ~~deferred~~ **WITHDRAWN, see below**

**The user's call, on the standard test.** No requirement exists (zero 960 or
variant references in `src/`); the decision is reversible and no more expensive
later; and the seam would ship with **zero consumers**, because nothing passes
`dests` unless this repo migrates to chessops first. A seam with no call site is
speculative generality, so neither half gets built.

The DS recommendation (optional `dests` prop, chess.js untouched) is sound and
is *why* this is cheap to revisit — it stays additive whenever it is taken up.
`.kol/llm-plan/03-chessops-migration.md` is parked ⚪ with the scope measured.
**Trigger to reopen:** a feature that actually needs Chess960 or a variant.

**Remainder here: none.**

## ⛔ CORRECTION — §3 IS RULED IN, 2026-08-31

The deferral above is withdrawn. It answered "is this worth doing" when Chess960
had already been asked for. **The requirement is standing.** kol-ds-ui has been
told to ship `dests` as an optional prop, plus king-onto-rook castling (960's
castle targets the rook's own square, so a board that reads it as self-capture
refuses every 960 castle). This repo's half — chess.js → chessops behind
`src/lib/rules.js` — is ACTIVE and does not wait on the board.

## ✅ RETURNED — 2026-08-31 · kol-chess@0.10.0

All three parts are in. 1 and 2 (drag + a11y) shipped in 0.9.0 from your prototype, with one correction: the diff's click-suppression was wrong in both directions. Instrumenting the real DOM showed the click after a SELECTING press never fires at all — the press re-renders the square, React replaces the node the mousedown landed on, and the browser drops the click for want of a common ancestor. A press on your own piece is authoritative now, and the skip flag resets on every pointerdown rather than only when consumed, because a flag cleared by a click that may never come is a latch that eats the NEXT real click. 29 browser checks green including real CDP touch. 3 is now built rather than ruled: dests takes Map<from,to[]> or a plain object, supplied legality WINS OUTRIGHT (not merged with chess.js, not checked against it — a variant's rules are not a superset of standard chess, so a board consulting both would emit moves neither engine agreed to), and canPick follows it because chess.js's turn is not a safe proxy in a 960 position. The ENGINE IS NOT SWAPPED and that is the decision: chess.js stays the default so no current consumer moves, and a consumer that wants chessops supplies dests from chessops rather than this package taking the dependency for everyone. That makes the engine swap your later choice instead of a precondition. Regression-checked with no dests supplied: tap, drag, keyboard, illegal-move and enemy-piece paths all unchanged. Not screen-verified WITH dests — no showcase surface passes it, so that branch is source-verified only.

**Remainder here:** bump kol-chess >=0.10.0; wire dests from chessops on the variant boards and confirm a 960 castle renders as a target

## ✅ §3 CONSUMED — 2026-08-31

kol-chess 0.10.0 shipped `dests` as an optional `Map<from, to[]>` — exactly the
shape `chessgroundDests()` returns, and exactly what was asked for. Bumped and
wired: `PlayPage` hands the board `game.dests()` from `src/lib/rules.js`, so the
board no longer asks chess.js anything.

The consumer half was already done — the chess.js → chessops migration landed
earlier the same day (14 call sites, chess.js now a devDependency kept only for
the differential test). Verified: e2 offers e3/e4 and nothing else, moves
commit, the bot replies. A 960 castle is in `dests` and covered by a test that
also asserts chess.js cannot even LOAD the position — which is why this was
impossible in principle rather than merely unbuilt.

**Remainder here: none.**
