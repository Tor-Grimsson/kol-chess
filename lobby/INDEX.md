# lobby — kol-chess

Intake queue for **kol-chess**: the chess analysis app — the four pages, the
engine/review passes, the DuckDB database surface, and this repo's consumption
of the KOL design system.
Not documentation — a work queue, deliberately outside `docs/`.

**This file is the ledger. The ledger is the truth, never a raw `ls`.**

| | |
|---|---|
| file one | `clip-drop.sh --kol-chess NAME` |
| read it | `/lobby-list` · `bin/lobby` · `prefix Ctrl+K` |
| the spec | `~/.dotfiles/docs/operations/systems/lobby/` |

## States

| | state | means | lives in |
|---|---|---|---|
| 🔵 | `filed` | captured, unread | `inbox/` |
| 🟡 | `read` | understood — the row below restates it | `inbox/` |
| 🟠 | `addressed` | a change shipped that is *meant* to close it | `inbox/` |
| 🟢 | `closed` | met the bar; resolution appended | `done/` |
| ⚪ | `parked` | deliberately not-**now**, reason recorded — revisitable | `archive/` |
| ⚫ | `retired` | closed without a fix, not-**ever** — terminal, and never ages | `archive/` |
| 🔴 | `needs-ruling` | **flag, not a state** — blocked on the user's call | wherever it is |
| 📌 | `remainder` | **flag, not a state** — closed at its destination, still owed **here** | `outbox/` |

**`read` is never `closed`.** Understanding a ticket ships nothing.
**Bar for 🟢 closed in this repo — purpose served:** the change is in the tree,
the build is green, and it was **browser-verified** — the affected route(s)
loaded with zero console errors at the viewport that matters, cited by file and
by the package version it rode in on. A DS defect is never closed here by a
consumer override: it goes upstream to kol-ds-ui and closes on the bump
(ARCHITECTURE §1–§2).
**The agent closes on that evidence.** Parking, declaring stale, reopening and
any design decision stay the **user's call**.

## Queue — 0 entries

_(empty)_

## Closed

_(none yet)_

## Archived

_(none yet — ownership, deferral and context notes land in `archive/`)_

## Filed elsewhere

Tickets this ledger does **not** govern — each row names the destination ledger
that does. The **Remainder** is this repo's to do; the state is theirs to report.

| | Receipt | Destination | Last known | Remainder here |
|---|---|---|---|---|
| 🔵 | [ChessBoardInputAndVariantSeam](outbox/ChessBoardInputAndVariantSeam.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🔵 `filed` · synced 2026-08-31 | 📌 on ship: unlink, bump, drop the local `touch-action` wrapper; migrate to chessops if the `dests` seam is ruled in |
| 🔵 | [DashCardBadgePropIsDead](outbox/DashCardBadgePropIsDead.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🔵 `filed` · synced 2026-08-30 | none — `/insights` uses the working `icon` slot; nothing owed when it ships |
| 🔵 | [lobby-watch-exit-when-idle](outbox/lobby-watch-exit-when-idle.md) | **dotfiles** — `~/.dotfiles/lobby/INDEX.md` | 🔵 `filed` · synced 2026-08-30 | none — the fix is entirely in `bin/lobby`; nothing changes here |
| 🟢 | [NotationPanelMoveDecorations](outbox/NotationPanelMoveDecorations.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🟢 `closed` · synced 2026-08-27 — kol-chess 0.8.0 | none — executed 2026-08-27; `ReviewPanel.jsx` renders `<NotationPanel decorate={…} />`, local `MoveCell` gone |
| 🟢 | [ChessBoardFluidCoordinates](outbox/ChessBoardFluidCoordinates.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🟢 `closed` · synced 2026-08-26 — kol-chess 0.7.1 · kol-theme 0.58.1 | none — executed 2026-08-26; bumped and re-shot `/analysis` at 390, `.chess-coord--fluid` confirmed |
| 🟢 | [ChessHeadingFontVarUndefined](outbox/ChessHeadingFontVarUndefined.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🟢 `closed` · synced 2026-09-01 — kol-theme 0.119.0 (rules speak sans-narrow) | 📌 bumped same day; hero/chart screen check rides the next deploy |
| 🟢 | [ShellPagePadFixedOnMobile](outbox/ShellPagePadFixedOnMobile.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🟢 `closed` · synced 2026-09-01 — kol-theme 0.118.0 | 📌 bumped 0.118.0 same day; `/settings` phone re-check rides the next deploy |
| 🟢 | [LogomarkInlineStyleLeak](outbox/LogomarkInlineStyleLeak.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🟢 `closed` · synced 2026-09-01 — kol-shell 0.32.0 sanitises fetched marks | none — bumped, repointed at the favicon, twin retired to `_tmp/` same day |

## History

- **2026-08-30** — Lobby brought to the six-section standard. The repo had an `outbox/` and nothing else: no ledger, no `inbox/`, `done/` or `archive/`, and **no row in the registry** (`~/.dotfiles/files/folders.md` § lobby) — so `bin/lobby` could not see it at all. `--counts`, `--outbox` and `--lint` skipped the repo silently, and `--watch` (ag-init step 7b) exited on `no registered lobby for …` written to **stderr**, which a Monitor does not surface — the receipt watch had never once been armed here. Registered, scaffolded, and the two existing receipts rowed under Filed elsewhere.
- **2026-08-30** — Filed `lobby-watch-exit-when-idle` into **dotfiles** (🔵) — the first ticket out through this repo's own ledger. `lobby --watch` never exits when no receipt is pending, contradicting its help and its docblock; step 7b arms it persistently on that promise. Nothing owed back here.
- **2026-08-30** — Filed `DashCardBadgePropIsDead` into **kol-ds-ui** (🔵) — four kol-dashboards cards accept a `badge` prop and none forward it to `CardHeader`, so it renders silently as nothing. Found while building `/insights`; that page keys severity off `icon` instead. Nothing owed back here.
- **2026-08-31** — Filed `ChessBoardInputAndVariantSeam` into **kol-ds-ui** (🔵) with a working prototype attached, not a guess: the package was symlinked in and drag + square a11y were built and verified against the live DS source first. The `dests` seam for 960/variants is left as a ruling request, because chess.js cannot express 960 castling at all.
- **2026-09-01** — Filed three into **kol-ds-ui** off the mobile field review (🔵 ×3): `ChessHeadingFontVarUndefined` (10 chess-pack rules reference a token the theme never defines — hero metrics/playback/chart titles fall to ui-sans), `ShellPagePadFixedOnMobile` (`--kol-shell-page-pad` flat 48px, 24.6% of a 390 viewport on gutters), `LogomarkInlineStyleLeak` (an inlined mark's `<style>` is document-global; presented as "the theme toggle doesn't flip"; consumer fixed with a styleless logomark twin the same evening).
