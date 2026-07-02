# Draw — Phase 1: Core MVP (Draw surface, Line, Rect, Ellipse)

> Part 1 of 3. See [DRAW-2.md](./DRAW-2.md) (curves, arcs, polylines, labels, draw-on animation) and [DRAW-3.md](./DRAW-3.md) (LAYOUT-mode visual editing).

## Objective

Build a reusable, dependency-free family of SVG drawing components in Svelte 5 (runes mode) for arbitrary annotation on the fixed canvas — connect two boxes with an arrow, circle a region, underline a point, frame an area. The end state (Phase 3) is Block-grade authoring ergonomics for every shape: flip on LAYOUT mode, drag a line's endpoints or a curve's control points on the canvas, then Copy the shape's updated tag and paste it back over the source — the slide stays plain, diffable Svelte.

## Hard Constraints (all phases)

- Svelte 5 with runes (`$state`, `$derived`, `$props`, `$bindable`). No legacy `export let` / stores-based reactivity in new code (auto-subscribing to the existing `layoutMode`/`layoutHistory` stores in Phase 3 is fine — that's their public API).
- Zero runtime dependencies. No SVG helper libraries, no geometry libraries. All math is ours.
- TypeScript throughout (`<script lang="ts">`), with exported types for the public API.
- All geometry math must be pure functions in a separate module (`drawCore.ts`), independently unit-testable without rendering a component — this is where the bugs live (arrowhead angles, arc conversion, curve evaluation), exactly as `tableCore.ts` / `chartCore.ts` are for their components.
- SSR/prerender-safe: every shape must render its full SVG server-side from props alone. Anything that needs the DOM (Phase 3's drag handles) attaches in `onMount` and only *enhances* — and only in LAYOUT mode.
- **The public API never exposes raw SVG path syntax.** Geometry props stay human-readable and diffable (`from`, `to`, `bend`), because the copied-back tag *is* the source of truth on the slide. `drawCore.ts` owns the translation to `d` strings.
- Accessible by default (see Accessibility section).

## Architectural Decisions (settled — do not revisit)

**1. SVG in canvas coordinates, not `<canvas>`.** `<Draw>` renders one absolutely-positioned `<svg>` spanning the whole canvas with `viewBox="0 0 1920 1080"` (both dimensions overridable for portrait/custom decks). SVG user units therefore equal canvas pixels equal Block `x`/`y` — the same "the numbers match, no math" rule KeyframeStudio documents: place `<Draw>` as a direct child of the slide, exactly like a bare `<Block>`. Vector output stays crisp under FITTED scaling and SCALED zoom to 400%; declarative markup prerenders and diffs; a raster `<canvas>` would do neither.

**2. Pure geometry in `drawCore.ts`.** Path building, arrowhead polygons, and segment math are pure functions. Components contain only `$derived` wiring and SVG markup — the chained-`$derived` discipline from the DataTable/Chart applies.

**3. One component per shape, composed as markup inside `<Draw>`.** `<Draw><Line …/><Rect …/></Draw>` — shapes are children rendering bare SVG elements; `<Draw>` provides canvas size via context. A data-driven mega-API (`<Draw shapes={[…]}>`) is rejected: shapes as markup diff line-by-line like everything else on a slide, and Phase 3's per-shape Copy depends on each shape being its own tag.

**4. The overlay never eats input.** The `<svg>` renders with `pointer-events: none` so a full-canvas Draw never blocks clicks, drags, or text selection on content beneath it. (Phase 3 re-enables pointer events *only* on editing chrome, only in LAYOUT mode.)

**5. Arrowheads are computed polygons, not `<marker>` defs.** An `arrow` prop (`'none' | 'end' | 'start' | 'both'`) makes `drawCore.ts` compute the head triangle from the shaft's end tangent and shorten the shaft so it doesn't poke through the tip. Inline polygons inherit the shape's color reliably everywhere (marker `context-stroke` doesn't), and the math is a pure, unit-testable function — which Phase 2 reuses for curved shafts.

**6. Escape hatch: raw SVG passes through.** `<Draw>`'s slot accepts arbitrary SVG elements alongside shape components. The components cover the common cases; they don't police the exotic ones.

**7. Theming via `--draw-*` custom properties**, mirroring `--chart-*`/`--dt-*`: `--draw-stroke` (default `currentColor`, so shapes sit on light or dark slides unchanged), `--draw-thickness`, `--draw-fill` (default `none`), `--draw-font-size` (used by Phase 2 labels). Per-shape props override the properties.

## File Structure

```
src/lib/draw/
  drawCore.ts          # pure: paths, arrowheads, segment math (+ curves/arcs/evaluators later)
  types.ts             # Point, ArrowMode, shared prop types
  Draw.svelte          # the canvas-coordinate SVG surface (context provider)
  Line.svelte          # Phase 1
  Rect.svelte          # Phase 1
  Ellipse.svelte       # Phase 1
  index.ts             # public exports
tests/
  drawCore.test.ts     # unit tests for the pure functions
  Draw.test.ts         # component smoke tests (structure, not pixels)
```

## Public API (target shape — full surface; Phase 1 uses the subset it needs)

```ts
// types.ts
export type Point = [number, number];                     // canvas px, [x, y]
export type ArrowMode = 'none' | 'start' | 'end' | 'both';
```

```svelte
<Draw title="Request flow">                               <!-- full-canvas overlay -->
  <Line from={[300, 540]} to={[900, 540]} arrow="end" thickness={6} />
  <Line from={[100, 100]} to={[400, 300]} dash />
  <Rect x={860} y={480} width={400} height={120} rounded={12} />
  <Ellipse x={1300} y={200} width={360} height={200} color="#e74c3c" />
  <circle cx="960" cy="540" r="8" fill="currentColor" /> <!-- raw SVG escape hatch -->
</Draw>
```

- Shared shape props: `color` (stroke, overrides `--draw-stroke`), `thickness` (stroke width, overrides `--draw-thickness`), `dash` (`true` for a default pattern, or a string like `"12 6"`), `fill` (Rect/Ellipse; overrides `--draw-fill`), `label` (aria — see Accessibility).
- `Line`: `from: Point`, `to: Point`, `arrow: ArrowMode = 'none'`, `arrowSize` (canvas px, default scales with thickness).
- `Rect`: `x`, `y`, `width`, `height`, `rounded` (corner radius px). **Box geometry, deliberately Block-shaped** — Phase 3 reuses Block's move/resize/Copy machinery for it wholesale.
- `Ellipse`: `x`, `y`, `width`, `height` — the ellipse inscribed in that box, same Block-shaped geometry (not `cx`/`cy`/`rx`/`ry`) for the same Phase 3 reason and because "draw an ellipse over that area" is how an author thinks.
- `Draw`: `width = 1920`, `height = 1080` (the coordinate space), `title` (required unless `decorative`), `description`, `decorative` (boolean → `aria-hidden`).

## `drawCore.ts` (get this right — it's where the bugs live)

- `shorten(from: Point, to: Point, by: number): Point` — the point `by` px back from `to` along the segment; degenerate zero-length segments return `to` unchanged (never NaN).
- `arrowHead(tip: Point, angle: number, size: number): Point[]` — the three polygon points of a head of `size` at `tip` pointing along `angle` (radians).
- `segmentAngle(from: Point, to: Point): number` — end tangent for straight shafts (Phase 2 adds curve/arc tangents that feed the same `arrowHead`).
- `linePath(from: Point, to: Point): string` — the `d` string.
- All NaN-safe: a mid-edit half-typed prop must never emit `NaNpx` into the SVG (same discipline as KeyframeStudio's `r()`).

## Phase 1 Deliverables

1. `drawCore.ts` with `shorten`, `arrowHead`, `segmentAngle`, `linePath` — all pure, all unit-tested (see gates).
2. `Draw.svelte`: the canvas-spanning, pointer-transparent SVG surface; sets canvas size context for children; `role="img"` + `<title>`/`<desc>` wiring; `decorative` mode.
3. `Line.svelte` with `arrow` (shaft shortened behind each head) and `dash`.
4. `Rect.svelte` (with `rounded`) and `Ellipse.svelte`, both on Block-shaped box geometry.
5. Theming with the `--draw-*` custom properties; defaults inherit `currentColor`.
6. Demo route (`draw-component.html` in the `slides` deck, registered in `pages.ts`, with the standard slide `+layout.js` — `prerender = true`, `trailingSlash = "never"`) showing: an arrow connecting two positioned Blocks, a dashed line, a rounded Rect framing content, an Ellipse circling a word, and one raw-SVG escape-hatch element.

## Phase 1 Acceptance Criteria

- The demo slide prerenders: the built HTML already contains the full `<svg>` markup for every shape.
- Coordinate agreement: a `<Line from={[100, 200]} …/>` starts exactly at the top-left corner of a sibling `<Block x={100} y={200} …>` — no offset, in FITTED and in SCALED at any zoom.
- `arrow="end"`: the head's tip lands exactly on `to`; the shaft is shortened so no stroke pokes past the tip (visible at `thickness={10}`).
- A full-canvas `<Draw>` laid over a slide does not block clicking a button or selecting text beneath it.
- Zero-length degenerate shapes (`from` === `to`, zero-size Rect) render nothing or a point — never a console error or `NaN` in the DOM.
- Shapes stay vector-crisp in SCALED mode at 400% zoom.

## Accessibility Requirements (all phases)

- `<Draw>` root: `role="img"` with a required `title` prop → SVG `<title>`, optional `description` → `<desc>`. Purely decorative surfaces opt out with `decorative` → `aria-hidden="true"` (and then `title` is not required).
- Individual shapes accept `label` → `aria-label` for shapes that carry meaning on their own ("arrow from client to server").
- Don't rely on color alone for meaning — `dash`, `thickness`, and Phase 2 labels are the differentiators.

## Styling (all phases)

Plain scoped CSS with `--draw-*` custom properties; no Tailwind, no external CSS. Neutral defaults that inherit `currentColor`; the deck themes via the custom properties exactly like `--chart-*`/`--dt-*`.

## Testing & Quality Gates (all phases)

- Vitest for `drawCore.ts`. Target: every branch covered — including zero-length segments, negative coordinates, `size` larger than the segment, and non-finite inputs coerced safely.
- Component smoke tests (Vitest + @testing-library/svelte, jsdom): SVG structure assertions — `<line>`/`<path>` presence and endpoint attributes, arrowhead `<polygon>` when `arrow` is set, `pointer-events: none` on the surface, `<title>`/`aria-hidden` wiring. No pixel testing.
- `svelte-check` passes with no new errors; Vitest suite green before each commit.
- Each phase ends with the demo route(s) updated to showcase the new features.

## Commit Cadence

One commit per numbered deliverable, message format `feat(draw): <deliverable>`, with tests in the same commit as the code they cover. Run `svelte-check` and the test suite before each commit.
