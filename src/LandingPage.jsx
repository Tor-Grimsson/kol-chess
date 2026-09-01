import { useNavigate } from 'react-router-dom'
import { Button, SectionText, SectionCardItem } from '@kolkrabbi/kol-component'
import PageHeader from './PageHeader'
import { getManifest } from './data/sample-games.js'

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
    <div className="kol-page">
      <PageHeader title="Overview" />
      <main className="flex max-w-[var(--kol-content-canvas)] flex-col gap-12 md:gap-16">
        <SectionText
          headline={`${manifest.totalGames.toLocaleString('en')} games, one database.`}
          headlineAs="h2"
          headlineClass="kol-display-section"
          body="Every game scraped from chess.com, stored as a browsable archive, replayable move by move, and aggregated into statistics."
          bodyClass="kol-mono-14 text-fg-64 max-w-[var(--kol-content-measure)]"
          gap="gap-5"
        />

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

        {/* the DS feature card: title header, the step number as the visual,
            mono description footer; a card with a link IS the link */}
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage) => (
            <li key={stage.n} className="flex">
              <SectionCardItem
                title={stage.name}
                visual={<span className="kol-display-subsection">{stage.n}</span>}
                description={stage.link ? `${stage.text} ${stage.link.label} ↗` : stage.text}
                href={stage.link?.href}
              />
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
          {/* external links: the same Button, link form (href) */}
          {[
            ['Blog post', 'https://kolkrabbi.io/stack/27200-chess-games'],
            ['Chess set in the DS', 'https://ui.kolkrabbi.io/sets/chess-apparatus'],
            ['GitHub', 'https://github.com/Tor-Grimsson/kol-chess'],
          ].map(([label, href]) => (
            <Button key={href} href={href} iconRight="external-link" target="_blank" rel="noreferrer">
              {label}
            </Button>
          ))}
        </div>

        <SectionText
          label="BUILT WITH"
          body="React · Vite · KOL design system · chessops · Stockfish 18 · DuckDB-WASM"
          bodyClass="kol-mono-12 text-fg-64"
          gap="gap-1"
        />
      </main>
    </div>
  )
}
