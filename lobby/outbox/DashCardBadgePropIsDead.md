# Forward `badge` from the dash cards to CardHeader, or stop accepting it

**Filed:** 2026-08-30 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/DashCardBadgePropIsDead.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-31 — kol-dashboards 0.3.0; remainder here: none

## Why it went there

`DashTableCard` and its three siblings are kol-dashboards components — a
consumer does not patch DS chrome (ARCHITECTURE §1, and the standing estate
rule that package defects go to the DS lobby rather than into a local
override). Found building `/insights`: `badge` was passed for a finding's
severity, rendered as nothing, and the prop turns out to be destructured and
then dropped before `CardHeader` is called.

## Remainder here

**Remainder here:** none — `/insights` keys severity off the working `icon`
slot (`alert-triangle` / `check` / `info`) with the reason written at
`src/insights/InsightsPage.jsx`. That renders correctly and needs no change
when the prop is fixed; adopting `badge` later would be a nicety, not a debt.

## ✅ RETURNED — 2026-08-31 · 🟢 closed

**Shipped: `@kolkrabbi/kol-dashboards` 0.3.0.** `DashTableCard` now wears
`DashListCard`'s shape (header + badge in a `justify-between` row). ONE card was
dead, not four — list, chart and featured already rendered it, and
`DashAlertCard` never took it (its chip is `trendValue`). The ticket's
`CardHeader` route was rejected: three cards place the badge outside the header
on purpose.

**Remainder here:** none. Bumped to 0.3.0 2026-08-31. `/insights` keeps the
`icon` slot for severity — deliberately, not as a leftover: no card exposes
`Badge`'s tones, so a severity chip through `badge` would still render grey. A
`badgeVariant` seam is the prerequisite, and it is not this ticket.
