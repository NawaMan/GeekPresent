# Draw — Phase 3: LAYOUT-Mode Visual Editing

> Part 3 of 3. Builds on [DRAW-1.md](./DRAW-1.md) (surface + basic shapes) and [DRAW-2.md](./DRAW-2.md) (curves, arcs, evaluators).
>
> **Read DRAW-1.md first** — its Hard Constraints and cross-cutting sections apply. This phase also builds directly on the idioms in `Block.svelte` and `KeyframeStudio.svelte`; read both before starting.

## Prerequisites

Phases 1–2 complete. Working knowledge of the existing authoring machinery: `layoutMode`/`canLayout` gating, `layoutHistory.record()` undo/redo, Block's scale-aware drag math and snippet-emit Copy, KeyframeStudio's ghost-handle pattern.

## Objective

Make every Draw shape visually authorable, the way Block made boxes authorable: flip on LAYOUT mode, drag a line's endpoints, a curve's control points, or an arc's bend directly on the canvas, then **Copy the shape's updated opening tag** and paste it over the old one in the source. This is the "KeyframeStudio for shapes" — with one deliberate difference in architecture, below.

## Architectural Decisions (settled — do not revisit)

**1. Shapes self-edit; there is no central studio panel.** KeyframeStudio needs a coordinating panel because its stops form *one* animation with a shared timeline. Drawn shapes are independent, so the unit of editing is the shape — each grows its own handles and its own Copy, exactly Block's model. Copy emits only the shape's **opening tag** with live geometry (`<Curve from={[200, 800]} to={[1200, 300]} c1={[700, 900]} arrow="end" />`) — snippet-emit, never live source rewrite, one line to paste over. A cross-shape panel (palette, shape list) is out of scope (see Non-Goals).

**2. One shared pointer-drag helper, extracted first.** The live-scale drag math (`getBoundingClientRect().width / offsetWidth`, pointer capture, move/up teardown, Esc-cancel) now exists three times — Block, KeyframeStudio's rotate grip, KeyframeStudio's panel drag. Deliverable 1 extracts it to `$lib/utils/drag.ts` and refactors all three call sites onto it with **zero behavior change**, before any new editing code is written. New Draw handles are its fourth consumer, not a fifth copy.

**3. Handles are SVG, in canvas units; chrome is HTML, per-Draw.** Point handles render as SVG circles inside the Draw `<svg>` — canvas-unit geometry means they scale with the deck exactly like Block's chrome does, and they can sit precisely on curve points. The readout + Copy toolbar is HTML: `Draw.svelte`'s wrapper renders one floating toolbar for the currently **selected** shape (shapes register with Draw via context). HTML-in-SVG (`foreignObject`) is avoided.

**4. Editing is gated and recorded, Block-style.** All editing chrome exists only when `$canLayout && $layoutMode`. Every completed gesture calls `record({undo, redo})` with the net before→after (no-op gestures record nothing); Esc cancels an in-progress drag and restores start geometry. The published build stays byte-inert: `pointer-events` remains `none` on the surface; only handle/selection elements re-enable it, and only in LAYOUT mode.

**5. Nothing is saved behind your back.** Same contract as Block/KeyframeStudio: the editor is a *finder* for coordinates, reset on reload. Copy → paste into source is the only persistence.

## Public API Additions

```svelte
<Draw title="…" name="flow">        <!-- name: toolbar title + localStorage key, like KeyframeStudio's -->
  <Line   name="main" from={…} to={…} arrow="end" />   <!-- name shows in readout + copied tag -->
  <Curve  from={…} to={…} c1={…} />
  <Arc    from={…} to={…} bend={0.3} />
  <Rect   x={…} y={…} width={…} height={…} />
</Draw>
```

- Every shape gains optional `name` (readout + copied-tag identification, mirrors Block's).
- Every shape gains optional `grid` (snap step in canvas px while dragging, default 1 — mirrors Block's).

## Phase 3 Deliverables

1. **`$lib/utils/drag.ts`** — `trackPointer(event, {scaleFrom, onMove, onEnd, onCancel})`: pointer capture, screen→canvas delta via live rendered scale, window listener teardown, Esc-cancel. Refactor `Block.svelte` and both KeyframeStudio drag sites onto it. **Zero behavior change** — existing component tests and demo slides must pass untouched; this deliverable lands as its own commit before any Draw editing code.
2. **Point-handle primitive** (`DrawHandle.svelte`, internal): an SVG knob bound to a `Point`, draggable via the shared helper, with `grid` snapping and Shift-snapping hooks; styled like the existing grips (`--ctrl-strong-bg` knob, `--on-accent` ring).
3. **Line editing**: a handle per endpoint. Shift snaps the dragged endpoint to horizontal / vertical / 45° relative to the other endpoint (the drawing-tool analog of KeyframeStudio's Shift = 15° rotation detents).
4. **Curve editing**: endpoint handles plus control-point handles rendered with the conventional thin guide lines from each control point to its endpoint, so the handles read as what they are. Guide lines are editing chrome — never in the published output.
5. **Arc editing**: endpoint handles plus one **bend handle** at the arc's apex (`pointAt(0.5)`); dragging it perpendicular to the chord updates `bend` (pure inverse: `bendFromApex(from, to, apex)` in `drawCore.ts`, unit-tested against `arcPath`'s forward math).
6. **Rect/Ellipse editing via Block**: reuse `Block.svelte`'s existing `tag`/`attrs`/`selfClose` extension (the ImageBlock pattern) so Rect and Ellipse get move, resize, aspect-lock, grid, bounds, undo, and Copy wholesale — their box geometry was chosen in Phase 1 precisely for this. Their Copy emits `<Rect …/>` / `<Ellipse …/>`, not `<Block>`.
7. **Selection + Copy toolbar**: in LAYOUT mode, clicking a shape's stroke (or any of its handles) selects it; Draw's floating toolbar (draggable, position persisted per `name` in localStorage — the KeyframeStudio panel pattern) shows the shape's name + live geometry readout + a Copy button emitting the current opening tag, with the `window.prompt` clipboard fallback.
8. **Demo route update**: an annotated-diagram slide where every shape type is present and editable; the slide's own source (via `ViewSource`) matches what Copy emits.

## Phase 3 Acceptance Criteria

- Dragging a curve endpoint in SCALED mode at 250% zoom tracks the cursor 1:1 (scale-aware drag), same as a Block drag.
- After dragging, Copy emits the shape's opening tag with updated geometry; pasting it over the original line in the demo slide's source reproduces the on-canvas result exactly.
- Ctrl+Z reverts a completed handle drag; Esc mid-drag restores the gesture's start geometry; a click that doesn't move records nothing in history.
- Dragging an Arc's bend handle across the chord flips the sign of `bend`; `bendFromApex` round-trips with `arcPath` (drag to apex X, read bend, re-render, apex is X).
- In a published build (`canLayout` false): no handles, no toolbar, no guide lines in the DOM; the Draw surface still never intercepts pointer events.
- Block and KeyframeStudio behave identically after the drag-helper refactor: their component tests pass unmodified, and their demo slides work unchanged (manual smoke on drag, resize, rotate, panel drag, Esc, undo).

## Non-Goals (settled)

- **No freehand/pen tool, no full vector editor.** This is a coordinate finder for a handful of shapes on a slide, not Figma.
- **No persistence beyond Copy.** Nothing writes to source or storage (toolbar position excepted, as with KeyframeStudio's panel).
- **No z-order UI.** Stacking is markup order; the author reorders lines in the source.
- **No shape palette / add-shape UI** in this phase. Authors add shapes by typing a tag with rough coordinates, then drag to refine — same workflow as Block today. Revisit only if real usage demands it.
- **Deferred, door left open:** animating an element *along* a drawn path (KeyframeStudio × Draw). Phase 2's `pointAt`/`angleAt` are the required primitives and already exist; do not build more toward this now.

## Testing & Quality Gates

- Unit-test `bendFromApex` (round-trip with `arcPath`, both signs, degenerate chord) and any new pure snapping math (H/V/45° selection).
- Component tests: handles/toolbar/guide lines present only under `canLayout && layoutMode`; selection swaps the toolbar's target; copied-tag text matches live props after a simulated drag; Rect/Ellipse Copy emits their own tag names.
- The refactor commit (deliverable 1) runs the full existing suite — Block, KeyframeStudio-dependent demos — before anything else lands on top.
- `svelte-check` passes with no new errors; Vitest suite green before each commit.

## Commit Cadence

One commit per numbered deliverable, message format `feat(draw): <deliverable>` (`refactor(layout): shared pointer-drag helper` for deliverable 1), tests in the same commit as the code they cover. End the phase with the demo route showcasing end-to-end visual editing.
