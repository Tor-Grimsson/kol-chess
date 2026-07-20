---
title: Design system brief 4.0 — archive "load entire set"
type: audit
status: active
updated: 2026-07-15
description: Brief for the kol-ds repo agent — the game archive can only load one month at a time; a stats dashboard (and plain "see everything") needs a "load entire set" path surfaced in the existing dropdown + button.
aliases:
  - ds-brief-4.0
tags:
  - project/kol-chess
  - domain/design-system
sources:
  - "@kolkrabbi/kol-chess/src"
related:
  - "[[DESIGN-SYSTEM-AUDIT-3.0|brief 3.0]]"
  - "[[DESIGN-SYSTEM-AUDIT-2.0|brief 2.0]]"
  - "[[DESIGN-SYSTEM-AUDIT|audit 1.0]]"
---

# Design system brief 4.0 — archive "load entire set"

**Audience: the kol-ds repo agent.** Brief 3.0 (board interactivity) shipped and this repo is on kol-chess 0.4.1. This is the next tranche — small, and the data half is already done upstream.

## The gap

`GameArchiveTable` can only ever load **one month**. It picks a random month on mount and the dropdown swaps between months — there is no path to the full set. That blocks two things the consumer now wants: a plain "show me everything" browse, and a **statistics dashboard** over the whole 27,200-game archive (win rates by opening/colour/time-control, rating over time) that inherently needs the entire dataset in memory.

The data capability already exists — the adapter exports `loadFullDataset()` (async, CDN-backed, memoized). What's missing is purely the **UI seam** in `GameArchiveTable` to reach it. Nothing new is needed in `@kolkrabbi/kol-chess/data`.

| | state |
|---|---|
| **Data** | ✅ `loadFullDataset()` exists, cached, returns all 27,200 |
| **UI** | ❌ dropdown + action button are month-only |

## The ask

1. **`<all>` as the first dropdown item** — label it "All games" (or similar), make it the item the dropdown **opens on**. Months follow below it.
2. **Scope-aware action button** — the button reads the current selection and relabels:
   - `all` selected → **"Load entire set"**
   - a month selected → **"Load month"** — *generic*, do **not** interpolate the month name. The dropdown already shows `Nov 2020`; a button reading `Load Nov 2020` next to it says the month twice.
3. **Fetch on click, not on open** — `<all>` is *selected* by default, but the 27k fetch waits for the button press. Opening the archive must not silently pull the full set; the dashboard/one-click-all intent is served by the button, not by mount.
4. **Wire to `loadFullDataset()`** — the `all` path calls the existing adapter export; the month path is unchanged (`loadMonthGames`).

## Why the shared cache matters

`loadMonthGames` and `loadFullDataset` sit on the same memoized `fetchFullDataset`. So whichever the user hits first pays the one fetch; the other is instant afterward. This is what lets a future stats dashboard mount-and-populate cheaply — it shares the archive's cache, one fetch total.

## Acceptance (preview in showcase) — verified upstream 2026-07-16, staged as kol-chess 0.5.0

- [x] Dropdown opens on an "All games" item; months listed below
- [x] Button reads "Load entire set" for `all`, "Load month" for a month (never "Load <month name>")
- [x] Opening the archive triggers **no** full fetch; only the button press does (the old random-month mount load — which silently pulled the full set — is gone)
- [x] "Load entire set" populates the table with the full 27,200-game set via `loadFullDataset()`
- [x] A subsequent month load (or vice-versa) is instant — shared cache
- [x] Publish (push == publish) → kol-chess bumped once (0.5.0 consumer-verified 2026-07-16)

## The loop, unchanged

Fix in `kol-ds` → preview in its `showcase` → one changeset publish → kol-chess bumps.
