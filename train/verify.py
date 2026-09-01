"""Round-trip check: does a stored sample really describe the position and the
move it claims? Run after prepare.py, before trusting a training run.

A wrong encoding does not crash — it trains a worse model quietly. This is the
cheapest thing that would catch it.
"""

import io
import json
import os
import sys

import chess
import chess.pgn
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from encoding import INDEX_MOVE, N_PLANES, encode_board, encode_move  # noqa: E402

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ME = "Biskupstunga"


def unpack(row):
    return np.unpackbits(row)[: N_PLANES * 64].reshape(N_PLANES, 8, 8)


def main():
    month = sorted(os.listdir(os.path.join(REPO, "_tmp", "pgn-cache")))[0]
    with open(os.path.join(REPO, "_tmp", "pgn-cache", month)) as fh:
        pgns = [p for p in json.load(fh).values() if isinstance(p, str)]

    game = None
    for p in pgns:
        g = chess.pgn.read_game(io.StringIO(p))
        if g and ME in (g.headers.get("White"), g.headers.get("Black")):
            game = g
            break

    h = game.headers
    i_am_white = h.get("White") == ME
    mine = chess.WHITE if i_am_white else chess.BLACK
    print(f"game: {h.get('White')} vs {h.get('Black')} · {h.get('Result')} · {h.get('UTCDate')}")
    print(f"I am {'White' if i_am_white else 'Black'}\n")

    board = game.board()
    checked = ok = 0
    shown = 0
    for move in game.mainline_moves():
        if board.turn == mine:
            flip = board.turn == chess.BLACK
            planes = encode_board(board)
            idx = encode_move(move, flip)

            # 1. the piece count in the planes must match the real board
            real_pieces = len(board.piece_map())
            plane_pieces = int(planes[:12].sum())
            # 2. the label must decode back to the move actually played
            decoded = INDEX_MOVE[idx]
            expect = move.uci()
            if flip:
                expect = chess.Move(
                    chess.square_mirror(move.from_square),
                    chess.square_mirror(move.to_square),
                    promotion=None if move.promotion == chess.QUEEN else move.promotion,
                ).uci()
            elif move.promotion == chess.QUEEN:
                expect = chess.Move(move.from_square, move.to_square).uci()

            good = (real_pieces == plane_pieces) and (decoded == expect)
            checked += 1
            ok += good
            if shown < 4:
                print(f"  ply {board.ply():>3}  played {board.san(move):<7} "
                      f"planes {plane_pieces:>2} pieces (board has {real_pieces:>2})  "
                      f"label {idx:>4} -> {decoded:<6} {'OK' if good else 'MISMATCH'}")
                shown += 1
        board.push(move)

    print(f"\nhis moves in this game: {checked} · encoded correctly: {ok}")
    print("PASS" if ok == checked else "FAIL")
    return 0 if ok == checked else 1


if __name__ == "__main__":
    sys.exit(main())
