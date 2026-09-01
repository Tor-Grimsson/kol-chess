# ContentRow: a `roster` variant — filled tile, fixed row, no border

**Filed:** 2026-08-31 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ContentRowRosterVariant.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-31 — kol-component 0.146.0 + kol-theme 0.113.0

## Why it went there

The roster row on `/play` was a hand-rolled `<button>` — a local build of
something the DS owns, which the estate forbids. `ContentRow default` is the
nearest part and a different object: a ruled transparent line with a divider
and no hover wash, right for a file listing, wrong for a grid of pick-targets.

Shape settled by six user corrections in a row, and the last one is the ticket:
*"it has to fill height of fixed card not change to height of the card"*. A row
whose height follows its content drifted 34 → 40 → 50 → 58 as the copy and
padding changed, and one long meta line pushed a tile out of line with its
neighbours.

## Remainder here

**Remainder here:** none — EXECUTED 2026-08-31, same day it shipped. Bumped
kol-component 0.147.0 + kol-theme 0.114.0; `PlayLobby` renders
`<ContentRow variant="roster">` and the local `OpponentCard` is gone. Verified
at 390: 11 rows, every one exactly 56px with `min-height: 56px`, both lines
present, no overflow.

Two notes for the next consumer, neither a defect:
- `roster`'s second line is **`meta`**, not `date`. `default` uses date + size,
  so a straight port from that variant renders the title alone and no error.
- The row measured 58 until the Vite cache was cleared — a bumped kol-theme
  needs `rm -rf node_modules/.vite` and a dev restart, or the browser keeps
  serving the previous CSS and `.kol-row--fixed` silently does not exist.
