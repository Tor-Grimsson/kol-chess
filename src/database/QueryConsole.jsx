import { useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import { Button, MenuItem, MenuDropdownItem, Table, Tag } from '@kolkrabbi/kol-component'
import { useTheme } from '@kolkrabbi/kol-framework'
import { getDb, runQuery, SCHEMA } from './duck'

/* The Query tab, modeled on the DuckDB Local UI at one-table scale:
 * clickable schema chips insert into the editor · CodeMirror SQL editor with
 * ⌘-Enter · per-column result profiles (type / distinct / min–max) · saved
 * queries + run history in localStorage. */

const SAVED_KEY = 'kol-chess-sql-saved'
const HISTORY_KEY = 'kol-chess-sql-history'
const MAX_SHOWN = 200
const HISTORY_SHOWN = 5

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

const readStore = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? []
  } catch {
    return []
  }
}
const writeStore = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* storage blocked */ }
}

const cell = (v) => {
  if (v === null || v === undefined) return '∅'
  if (typeof v === 'bigint') return v.toString()
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}

/* Per-column mini profile, DuckDB-UI style: distinct count always; min–max
 * for numeric/date columns. Computed over the returned rows (capped). */
const profileColumns = (columns, rows) => {
  const sample = rows.slice(0, 10000)
  return columns.map((name) => {
    const values = sample.map((r) => r[name]).filter((v) => v !== null && v !== undefined)
    const distinct = new Set(values.map((v) => (typeof v === 'bigint' ? v.toString() : v))).size
    const numeric = values.length && values.every((v) => typeof v === 'number' || typeof v === 'bigint' || v instanceof Date)
    let range = null
    if (numeric) {
      const nums = values.map((v) => (v instanceof Date ? v : Number(v)))
      const min = nums.reduce((a, b) => (a < b ? a : b))
      const max = nums.reduce((a, b) => (a > b ? a : b))
      range = `${cell(min)} – ${cell(max)}`
    }
    return { distinct, range, nulls: sample.length - values.length }
  })
}

export default function QueryConsole({ lessonSql = null, onLessonConsumed = () => {} }) {
  const { isDark } = useTheme()
  const [status, setStatus] = useState('booting') // booting | ready | error
  const [rowCount, setRowCount] = useState(null)
  const [query, setQuery] = useState(CANNED[0].sql)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [profiles, setProfiles] = useState(null)
  const [saved, setSaved] = useState(() => readStore(SAVED_KEY))
  const [history, setHistory] = useState(() => readStore(HISTORY_KEY))
  const editorRef = useRef(null)
  const runRef = useRef(() => {})

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

  const run = async (q) => {
    setBusy(true)
    setError(null)
    try {
      const res = await runQuery(q)
      setResult(res)
      setProfiles(profileColumns(res.columns, res.rows))
      const next = [q, ...history.filter((h) => h !== q)].slice(0, 20)
      setHistory(next)
      writeStore(HISTORY_KEY, next)
    } catch (err) {
      setError(err.message)
      setResult(null)
      setProfiles(null)
    } finally {
      setBusy(false)
    }
  }
  runRef.current = () => run(query)

  /* "Try it" from the Learn tab: load the lesson query and execute it.
   * runQuery awaits the DuckDB boot internally, so this is safe mid-boot. */
  useEffect(() => {
    if (!lessonSql) return
    setQuery(lessonSql)
    run(lessonSql)
    onLessonConsumed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonSql])

  const insertAtCursor = (text) => {
    const view = editorRef.current?.view
    if (!view) return
    const { from, to } = view.state.selection.main
    view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } })
    view.focus()
  }

  const saveCurrent = () => {
    const name = query.trim().split('\n')[0].slice(0, 48) || 'untitled'
    const next = [{ name, sql: query }, ...saved.filter((s) => s.sql !== query)].slice(0, 12)
    setSaved(next)
    writeStore(SAVED_KEY, next)
  }
  const deleteSaved = (sqlText) => {
    const next = saved.filter((s) => s.sql !== sqlText)
    setSaved(next)
    writeStore(SAVED_KEY, next)
  }

  return (
    <div>
      <div className="kol-mono-12 text-fg-secondary mb-2">
        {status === 'booting' && 'loading the archive into DuckDB…'}
        {status === 'ready' && `games table · ${rowCount?.toLocaleString('en')} rows · DuckDB-WASM, in your browser · ⌘⏎ runs`}
        {status === 'error' && 'failed to boot'}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* schema as an insert menu — pick a column, it lands at the cursor */}
        <MenuItem label="Columns">
          {SCHEMA.map(([name, type]) => (
            <MenuDropdownItem key={name} onClick={() => insertAtCursor(name)} shortcut={type.toLowerCase()}>
              {name}
            </MenuDropdownItem>
          ))}
        </MenuItem>
        {CANNED.map((q) => (
          <Button
            key={q.label}
            variant="grey"
            size="sm"
            disabled={status !== 'ready' || busy}
            onClick={() => {
              setQuery(q.sql)
              run(q.sql)
            }}
          >
            {q.label}
          </Button>
        ))}
        {saved.map((s) => (
          <span key={s.sql} className="flex items-center">
            <Button
              variant="grey"
              size="sm"
              disabled={status !== 'ready' || busy}
              onClick={() => {
                setQuery(s.sql)
                run(s.sql)
              }}
            >
              {s.name}
            </Button>
            <Button variant="ghost" size="sm" iconOnly="x" aria-label={`Delete ${s.name}`} onClick={() => deleteSaved(s.sql)} />
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded border border-fg-12">
        <CodeMirror
          ref={editorRef}
          value={query}
          onChange={setQuery}
          theme={isDark ? 'dark' : 'light'}
          extensions={[
            sql(),
            /* Prec.highest — the default keymap binds Mod-Enter (insertBlankLine)
             * and would swallow it otherwise */
            Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => (runRef.current(), true) }])),
          ]}
          basicSetup={{ lineNumbers: true, foldGutter: false }}
          minHeight="140px"
        />
      </div>

      <div className="mt-2 mb-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" size="sm" disabled={status !== 'ready' || busy || !query.trim()} onClick={() => run(query)}>
          {busy ? 'Running…' : 'Run query'}
        </Button>
        <Button variant="grey" size="sm" disabled={!query.trim()} onClick={saveCurrent}>
          Save query
        </Button>
        {result && !error && (
          <span className="kol-mono-12 text-fg-secondary">
            {result.rows.length.toLocaleString('en')} rows · {result.ms} ms
            {result.rows.length > MAX_SHOWN && ` · showing first ${MAX_SHOWN}`}
          </span>
        )}
      </div>

      {history.length > 0 && (
        <div className="kol-mono-12 text-fg-48 mb-6 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="kol-helper-10">HISTORY</span>
          {history.slice(0, HISTORY_SHOWN).map((h) => (
            <Tag key={h} hash={false} size="sm" variant="secondary" className="max-w-64 truncate" onClick={() => setQuery(h)}>
              {h.replace(/\s+/g, ' ')}
            </Tag>
          ))}
        </div>
      )}

      {error && <p className="kol-mono-12 text-fg-secondary whitespace-pre-wrap">{error}</p>}

      {result && !error && (
        /* THE data table (kol-component Table) — a query result needs the room,
           so width="column" (no panel cap). The header cell carries the
           DuckDB-UI column profile: type · distinct · range · nulls. */
        <Table
          width="column"
          columns={result.columns.map((c, i) => ({
            accessor: c,
            header: (
              <span className="flex flex-col gap-0.5">
                <span>{c}</span>
                <span className="kol-mono-10 text-fg-48 font-normal normal-case">
                  {result.types[i].toLowerCase()} · {profiles?.[i]?.distinct} distinct
                  {profiles?.[i]?.range && <span> · {profiles[i].range}</span>}
                  {profiles?.[i]?.nulls > 0 && <span> · {profiles[i].nulls} ∅</span>}
                </span>
              </span>
            ),
            render: (row) => cell(row[c]),
          }))}
          rows={result.rows.slice(0, MAX_SHOWN)}
        />
      )}
    </div>
  )
}
