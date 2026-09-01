# Make `lobby --watch` exit when no receipt is pending

**Filed:** 2026-08-30 → **dotfiles**
**Entry:** `~/.dotfiles/lobby/inbox/lobby-watch-exit-when-idle.md`
**Ledger:** `~/.dotfiles/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` · synced 2026-08-30

## Why it went there

`bin/lobby` is dotfiles' script — a consumer repo does not patch it (the same
law that sends DS defects to kol-ds-ui rather than into an override here).
Found while bringing this repo's own lobby to the six-section standard:
`--watch` documents "Exits when nothing is pending" in both its help text and
`watch_lobby`'s docblock, and then loops unconditionally. `/ag-init` step 7b
arms it persistently in every repo that has an `outbox/`, on that promise.

## Remainder here

**Remainder here:** none — the fix is entirely in `~/.dotfiles/bin/lobby`.
When it ships, this repo's boot watch simply stops holding a process; no
change is needed in kol-chess.
