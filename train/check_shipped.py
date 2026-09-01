"""Are the shipped artifacts coherent with each other?

Run after export.py. Catches the class of mistake where one file is rebuilt and
another is not — a model expecting a different move vocabulary than the one the
browser fetches, or metrics describing a checkpoint that is no longer the one
in public/.
"""

import json
import os
import sys

import numpy as np
import onnxruntime as ort

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from encoding import MOVE_INDEX, N_MOVES, N_PLANES  # noqa: E402

MODELS = os.path.join(REPO, "public", "models")


def main():
    problems = []

    for name in ("personality.onnx", "moves.json", "personality.json"):
        path = os.path.join(MODELS, name)
        if not os.path.exists(path):
            problems.append(f"missing public/models/{name}")
    if problems:
        for p in problems:
            print(f"[check] FAIL — {p}")
        return 1

    moves = json.load(open(os.path.join(MODELS, "moves.json")))
    meta = json.load(open(os.path.join(MODELS, "personality.json")))

    if len(moves) != N_MOVES:
        problems.append(f"moves.json has {len(moves)}, encoding.py says {N_MOVES}")
    if moves != [m for m, _ in sorted(MOVE_INDEX.items(), key=lambda kv: kv[1])]:
        problems.append("moves.json is not the vocabulary encoding.py builds")

    sess = ort.InferenceSession(os.path.join(MODELS, "personality.onnx"),
                                providers=["CPUExecutionProvider"])
    out = sess.run(["policy"], {
        "board": np.zeros((1, N_PLANES, 8, 8), np.float32),
        "rating": np.zeros((1, 1), np.float32),
    })[0]
    if out.shape != (1, N_MOVES):
        problems.append(f"model outputs {out.shape}, expected (1, {N_MOVES})")

    inputs = {i.name for i in sess.get_inputs()}
    if inputs != {"board", "rating"}:
        problems.append(f"model inputs are {inputs}, expected board + rating")

    for k in ("move_match", "baseline", "repertoire", "conditioning_flip"):
        if k not in meta:
            problems.append(f"personality.json is missing {k}")

    for p in problems:
        print(f"[check] FAIL — {p}")
    if problems:
        return 1

    mb = os.path.getsize(os.path.join(MODELS, "personality.onnx")) / 1e6
    print(f"[check] model {mb:.1f} MB · vocabulary {len(moves)} · "
          f"move-match {meta['move_match'] * 100:.2f}% "
          f"(baseline {meta['baseline'] * 100:.2f}%) · epoch {meta.get('epoch', '?')}")
    print(f"[check] repertoire — first move {meta['repertoire']['start'][0]['san']} "
          f"{meta['repertoire']['start'][0]['p']:.0%}")
    print("[check] PASS — shipped artifacts agree")
    return 0


if __name__ == "__main__":
    sys.exit(main())
