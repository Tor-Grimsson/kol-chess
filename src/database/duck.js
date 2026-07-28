import * as duckdb from '@duckdb/duckdb-wasm'
import duckdbWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
import duckdbWasmEh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'
import { loadFullDataset } from '@kolkrabbi/kol-chess/data'

/* DuckDB-WASM over the full archive, fully self-hosted (wasm + workers come
 * from the installed package via Vite ?url — no CDN dependency beyond the
 * B2 game data itself). One shared init promise: the 27k-row ingest happens
 * once per session, re-visits reuse the connection. */

const MANUAL_BUNDLES = {
  mvp: { mainModule: duckdbWasm, mainWorker: mvpWorker },
  eh: { mainModule: duckdbWasmEh, mainWorker: ehWorker },
}

/* The one table, flattened from the adapter's nested game-meta at ingest —
 * a clean single-level schema queries better than structs. */
export const SCHEMA = [
  ['played_at', 'TIMESTAMP'],
  ['month', 'VARCHAR'],
  ['rated', 'BOOLEAN'],
  ['time_class', 'VARCHAR'],
  ['time_control', 'VARCHAR'],
  ['color', 'VARCHAR'],
  ['result', 'VARCHAR'],
  ['player_rating', 'BIGINT'],
  ['opponent', 'VARCHAR'],
  ['opponent_rating', 'BIGINT'],
  ['eco', 'VARCHAR'],
  ['url', 'VARCHAR'],
]

const INGEST = `
CREATE TABLE games AS
SELECT
  to_timestamp(endTime)  AS played_at,
  month,
  rated,
  timeClass              AS time_class,
  timeControl            AS time_control,
  playerColor            AS color,
  playerResult           AS result,
  player.rating          AS player_rating,
  opponent.username      AS opponent,
  opponent.rating        AS opponent_rating,
  eco,
  url
FROM read_json_auto('games.json')
`

let ready = null

export const getDb = () => {
  ready ??= (async () => {
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES)
    const worker = new Worker(bundle.mainWorker)
    const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING), worker)
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
    const games = await loadFullDataset()
    await db.registerFileText('games.json', JSON.stringify(games))
    const conn = await db.connect()
    await conn.query(INGEST)
    return { conn, rowCount: games.length }
  })()
  return ready
}

export const runQuery = async (sql) => {
  const { conn } = await getDb()
  const t0 = performance.now()
  const table = await conn.query(sql)
  const ms = Math.round(performance.now() - t0)
  const columns = table.schema.fields.map((f) => f.name)
  const rows = table.toArray().map((row) => row.toJSON())
  return { columns, rows, ms }
}
