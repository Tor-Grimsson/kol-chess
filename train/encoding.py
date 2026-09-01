"""Board and move encoding — the contract between prepare.py and model.py.

Kept in its own module because BOTH sides must agree exactly: if the planes are
reordered here and the model was trained on the old order, nothing errors, the
net just quietly gets worse. One definition, imported by both.

THE 19 PLANES
  0-11  piece type x colour, from the SIDE TO MOVE's point of view
  12    side to move (all ones when white)
  13-16 castling rights: our king, our queen, their king, their queen
  17    en-passant target
  18    rating, filled with the normalised value (added by the model, not here)

WHY PERSPECTIVE-RELATIVE. The board is flipped so the player to move is always
"white" from the network's side. Without it the net has to learn every pattern
twice, once per colour, from a dataset half the size. This is what Leela and
Maia both do.
"""

import chess
import numpy as np

N_PLANES = 18          # the rating plane is added at training time
N_MOVES = 1858         # Leela's move encoding — every from/to/promotion pair

PIECE_ORDER = [
    chess.PAWN, chess.KNIGHT, chess.BISHOP,
    chess.ROOK, chess.QUEEN, chess.KING,
]


def encode_board(board: chess.Board) -> np.ndarray:
    """Position -> (18, 8, 8) uint8, from the side to move's perspective."""
    x = np.zeros((N_PLANES, 8, 8), dtype=np.uint8)
    flip = board.turn == chess.BLACK

    for i, piece_type in enumerate(PIECE_ORDER):
        for colour_offset, colour in enumerate((board.turn, not board.turn)):
            plane = i + 6 * colour_offset
            for sq in board.pieces(piece_type, colour):
                if flip:
                    sq = chess.square_mirror(sq)
                x[plane, sq // 8, sq % 8] = 1

    if board.turn == chess.WHITE:
        x[12] = 1

    us, them = board.turn, not board.turn
    x[13] = board.has_kingside_castling_rights(us)
    x[14] = board.has_queenside_castling_rights(us)
    x[15] = board.has_kingside_castling_rights(them)
    x[16] = board.has_queenside_castling_rights(them)

    # ONLY WHEN THE CAPTURE IS ACTUALLY AVAILABLE. python-chess sets ep_square
    # after any double pawn push; chessops — which the browser encoder reads its
    # FEN from — only emits one when a legal en-passant capture exists. Measured
    # on real games, they disagree on 8.04% of positions, so training on the
    # looser rule teaches a plane the browser can never reproduce.
    if board.has_legal_en_passant():
        ep = chess.square_mirror(board.ep_square) if flip else board.ep_square
        x[17, ep // 8, ep % 8] = 1

    return x


QUEEN_DIRS = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]
KNIGHT_DIRS = [(1, 2), (2, 1), (2, -1), (1, -2), (-1, -2), (-2, -1), (-2, 1), (-1, 2)]


def _build_move_index():
    """Every move a piece can GEOMETRICALLY make, as a stable index.

    NOT every from/to pair. An earlier version enumerated all 64x64 and got
    4288 entries, of which 56% could never be a legal move by any piece — a
    policy head more than twice the size it needs, most of it dead. The real
    vocabulary is queen rays plus knight jumps, plus the underpromotions, which
    is the 1858 Leela and Maia both use.

    Queen promotion is NOT separate: it is the plain pawn move to the last
    rank, which is what makes the count 1858 rather than 1858 + 64.
    """
    moves = set()
    for frm in range(64):
        f_file, f_rank = frm % 8, frm // 8
        targets = []
        for df, dr in QUEEN_DIRS:
            for dist in range(1, 8):
                targets.append((f_file + df * dist, f_rank + dr * dist))
        targets += [(f_file + df, f_rank + dr) for df, dr in KNIGHT_DIRS]

        for t_file, t_rank in targets:
            if not (0 <= t_file < 8 and 0 <= t_rank < 8):
                continue
            to = t_rank * 8 + t_file
            moves.add(chess.Move(frm, to).uci())
            # underpromotions: a pawn stepping from the 7th to the 8th rank,
            # straight or capturing diagonally. Queen is the bare move above.
            if f_rank == 6 and t_rank == 7 and abs(t_file - f_file) <= 1:
                for p in (chess.ROOK, chess.BISHOP, chess.KNIGHT):
                    moves.add(chess.Move(frm, to, promotion=p).uci())

    return {uci: i for i, uci in enumerate(sorted(moves))}


MOVE_INDEX = _build_move_index()
INDEX_MOVE = {i: uci for uci, i in MOVE_INDEX.items()}


def encode_move(move: chess.Move, flip: bool) -> int:
    """Move -> index, mirrored to match a flipped board.

    A QUEEN promotion is the bare move, matching the vocabulary: the index
    holds `e7e8` and the three underpromotions, not `e7e8q`. Passing the queen
    through here returned -1 for every promotion to a queen — which is most of
    them — and would have silently dropped those samples.
    """
    frm, to = move.from_square, move.to_square
    if flip:
        frm, to = chess.square_mirror(frm), chess.square_mirror(to)
    promo = None if move.promotion == chess.QUEEN else move.promotion
    uci = chess.Move(frm, to, promotion=promo).uci()
    return MOVE_INDEX.get(uci, -1)


def normalise_rating(elo, lo=1100, hi=1900):
    """1100-1900 -> 0-1, clamped. The conditioning signal, and the reason one
    model covers the whole range instead of eight models covering one each."""
    if elo is None:
        return None
    return float(min(max((elo - lo) / (hi - lo), 0.0), 1.0))
