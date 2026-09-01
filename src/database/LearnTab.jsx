import { Button, CodeBlock, ContentText, SectionText } from '@kolkrabbi/kol-component'

/* The Learn tab — an 8-step SQL curriculum that runs on the reader's own
 * 27k games, then a "Find games" recipe block: question-shaped filters,
 * each with the one value to swap. Every card ends in "Try it →", which
 * loads + executes the query in the Query tab. Copy is a first draft —
 * content layer, editable. */

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

/* Find games — one question per card, one WHERE, one value to swap.
 * Every card returns the url column: paste it into the board's Paste
 * popover (or open it on chess.com) to load the game. */
const COLS = 'SELECT played_at, opponent, opponent_rating, color, result, url\nFROM games\n'

const RECIPES = [
  {
    n: 'F1',
    title: 'Games against one opponent',
    body: 'Swap the username. Names are case-sensitive — copy one as it appears in Browse.',
    sql: COLS + "WHERE opponent = 'DARTH-ZANE'\nORDER BY played_at DESC",
  },
  {
    n: 'F2',
    title: 'My wins as black',
    body: "Swap 'black' ↔ 'white', or 'win' ↔ 'loss' / 'draw'.",
    sql: COLS + "WHERE color = 'black' AND result = 'win'\nORDER BY played_at DESC\nLIMIT 50",
  },
  {
    n: 'F3',
    title: 'Games in one opening',
    body: 'eco is the chess.com opening URL, so match on a word inside it. ILIKE is LIKE ignoring case; % means "anything here". Swap the word.',
    sql: COLS + "WHERE eco ILIKE '%Scandinavian%'\nORDER BY played_at DESC\nLIMIT 50",
  },
  {
    n: 'F4',
    title: 'Games in one month',
    body: "month is text in YYYY-MM form. Swap the month. For a whole year, use month LIKE '2023-%'.",
    sql: COLS + "WHERE month = '2023-06'\nORDER BY played_at",
  },
  {
    n: 'F5',
    title: 'Games between two dates',
    body: 'played_at is a timestamp; plain date strings work with BETWEEN. Swap either end.',
    sql: COLS + "WHERE played_at BETWEEN '2024-01-01' AND '2024-03-31'\nORDER BY played_at",
  },
  {
    n: 'F6',
    title: 'Rated blitz against strong opponents',
    body: "rated is true/false so it stands alone. Swap the rating floor or the time class ('bullet', 'rapid', 'daily').",
    sql: COLS + "WHERE rated AND time_class = 'blitz' AND opponent_rating >= 1800\nORDER BY opponent_rating DESC\nLIMIT 50",
  },
  {
    n: 'F7',
    title: 'Upsets — wins over higher-rated opponents',
    body: 'Columns can be compared to each other, not just to values. The ORDER BY sorts by the size of the rating gap.',
    sql: COLS + "WHERE result = 'win' AND opponent_rating > player_rating\nORDER BY opponent_rating - player_rating DESC\nLIMIT 50",
  },
  {
    n: 'F8',
    title: 'Stack the filters',
    body: 'Every condition above chains with AND. Drop a line to widen the net, add one to narrow it.',
    sql: COLS + "WHERE rated\n  AND color = 'black'\n  AND eco ILIKE '%Sicilian%'\n  AND result = 'win'\n  AND opponent_rating >= 1500\nORDER BY played_at DESC",
  },
]

/* Find games by OPENING — the second recipe group.
 *
 * `eco` is not a three-letter code: it is chess.com's opening URL, e.g.
 *   https://www.chess.com/openings/Kings-Gambit-Accepted-Fischer-Defense-4.Bc4
 * so the family, the variation and the move that defined it are all inside one
 * string. That makes openings queryable with plain text matching — and it is why
 * the cards below are mostly about getting a NAME out of a URL.
 *
 * THE CAVEAT THAT RIDES EVERY ROW: this is the opening the game was classified
 * as at the END of its opening phase, not the one chosen at move 1. Openings
 * transpose — a line reached from a different move order lands in the same
 * bucket. Counting them is right; calling them all a deliberate choice is not.
 */
const OPENING_RECIPES = [
  {
    n: 'O1',
    title: 'The opening name, pulled out of the URL',
    body: 'regexp_extract takes the first bracketed group of the pattern. Here it grabs the letters-and-dashes right after /openings/, which is the family plus variation, and replace() turns the dashes into spaces. Everything below builds on this line.',
    sql:
      "SELECT replace(regexp_extract(eco, 'openings/([A-Za-z-]+)', 1), '-', ' ') AS opening,\n" +
      '       count(*) AS games\n' +
      'FROM games\n' +
      'WHERE eco IS NOT NULL\n' +
      'GROUP BY opening\nORDER BY games DESC\nLIMIT 25',
  },
  {
    n: 'O2',
    title: 'Score by opening family',
    body: 'A win is 1, a draw is a half, a loss is 0 — that is score%, the number that actually says whether an opening works. split_part cuts the URL at each dash and keeps the first two words, which is roughly the family. min 30 games so a lucky handful cannot top the table.',
    sql:
      "SELECT split_part(regexp_extract(eco, 'openings/([A-Za-z-]+)', 1), '-', 1) || ' ' ||\n" +
      "       split_part(regexp_extract(eco, 'openings/([A-Za-z-]+)', 1), '-', 2) AS family,\n" +
      '       count(*) AS games,\n' +
      "       round(100.0 * (count(*) FILTER (WHERE result = 'win') +\n" +
      "                      0.5 * count(*) FILTER (WHERE result = 'draw')) / count(*), 1) AS score_pct\n" +
      'FROM games\nWHERE eco IS NOT NULL\nGROUP BY family\nHAVING count(*) >= 30\nORDER BY score_pct DESC',
  },
  {
    n: 'O3',
    title: "Inside one opening — King's Gambit variations",
    body: "ILIKE '%Kings-Gambit%' catches every King's Gambit line. Grouping by the full opening string breaks the family into its variations, so you can see which branch carries the score and which one leaks. Swap the pattern for any opening.",
    sql:
      "SELECT replace(regexp_extract(eco, 'openings/([A-Za-z-]+)', 1), '-', ' ') AS variation,\n" +
      '       count(*) AS games,\n' +
      "       round(100.0 * (count(*) FILTER (WHERE result = 'win') +\n" +
      "                      0.5 * count(*) FILTER (WHERE result = 'draw')) / count(*), 1) AS score_pct\n" +
      "FROM games\nWHERE eco ILIKE '%Kings-Gambit%'\nGROUP BY variation\nHAVING count(*) >= 20\nORDER BY games DESC",
  },
  {
    n: 'O4',
    title: 'Does an opening survive stronger opposition?',
    body: "Rounding the rating to the nearest hundred buckets the games into bands, so you can read one opening down the rating ladder. The Dutch is the example because it is the interesting case — watch what the score does as the band climbs.",
    sql:
      'SELECT round(player_rating / 100) * 100 AS band,\n' +
      '       count(*) AS games,\n' +
      "       round(100.0 * (count(*) FILTER (WHERE result = 'win') +\n" +
      "                      0.5 * count(*) FILTER (WHERE result = 'draw')) / count(*), 1) AS score_pct\n" +
      "FROM games\nWHERE eco ILIKE '%Dutch%'\nGROUP BY band\nHAVING count(*) >= 20\nORDER BY band",
  },
  {
    n: 'O5',
    title: 'The openings that beat me',
    body: 'Flip the question: instead of what you score with an opening, ask which ones you lose in most often. Filter by colour to separate your own repertoire from what is being played at you.',
    sql:
      "SELECT replace(regexp_extract(eco, 'openings/([A-Za-z-]+)', 1), '-', ' ') AS opening,\n" +
      '       count(*) AS losses\n' +
      "FROM games\nWHERE result = 'loss' AND color = 'black' AND eco IS NOT NULL\n" +
      'GROUP BY opening\nORDER BY losses DESC\nLIMIT 20',
  },
  {
    n: 'O6',
    title: 'One opening, over the years',
    body: 'A repertoire is not static. Grouping an opening by year shows when you picked it up, when it peaked, and whether you still play it. Swap the pattern for any opening you want the history of.',
    sql:
      "SELECT substr(month, 1, 4) AS year,\n" +
      '       count(*) AS games,\n' +
      "       round(100.0 * (count(*) FILTER (WHERE result = 'win') +\n" +
      "                      0.5 * count(*) FILTER (WHERE result = 'draw')) / count(*), 1) AS score_pct\n" +
      "FROM games\nWHERE eco ILIKE '%French%'\nGROUP BY year\nORDER BY year",
  },
]

/* One card = the DS content text (article row: kicker · title · body) over
 * the one code surface (CodeBlock) and a Button. Seam is the opaque tier. */
function Card({ item, onTry }) {
  return (
    <section className="flex flex-col gap-3 border-t border-oq-08 pt-3">
      <ContentText variant="article" form="row" kicker={item.n} title={item.title} body={item.body} />
      <CodeBlock code={item.sql} language="sql" size="sm" />
      <div>
        <Button variant="primary" size="sm" onClick={() => onTry(item.sql)}>
          Try it →
        </Button>
      </div>
    </section>
  )
}

export default function LearnTab({ onTry }) {
  return (
    <div className="max-w-[var(--kol-content-canvas)]">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {LESSONS.map((lesson) => (
          <Card key={lesson.n} item={lesson} onTry={onTry} />
        ))}
      </div>
      <SectionText
        className="mt-12 mb-8"
        headline="Find games"
        headlineAs="h2"
        headlineSize="heading-04"
        body="One question per card. Try it, then change the one value the note points at."
        bodyClass="kol-mono-12 text-fg-64"
        gap="gap-2"
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {RECIPES.map((recipe) => (
          <Card key={recipe.n} item={recipe} onTry={onTry} />
        ))}
      </div>
      <SectionText
        className="mt-12 mb-8"
        headline="Openings"
        headlineAs="h2"
        headlineSize="heading-04"
        body="eco holds the chess.com opening URL, so the family, the variation and the move that named it all sit in one string. These pull a readable name out of it and then ask the questions worth asking. One caveat rides every row: this is what the game was classified as at the end of its opening phase, not what was chosen at move 1 — openings transpose into one another."
        bodyClass="kol-mono-12 text-fg-64"
        gap="gap-2"
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {OPENING_RECIPES.map((recipe) => (
          <Card key={recipe.n} item={recipe} onTry={onTry} />
        ))}
      </div>
    </div>
  )
}
