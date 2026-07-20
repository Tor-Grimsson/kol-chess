# kol-chess — statistics dashboard

Scoped 2026-07-15 · ✅ **EXECUTED 2026-07-16** (overnight) — `/stats` route: `src/stats/aggregate.js` + `src/stats/StatsPage.jsx`. The predicted integration caveats both materialized and were fixed upstream: kol-dashboards stale deps → **0.2.0 staged** (kol deps → peerDeps; consumed tonight as 0.1.0 + pnpm overrides), plus an unpredicted one — the theme never defined `--kol-palette-*` that the dashboards CSS references → **kol-theme 0.11.1 staged** (+ marked bridge block in `src/index.css` until it publishes). Morning follow-ups in AGENT-CONTEXT.

## Goal

A statistics view over the full 27,200-game archive: win rates by opening / colour / time-control, rating over time, opponent spread, result splits. Built from the published **`@kolkrabbi/kol-dashboards`** package (hand-rolled SVG charts, no d3), not freestyle charts.

## The package — `@kolkrabbi/kol-dashboards` (v0.1.0)

DS-authored, sits above kol-{theme,icons,component}, **consumer-injects its data**, ships **raw JSX source** (same Vite/Tailwind rules as kol-chess). Exports:

| group | components |
|---|---|
| **Cards** | `DashMetricCard` `DashListCard` `DashTableCard` `DashChartCard` `DashFeaturedCard` `DashStackedBarCard` `DashAlertCard` `DashSlotCard` |
| **Chart primitives** | `LineChart` `DonutChart` `Sparkline` `Heatmap` `Histogram` `ScatterPlot` `Candlestick` |
| **Layout** | `DashboardGrid` `GridCard` `MetricsDashboard` |
| **Utils** | `RANGES` `PALETTE` `formatB2Size` `timeAgo` `DEPLOY_STATE_COLORS` |

### ⚠️ Do NOT use the `MetricsDashboard` apparatus

`MetricsDashboard` is the pre-composed **KOL-website ops dashboard** — its `data` contract is `{ siteData, allHosts, host, setHost, projectData, sanityData, deploys, b2Data, hostSummaries, ... }` (deploys/hosting/B2 analytics). Wrong domain for chess. **Compose the cards + chart primitives + `DashboardGrid` directly** into an app-side `<ChessStatsDashboard>`.

## Data source

`loadFullDataset()` (the brief-4.0 "load entire set" path) → the full `gameMeta` array. **The dashboard is the reason brief 4.0 exists** — mounting it triggers the load-all, and the fetch is shared with the archive's month cache (one fetch total).

## App-side build (net-new)

| piece | what |
|---|---|
| **stats aggregation module** | the real work — reduce `gameMeta` into each card's shape: win% by opening (join on the opening index), rating time-series, W/L/D counts, win% by colour, time-control breakdown, opponent frequency + best/worst matchups. Pure functions over the array. |
| **`<ChessStatsDashboard>`** | composes kol-dashboards cards with the computed data — see mapping below |
| **mount point** | a view/tab; natural home is behind the brief-4.0 "load entire set" (dashboard = the load-all trigger). Decide alongside the archive UX. |
| **Vite/Tailwind wiring** | install `@kolkrabbi/kol-dashboards`; add its `src` to `@source` in `index.css`; add to `optimizeDeps.exclude` (source-only, `import.meta.glob` dies under prebundle — same rule as every KOL package here) |

### Card mapping (first pass)

- **KPI row** — `DashMetricCard` ×: total games · overall win% · W/L/D · avg opponent rating
- **Rating over time** — `LineChart` (in a `DashChartCard`)
- **Result / colour split** — `DonutChart` (W/L/D, and win% as White vs Black)
- **Win rate by opening / by time control** — `DashStackedBarCard` or `Histogram`
- **Top openings · opponent spread** — `DashTableCard` / `DashListCard`
- **Activity heat** (games by month/weekday) — `Heatmap`
- inline trends — `Sparkline` inside metric cards

## Integration caveats

1. **Stale kol deps — check first.** kol-dashboards pins `kol-component 0.7.0 / kol-theme 0.7.1 / kol-icons 0.5.0` as **`dependencies`** (not peerDeps) vs our 0.11.0 / 0.9.1 / 0.7.0. Risk: pnpm nests a second older copy → token/class drift or double-registered icons. Likely wants an **upstream republish** bumping those deps (and moving them to peerDeps) before it composes cleanly with our theme. This is the #1 thing to verify on install.
2. **Source-only / Vite-locked** — same `@source` + `optimizeDeps.exclude` discipline as kol-chess; skip either and classes/icons vanish.
3. **Charts are SVG, consumer-injected data** — no chart lib to add, but every card wants a specific data shape; the aggregation module is where the effort lives.

## Constraints

- Data already CDN-side (full index + month files) — no new data infra.
- Depends on brief 4.0 for the load-all path; otherwise nothing upstream except the possible kol-dashboards dep-bump.
