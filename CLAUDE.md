# Project Overview

K-Map Solver is a single-page study tool for Karnaugh maps (1–4 variables) with custom variable names. It walks the user through the same paper-style workflow they'd use in class — variables → truth table → K-map → grouping → verify → export — with optional manual practice + `Check` buttons at each step that validate work against ground truth, plus an SOP/POS auto-solver and PNG/PDF export. Built as a personal study aid for a Computer Architecture course; deployed at https://lotantamary-tau.github.io/kmap-solver/.

## Tech Stack & Environment

- **Language:** Vanilla JavaScript (ES2020), HTML5, CSS3 — no transpilation, no bundler.
- **Algorithmic core:** `kmap-core.js`, UMD-wrapped (loads as `<script>` in browser, `require()`-able from Node).
- **Browser libs (CDN, no install):** `html2canvas@1.4.1`, `jspdf@2.5.1`, `canvas-confetti`. Fonts: Inter + JetBrains Mono via Google Fonts.
- **Testing:** Node ≥18 with the hand-rolled runner in [tests/run.js](tests/run.js).
- **Deploy:** GitHub Pages from `main` branch, repo `lotantamary-tau/kmap-solver`.
- **No environment variables required.**

## Key Directories & Architecture

- [index.html](index.html) — entire UI shell. Inline `<style>` (~1500 lines of CSS, design tokens at the top), inline `<script>` (state, render functions, event handlers). All app behavior lives here.
- [kmap-core.js](kmap-core.js) — pure algorithmic core. UMD wrapper exposes `KMapCore` globally in the browser and as a CommonJS module to Node. Zero DOM access. Public API is the flat object returned at [kmap-core.js:461](kmap-core.js#L461) (Gray-code helpers, cell↔minterm mapping, cube validator, term extractor, expression parser, Quine-McCluskey + Petrick solver, top-level `solve()`).
- [tests/](tests/) — one `*.test.js` per algorithmic module ([cube.test.js](tests/cube.test.js), [parser.test.js](tests/parser.test.js), [qm.test.js](tests/qm.test.js), [solve.test.js](tests/solve.test.js), [layout.test.js](tests/layout.test.js), [cell-mapping.test.js](tests/cell-mapping.test.js), [smoke.test.js](tests/smoke.test.js)). The runner picks them up automatically.
- [README.md](README.md) — public-facing one-pager (live demo link + summary).

The single global `state` object at [index.html:1903](index.html#L1903) is the canonical data store. UI is a 6-step wizard (only one step visible at a time; previous steps lockable via Edit/Reset). Group overlays are rendered into both Step 4 (interactive) and Step 5 (read-only) K-maps by [renderOverlays()](index.html#L2405).

## Build & Test Commands

```bash
# Run the app locally (no install, no server needed):
#   open kmap-app/index.html in a browser

# Run the algorithmic test suite — must pass before any push:
cd kmap-app
node tests/run.js

# Deploy: just push main. GitHub Pages serves from repo root.
git push origin main
```

There is no `npm install` step. There is no production build. The browser loads `index.html` and the script tags pull `kmap-core.js` + the three CDN libs directly.

## Conventions & Anti-patterns

**Naming:** `camelCase` for functions and state keys, descriptive over terse (e.g. `renderOverlays`, `cascadeChange`, `openEscalatingConfirm`, `state.groupingVerified`). Constants are `UPPER_SNAKE_CASE` (e.g. `PALETTE`, `RESERVED`). CSS uses `kebab-case` BEM-ish class names (`.kmap-cell`, `.modal-give-up-label`, `.is-current`, `.is-locked`).

**Patterns used:**
- **Algorithmic core / UI shell separation** — every algorithm is in `kmap-core.js` and pure; everything DOM-related is in `index.html`.
- **Single global state** — one `state` object; reads and writes go through it; `cascadeChange(fromStep)` invalidates downstream state when an earlier step changes ([index.html:1627](index.html#L1627)).
- **Wizard with locked steps** — `state.step` (current view) + `state.maxStep` (furthest reached); `showOnlyCurrentStep()` ([index.html:2133](index.html#L2133)) toggles `.is-current` / `.is-locked`.
- **Per-step verification gate** — boolean flags (`truthTableVerified`, `kmapVerified`, `groupingVerified`, `solutionVerified`) gate the Continue button on each step.
- **Two confirm-modal flavors** — `openRunawayConfirm` ([index.html:2753](index.html#L2753)) for cursor-dodging "skip practice" pranks, `openEscalatingConfirm` ([index.html:3107](index.html#L3107)) for staged "are you really sure?" sequences.
- **Recursive-descent parser** — boolean expressions parsed by hand, no `eval` ([kmap-core.js:152](kmap-core.js#L152)).

**Avoid:**
- No build step, bundler, or transpiler — keep it openable as a static file.
- No framework (React, Vue, Svelte). Plain DOM APIs only.
- No `package.json` and no npm dependencies — all browser libs from CDN, all dev deps are just Node built-ins.
- No DOM access from `kmap-core.js` — keeps it pure and Node-testable.
- No `eval()` for parsing — recursive descent only.
- No mocks in tests — direct input/output assertions on the algorithmic functions.
- No backwards-compat shims when the design changes — rewrite the call site.

## Maintenance

This file is a living document. Claude must update it automatically — without being asked —
whenever any of the following occur:
- A new file or directory is added that changes the project structure
- A new dependency, library, or tool is introduced
- A build, test, or run command is established or changes
- An architectural pattern or convention is established or changed

Update only the affected section(s). Do not rewrite the whole file.
Apply the same updates to `.claude/docs/architectural_patterns.md` when relevant.

## Additional Documentation

- [.claude/docs/architectural_patterns.md](.claude/docs/architectural_patterns.md) — deeper detail on state flow, the algorithmic pipeline, and UI patterns (overlays, modals, single-step wizard).
- [README.md](README.md) — public-facing summary with the live-demo URL.
