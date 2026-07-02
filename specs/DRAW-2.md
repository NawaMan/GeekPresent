# Draw — Phase 2: Curves, Arcs, Polylines, Labels, Draw-on Animation

> Part 2 of 3. Builds on [DRAW-1.md](./DRAW-1.md) (Draw surface, Line, Rect, Ellipse). See also [DRAW-3.md](./DRAW-3.md) (LAYOUT-mode visual editing).
>
> **Read DRAW-1.md first** — the Hard Constraints, Architectural Decisions, File Structure, Public API types, Accessibility, Styling, and Testing & Quality Gates sections there apply to every phase and are not repeated in full here.

## Prerequisites

Phase 1 complete: pure `drawCore.ts` (paths, arrowheads, segment math), pointer-transparent `Draw` surface, `Line`/`Rect`/`Ellipse`, `--draw-*` theming, demo route.

## Recap of Relevant Architecture

Shapes are markup children of `<Draw>`, geometry props are human-readable (never raw path syntax), all math is pure in `drawCore.ts`, everything prerenders. Arrowheads are computed polygons fed by an end-tangent angle — this phase supplies curved shapes' tangents to the same `arrowHead` function.

## Usage Target

```svelte
<Draw title="Data flow">
  <Curve from={[200, 800]} to={[1200, 300]} c1={[700, 900]} arrow="end" />          <!-- quadratic -->
  <Curve from={[200, 200]} to={[900, 700]} c1={[500, 100]} c2={[700, 800]} />       <!-- cubic -->
  <Arc from={[400, 540]} to={[1500, 540]} bend={0.3} arrow="both" label="round trip" />
  <Polyline points={[[100, 900], [400, 700], [700, 950], [1100, 600]]} smooth />
  <Line from={[300, 500]} to={[1600, 500]} draw={1.5} />                            <!-- draws itself in 1.5s -->
</Draw>
```

## Phase 2 Deliverables

1. **`Curve.svelte`** — quadratic when only `c1` is given, cubic with `c1` + `c2`. `curvePath(from, to, c1, c2?)` is pure in `drawCore.ts`. Supports `arrow` at either end via the curve's end tangents.
2. **`Arc.svelte`** — a circular arc through `from`/`to` with a signed **`bend`** prop: the sagitta as a fraction of the chord length (`bend={0.5}` bulges by half the chord; negative bends to the other side; `bend={0}` degenerates to a straight line). `arcPath(from, to, bend)` does the radius/flag math internally — **raw SVG arc parameters (`rx`, `large-arc-flag`, `sweep-flag`) never appear in the API**; `bend` is what a human can read in a diff and what Phase 3's handle drags.
3. **`Polyline.svelte`** — `points: Point[]`, optional `close` (polygon) and `smooth` (Catmull-Rom converted to cubic segments — pure `smoothPath(points)` — the curve passes *through* every point, no overshoot-prone fitting).
4. **Curve evaluators in `drawCore.ts`**: `pointAt(shape, t)` and `angleAt(shape, t)` for line/quadratic/cubic/arc, `t ∈ [0, 1]`. Used now for label placement and arrow tangents; Phase 3's bend handle and the possible follow-a-path future (see DRAW-3 non-goals) sit on the same functions.
5. **Shape labels** — a `label` prop gains a visible twin: `labelText` renders SVG `<text>` at `pointAt(labelAt ?? 0.5)` offset perpendicular by `labelOffset` px, themed by `--draw-font-size`/`--draw-stroke`. (`label` alone stays aria-only, as in Phase 1.)
6. **Draw-on animation** — a `draw` prop (seconds) animates the shape drawing itself via stroke-dasharray/dashoffset in scoped CSS. CSS-driven so it runs in the prerendered page without JS and shows up in `AnimationBar`'s scan like any other finite animation. Applies to Line/Curve/Arc/Polyline.

## Phase 2 Acceptance Criteria

- `bend={0}` renders exactly the straight `from`→`to` line; `bend={0.3}` vs `bend={-0.3}` bulge to opposite sides of the chord; `|bend|` beyond ~1 still renders a sane arc (clamped, documented).
- An `arrow="end"` on a strongly-curved quadratic points along the curve's end tangent, not along the chord.
- A `smooth` Polyline passes through every input point (assert `pointAt` at segment boundaries equals the inputs).
- `labelAt={0.5}` on an Arc places the text at the arc's apex, offset off the stroke, readable on both light and dark themes.
- A shape with `draw={1.5}` is fully drawn in the no-JS prerendered page after the animation completes, and `AnimationBar` can scrub it alongside a slide's other animations.

## Cross-Cutting Requirements (carried from Phase 1 — see DRAW-1.md for full text)

- **API purity:** no raw path/arc syntax in props; all new math (`curvePath`, `arcPath`, `smoothPath`, `pointAt`, `angleAt`) is pure and NaN-safe in `drawCore.ts`.
- **SSR-safety:** every new shape prerenders its complete SVG; the `draw` animation is CSS, not `onMount` scripting.
- **Accessibility:** `labelText` is real SVG `<text>`; `label` continues to feed `aria-label`.

## Testing & Quality Gates

- Unit-test `arcPath` (bend 0 / positive / negative / clamped, vertical and horizontal chords, zero-length chord), `smoothPath` (2 points degenerates to a line, collinear points stay collinear), and `pointAt`/`angleAt` (t = 0/0.5/1 against hand-computed values for each shape kind).
- Extend component tests: quadratic vs cubic `d` strings, arrowhead polygon presence on curves, label `<text>` position attributes, dasharray attributes when `draw` is set.
- `svelte-check` passes with no new errors; Vitest suite green before each commit.

## Commit Cadence

One commit per numbered deliverable, message format `feat(draw): <deliverable>`, tests in the same commit as the code they cover. End the phase with the demo route updated to showcase curves, arcs, smooth polylines, labels, and draw-on animation.
