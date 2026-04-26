# K-Map Solver

A browser-based study tool for Karnaugh maps (1–4 variables) with custom variable names, manual practice + Check buttons, and PNG/PDF export.

**Live demo:** https://lotantamary-tau.github.io/kmap-solver/

Built as a single static site — open `index.html` locally or use the live link above.

## What it does

- Pick 1–4 variables and name them anything (e.g. `X, Y, Z`).
- Build a truth table by hand, or auto-fill it from a Boolean expression.
- Build a K-map by hand, or auto-fill it from the truth table.
- Solve for **SOP (1s)** or **POS (0s)** with Quine-McCluskey + Petrick's method — minimal cover shown as colored group rectangles on the map plus a simplified Boolean expression.
- Or use **Manual mode** to circle groups yourself; click `Check my groups` to validate each group, see coverage gaps, and check minimality.
- Export the truth table + K-map + result as **PNG** or **PDF**.

## Tech

Vanilla HTML/CSS/JS. No build step. Algorithmic core lives in `kmap-core.js` (UMD wrapper) and is unit-tested via Node — run `node tests/run.js` from this folder.
