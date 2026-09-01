# ContentCollection: columns should drop before the text starts clipping

**Filed:** 2026-08-31 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ContentCollectionMinColumnWidth.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-09-01 — **kol-component 0.148.0**: `cols` is a CEILING now, not a command. The rungs publish `--kol-wall-cols` and one static template does `repeat(auto-fill, minmax(min(100%, max(floor, (100% - (N-1)·gap)/N)), 1fr))` — pure CSS, no observer.

## Why it went there

Split out of `ContentRowRosterVariant` at kol-ds-ui's own request: the finding
surfaced on the roster row, but a minimum column width binds the whole
collection and every kind, so it is not the variant's to settle. They offered to
pick a number and ship it; we said please do — we have one page and no view on
what the other kinds need.

## Remainder here

**Remainder here:** none — EXECUTED 2026-09-01. `PlayLobby` renders
`<ContentCollection cols={3} minCol="360px" gap={8}>` and the hand-rolled grid
classes are gone.

**The finding is fixed, measured:** 768 was 2 columns at 324 with the meta
clipping on 7 rows of 10 — it now drops to **1 column at 656, 0 of 11 clipped**.
1440 still takes **3 columns at 427, 0 clipped**. Rows hold 56 at both.

Worth recording: the DS **declined to make 360 the estate default** and shipped
320, on the reasoning that our datum describes a row two truncated lines tall
while the floor governs every kind — carrying the DS's existing 320 ruling
across to the `cols` path is a different act from minting a new estate-wide law
from one page's evidence. `minCol="360px"` is the seam our measurements bought;
this page uses it and no other wall is moved.

## ✅ RETURNED — 2026-09-01 · kol-component@0.148.0

Shipped, and I picked the number — but not the one your measurements argue for, and the reason matters. cols is a CEILING now rather than a command: the breakpoint rungs publish --kol-wall-cols and one static template turns it into 'at most N, never narrower than the floor' via repeat(auto-fill, minmax(min(100%, max(floor, (100% - (N-1)*gap)/N)), 1fr)). All CSS — no measurement, no observer, and it works inside the container query the wall already establishes. THE FLOOR DEFAULTS TO 320px, not 360. Your datum argues for ~360, and for a roster row it is right — but that number is about a row two truncated lines tall, and this floor governs every kind in the collection. 320 is the width this DS has already ruled as the narrowest acceptable track and has lived with as min's default; carrying an existing ruling across to the cols path is a different thing from minting a new estate-wide law out of one page's evidence. So: minCol defaults to min, raising min raises both, and a wall whose content needs more says so. FOR YOUR PAGE, PASS minCol=360px — that is the seam you asked for and your measurements are the reason it exists. Note this DOES change existing renders, but only walls that were drawing tracks under 320px, which the DS's own default already calls too narrow. Verified in a browser: the floor holds at every width from 1440 down to 360 with no overflow, and the fluid path is unchanged (2152/6, 1392/4, 1232/3, 720/2, 342/1).

**Remainder here (their line, answered at the top):** done — bumped 0.148.0, `md:2 xl:3` dropped, `minCol="360px"` passed. 768 now takes 1 column at 656 with 0 of 11 clipped, 1440 takes 3 at 427.
