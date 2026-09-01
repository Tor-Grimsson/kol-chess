import { useEffect, useState } from 'react'
import { SectionText, ContentText, CodeBlock, Badge } from '@kolkrabbi/kol-component'
import PageHeader from '../PageHeader'

/* THE REAL SOURCE, NOT A COPY OF IT (2026-08-31).
 *
 * Every code block on this page is the actual file, imported with Vite's
 * `?raw` and sliced to the function being discussed. A page that quotes code
 * by hand starts true and rots the first time the file changes; this one
 * cannot drift, because there is only one copy and the build reads it.
 *
 * Same rule as the numbers: the metrics come from
 * `public/models/personality.json`, written by `train/export.py` at the end of
 * a real training run. If no model has been trained, the page says so rather
 * than printing a number nobody measured.
 */
import encodingSrc from '../../train/encoding.py?raw'
import prepareSrc from '../../train/prepare.py?raw'
import modelSrc from '../../train/model.py?raw'
import finetuneSrc from '../../train/finetune.py?raw'

const BASE = import.meta.env.BASE_URL
const getJson = (path) =>
  fetch(`${BASE}${path}`).then((r) => {
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`)
    return r.json()
  })

/* Pull one top-level `def` or `class` out of a Python file by name, so a block
   shows the real thing without pasting 150 lines of it. */
const excerpt = (src, name) => {
  const start = src.search(new RegExp(`^(def|class) ${name}\\b`, 'm'))
  if (start < 0) return `# ${name} not found`
  const rest = src.slice(start)
  const end = rest.search(/\n(?=(def|class) |\w)/)
  return (end < 0 ? rest : rest.slice(0, end)).trimEnd()
}

const Row = ({ k, v }) => (
  <div className="grid grid-cols-1 gap-1 border-b border-oq-08 py-2 sm:grid-cols-[11rem_1fr] sm:items-baseline sm:gap-3">
    <span className="kol-helper-12 text-fg-48">{k}</span>
    <span className="kol-mono-12 text-fg-80 min-w-0 break-words">{v}</span>
  </div>
)

const Block = ({ label, headline, children }) => (
  <section className="flex flex-col gap-3">
    <SectionText label={label} headline={headline} headlineAs="h2" headlineSize="heading-04" gap="gap-2" />
    {children}
  </section>
)

const P = ({ children }) => (
  <p className="kol-mono-12 text-fg-64 max-w-[var(--kol-content-measure)]">{children}</p>
)

const pct = (v) => (typeof v === 'number' ? `${(v * 100).toFixed(2)}%` : '—')

/* Only the moves it actually considers. Printing the tail as "e3 0%" reads as
   a broken number rather than as "it never plays this". */
const repertoireLine = (moves) =>
  moves
    .filter((m) => m.p >= 0.01)
    .map((m) => `${m.san} ${(m.p * 100).toFixed(0)}%`)
    .join(' · ')

const BotPage = () => {
  const [book, setBook] = useState(null)
  const [model, setModel] = useState(null)
  const [modelMissing, setModelMissing] = useState(false)

  useEffect(() => {
    let alive = true
    getJson('books/style-book.json')
      .then((b) => alive && setBook(b.meta))
      .catch(() => {})
    getJson('models/personality.json')
      .then((m) => alive && setModel(m))
      .catch(() => alive && setModelMissing(true))
    return () => {
      alive = false
    }
  }, [])

  /* How much better than guessing his single most common move, every time. */
  const lift =
    model?.move_match && model?.baseline ? (model.move_match / model.baseline).toFixed(1) : null

  return (
    <div className="kol-page flex flex-col gap-14">
      <PageHeader
        title="How the bot works"
        meta={
          <span className="kol-mono-14 text-fg-64">
            a policy network trained on 27,200 games
          </span>
        }
      />

      <Block label="THE SHORT VERSION" headline="It predicts the move he would play">
        <P>
          A neural network is shown a position and asked which move Biskupstunga plays here — not
          which move is best. It was trained on every move he made in 27,200 chess.com games, and
          it is told his rating at the time, so the same network answers differently at 1200 and at
          1900.
        </P>
        <P>
          An opening book still handles the first few moves, because exact memorised lines beat a
          network in positions he has literally been in hundreds of times. Everything after that —
          which used to be a generic engine at a fixed strength, and was nobody — is the model.
        </P>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" size="sm">974,566 training positions</Badge>
          <Badge variant="secondary" size="sm">2.36M parameters</Badge>
          <Badge variant={model ? 'success' : 'outline'} size="sm">
            {model ? `${pct(model.move_match)} move match` : 'no model trained yet'}
          </Badge>
        </div>
      </Block>

      <Block label="1 · THE DATA" headline="Every move he ever made becomes one training example">
        <P>
          One sample per move <em>he</em> played: the position he faced, the move he chose, and his
          rating. Nothing consults an engine — the label is what he actually played, mistakes
          included, because the mistakes are the personality.
        </P>
        <P>
          The old opening book read only the first 30 plies and threw away any position it had not
          seen twice, which kept 5.9% of what it observed. None of that applies to a network: a
          position reached once still teaches something, and move 40 teaches as much as move 4.
        </P>
        <div className="flex flex-col">
          <Row k="Source" v="106 monthly PGN files from chess.com, cached locally" />
          <Row k="Samples" v="974,566 — whole games, no ply cap, no minimum" />
          <Row k="By phase" v="middlegame 424,581 · opening 321,997 · endgame 227,988" />
          <Row k="Rating span" v="1100–1900, every band populated (median 1584)" />
          <Row k="Built by" v="train/prepare.py · Python, ~140 lines" />
        </div>
        <CodeBlock language="python" filename="train/encoding.py" size="sm"
          code={excerpt(encodingSrc, 'encode_board')} />
        <P>
          The board becomes 18 planes of 8×8 — one per piece type per colour, plus side to move,
          castling rights and en passant. It is written from the mover's point of view and mirrored
          when black moves, so the network only ever learns one perspective instead of two from
          half the data.
        </P>
        <CodeBlock language="python" filename="train/prepare.py" size="sm"
          code={excerpt(prepareSrc, 'samples_from')} />
      </Block>

      <Block label="2 · THE NETWORK" headline="A residual tower, and the rating as an input plane">
        <P>
          Chess is repetitive in space: a knight fork looks the same on b5 as on g5. A convolution
          learns that pattern once instead of sixty-four times, which is why this is a residual
          tower and not a stack of dense layers — the same shape Maia and Leela use.
        </P>
        <P>
          The one addition is the rating. It is broadcast to a full plane and fed in at the stem,
          so every layer sees it. That is what lets one model cover the whole range rather than
          training eight of them, and it is what the strength setting on the play page actually
          controls.
        </P>
        <CodeBlock language="python" filename="train/model.py" size="sm"
          code={excerpt(modelSrc, 'Personality')} />
        <div className="flex flex-col">
          <Row k="Shape" v="6 residual blocks × 64 filters — Maia's tower, unshrunk" />
          <Row k="Parameters" v={model ? `2,360,482 (${model.size_mb} MB as ONNX)` : '2,360,482'} />
          <Row k="Output" v="1858 moves — every queen ray, knight jump and underpromotion" />
          <Row k="Why so small" v="it trains on a CPU here and downloads into a phone" />
        </div>
      </Block>

      <Block label="3 · THE TRAINING" headline="Predict his move, and split so the score is honest">
        <P>
          Cross-entropy against the move he played. The part that takes discipline is not the loop
          but the split: dividing moves at random puts the same game's opening on both sides of the
          fence, and the model scores well by recognising positions it was trained on. Whole games
          are held out instead.
        </P>
        <CodeBlock language="python" filename="train/finetune.py" size="sm"
          code={excerpt(finetuneSrc, 'split_by_game')} />
        <P>
          The metric is move-match — of his held-out moves, how many does the model pick — because
          loss going down only proves the optimiser works. The number to beat is guessing his
          single most common move every time.
        </P>
        <CodeBlock language="python" filename="train/finetune.py" size="sm"
          code={excerpt(finetuneSrc, 'move_match')} />
      </Block>

      <Block label="4 · DOES IT WORK" headline="The scoreboard, from the last real run">
        {modelMissing && (
          <P>
            No model has been trained into <code>public/models/</code> yet, so there is nothing to
            report here. Run <code>train/finetune.py</code> then <code>train/export.py</code>.
          </P>
        )}
        {model && (
          <div className="flex flex-col">
            <Row k="Move match" v={`${pct(model.move_match)} of his held-out moves picked exactly`} />
            <Row k="Top-3" v={`${pct(model.top3)} — his move is in the model's top three`} />
            <Row k="Baseline" v={`${pct(model.baseline)} — always guessing his most common move`} />
            <Row k="Lift over baseline" v={lift ? `${lift}×` : '—'} />
            <Row k="Held out" v="whole games, never seen in training" />
            <Row
              k="Rating actually used"
              v={
                typeof model.conditioning_flip === 'number'
                  ? `asked at 1100 and at 1900, the top move differs on ${pct(model.conditioning_flip)} of positions`
                  : '—'
              }
            />
            <Row k="Trained for" v={model.epoch ? `${model.epoch} epoch${model.epoch > 1 ? 's' : ''}` : '—'} />
          </div>
        )}
        <P>
          The rating row is there because nothing in the training forces the network to use that
          plane — it is free to ignore it and be one strength wearing eight labels. So it is
          measured on real positions rather than asserted, and the number ships whatever it says.
        </P>
        <P>
          Published Maia models reach roughly 50% move-match against a whole rating population.
          This one is aimed at a single player on a fraction of the data and trained on a CPU, so
          it is measured against the honest baseline above rather than against that headline.
        </P>
      </Block>

      <Block label="THE EVIDENCE" headline="It reproduces his repertoire, unprompted">
        <P>
          The strongest thing on this page, and the cheapest to check. The network was never shown
          the opening book — it only ever saw board planes and the move he played. If it
          independently arrives at his repertoire, it has learned <em>him</em> rather than learned
          chess.
        </P>
        {model?.repertoire ? (
          <div className="flex flex-col">
            <Row
              k="First move"
              v={repertoireLine(model.repertoire.start)}
            />
            <Row
              k="After 1.e4 e5"
              v={repertoireLine(model.repertoire.after_e4_e5)}
            />
            <Row k="His book says" v="e4 13,391× vs d4 99× · then f4 3,748×, the King's Gambit" />
          </div>
        ) : (
          <P>No model trained yet.</P>
        )}
      </Block>

      <Block label="5 · IN THE BROWSER" headline="Exported to ONNX, and nothing leaves the machine">
        <P>
          The trained weights go out as ONNX and run through onnxruntime-web. No server, no API —
          the same property the rest of this app has. The model only downloads when a game actually
          needs a move out of book.
        </P>
        <div className="flex flex-col">
          <Row k="Runtime" v="onnxruntime-web, wasm backend" />
          <Row k="Model" v={model ? `public/models/personality.onnx · ${model.size_mb} MB` : 'not built'} />
          <Row k="Legal moves" v="masked before the softmax — a policy head does not know the rules" />
          <Row k="Export check" v="train/export.py fails if ONNX and PyTorch disagree" />
        </div>
        <P>
          The riskiest seam in the whole thing is that the board is encoded twice — by Python for
          training and by JavaScript at play time. A mismatch throws no error; the model simply
          receives a position from a world it never saw. So the move list is exported rather than
          re-derived, and a test checks the JavaScript encoder against planes generated by the
          Python one, plane by plane. It has already caught one: en passant, where the two chess
          libraries disagree on 8% of positions.
        </P>
      </Block>

      <Block label="6 · WHAT IT STILL CANNOT DO" headline="The honest limits">
        <P>
          <strong>The masters have no model.</strong> Fischer and the rest are still opening books
          and an engine — there is no archive of their moves at nine different ratings to train on,
          and 800 games is not 27,200.
        </P>
        <P>
          <strong>It has no idea whether it is winning.</strong> There is a policy head and no value
          head: it predicts the move he would play, not the move that wins. In a lost position it
          plays what he plays in lost positions, which is the point, but it cannot tell you that.
        </P>
        <P>
          <strong>It was trained on a CPU.</strong> Six blocks of 64 filters on an Intel iMac with no
          usable GPU. A larger tower on real hardware would score better; this is what fits.
        </P>
        <P>
          <strong>The years are lopsided.</strong> 2017 contributes 8,984 games and 2022 contributes
          382, so it knows early him far better than recent him.
        </P>
      </Block>

      <Block label="STATUS" headline="Ongoing, and openly unfinished">
        <P>
          The book is still there for the opening and the think-time still comes from his real
          clocks. What changed is everything after move three, which used to be a stranger.
        </P>
        {book && (
          <div className="flex flex-col">
            <Row k="Book" v={`${book.positions.toLocaleString()} positions · ${book.games.toLocaleString()} games`} />
            <Row k="Model" v={model ? `trained · ${pct(model.move_match)} move match` : 'not trained'} />
          </div>
        )}
        <ContentText
          variant="default"
          title="Everything here is checkable"
          date="Four Python files in train/, one inference module in src/play/. The code on this page is imported from those files, not copied."
        />
      </Block>
    </div>
  )
}

export default BotPage
