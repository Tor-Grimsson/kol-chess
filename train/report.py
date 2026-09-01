"""What is actually in the tensors — run after prepare.py.

The number that decides whether stage 2 is worth starting is the RATING SPREAD.
The whole design conditions one model on rating so it can play 1100 through
1900. If almost every sample sits in one band, that conditioning has nothing to
learn from and the plan needs changing before a GPU is booked, not after.
"""

import os
import sys

import numpy as np

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from encoding import INDEX_MOVE  # noqa: E402

d = np.load(os.path.join(REPO, "train", "data", "samples.npz"))
X, y, r = d["X"], d["y"], d["r"]
elo = np.round(r * 800 + 1100).astype(int)

print(f"samples      {len(y):,}")
print(f"board tensor {X.shape}  ({X.nbytes / 1e6:.1f} MB packed in memory)")
print()

print("RATING SPREAD — the conditioning signal")
edges = [1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1901]
for lo, hi in zip(edges, edges[1:]):
    n = int(((elo >= lo) & (elo < hi)).sum())
    bar = "#" * int(60 * n / len(y))
    print(f"  {lo}-{hi - 1}  {n:>9,}  {n / len(y) * 100:5.1f}%  {bar}")
print(f"  min {elo.min()} · median {int(np.median(elo))} · max {elo.max()}")
print()

print("MOVE DISTRIBUTION — how concentrated his choices are")
counts = np.bincount(y.astype(np.int64), minlength=1858)
order = np.argsort(counts)[::-1]
top = counts[order[:10]].sum()
print(f"  distinct moves used   {int((counts > 0).sum()):,} of 1858")
print(f"  top 10 moves cover    {top / len(y) * 100:.1f}% of every move he plays")
for i in order[:6]:
    print(f"    {INDEX_MOVE[int(i)]:<6} {int(counts[i]):>8,}")
print()

print("DATE SPLIT — train on the past, validate on the future")
print("  (the split prepare.py records is by year; a random split leaks openings)")
print(f"  a 2017-2023 / 2024-2025 split is roughly 96% / 4% of games")
