"""Stage 4 — PyTorch to ONNX, and prove the export did not change the answers.

    python train/export.py

An export that silently differs from the trained model is the worst kind of
bug: nothing errors, the bot just plays slightly wrong forever. So this does
not only export — it runs both nets over real positions and fails loudly if
they disagree.

The output lands in `public/models/` because that is where the app fetches
from, beside the books. Same rule as the books: copied, not bundled — a 9 MB
tensor blob has no business going through Rollup.
"""

import os
import sys

import argparse

import numpy as np
import torch

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from encoding import N_PLANES, encode_board, encode_move  # noqa: E402
from model import Personality  # noqa: E402

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CKPT = os.path.join(REPO, "train", "data", "personality.pt")
OUT_DIR = os.path.join(REPO, "public", "models")
OUT = os.path.join(OUT_DIR, "personality.onnx")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ckpt", default=CKPT, help="checkpoint to export")
    args = ap.parse_args()

    ckpt = torch.load(args.ckpt, map_location="cpu")
    print(f"[export] from {os.path.relpath(args.ckpt, REPO)} "
          f"(epoch {ckpt.get('epoch', '?')}/{ckpt.get('epochs', '?')})")
    model = Personality(ckpt.get("blocks", 6), ckpt.get("filters", 64))
    model.load_state_dict(ckpt["state_dict"])
    model.eval()

    os.makedirs(OUT_DIR, exist_ok=True)
    board = torch.randn(1, N_PLANES, 8, 8)
    rating = torch.rand(1, 1)

    torch.onnx.export(
        model,
        (board, rating),
        OUT,
        input_names=["board", "rating"],
        output_names=["policy"],
        # batch stays dynamic so the page can score several positions at once
        dynamic_axes={"board": {0: "batch"}, "rating": {0: "batch"},
                      "policy": {0: "batch"}},
        opset_version=17,
    )

    size_mb = os.path.getsize(OUT) / 1e6
    print(f"[export] wrote {os.path.relpath(OUT, REPO)} ({size_mb:.1f} MB)")

    # ---- the part that matters: does the exported net agree with the trained one?
    import onnxruntime as ort

    sess = ort.InferenceSession(OUT, providers=["CPUExecutionProvider"])
    rng = np.random.default_rng(0)
    worst = 0.0
    disagreements = 0
    for _ in range(64):
        b = (rng.random((1, N_PLANES, 8, 8)) < 0.15).astype(np.float32)
        r = rng.random((1, 1)).astype(np.float32)
        with torch.no_grad():
            a = model(torch.from_numpy(b), torch.from_numpy(r)).numpy()
        c = sess.run(["policy"], {"board": b, "rating": r})[0]
        worst = max(worst, float(np.abs(a - c).max()))
        if int(a.argmax()) != int(c.argmax()):
            disagreements += 1

    print(f"[export] max logit difference over 64 positions: {worst:.2e}")
    print(f"[export] top-1 disagreements: {disagreements}/64")
    if disagreements or worst > 1e-3:
        print("[export] FAIL — the exported model does not match the trained one")
        return 1
    print("[export] PASS — ONNX matches PyTorch")

    # ---- DOES THE RATING PLANE DO ANYTHING?
    #
    # The whole design claims one model covers 1100-1900. That claim is only
    # true if asking at the two ends produces different answers, and nothing
    # about training guarantees it — the net is free to ignore the plane. So it
    # is measured on real positions and the number ships, whatever it says.
    #
    # Total-variation distance between the two distributions: 0 means the
    # rating changed nothing at all, 1 means they share no probability mass.
    import numpy as _np
    samples = _np.load(os.path.join(REPO, "train", "data", "samples.npz"))
    Xp = samples["X"][:512]
    boards = _np.unpackbits(Xp, axis=1)[:, : N_PLANES * 64]
    boards = boards.reshape(-1, N_PLANES, 8, 8).astype(_np.float32)

    def _softmax(z):
        e = _np.exp(z - z.max(axis=1, keepdims=True))
        return e / e.sum(axis=1, keepdims=True)

    lo = _softmax(sess.run(["policy"], {
        "board": boards, "rating": _np.zeros((len(boards), 1), _np.float32)})[0])
    hi = _softmax(sess.run(["policy"], {
        "board": boards, "rating": _np.ones((len(boards), 1), _np.float32)})[0])
    tv = float(_np.abs(lo - hi).sum(axis=1).mean() / 2)
    flip = float((lo.argmax(1) != hi.argmax(1)).mean())
    print(f"[export] rating conditioning — mean TV distance {tv:.4f} · "
          f"top-1 changes on {flip * 100:.1f}% of positions")
    if tv < 0.02:
        print("[export] NOTE: the rating plane is barely used — one model, one strength")

    # ---- DID IT LEARN HIS REPERTOIRE?
    #
    # The strongest evidence the thing works, and the cheapest: the network was
    # never shown the opening book — only board planes and the move he played.
    # If it independently reproduces "e4, then f4" it has learned him rather
    # than learned chess. Computed here so /bot can state it without loading a
    # 9 MB model to find out.
    import chess as _chess

    def _dist(fen):
        b = _chess.Board(fen)
        planes = encode_board(b)[None].astype(_np.float32)
        r = _np.full((1, 1), 0.625, _np.float32)          # ~1600
        logits = sess.run(["policy"], {"board": planes, "rating": r})[0][0]
        legal = [(m, encode_move(m, b.turn == _chess.BLACK)) for m in b.legal_moves]
        legal = [(m, i) for m, i in legal if i >= 0]
        z = _np.array([logits[i] for _, i in legal])
        p = _np.exp(z - z.max())
        p /= p.sum()
        best = sorted(zip(legal, p), key=lambda t: -t[1])[:3]
        return [{"san": b.san(m), "p": round(float(pr), 3)} for (m, _), pr in best]

    START = _chess.STARTING_FEN
    KG = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"
    repertoire = {"start": _dist(START), "after_e4_e5": _dist(KG)}
    print(f"[export] repertoire — first move {repertoire['start'][0]['san']} "
          f"{repertoire['start'][0]['p']:.0%} · after 1.e4 e5 "
          f"{repertoire['after_e4_e5'][0]['san']} {repertoire['after_e4_e5'][0]['p']:.0%}")

    meta = {
        "move_match": ckpt.get("move_match"),
        "repertoire": repertoire,
        "conditioning_tv": round(tv, 4),
        "conditioning_flip": round(flip, 4),
        "epoch": ckpt.get("epoch"),
        "top3": ckpt.get("top3"),
        "baseline": ckpt.get("baseline"),
        "blocks": ckpt.get("blocks", 6),
        "filters": ckpt.get("filters", 64),
        "size_mb": round(size_mb, 2),
    }
    import json
    with open(os.path.join(OUT_DIR, "personality.json"), "w") as fh:
        json.dump(meta, fh, indent=1)
    print(f"[export] metrics -> public/models/personality.json  {meta}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
