import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from '../lib/rules.js'
import { ChessBoard, NotationPanel } from '@kolkrabbi/kol-chess'
import { Button, Badge, Dropdown, ToggleSwitch } from '@kolkrabbi/kol-component'
import PageHeader from '../PageHeader'
import { candidates, pickMove } from './styleBook.js'
import { engineMove, uciToMove, clampElo } from './opponent.js'
import { modelMove } from './personality.js'
import { findOpponent, loadBook } from './opponents.js'
import { findControl, formatClock, engineMovetime, thinkTimeMs } from './timeControls.js'
import NewGameDialog from './NewGameDialog.jsx'
import PlayLobby from './PlayLobby.jsx'

/* /play — a game against a book of somebody's actual moves.
 *
 * LAYOUT: the clocks flank the BOARD, not the sidebar — opponent above, you
 * below, which is what lichess and chess.com both do. That is not decoration:
 * it is what makes the page work at every width without a breakpoint. When the
 * sidebar stacks under the board on a phone or a tablet, the clocks come with
 * the board instead of falling below the fold, which is exactly what happened
 * when they lived in the sidebar and nobody had looked at 768.
 *
 * SETTINGS THAT CAN RESTART A GAME LIVE IN THE DIALOG, NOT THE SIDEBAR.
 * Opponent, colour and time control are chosen in `NewGameDialog` and committed
 * on Start. Previously they were live dropdowns and changing the time control
 * wiped the game in progress.
 *
 * EXTRAS ARE OFF BY DEFAULT. Board, clocks, move list and the game buttons are
 * the page; the book's reasoning is behind one switch. Extras controls
 * (era/band/sharpness) only affect the NEXT book pick, so they are safe to
 * change mid-game and stay live.
 */

const EXTRAS_KEY = 'kol-chess-play-extras'
const ANY = '—'
const YEARS = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']
const BANDS = [1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900]
const ENGINE_ELOS = [1320, 1500, 1700, 1900, 2100, 2400, 2800]
const OPP_BANDS = [1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900]
const TIME_CLASSES = ['bullet', 'blitz', 'rapid', 'daily']

const DEFAULT_SETTINGS = { opponentKey: 'me', colour: 'white', controlId: 'Unlimited' }

/* How closely the model sticks to its favourite move. 0 would be always-the-top
   pick, which makes every game against him identical; higher lets its
   less-likely moves through, and that variety IS the personality. A constant
   until there is a reason to put it on screen. */
const MODEL_TEMPERATURE = 0.9

const readExtras = () => {
  try {
    return localStorage.getItem(EXTRAS_KEY) === '1'
  } catch {
    return false
  }
}

const toNotationPairs = (sans) => {
  const pairs = []
  sans.forEach((san, i) => {
    const moveNumber = Math.floor(i / 2) + 1
    if (i % 2 === 0) pairs.push({ moveNumber, white: { san, ply: i + 1 }, black: null })
    else pairs[pairs.length - 1].black = { san, ply: i + 1 }
  })
  return pairs
}

const PlayPage = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [book, setBook] = useState(null)
  const [bookError, setBookError] = useState(null)
  /* The move list is the state; the board derives from it. A FEN carries a
     position, not a history — rebuilding from one loses the game. */
  const [moves, setMoves] = useState([])
  const [clocks, setClocks] = useState({ w: null, b: null })
  const [result, setResult] = useState(null)
  const [year, setYear] = useState(ANY)
  const [band, setBand] = useState(ANY)
  const [engineElo, setEngineElo] = useState(1700)
  const [oppBand, setOppBand] = useState(ANY)
  const [timeClass, setTimeClass] = useState(ANY)
  const [sharpness, setSharpness] = useState(0)
  const [thinking, setThinking] = useState(false)
  const [lastSource, setLastSource] = useState(null)
  const [extras, setExtras] = useState(readExtras)
  const [promotion, setPromotion] = useState(null)
  /* A GAME EXISTS. Not the same as `started` (= a move has been played): the
     board has to be on screen to make the first move on. Set by `startGame` and
     never cleared — a finished game keeps its board and its result rather than
     dropping you back to the lobby. */
  const [inGame, setInGame] = useState(false)
  const abortRef = useRef(null)

  const opponent = findOpponent(settings.opponentKey)
  const control = findControl(settings.controlId)
  const myColour = settings.colour

  const game = useMemo(() => {
    const c = new Chess()
    for (const san of moves) {
      try {
        c.move(san)
      } catch {
        break
      }
    }
    return c
  }, [moves])

  useEffect(() => {
    try {
      localStorage.setItem(EXTRAS_KEY, extras ? '1' : '0')
    } catch {
      /* private window — the toggle still works for this session */
    }
  }, [extras])

  /* THE BOOK DOWNLOADS WHEN A GAME STARTS, not when the page mounts. It used to
     fire on mount for whatever the default opponent was — 3.8 MB for a choice
     nobody had made, and wasted outright if you then picked a master. */
  useEffect(() => {
    if (!inGame) return undefined
    let alive = true
    setBookError(null)
    setBook(null)
    loadBook(settings.opponentKey)
      .then((b) => alive && setBook(b))
      .catch(
        () => alive && setBookError('That book is not built — see scripts/build-master-books.mjs')
      )
    return () => {
      alive = false
    }
  }, [inGame, settings.opponentKey])

  useEffect(() => () => abortRef.current?.abort(), [])

  const fen = game.fen()
  const turn = game.turn()
  const myTurn = turn === (myColour === 'white' ? 'w' : 'b')
  const over = Boolean(result) || game.isGameOver()
  const started = moves.length > 0

  useEffect(() => {
    if (!started || over || control.base === null) return undefined
    const id = setInterval(() => {
      setClocks((c) => (c[turn] === null ? c : { ...c, [turn]: Math.max(0, c[turn] - 100) }))
    }, 100)
    return () => clearInterval(id)
  }, [started, over, turn, control.base])

  useEffect(() => {
    if (over || control.base === null || !started) return
    const mine = myColour === 'white' ? 'w' : 'b'
    if (clocks.w === 0 || clocks.b === 0) {
      const flagged = clocks.w === 0 ? 'w' : 'b'
      setResult(flagged === mine ? 'Flagged — you lose on time' : 'Opponent flagged — you win')
    }
  }, [clocks, over, control.base, started, myColour])

  const opts = useMemo(
    () => ({
      year: year === ANY ? null : year,
      band: band === ANY ? null : Number(band),
      /* the conditioning that stops a move's weight being averaged over
         whoever happened to be across the board */
      oppBand: oppBand === ANY ? null : Number(oppBand),
      timeClass: timeClass === ANY ? null : timeClass,
      fidelity: 0.7,
      sharpness
    }),
    [year, band, oppBand, timeClass, sharpness]
  )

  const bookHere = useMemo(() => (book ? candidates(book.p, fen, opts) : []), [book, fen, opts])

  const applyMove = useCallback(
    (san, moverColour) => {
      setMoves((m) => [...m, san])
      if (control.base !== null && control.inc) {
        setClocks((c) => ({ ...c, [moverColour]: (c[moverColour] ?? 0) + control.inc * 1000 }))
      }
    },
    [control]
  )

  const playOpponent = useCallback(
    async (position) => {
      const controller = new AbortController()
      abortRef.current?.abort()
      abortRef.current = controller
      setThinking(true)
      try {
        const current = new Chess(position)
        const moverColour = current.turn()
        let played = null
        let source = null

        const pick = book ? pickMove(book.p, position, opts) : null
        if (pick && current.moves().includes(pick.san)) {
          /* HE DOES NOT ANSWER INSTANTLY. The book carries how long the move
             actually cost him; without this the reply lands in the same tick
             and every move is equally immediate, which is the one thing no
             human does. Aborts with the rest — starting a new game mid-think
             must not land a move on the new board. */
          const wait = thinkTimeMs(pick.d, control)
          if (wait) {
            await new Promise((r) => setTimeout(r, wait))
            if (controller.signal.aborted) return
          }
          current.move(pick.san)
          played = pick.san
          source = { kind: 'book', san: pick.san, n: pick.n, scorePct: pick.scorePct, thinkMs: wait }
        }

        /* OUT OF BOOK, THE MODEL — not raw Stockfish (2026-08-31).
         *
         * The book answers roughly three moves; everything after it used to be
         * a generic engine at a hardcoded 1700, which is nobody. The policy
         * network was trained on all 974,566 of his moves across whole games,
         * so it has something to say in exactly the positions the book does
         * not. Only `me` has one — a master has no games to train on — and if
         * the model is missing or fails to load, the engine still catches the
         * game rather than leaving the board stuck. */
        const strengthElo = clampElo(opponent.key === 'me' && opts.band ? opts.band : engineElo)
        if (!played && opponent.key === 'me') {
          try {
            const m = await modelMove(position, { elo: strengthElo, temperature: MODEL_TEMPERATURE })
            if (controller.signal.aborted) return
            if (m && current.moves().includes(m.san)) {
              current.move(m.san)
              played = m.san
              source = { kind: 'model', san: m.san, elo: strengthElo, share: m.share }
            }
          } catch {
            /* no model shipped, or wasm blocked — fall through to the engine */
          }
        }

        if (!played) {
          const elo = strengthElo
          const uci = await engineMove(position, {
            elo,
            movetime: engineMovetime(control),
            signal: controller.signal
          })
          if (controller.signal.aborted) return
          const m = uciToMove(uci)
          if (!m) return
          const made = current.move(m)
          played = made?.san
          source = { kind: 'engine', san: made?.san, elo }
        }

        if (controller.signal.aborted || !played) return
        applyMove(played, moverColour)
        setLastSource(source)
      } catch {
        /* engine unreachable — leave the position alone rather than fake a move */
      } finally {
        if (!controller.signal.aborted) setThinking(false)
      }
    },
    [book, opts, opponent.key, engineElo, control, applyMove]
  )

  useEffect(() => {
    if (over || myTurn || thinking || dialogOpen) return
    if (opponent.key !== 'engine' && !book) return
    playOpponent(fen)
  }, [fen, myTurn, over, thinking, dialogOpen, book, opponent.key, playOpponent])

  const onMove = useCallback(
    ({ from, to }) => {
      if (!myTurn || over) return
      const probe = new Chess(game.fen())
      const legal = probe.moves({ verbose: true }).find((m) => m.from === from && m.to === to)
      if (!legal) return
      if (legal.promotion) {
        setPromotion({ from, to })
        return
      }
      const made = new Chess(game.fen()).move({ from, to })
      applyMove(made.san, probe.turn())
    },
    [game, myTurn, over, applyMove]
  )

  const completePromotion = (piece) => {
    if (!promotion) return
    const probe = new Chess(game.fen())
    const moverColour = probe.turn()
    let made
    try {
      made = probe.move({ ...promotion, promotion: piece })
    } catch {
      setPromotion(null)
      return
    }
    setPromotion(null)
    applyMove(made.san, moverColour)
  }

  /* The ONLY thing that clears a game. Reached from the dialog's Start button,
     which is the one place a restart can be intended. */
  const startGame = (next) => {
    abortRef.current?.abort()
    const c = findControl(next.controlId)
    setSettings(next)
    setDialogOpen(false)
    setThinking(false)
    setLastSource(null)
    setResult(null)
    setPromotion(null)
    setClocks(c.base === null ? { w: null, b: null } : { w: c.base * 1000, b: c.base * 1000 })
    setMoves([])
    setInGame(true)
  }

  /* A card in the lobby is the shortcut, not a detour: it fills the opponent in
     and opens the same sheet, so one decision is already made. */
  const pickOpponent = (key) => {
    setSettings((prev) => ({ ...prev, opponentKey: key }))
    setDialogOpen(true)
  }

  const resign = () => {
    abortRef.current?.abort()
    setThinking(false)
    setResult('You resigned')
  }

  /* A FINISHED GAME CANNOT BE TAKEN BACK (2026-08-31). `result` is only ever set
   * by a resign or a flag — checkmate and draws are read live off the position —
   * so clearing it here could do exactly one thing: undo a loss. It resurrected
   * a flagged game with the clock frozen at 0:00, which then never flagged
   * again. Checkmate still un-does naturally, because the position changes. */
  const takeback = () => {
    if (over || !moves.length) return
    abortRef.current?.abort()
    setThinking(false)
    setLastSource(null)
    setMoves((m) => m.slice(0, Math.max(0, m.length - (myTurn ? 2 : 1))))
  }

  const status = result
    ? result
    : game.isCheckmate()
      ? myTurn
        ? 'Checkmate — you lose'
        : 'Checkmate — you win'
      : game.isDraw()
        ? 'Draw'
        : thinking
          ? 'Thinking…'
          : myTurn
            ? 'Your move'
            : 'Opponent to move'

  /* Recomputed with the position, not per render — `dests()` walks every legal
     move and the board re-renders on hover. */
  const dests = useMemo(() => (myTurn && !over ? game.dests() : null), [game, myTurn, over])

  const pairs = useMemo(() => toNotationPairs(moves), [moves])
  const myKey = myColour === 'white' ? 'w' : 'b'
  const theirKey = myColour === 'white' ? 'b' : 'w'

  /* One clock row, used above and below the board. `live` lights the side whose
     time is actually running, which is the only state a chess clock has to show. */
  const ClockRow = ({ side, label }) => {
    const live = turn === side && started && !over
    return (
      <div
        className={`flex items-baseline justify-between gap-3 border px-3 py-2 ${
          live ? 'border-fg-24 bg-fg-04' : 'border-fg-08'
        }`}
      >
        <span className="kol-helper-12 text-fg-64 min-w-0 truncate">{label}</span>
        <span className={`kol-mono-14 shrink-0 ${live ? 'text-fg-96' : 'text-fg-64'}`}>
          {formatClock(clocks[side])}
        </span>
      </div>
    )
  }

  return (
    <div className="kol-page">
      <PageHeader
        title="Play"
        /* Only once a game exists — before that there is no opponent and no
           clock to name, and naming one implied a game that was not there. */
        meta={
          inGame ? (
            <span className="kol-mono-14 text-fg-64">
              {opponent.label}
              {control.base !== null ? ` · ${control.id}` : ''}
            </span>
          ) : null
        }
      />

      {bookError && <p className="kol-mono-12 text-fg-64">{bookError}</p>}

      {!inGame && <PlayLobby onNewGame={() => setDialogOpen(true)} onPickOpponent={pickOpponent} />}

      {/* Board column and sidebar. The split happens at lg; below that the
          sidebar stacks under a full-width board — and because the clocks ride
          with the board, nothing time-critical goes below the fold. */}
      {inGame && (
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex w-full min-w-0 flex-col gap-2 lg:max-w-[calc(100dvh-220px)]">
          <ClockRow side={theirKey} label={opponent.label} />

          {/* LEGALITY FROM OUR ENGINE, NOT THE BOARD'S (kol-chess 0.10.0).
              `dests` is the seam we filed and the user ruled in: supply it and
              the board stops asking chess.js anything. `rules.js` already
              returns exactly this shape, and it castles correctly in a 960
              position — which is what chess.js could not do and why variants
              were unreachable in principle rather than merely unbuilt. */}
          <ChessBoard
            fen={fen}
            size="fluid"
            orientation={myColour}
            interactive={myTurn && !over && !promotion}
            dests={dests}
            onMove={onMove}
          />

          <ClockRow side={myKey} label="You" />

          {promotion && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="kol-helper-12 text-fg-64">PROMOTE TO</span>
              {[
                ['q', 'Queen'],
                ['r', 'Rook'],
                ['b', 'Bishop'],
                ['n', 'Knight']
              ].map(([p, label]) => (
                <Button key={p} variant="secondary" size="sm" onClick={() => completePromotion(p)}>
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <aside className="flex w-full min-w-0 flex-col gap-4 lg:max-w-[360px]">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={over ? 'warning' : 'secondary'} size="sm">
              {status}
            </Badge>
            {book && (
              <Badge variant={bookHere.length ? 'success' : 'outline'} size="sm">
                {bookHere.length ? `In book · ${bookHere.length}` : 'Out of book'}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
              New game
            </Button>
            <Button variant="ghost" size="sm" disabled={over || !started} onClick={resign}>
              Resign
            </Button>
            <Button variant="ghost" size="sm" disabled={!started || over} onClick={takeback}>
              Takeback
            </Button>
          </div>

          {pairs.length > 0 && (
            <div className="max-h-[38vh] overflow-y-auto border-t border-oq-08 pt-3">
              <NotationPanel notationPairs={pairs} activePly={moves.length} />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-oq-08 pt-3">
            <span className="kol-helper-12 text-fg-64">SHOW HOW IT PICKS</span>
            <ToggleSwitch
              size="sm"
              checked={extras}
              onChange={setExtras}
              aria-label="Show opponent internals"
            />
          </div>

          {extras && (
            <div className="flex flex-col gap-4">
              {lastSource && (
                <p className="kol-mono-12 text-fg-64">
                  Last reply <strong>{lastSource.san}</strong>{' '}
                  {lastSource.kind === 'book'
                    ? `— played ${lastSource.n}× from this position, ${lastSource.scorePct.toFixed(0)}% score${
                        lastSource.thinkMs ? `, thought for ${(lastSource.thinkMs / 1000).toFixed(1)}s` : ''
                      }`
                    : lastSource.kind === 'model'
                      ? `— the model at ${lastSource.elo}${
                          lastSource.share ? `, ${(lastSource.share * 100).toFixed(0)}% of its weight` : ''
                        }`
                      : `— engine, ${lastSource.elo} Elo`}
                </p>
              )}

              {opponent.key === 'me' ? (
                <>
                  <label className="kol-helper-12 text-fg-64">
                    ERA
                    <Dropdown
                      value={year}
                      options={[ANY, ...YEARS].map((v) => ({
                        value: v,
                        label: v === ANY ? 'All years' : v
                      }))}
                      onChange={setYear}
                    />
                  </label>
                  <label className="kol-helper-12 text-fg-64">
                    RATING BAND
                    <Dropdown
                      value={String(band)}
                      options={[ANY, ...BANDS].map((v) => ({
                        value: String(v),
                        label: v === ANY ? 'Whole career' : String(v)
                      }))}
                      onChange={setBand}
                    />
                  </label>
                </>
              ) : (
                <label className="kol-helper-12 text-fg-64">
                  ENGINE STRENGTH · OUT OF BOOK
                  <Dropdown
                    value={String(engineElo)}
                    options={ENGINE_ELOS.map((e) => ({ value: String(e), label: `${e} Elo` }))}
                    onChange={(v) => setEngineElo(Number(v))}
                  />
                </label>
              )}

              {/* Only offered for my own book: historical collections carry no
                  Elo and no clock, so `o`/`t` are absent there and the controls
                  would be dials wired to nothing. */}
              {opponent.key === 'me' && (
                <>
                  <label className="kol-helper-12 text-fg-64">
                    AGAINST OPPONENTS RATED
                    <Dropdown
                      value={String(oppBand)}
                      options={[ANY, ...OPP_BANDS].map((v) => ({
                        value: String(v),
                        label: v === ANY ? 'Anyone' : `${v} ± 50`
                      }))}
                      onChange={setOppBand}
                    />
                  </label>
                  <label className="kol-helper-12 text-fg-64">
                    TIME CLASS
                    <Dropdown
                      value={timeClass}
                      options={[ANY, ...TIME_CLASSES].map((v) => ({
                        value: v,
                        label: v === ANY ? 'Any' : v
                      }))}
                      onChange={setTimeClass}
                    />
                  </label>
                </>
              )}

              <label className="kol-helper-12 text-fg-64">
                SHARPNESS · {sharpness}
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={sharpness}
                  onChange={(e) => setSharpness(Number(e.target.value))}
                  className="w-full"
                />
              </label>

              {bookHere.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <span className="kol-helper-12 text-fg-64">WHAT THEY PLAY HERE</span>
                  {(oppBand !== ANY || timeClass !== ANY) && (
                    <p className="kol-mono-12 text-fg-48">
                      Counts and scores are whole-history; the filters change which move gets
                      picked, not what it scored inside the slice.
                    </p>
                  )}
                  {bookHere.slice(0, 6).map((c) => (
                    <div key={c.san} className="flex items-baseline justify-between gap-3">
                      <span className="kol-mono-12">{c.san}</span>
                      <span className="kol-mono-12 text-fg-48">
                        {c.n}× · {c.scorePct.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                book && (
                  <p className="kol-mono-12 text-fg-48">
                    Out of book — the engine is playing from here.
                  </p>
                )
              )}
            </div>
          )}
        </aside>
      </div>
      )}

      <NewGameDialog
        open={dialogOpen}
        initial={settings}
        onStart={startGame}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  )
}

export default PlayPage
