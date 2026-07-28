import { Button } from '@kolkrabbi/kol-component'

/* The Learn tab — an 8-step SQL curriculum that runs on the reader's own
 * 27k games. Every lesson ends in "Try it →", which loads + executes the
 * query in the Query tab. Copy is a first draft — content layer, editable. */

const LESSONS = [
  {
    n: '01',
    title: 'Tables, rows, columns',
    body: 'A database holds tables. A table is rows (one per thing — here, one per game) and columns (one per fact about it — opponent, result, rating). Every column has a type: text, number, date. That is the whole mental model.',
    sql: 'SELECT * FROM games LIMIT 10',
  },
  {
    n: '02',
    title: 'SELECT — choosing columns',
    body: 'SELECT names the columns you want, FROM names the table. LIMIT caps how many rows come back. The star means "every column" — naming them is usually better.',
    sql: 'SELECT played_at, opponent, result FROM games LIMIT 20',
  },
  {
    n: '03',
    title: 'WHERE — filtering rows',
    body: 'WHERE keeps only rows that pass a condition. Conditions combine with AND / OR. Text values go in single quotes.',
    sql: "SELECT played_at, opponent, opponent_rating\nFROM games\nWHERE time_class = 'blitz' AND result = 'win'\nLIMIT 20",
  },
  {
    n: '04',
    title: 'ORDER BY — sorting',
    body: 'ORDER BY sorts the result by a column — ASC (default) or DESC. Sort by opponent rating descending and the first rows are your biggest scalps.',
    sql: "SELECT played_at, opponent, opponent_rating\nFROM games\nWHERE result = 'win'\nORDER BY opponent_rating DESC\nLIMIT 10",
  },
  {
    n: '05',
    title: 'Aggregates — one answer from many rows',
    body: 'count, avg, min, max collapse many rows into a single number. Without a GROUP BY the whole table becomes one row of totals.',
    sql: 'SELECT count(*) AS games,\n       round(avg(opponent_rating)) AS avg_opponent,\n       max(player_rating) AS peak_rating\nFROM games\nWHERE rated',
  },
  {
    n: '06',
    title: 'GROUP BY — counting in buckets',
    body: 'GROUP BY collapses rows that share a value into one row per value — per opponent, per month, per opening. Aggregates then run inside each bucket.',
    sql: 'SELECT opponent, count(*) AS games\nFROM games\nGROUP BY opponent\nORDER BY games DESC\nLIMIT 10',
  },
  {
    n: '07',
    title: 'FILTER — conditional counting',
    body: 'A FILTER clause makes an aggregate count only rows that match a condition. Counting wins inside the same query that counts games gives you win-rate in one pass.',
    sql: "SELECT time_class,\n       count(*) AS games,\n       count(*) FILTER (WHERE result = 'win') AS wins,\n       round(100.0 * count(*) FILTER (WHERE result = 'win') / count(*), 1) AS win_pct\nFROM games\nGROUP BY time_class\nORDER BY games DESC",
  },
  {
    n: '08',
    title: 'Window functions — comparing rows to neighbours',
    body: 'A window function reads other rows without collapsing them — lag() looks at the previous row. WITH names a sub-result so you can build in steps: first peak rating per month, then each month compared to the one before.',
    sql: "WITH monthly AS (\n  SELECT month, max(player_rating) AS peak\n  FROM games\n  WHERE time_class = 'blitz' AND rated\n  GROUP BY month\n)\nSELECT month, peak,\n       peak - lag(peak) OVER (ORDER BY month) AS change\nFROM monthly\nORDER BY month",
  },
]

export default function LearnTab({ onTry }) {
  return (
    <div className="grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
      {LESSONS.map((lesson) => (
        <section key={lesson.n} className="border-t border-fg-12 pt-3">
          <span className="kol-helper-10 text-fg-48">{lesson.n}</span>
          <h2 className="kol-mono-14 text-emphasis mt-2">{lesson.title}</h2>
          <p className="kol-mono-12 text-fg-64 mt-2">{lesson.body}</p>
          <pre className="kol-mono-12 text-fg-80 mt-3 overflow-x-auto rounded bg-oq-02 p-3">{lesson.sql}</pre>
          <div className="mt-2">
            <Button variant="primary" size="sm" onClick={() => onTry(lesson.sql)}>
              Try it →
            </Button>
          </div>
        </section>
      ))}
    </div>
  )
}
