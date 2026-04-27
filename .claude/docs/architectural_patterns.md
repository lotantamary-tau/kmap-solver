# Architectural Patterns

Detail to support [CLAUDE.md](../../CLAUDE.md). Each pattern is grounded in a `file:line` reference.

## Architectural Patterns

**Two-layer split: pure algorithmic core + DOM shell.** Every algorithm (Gray-code mapping, cube validator, term extraction, expression parser, Quine-McCluskey, Petrick's method, top-level solver) lives in [kmap-core.js](../../kmap-core.js) inside a UMD factory at [kmap-core.js:1](../../kmap-core.js#L1). The factory's return at [kmap-core.js:461](../../kmap-core.js#L461) is the entire public surface — `KMapCore.solve`, `KMapCore.parseExpression`, `KMapCore.cellToMinterm`, etc. The core has zero DOM access, so the same file is loaded as a `<script>` in the browser and `require()`d from Node tests without modification.

**Six-step wizard, one visible step at a time.** Step bodies live in [index.html](../../index.html) as `<section>` elements; [showOnlyCurrentStep()](../../index.html#L2133) toggles `.is-current` (visible) and `.is-locked` (visible but interactivity disabled, for previously-completed steps awaiting Edit). A floating sticky stepper at the top renders numbered pills clickable up to `state.maxStep`.

## Design Decisions

**No build step.** The project is intentionally a pair of static files plus a tests folder. Rationale: the user opens `index.html` locally, GitHub Pages serves the same files at the public URL, and there's no toolchain to break. Trade-off accepted: no JSX/TS/SCSS, all CSS/HTML/JS hand-written.

**UMD wrapper for the core.** [kmap-core.js:1-7](../../kmap-core.js#L1-L7) detects `module.exports` (Node) vs. `self`/`this` (browser). This lets the same file be the script the browser loads AND the module the Node test runner requires, without conditional code paths or a build step.

**Recursive-descent expression parser, no `eval`.** [parseExpression()](../../kmap-core.js#L152) tokenizes user input with a variable-name-aware lexer (longest-prefix match against `state.varNames`) and parses into an AST node tree. Disables implicit AND when any variable name has length > 1 to remove ambiguity.

**Single global `state` object.** Defined at [index.html:1903](../../index.html#L1903). All reads and writes go through it. There's no Redux-style action layer — render functions read `state` directly and event handlers mutate it directly, then call [renderAll()](../../index.html#L2102).

## State Management

**Canonical store:** one `state` object at [index.html:1903](../../index.html#L1903). Notable fields:

- `state.n` — variable count (1–4)
- `state.varNames` — user-chosen names (length `n`)
- `state.kmapLayout` — row/column variable assignment (defaults via `KMapCore.defaultLayout`)
- `state.values` — length `2^n` array of `0 | 1 | 'X'`; canonical for both truth table and K-map
- `state.kmapDraft` — what the user has typed into the K-map cells (separate from `values` so `Check K-map` can compare)
- `state.answerKey` — `{expression, evaluated}` parsed from the user's source expression
- `state.solverGroups` / `state.manualGroups` — group overlays (rendered into both Step 4 and Step 5 K-maps)
- `state.step` (current view) + `state.maxStep` (furthest reached)
- Per-step verification flags: `truthTableVerified`, `kmapVerified`, `groupingVerified`, `solutionVerified` — gate the Continue button on each step
- `state.solveMode` — `'SOP' | 'POS' | null`
- `state.pendingSelection` — `Set<minterm>` for the Step 4 manual-grouping click/drag selection

**Cascade invalidation.** [cascadeChange(fromStep)](../../index.html#L1627) clears every state field that depends on the changed step's output, then resets `state.maxStep = fromStep`. Called from every Edit/Reset/cell-cycle that mutates an earlier step's data, so downstream state can never go stale.

## Recurring Logic Patterns

**Group overlays — render into multiple containers.** [renderOverlays()](../../index.html#L2405) iterates `[#step4KmapContainer, #step5KmapContainer]` and draws colored rectangles for every group in `state.solverGroups + state.manualGroups`. Position math anchors to the overlay's own `getBoundingClientRect()` (not its parent's) so padding and border on `.kmap` don't shift the rectangles off the cells. Labels stagger across four corner positions (`.label-tl/-tr/-bl/-br`) by group index modulo 4 to avoid collisions when groups overlap.

**Two flavors of confirmation modal.**
- [openRunawayConfirm()](../../index.html#L2753) — the "Yes" button physically dodges the cursor; a give-up section reveals after a delay. Surrender mechanics dispatched by `giveUpKind`: `'click' | 'hold' | 'type' | 'escalate'`. Used for the Step 2 / Step 3 / Step 4 "skip practice" pranks.
- [openEscalatingConfirm()](../../index.html#L3107) — each Yes click swaps the modal's question + button text for the next stage of escalation; final stage triggers `onConfirm`. Used by the Step 5 Reveal-Answer flow.

**Single-step transitions with fade.** [showOnlyCurrentStep()](../../index.html#L2133) handles two paths: a `.is-leaving` fade-out → swap → `.is-current` fade-in (220 ms), and a snap path for initial mount or no change. Both paths re-call `renderOverlays()` after the visibility change so K-map cell rects are valid before the overlay is positioned.

**Off-screen render for export.** [withStepVisible()](../../index.html#L3219) temporarily sets a hidden step to `display: block; position: absolute; left: -99999px` so html2canvas can snapshot it, then restores the original styles in a `finally` block. Used by the Step 6 PNG / PDF downloads.

**Quine-McCluskey + Petrick's method.** [findMinimumCover()](../../kmap-core.js#L348) generates all prime implicants ([generatePrimes()](../../kmap-core.js#L318)), pulls essentials, then runs Petrick on the remainder using bitmask sums-of-products with absorption + idempotence. Tiebreak: fewest total literals.

## API / Interface Design Patterns

**One namespace, flat exports.** The browser sees `window.KMapCore`; Node sees `require('./kmap-core.js')`. Both yield the same object exported at [kmap-core.js:461](../../kmap-core.js#L461). Functions take primitive args (numbers, strings, arrays of numbers) and return plain objects — no classes, no constructors, no shared state.

**Result objects use `{ok, ...}` for fallible operations.** [parseExpression()](../../kmap-core.js#L152) returns `{ok: true, ast}` or `{ok: false, error}`. [isValidCube()](../../kmap-core.js#L90) returns `{ok: true, andMask, freeBits}` or `{ok: false, reason}`. Callers branch on `ok`.

**Test runner.** [tests/run.js](../../tests/run.js) defines `global.test`, `global.assert`, `global.assertEqual`, `global.assertThrows`, then `require()`s every `*.test.js` in the directory. Output is `N passed, M failed (T total)` and exit code 1 on any failure. No mocks, no async — tests assert directly against the algorithmic exports.

## Dependency Injection / Inversion of Control

Minimal. `KMapCore` is a static module loaded via `<script>` (browser) or `require()` (Node). UI code calls `KMapCore.foo(...)` directly — there's no DI container or service-locator layer. The only injection-style indirection is in `KMapCore.solve(values, n, mode, varNames)` where `varNames` is passed in by the caller so `extractTerm` can build the output expression in whatever names the user picked.
