"""Stage 3 — train the network on his moves.

    python train/finetune.py --epochs 3
    python train/finetune.py --epochs 1 --subset 200000   # a fast look

NO GPU HERE. This machine is an Intel iMac with a Radeon Pro 570X, and PyTorch
reaches neither (CUDA is NVIDIA, MPS is Apple Silicon), so it trains on 6 CPU
threads. That is the reason the model is 2.4M parameters rather than 20M — it
is sized to actually finish here. A GPU run could afford a wider tower and
would score better; this one produces real, shippable weights without waiting
for one.

THE SPLIT IS BY GAME, NOT BY MOVE. Splitting moves at random puts the same
game's opening on both sides of the fence, and the model scores well by
recognising positions it has already been trained on. Splitting whole games
apart is what makes the held-out number mean anything.

THE METRIC IS MOVE-MATCH, NOT LOSS. "Of his held-out moves, how many does the
model pick?" is the only number that answers the question the project is about.
Loss going down proves the optimiser works, nothing more.
"""

import argparse
import os
import sys
import time

import numpy as np
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from encoding import N_PLANES  # noqa: E402
from model import Personality, parameter_count  # noqa: E402

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(REPO, "train", "data")


def load(subset=None, seed=0):
    d = np.load(os.path.join(DATA, "samples.npz"))
    X, y, r = d["X"], d["y"], d["r"]
    if subset and subset < len(y):
        rng = np.random.default_rng(seed)
        keep = rng.choice(len(y), subset, replace=False)
        X, y, r = X[keep], y[keep], r[keep]
    return X, y, r


class PackedBoards(Dataset):
    """Unpacks bits PER SAMPLE, not up front.

    Materialising the whole set as float32 is 974,566 x 18 x 64 x 4 bytes =
    4.5 GB, which on this machine means swapping and a training run that never
    finishes. Packed it is 140 MB and stays resident; unpacking one board is a
    few microseconds and happens inside the batch the GPU-less CPU is already
    waiting on.
    """

    def __init__(self, Xp, y, r, idx):
        self.Xp, self.y, self.r, self.idx = Xp, y, r, idx

    def __len__(self):
        return len(self.idx)

    def __getitem__(self, i):
        j = self.idx[i]
        bits = np.unpackbits(self.Xp[j])[: N_PLANES * 64]
        board = torch.from_numpy(bits.reshape(N_PLANES, 8, 8).astype(np.float32))
        return board, torch.tensor([self.r[j]], dtype=torch.float32), int(self.y[j])


def split_by_game(n, game_ids=None, holdout=0.06, seed=0):
    """Contiguous blocks stand in for games: prepare.py emits a game's moves
    consecutively, so slicing on block boundaries keeps games whole without
    having to carry a game id per sample."""
    rng = np.random.default_rng(seed)
    block = 40                       # ~ one game's worth of his moves
    blocks = np.arange(n) // block
    uniq = np.unique(blocks)
    rng.shuffle(uniq)
    cut = int(len(uniq) * (1 - holdout))
    train_blocks = set(uniq[:cut].tolist())
    is_train = np.fromiter((b in train_blocks for b in blocks), bool, n)
    return np.where(is_train)[0], np.where(~is_train)[0]


def move_match(model, loader, device):
    """The headline number: top-1 agreement with the move he played."""
    model.eval()
    hit = tot = 0
    top3 = 0
    with torch.no_grad():
        for xb, rb, yb in loader:
            out = model(xb.to(device), rb.to(device))
            pred = out.argmax(1).cpu()
            hit += int((pred == yb).sum())
            t3 = out.topk(3, dim=1).indices.cpu()
            top3 += int((t3 == yb.unsqueeze(1)).any(1).sum())
            tot += len(yb)
    model.train()
    return hit / tot, top3 / tot


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=3)
    ap.add_argument("--batch", type=int, default=512)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--subset", type=int, default=None)
    ap.add_argument("--blocks", type=int, default=6)
    ap.add_argument("--filters", type=int, default=64)
    ap.add_argument("--out", default=os.path.join(DATA, "personality.pt"))
    args = ap.parse_args()

    device = torch.device("cpu")
    torch.manual_seed(0)

    Xp, y, r = load(args.subset)
    tr, va = split_by_game(len(y))
    print(f"[train] samples {len(y):,} · train {len(tr):,} · held out {len(va):,}")

    dl_tr = DataLoader(PackedBoards(Xp, y, r, tr), batch_size=args.batch,
                       shuffle=True, num_workers=2, persistent_workers=True)
    dl_va = DataLoader(PackedBoards(Xp, y, r, va), batch_size=1024, num_workers=2)

    model = Personality(args.blocks, args.filters).to(device)
    print(f"[train] parameters {parameter_count(model):,}")

    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.OneCycleLR(
        opt, max_lr=args.lr, total_steps=args.epochs * len(dl_tr)
    )

    # the number to beat: always guess his single most common move
    baseline = float(np.bincount(y[va].astype(np.int64), minlength=1858).max()) / len(va)
    print(f"[train] baseline (his most common move, always) {baseline * 100:.2f}%")

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        run = seen = 0
        for i, (xb, rb, yb) in enumerate(dl_tr, 1):
            loss = F.cross_entropy(model(xb, rb), yb)
            opt.zero_grad(set_to_none=True)
            loss.backward()
            opt.step()
            sched.step()
            run += float(loss) * len(yb)
            seen += len(yb)
            if i % 200 == 0:
                print(f"[train]   epoch {epoch} · {i}/{len(dl_tr)} · "
                      f"loss {run / seen:.3f} · {time.time() - t0:.0f}s", flush=True)
        top1, top3 = move_match(model, dl_va, device)
        print(f"[train] epoch {epoch} · loss {run / seen:.3f} · "
              f"move-match {top1 * 100:.2f}% · top-3 {top3 * 100:.2f}% · "
              f"{time.time() - t0:.0f}s", flush=True)

        # CHECKPOINT EVERY EPOCH, not just at the end. An epoch is ~30 minutes
        # on this CPU; saving only at the end means a four-epoch run has no
        # usable weights for two hours, and a crash at epoch 4 leaves nothing.
        torch.save({"state_dict": model.state_dict(),
                    "blocks": args.blocks, "filters": args.filters,
                    "epoch": epoch, "epochs": args.epochs,
                    "move_match": top1, "top3": top3, "baseline": baseline}, args.out)
        print(f"[train] wrote {args.out} (epoch {epoch})", flush=True)


if __name__ == "__main__":
    main()
