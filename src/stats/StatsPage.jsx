import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@kolkrabbi/kol-component'
import { ThemeToggle } from '@kolkrabbi/kol-framework'
import { loadFullDataset } from '@kolkrabbi/kol-chess/data'
import {
  DashboardGrid,
  GridCard,
  DashMetricCard,
  DashChartCard,
  DashTableCard,
  DashStackedBarCard,
  LineChart,
  DonutChart,
  Sparkline,
  Heatmap,
  formatPercent
} from '@kolkrabbi/kol-dashboards'
import { computeStats } from './aggregate'

const GREEN = 'var(--kol-palette-green)'
const RED = 'var(--kol-palette-red)'
const BLUE = 'var(--kol-palette-blue)'
const YELLOW = 'var(--kol-palette-yellow)'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// '2019-11' → 'Nov 2019'
const monthLabel = (month) => {
  if (!month) return '—'
  const [y, m] = month.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}

const recordCell = (t) => `${t.win}–${t.loss}–${t.draw}`

const OPENING_COLUMNS = [
  { header: 'OPENING', accessor: 'family', className: 'kol-table-cell-text', render: (r) => <span>{r.family}</span> },
  { header: 'GAMES', accessor: 'games', className: 'kol-table-cell-text', render: (r) => <span>{r.games.toLocaleString()}</span> },
  { header: 'W–L–D', accessor: 'record', className: 'kol-table-cell-text', render: (r) => <span className="kol-table-token bg-fg-08">{recordCell(r)}</span> },
  { header: 'SCORE', accessor: 'scorePct', className: 'kol-table-cell-text', render: (r) => <span>{formatPercent(r.scorePct)}</span> }
]

const OPPONENT_COLUMNS = [
  { header: 'OPPONENT', accessor: 'username', className: 'kol-table-cell-text', render: (r) => <span>{r.username}</span> },
  { header: 'GAMES', accessor: 'games', className: 'kol-table-cell-text', render: (r) => <span>{r.games}</span> },
  { header: 'W–L–D', accessor: 'record', className: 'kol-table-cell-text', render: (r) => <span className="kol-table-token bg-fg-08">{recordCell(r)}</span> },
  { header: 'SCORE', accessor: 'scorePct', className: 'kol-table-cell-text', render: (r) => <span>{formatPercent(r.scorePct)}</span> }
]

const StatsPage = () => {
  const navigate = useNavigate()
  const [games, setGames] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    loadFullDataset()
      .then((data) => {
        if (!alive) return
        if (!data?.length) setError('Dataset came back empty — CDN unreachable?')
        else setGames(data)
      })
      .catch((err) => alive && setError(err.message))
    return () => {
      alive = false
    }
  }, [])

  const stats = useMemo(() => (games ? computeStats(games) : null), [games])

  return (
    <div className="mx-auto max-w-[1232px] px-4 pt-11 pb-8 md:px-6 md:pt-15 md:pb-12">
      {/* toggle stays in-flow so its height is reserved and the mb-6 gives a real
          gap below; pt matches the board toggle's top offset (top-11/top-15) */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="kol-sans-heading-05">Statistics</h1>
          {stats && (
            <span className="kol-mono-12 text-fg-secondary">
              {monthLabel(stats.span.from)} — {monthLabel(stats.span.to)} · {stats.totals.rated.toLocaleString()} rated
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
          <Button variant="ghost" size="sm" iconLeft="grid" onClick={() => navigate('/')}>
            Board
          </Button>
        </div>
      </div>

      {error && <p className="kol-mono-14 text-fg-secondary">{error}</p>}
      {!error && !stats && <p className="kol-mono-14 text-fg-secondary">Loading the full archive…</p>}

      {stats && (
        <DashboardGrid layout="4-col">
          {/* ── KPI row ── */}
          <GridCard span="1x1">
            <DashMetricCard
              label="Games played"
              value={stats.totals.games.toLocaleString()}
              delta={`${stats.totals.win.toLocaleString()}W · ${stats.totals.draw.toLocaleString()}D · ${stats.totals.loss.toLocaleString()}L`}
            />
          </GridCard>
          <GridCard span="1x1">
            <DashMetricCard
              label="Win rate"
              value={formatPercent(stats.totals.winPct)}
              delta={`as White ${formatPercent(stats.colours.white.winPct)} · as Black ${formatPercent(stats.colours.black.winPct)}`}
              borderColor={GREEN}
            />
          </GridCard>
          <GridCard span="1x1">
            <DashMetricCard
              label={`Peak rating · ${stats.dominantClass}`}
              value={String(stats.rating.peak?.rating ?? '—')}
              delta={`${monthLabel(stats.rating.peak?.month)} · avg opponent ${stats.records.avgOpponentRating}`}
              borderColor={YELLOW}
              sparkline={<Sparkline data={stats.rating.series.map((p) => p.y)} height={28} />}
            />
          </GridCard>
          <GridCard span="1x1">
            <DashMetricCard
              metrics={[
                {
                  label: 'Best win',
                  value: String(stats.records.bestWin?.opponent.rating ?? '—'),
                  delta: `vs ${stats.records.bestWin?.opponent.username} · ${monthLabel(stats.records.bestWin?.month)}`,
                  borderColor: GREEN
                },
                {
                  label: 'Highest-rated opponent',
                  value: String(stats.records.highestFaced?.opponent.rating ?? '—'),
                  delta: `vs ${stats.records.highestFaced?.opponent.username} · ${monthLabel(stats.records.highestFaced?.month)}`
                },
                {
                  label: 'Longest win streak',
                  value: String(stats.streaks.win?.length ?? 0),
                  delta: monthLabel(stats.streaks.win?.start),
                  borderColor: GREEN
                },
                {
                  label: 'Longest losing streak',
                  value: String(stats.streaks.loss?.length ?? 0),
                  delta: monthLabel(stats.streaks.loss?.start),
                  borderColor: RED
                }
              ]}
            />
          </GridCard>

          {/* ── rating + result shape ── */}
          <GridCard span="2x2">
            <DashChartCard
              title="Rating over time"
              subtitle={`${stats.dominantClass} · monthly closing rating`}
              badge={`peak ${stats.rating.peak?.rating}`}
              footer={`${stats.rating.games.toLocaleString()} rated ${stats.dominantClass} games across ${stats.rating.series.length} months`}
            >
              <LineChart
                data={stats.rating.series.map((p) => ({ x: p.x, y: p.y }))}
                height={220}
                showArea
                xLabels={stats.activity.years.filter((_, i) => i % 2 === 0)}
              />
            </DashChartCard>
          </GridCard>
          <GridCard span="1x2">
            <DashChartCard
              title="Results"
              subtitle={`all ${stats.totals.games.toLocaleString()} games`}
              footer={`score ${formatPercent(stats.totals.scorePct)} (draws = ½)`}
            >
              <div className="flex flex-1 items-center justify-center">
                <DonutChart
                  size={150}
                  centerLabel={formatPercent(stats.totals.winPct)}
                  showLegend
                  segments={[
                    { label: 'Wins', value: stats.totals.win, color: GREEN },
                    { label: 'Draws', value: stats.totals.draw, color: BLUE },
                    { label: 'Losses', value: stats.totals.loss, color: RED }
                  ]}
                />
              </div>
            </DashChartCard>
          </GridCard>
          <GridCard span="1x2">
            <DashStackedBarCard
              title="By colour"
              value={`${formatPercent(stats.colours.white.winPct)} / ${formatPercent(stats.colours.black.winPct)}`}
              label="win rate W / B"
              data={[stats.colours.white, stats.colours.black].map((c) => ({
                win: c.win,
                draw: c.draw,
                loss: c.loss,
                total: c.games
              }))}
              footerLeft={`White · ${stats.colours.white.games.toLocaleString()}`}
              footerRight={`Black · ${stats.colours.black.games.toLocaleString()}`}
            />
          </GridCard>

          {/* ── openings ── */}
          <GridCard span="2x2">
            <DashTableCard
              title="Openings as White"
              subtitle="most played families"
              rows={stats.openings.white.played}
              columns={OPENING_COLUMNS}
              footer={
                stats.openings.white.best
                  ? `best score: ${stats.openings.white.best.family} — ${formatPercent(stats.openings.white.best.scorePct)} over ${stats.openings.white.best.games} games`
                  : undefined
              }
            />
          </GridCard>
          <GridCard span="2x2">
            <DashTableCard
              title="Openings as Black"
              subtitle="most played families"
              rows={stats.openings.black.played}
              columns={OPENING_COLUMNS}
              footer={
                stats.openings.black.best
                  ? `best score: ${stats.openings.black.best.family} — ${formatPercent(stats.openings.black.best.scorePct)} over ${stats.openings.black.best.games} games`
                  : undefined
              }
            />
          </GridCard>

          {/* ── opponents + activity ── */}
          <GridCard span="2x2">
            <DashTableCard
              title="Most frequent opponents"
              subtitle={`${stats.opponents.unique.toLocaleString()} unique opponents`}
              rows={stats.opponents.frequent}
              columns={OPPONENT_COLUMNS}
              footer={`best matchup ${stats.opponents.bestMatchup?.username} ${recordCell(stats.opponents.bestMatchup)} · worst ${stats.opponents.worstMatchup?.username} ${recordCell(stats.opponents.worstMatchup)} (min 5 games)`}
            />
          </GridCard>
          <GridCard span="2x2">
            <DashChartCard
              title="Activity"
              subtitle="games per month"
              footer={`busiest: ${monthLabel(stats.activity.busiestMonth?.[0])} — ${stats.activity.busiestMonth?.[1].toLocaleString()} games`}
            >
              <Heatmap
                data={stats.activity.grid}
                rows={stats.activity.years}
                cols={MONTHS}
                colorScale={[BLUE, YELLOW]}
                fill
              />
            </DashChartCard>
          </GridCard>

          {/* ── how games end + formats ── */}
          <GridCard span="2x2">
            <DashChartCard
              title="How games end"
              subtitle="termination method"
              footer={`wins: ${stats.terminations.wins[0]?.method} ${formatPercent(pctOf(stats.terminations.wins, stats.terminations.wins[0]))} · losses: ${stats.terminations.losses[0]?.method} ${formatPercent(pctOf(stats.terminations.losses, stats.terminations.losses[0]))}`}
            >
              <div className="flex flex-1 items-center justify-center">
                <DonutChart
                  size={150}
                  centerLabel={stats.totals.games.toLocaleString()}
                  showLegend
                  segments={terminationSegments(stats.terminations.byMethod)}
                />
              </div>
            </DashChartCard>
          </GridCard>
          <GridCard span="2x2">
            <DashChartCard
              title="Time classes"
              subtitle="games and win rate per format"
              footer={stats.timeClasses
                .map((t) => `${t.timeClass} ${formatPercent(t.winPct)}`)
                .join(' · ')}
            >
              <div className="flex flex-1 items-center justify-center">
                <DonutChart
                  size={150}
                  centerLabel={stats.dominantClass}
                  showLegend
                  segments={stats.timeClasses.map((t, i) => ({
                    label: `${t.timeClass} (${t.games.toLocaleString()})`,
                    value: t.games,
                    color: [GREEN, YELLOW, BLUE, RED][i % 4]
                  }))}
                />
              </div>
            </DashChartCard>
          </GridCard>
        </DashboardGrid>
      )}
    </div>
  )
}

const pctOf = (list, item) => {
  const total = list.reduce((sum, x) => sum + x.count, 0)
  return item && total ? (item.count / total) * 100 : 0
}

const TERMINATION_COLORS = {
  resignation: GREEN,
  checkmate: RED,
  time: YELLOW,
  stalemate: BLUE,
  repetition: BLUE,
  insufficient: BLUE,
  abandoned: 'var(--kol-fg-32)',
  other: 'var(--kol-fg-32)'
}

// top 4 methods + everything else folded into "other"
const terminationSegments = (byMethod) => {
  const top = byMethod.slice(0, 4)
  const rest = byMethod.slice(4).reduce((sum, m) => sum + m.count, 0)
  const segments = top.map((m) => ({
    label: `${m.method} (${m.count.toLocaleString()})`,
    value: m.count,
    color: TERMINATION_COLORS[m.method] ?? BLUE
  }))
  if (rest > 0) segments.push({ label: `other (${rest.toLocaleString()})`, value: rest, color: 'var(--kol-fg-32)' })
  return segments
}

export default StatsPage
