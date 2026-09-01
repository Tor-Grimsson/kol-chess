"""Stage 2 — the network.

Maia's shape, shrunk, with one addition: the rating goes in as its own input
plane, so ONE model covers 1100-1900 instead of eight models covering one band
each. Ask it for "1200 me" and "1900 me" in the same position and it answers
differently — that is what makes the strength dial on /play mean something.

WHY A RESIDUAL TOWER AND NOT AN MLP. Chess is translation-ish: a knight fork
looks the same on b5 as on g5, and a convolution learns that pattern once
instead of 64 times. Flattening the board into a vector throws that away and
needs far more data to recover it.

WHY 1858 OUTPUTS. It is every move a piece can geometrically make (queen rays +
knight jumps + underpromotions) — see encoding.py. A softmax over that, masked
to the legal moves at play time.

SIZE. Six blocks of 64 filters is a 0.44M-parameter tower — Maia's own shape,
not a compromised shrink. The POLICY HEAD dominates the total: flattening to
1858 outputs costs more than everything before it, so the head squeezes to 16
planes first. 16*64 -> 1858 is 1.9M; at 32 planes it was 3.8M and the model
doubled for no measured gain. Total ~2.4M, ~9 MB of float32 — it has to train
on a CPU here and download into a phone browser.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

from encoding import N_MOVES, N_PLANES


class ResBlock(nn.Module):
    """Conv-BN-ReLU twice, plus the skip. The skip is what lets the tower go
    deep without the early layers losing their gradient."""

    def __init__(self, filters):
        super().__init__()
        self.c1 = nn.Conv2d(filters, filters, 3, padding=1, bias=False)
        self.b1 = nn.BatchNorm2d(filters)
        self.c2 = nn.Conv2d(filters, filters, 3, padding=1, bias=False)
        self.b2 = nn.BatchNorm2d(filters)

    def forward(self, x):
        y = F.relu(self.b1(self.c1(x)))
        y = self.b2(self.c2(y))
        return F.relu(x + y)


class Personality(nn.Module):
    """Board + rating -> a distribution over 1858 moves.

    The rating is broadcast to a full 8x8 plane rather than concatenated at the
    head. Feeding it at the STEM lets every convolution see it, so the net can
    learn that a 1200 and an 1800 read the same pawn structure differently —
    which is the entire point of conditioning rather than training per band.
    """

    def __init__(self, blocks=6, filters=64):
        super().__init__()
        self.stem = nn.Sequential(
            nn.Conv2d(N_PLANES + 1, filters, 3, padding=1, bias=False),
            nn.BatchNorm2d(filters),
            nn.ReLU(inplace=True),
        )
        self.tower = nn.Sequential(*[ResBlock(filters) for _ in range(blocks)])
        # policy head: squeeze to 32 planes, then one linear to the move vocabulary
        self.head_conv = nn.Sequential(
            nn.Conv2d(filters, 16, 1, bias=False),
            nn.BatchNorm2d(16),
            nn.ReLU(inplace=True),
        )
        self.head_fc = nn.Linear(16 * 8 * 8, N_MOVES)

    def forward(self, board, rating):
        """board (B, 18, 8, 8) float · rating (B, 1) float in 0-1."""
        r = rating.view(-1, 1, 1, 1).expand(-1, 1, 8, 8)
        x = torch.cat([board, r], dim=1)
        x = self.tower(self.stem(x))
        x = self.head_conv(x)
        return self.head_fc(x.flatten(1))


def masked_choice(logits, legal_indices, temperature=1.0):
    """Pick a move from the net's distribution, restricted to legal moves.

    A policy head happily assigns weight to moves that are illegal in this
    position — it has no rules engine. Masking BEFORE the softmax (rather than
    zeroing after) keeps the remaining probabilities a proper distribution.
    """
    mask = torch.full_like(logits, float("-inf"))
    mask[..., legal_indices] = 0.0
    scaled = (logits + mask) / max(temperature, 1e-6)
    return F.softmax(scaled, dim=-1)


def parameter_count(model):
    return sum(p.numel() for p in model.parameters())
