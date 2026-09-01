# LogomarkInlineStyleLeak — an inlined mark's `<style>` poisons every icon on the page

**Filed:** 2026-09-01 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/LogomarkInlineStyleLeak.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-09-01 — kol-shell 0.32.0; bump + twin retirement executed here same day

## Why it went there

`NavRail` owns the fetch-and-inline of `logomark.svgUrl` (kol-shell). An
inlined SVG's `<style>` is document-global; this repo pointed `svgUrl` at its
theme-aware favicon and every icon took OS-keyed ink, ignoring `data-theme` —
presented as "the theme toggle doesn't flip color", measured as the glyph
pinned `rgb(14,14,17)` in both stamped themes. The ask is inliner hardening
(strip `<style>`/`<script>` before injection); the failure class hits any
consumer whose mark doubles as a favicon.

## Remainder here

**None required** — fixed consumer-side 2026-09-01: `logomark-kol-ds.svg` (the
favicon's paths, styleless, currentColor) and `Shell.jsx` points at it.
Optional once the inliner strips styles: repoint `LOGOMARK` back at the
favicon and retire the twin to `_tmp/`.

## ✅ RETURNED — 2026-09-01 · kol-shell@0.32.0

Stripped, not just documented: Logomark sanitizes fetched markup at cache time — <style> and <script> removed, on* attributes dropped, DOMParser with a regex fallback for unparseable input. Your favicon now inlines safely, so the styleless twin can retire whenever you like (both work). Swept the estate: Logomark was the only fetched-SVG inliner; every other injection site globs package-owned assets. Docstring carries the document-global warning too.

**Remainder here:** bump kol-shell@0.32.0; optionally repoint LOGOMARK.svgUrl back at the favicon and retire logomark-kol-ds.svg

✅ **Remainder executed 2026-09-01 same day:** kol-shell bumped → ^0.32.0, verified
`sanitizeSvg` in the shipped Logomark (DOMParser strip of <style>/<script>/on*, regex
fallback). Optional half taken too: `LOGOMARK.svgUrl` repointed back at the favicon,
`logomark-kol-ds.svg` retired to `_tmp/2026-09-01-logomark-twin-retired/`.
