"""Stage 1 — PGN to training tensors.

Reads the cached chess.com archive and emits one sample for every move
BISKUPSTUNGA played: the position he faced, the move he chose, and the rating
he held at the time.

WHOLE GAMES. The JSON book stopped at 30 plies and threw away any position it
had not seen twice — 5.9% of what it observed survived. None of that applies
here: a network learns features, so a position reached once still teaches
something, and move 40 teaches as much as move 4. That is the whole reason this
stage exists.

THE LABEL IS HIS MOVE, NOT THE BEST MOVE. Nothing in here consults an engine.
The target is what he actually played, including the mistakes — those are the
personality.

    python train/prepare.py                    # everything
    python train/prepare.py --limit 5          # 5 months, for a quick look
"""

import argparse
import json
import os
import sys
from collections import Counter

import chess
import chess.pgn
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from encoding import N_PLANES, encode_board, encode_move, normalise_rating  # noqa: E402

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(REPO, "_tmp", "pgn-cache")
OUT = os.path.join(REPO, "train", "data")
ME = "Biskupstunga"


def games_in(path):
    """The cache is {game_id: pgn_text}."""
    with open(path) as fh:
        blob = json.load(fh)
    for pgn in blob.values():
        if isinstance(pgn, str) and pgn.strip():
            yield pgn


def samples_from(pgn_text, stats):
    """One sample per move HE played. Yields (planes, move_index, rating)."""
    try:
        game = chess.pgn.read_game(__import__("io").StringIO(pgn_text))
    except Exception:
        stats["unparsed"] += 1
        return
    if game is None:
        stats["unparsed"] += 1
        return

    h = game.headers
    white, black = h.get("White"), h.get("Black")
    if ME not in (white, black):
        stats["not_mine"] += 1
        return
    i_am_white = white == ME

    try:
        elo = int(h.get("WhiteElo" if i_am_white else "BlackElo", ""))
    except ValueError:
        elo = None
    rating = normalise_rating(elo)
    if rating is None:
        stats["no_elo"] += 1
        return

    stats["games"] += 1
    stats["year"][h.get("UTCDate", h.get("Date", "?"))[:4]] += 1

    board = game.board()
    my_colour = chess.WHITE if i_am_white else chess.BLACK
    for move in game.mainline_moves():
        if board.turn == my_colour:
            idx = encode_move(move, flip=board.turn == chess.BLACK)
            if idx < 0:
                stats["unencodable"] += 1
            else:
                yield encode_board(board), idx, rating
                stats["moves"] += 1
                stats["phase"]["opening" if board.fullmove_number <= 12
                                else "middlegame" if board.fullmove_number <= 32
                                else "endgame"] += 1
        board.push(move)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None, help="months to read")
    ap.add_argument("--out", default=os.path.join(OUT, "samples.npz"))
    args = ap.parse_args()

    months = sorted(f for f in os.listdir(CACHE) if f.endswith(".json"))
    if args.limit:
        months = months[: args.limit]

    stats = Counter()
    stats["year"] = Counter()
    stats["phase"] = Counter()

    boards, labels, ratings = [], [], []
    for n, m in enumerate(months, 1):
        for pgn in games_in(os.path.join(CACHE, m)):
            for x, y, r in samples_from(pgn, stats):
                boards.append(np.packbits(x))   # 18*64 bits -> 144 bytes
                labels.append(y)
                ratings.append(r)
        if n % 10 == 0 or n == len(months):
            print(f"[prep] {n}/{len(months)} months · {stats['moves']:,} samples", flush=True)

    X = np.stack(boards)
    y = np.asarray(labels, dtype=np.int16)
    r = np.asarray(ratings, dtype=np.float32)

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    np.savez_compressed(args.out, X=X, y=y, r=r, planes=N_PLANES)

    size_mb = os.path.getsize(args.out) / 1e6
    print()
    print(f"[prep] games used        {stats['games']:,}")
    print(f"[prep] samples           {stats['moves']:,}")
    print(f"[prep] skipped           not-mine {stats['not_mine']:,} · "
          f"no-elo {stats['no_elo']:,} · unparsed {stats['unparsed']:,} · "
          f"unencodable {stats['unencodable']:,}")
    print(f"[prep] by phase          " +
          " · ".join(f"{k} {v:,}" for k, v in stats["phase"].most_common()))
    print(f"[prep] by year           " +
          " · ".join(f"{k} {v:,}" for k, v in sorted(stats["year"].items())))
    print(f"[prep] wrote             {args.out} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
