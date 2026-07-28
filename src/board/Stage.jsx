import { useChessControls, ChessBoard } from '@kolkrabbi/kol-chess'
import Rail from './Rail'

/* The board stage — STRUCTURE OWNED HERE (2026-07-28 restructure): composed
 * from kol-chess ELEMENTS. Nothing renders above the board (rail-tabs fix) —
 * the board is the anchor and owns the full height budget.
 *
 * Geometry:
 * - married heights: at lg+ the BOARD defines the row — the rail is
 *   absolutely pinned to the board's box (inset-y-0), content scrolls inside.
 *   Stacked below lg.
 * - justify-between (2026-07-28): the stage spans the page fence — the board
 *   anchors LEFT (locks to the title edge, square-capped off viewport height
 *   via --chess-stage-reserve), the rail anchors RIGHT (locks to the Games
 *   action edge). Rail width has leeway: clamp(440px,30vw,560px); the stage's
 *   pr = that clamp + 32px gap, so the two never collide. */

const BoardView = () => {
  const { activeFen, orientation, lastMove, pieceSet, boardTheme, playMove, isEditMode, placePiece } = useChessControls()
  return (
    <ChessBoard
      fen={activeFen}
      size="fluid"
      orientation={orientation}
      lastMove={lastMove}
      pieceSet={pieceSet}
      boardTheme={boardTheme}
      interactive={!isEditMode}
      onMove={playMove}
      onSquareClick={isEditMode ? placePiece : null}
    />
  )
}

const widthCap = 'max-w-[calc(100dvh-380px)]'

const Stage = ({ railTab }) => {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 lg:block lg:h-auto lg:relative lg:pr-[calc(clamp(440px,30vw,560px)_+_32px)]">
      <div className={`mx-auto w-full ${widthCap} flex-shrink-0 min-w-0 lg:mx-0 lg:max-w-[calc(100dvh_-_var(--chess-stage-reserve,200px))]`}>
        <BoardView />
      </div>
      <div className={`mx-auto min-h-0 flex-1 w-full ${widthCap} overflow-hidden lg:mx-0 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[clamp(440px,30vw,560px)] lg:max-w-none lg:flex-none`}>
        <Rail tab={railTab} />
      </div>
    </div>
  )
}

export default Stage
