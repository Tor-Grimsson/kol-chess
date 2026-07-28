import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameArchiveTable } from '@kolkrabbi/kol-chess'
import * as chessData from '@kolkrabbi/kol-chess/data'
import { Button, Textarea, TabsRow } from '@kolkrabbi/kol-component'
import { queueGame } from '../lib/gameHandoff'
import PasteGame from '../lib/PasteGame'
import { getDb, runQuery, SCHEMA } from './duck'

/* /database — ONE page over the 27.2k-game set, two ways in:
 *   Browse — the archive table ("Load here" hands the game to the board)
 *   Query  — the SQL console (DuckDB-WASM in the browser, no backend)
 * Merged from the former /games + /database (2026-07-28, user ruling). */

const CANNED = [
  {
    label: 'Win rate by color',
    sql: `SELECT color,
       count(*) AS games,
       round(100.0 * count(*) FILTER (WHERE result = 'win') / count(*), 1) AS win_pct
FROM games
GROUP BY color`,
  },
  {
    label: 'Most-played opponents',
    sql: `SELECT opponent,
       count(*) AS games,
       count(*) FILTER (WHERE result = 'win') AS wins,
       max(opponent_rating) AS best_rating
FROM games
GROUP BY opponent
ORDER BY games DESC
LIMIT 15`,
  },
  {
    label: 'Games per year',
    sql: `SELECT substr(month, 1, 4) AS year,
       count(*) AS games,
       round(100.0 * count(*) FILTER (WHERE result = 'win') / count(*), 1) AS win_pct
FROM games
GROUP BY year
ORDER BY year`,
  },
  {
    label: 'Blitz rating march',
    sql: `SELECT month, max(player_rating) AS peak
FROM games
WHERE time_class = 'blitz' AND rated
GROUP BY month
ORDER BY month`,
  },
]

const MAX_SHOWN = 200

const cell = (v) => {
  if (v === null || v === undefined) return '∅'
  if (typeof v === 'bigint') return v.toString()
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}

const PAGE_TABS = [
  { id: 'browse', label: 'Browse' },
  { id: 'query', label: 'Query' },
]

export default function DatabasePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('browse')
  const [status, setStatus] = useState('booting') // booting | ready | error
  const [rowCount, setRowCount] = useState(null)
  const [sql, setSql] = useState(CANNED[0].sql)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const loadOnBoard = (game) => {
    queueGame(game)
    navigate('/analysis')
  }

  useEffect(() => {
    let alive = true
    getDb()
      .then(({ rowCount: n }) => {
        if (!alive) return
        setRowCount(n)
        setStatus('ready')
      })
      .catch((err) => alive && (setError(err.message), setStatus('error')))
    return () => {
      alive = false
    }
  }, [])

  const run = async (query) => {
    setBusy(true)
    setError(null)
    try {
      setResult(await runQuery(query))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 py-8 md:px-6 md:py-12">
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-fg-12 pb-1">
        <div className="flex items-center gap-4">
          <h1 className="kol-sans-heading-05">Database</h1>
          <TabsRow tabs={PAGE_TABS} value={tab} onChange={setTab} />
        </div>
        {tab === 'browse' && <PasteGame onLoad={loadOnBoard} />}
      </div>

      {/* ── Browse — mounted always so scope/table state survives tab switches ── */}
      <div className={tab === 'browse' ? '' : 'hidden'}>
        <GameArchiveTable chessData={chessData} onGameLoad={loadOnBoard} />
      </div>

      <div className={tab === 'query' ? '' : 'hidden'}>
      <div className="kol-mono-12 text-fg-secondary mb-2">
        {status === 'booting' && 'loading the archive into DuckDB…'}
        {status === 'ready' && `games table · ${rowCount?.toLocaleString('en')} rows · DuckDB-WASM, in your browser`}
        {status === 'error' && 'failed to boot'}
      </div>

      <div className="kol-mono-12 text-fg-64 mb-6 flex flex-wrap gap-x-3 gap-y-1">
        {SCHEMA.map(([name, type]) => (
          <span key={name}>
            {name} <span className="text-fg-48">{type.toLowerCase()}</span>
          </span>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {CANNED.map((q) => (
          <Button
            key={q.label}
            variant="ghost"
            size="sm"
            disabled={status !== 'ready' || busy}
            onClick={() => {
              setSql(q.sql)
              run(q.sql)
            }}
          >
            {q.label}
          </Button>
        ))}
      </div>

      <Textarea
        value={sql}
        onChange={(event) => setSql(event.target.value)}
        rows={7}
        className="kol-mono-12 w-full"
        spellCheck={false}
      />
      <div className="mt-2 mb-8 flex items-center gap-3">
        <Button variant="primary" size="sm" disabled={status !== 'ready' || busy || !sql.trim()} onClick={() => run(sql)}>
          {busy ? 'Running…' : 'Run query'}
        </Button>
        {result && !error && (
          <span className="kol-mono-12 text-fg-secondary">
            {result.rows.length.toLocaleString('en')} rows · {result.ms} ms
            {result.rows.length > MAX_SHOWN && ` · showing first ${MAX_SHOWN}`}
          </span>
        )}
      </div>

      {error && <p className="kol-mono-12 text-fg-secondary whitespace-pre-wrap">{error}</p>}

      {result && !error && (
        <div className="overflow-x-auto">
          <table className="kol-table w-full">
            <thead>
              <tr>
                {result.columns.map((c) => (
                  <th key={c} className="kol-helper-10 text-fg-64 px-3 py-2 text-left">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.slice(0, MAX_SHOWN).map((row, i) => (
                <tr key={i} className="kol-table-row">
                  {result.columns.map((c) => (
                    <td key={c} className="kol-table-cell-text kol-mono-12 px-3 py-1.5">
                      {cell(row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  )
}
