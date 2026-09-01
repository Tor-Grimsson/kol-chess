"""Emit what the browser needs to speak the same language as the model.

TWO IMPLEMENTATIONS OF ONE ENCODING IS THE REAL RISK HERE. Python builds the
training tensors; JavaScript builds the tensor at play time. If they drift, the
model receives a board it was never trained on and plays nonsense — with no
error anywhere. So:

  moves.json     the move vocabulary, EXPORTED not reimplemented. The JS looks
                 moves up in the same list the labels were made from.
  fixture.json   real positions with their Python-encoded planes, so a JS test
                 can prove its encoder agrees square for square.
"""

import io
import json
import os
import sys

import chess
import chess.pgn
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from encoding import INDEX_MOVE, MOVE_INDEX, N_PLANES, encode_board, encode_move  # noqa: E402

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO, "public", "models")
FIXTURE = os.path.join(REPO, "src", "play", "__fixtures__", "encoding.json")

POSITIONS = [
    chess.STARTING_FEN,
    "rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq f3 0 2",   # King's Gambit, black to move
    "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    "8/8/8/4k3/8/4K3/4P3/8 w - - 0 1",                                  # bare endgame
    "r3k2r/pppq1ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 0 1",  # all castling rights
    "4k3/P6P/8/8/8/8/8/4K3 w - - 0 1",                                  # promotions available
]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "moves.json"), "w") as fh:
        json.dump([INDEX_MOVE[i] for i in range(len(INDEX_MOVE))], fh)
    print(f"[js] moves.json — {len(MOVE_INDEX)} moves")

    cases = []
    for fen in POSITIONS:
        b = chess.Board(fen)
        planes = encode_board(b)
        legal = sorted({encode_move(m, b.turn == chess.BLACK) for m in b.legal_moves})
        cases.append({
            "fen": fen,
            # planes as a flat 0/1 string keeps the fixture small and diffable
            "planes": "".join(str(int(v)) for v in planes.reshape(-1)),
            "legal": legal,
        })

    os.makedirs(os.path.dirname(FIXTURE), exist_ok=True)
    with open(FIXTURE, "w") as fh:
        json.dump({"nPlanes": N_PLANES, "cases": cases}, fh, indent=1)
    print(f"[js] fixture.json — {len(cases)} positions -> {os.path.relpath(FIXTURE, REPO)}")


if __name__ == "__main__":
    main()
