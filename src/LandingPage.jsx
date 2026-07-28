import { useNavigate } from 'react-router-dom'
import { Button } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import PageHeader from './PageHeader'
import { getManifest } from '@kolkrabbi/kol-chess/data'

const manifest = getManifest()

/* The front door: the pipeline story (scrape → store → replay → aggregate),
 * told with the archive's real numbers — `manifest` is bundled by the data
 * adapter, so everything renders synchronously, no fetch. */

const STAGES = [
  {
    n: '01',
    name: 'SCRAPE',
    text: 'The chess.com API, pulled month by month — every archive since 2017.',
    link: { label: 'kol-scrape source', href: 'https://github.com/Tor-Grimsson/kol-ds/tree/main/packages/scrape' },
  },
  {
    n: '02',
    name: 'STORE',
    text: 'Games kept as monthly JSON shards on a CDN. No server, no backend — the browser loads what it needs.',
  },
  {
    n: '03',
    name: 'REPLAY',
    text: 'Any game on the board: notation, variations, Stockfish analysis, one-click game review.',
  },
  {
    n: '04',
    name: 'AGGREGATE',
    text: 'The full set computed client-side — results, openings, streaks, rating history.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const yearSpan = `${new Date(manifest.dateRange.start).getFullYear()}–${new Date(manifest.dateRange.end).getFullYear()}`

  return (
    <div className="mx-auto max-w-[1800px] px-4 py-8 md:px-6 md:py-12">
      <PageHeader title="Overview" />
      <main className="flex max-w-5xl flex-col gap-12 md:gap-16">
        <div>
          <h2 className="kol-display-section">
            {manifest.totalGames.toLocaleString('en')} games, one database.
          </h2>
          <p className="kol-mono-14 text-fg-64 mt-5 max-w-2xl">
            Every game scraped from chess.com, stored as a browsable archive,
            replayable move by move, and aggregated into statistics.
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-12 gap-y-6">
          {[
            [manifest.totalGames.toLocaleString('en'), 'GAMES'],
            [manifest.monthsTracked, 'MONTHLY ARCHIVES'],
            [yearSpan, 'SPAN'],
          ].map(([value, label]) => (
            <div key={label}>
              <dd className="kol-display-subsection">{value}</dd>
              <dt className="kol-helper-10 text-fg-48 mt-1">{label}</dt>
            </div>
          ))}
        </dl>

        <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage) => (
            <li key={stage.n} className="border-t border-fg-12 pt-3">
              <span className="kol-helper-10 text-fg-48">{stage.n}</span>
              <h2 className="kol-mono-14 text-emphasis mt-2">{stage.name}</h2>
              <p className="kol-mono-12 text-fg-64 mt-2">{stage.text}</p>
              {stage.link && (
                <a
                  href={stage.link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="kol-mono-12 text-fg-64 mt-2 inline-flex items-center gap-1.5"
                >
                  {stage.link.label}
                  <Icon name="external-link" size={12} />
                </a>
              )}
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center gap-3">
          <Button iconLeft="grid" onClick={() => navigate('/analysis')}>
            Open the board
          </Button>
          <Button iconLeft="terminal" onClick={() => navigate('/database')}>
            Database
          </Button>
          <Button iconLeft="stat-chart-a" onClick={() => navigate('/stats')}>
            Statistics
          </Button>
          {/* external links share the row's button anatomy (website convention):
              anchor element, same .kol-btn chrome as the Buttons (one variant
              per purpose — the row is all content actions), trailing external mark */}
          {[
            ['Blog post', 'https://kolkrabbi.io/stack/27200-chess-games'],
            ['Chess set in the DS', 'https://ui.kolkrabbi.io/sets/chess-apparatus'],
            ['GitHub', 'https://github.com/Tor-Grimsson/kol-chess'],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="kol-btn kol-btn-primary kol-btn-md kol-mono-14 gap-2"
            >
              {label}
              <Icon name="external-link" size={14} />
            </a>
          ))}
        </div>

        <div>
          <span className="kol-helper-10 text-fg-48">BUILT WITH</span>
          <p className="kol-mono-12 text-fg-64 mt-1">
            React · Vite · KOL design system · chess.js · Stockfish 18 · DuckDB-WASM
          </p>
        </div>
      </main>
    </div>
  )
}
