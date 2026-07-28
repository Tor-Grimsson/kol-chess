import { useChessControls, ChessBoard, AlternativeControlsMock } from '@kolkrabbi/kol-chess'

/* The board stage — STRUCTURE OWNED HERE (2026-07-28 restructure): composed
 * from kol-chess ELEMENTS (ChessBoard, the rail, the provider hooks) instead
 * of consuming the upstream ChessAnalysisLayout/ChessBoardWithControls
 * apparatus. Layout churn stays in this repo; upstream is elements only.
 *
 * Geometry (ported from upstream 0.5.1, now ours to iterate):
 * - married heights: at lg+ the BOARD defines the row — the rail is
 *   absolutely pinned to the board's box (inset-y-0), content scrolls inside.
 *   Stacked below lg.
 * - the stage caps its own width off viewport height (board is square):
 *   reserve = chrome above+below via --chess-stage-reserve; the panel strip
 *   budgets +106px; +472px re-adds the rail (440) + gap (32). */

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

const Stage = ({ panel = null }) => {
  const widthCap = panel ? 'max-w-[calc(100dvh-470px)]' : 'max-w-[calc(100dvh-380px)]'
  const lgStageCap = panel
    ? 'lg:max-w-[calc(100dvh_-_var(--chess-stage-reserve,200px)_-_106px_+_472px)]'
    : 'lg:max-w-[calc(100dvh_-_var(--chess-stage-reserve,200px)_+_472px)]'
  return (
    <div className={`flex h-full min-h-0 flex-col gap-4 lg:block lg:h-auto lg:relative lg:mx-auto lg:pr-[472px] ${lgStageCap}`}>
      {panel && (
        <div className={`mx-auto w-full ${widthCap} flex-shrink-0 min-w-0 lg:mx-0 lg:max-w-none lg:mb-4`}>
          {panel}
        </div>
      )}
      <div className={`mx-auto w-full ${widthCap} flex-shrink-0 min-w-0 lg:mx-0 lg:max-w-none`}>
        <BoardView />
      </div>
      <div className={`mx-auto min-h-0 flex-1 w-full ${widthCap} overflow-y-auto lg:overflow-hidden lg:mx-0 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[440px] lg:max-w-none lg:flex-none`}>
        <AlternativeControlsMock />
      </div>
    </div>
  )
}

export default Stage
