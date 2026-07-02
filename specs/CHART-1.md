# Chart — Phase 1: Core MVP (scales, axes, Bar + Line)

> Part 1 of 3. See [CHART-2.md](./CHART-2.md) (multi-series, legend, tooltips, time axis) and [CHART-3.md](./CHART-3.md) (pie/donut, aggregation, DataTable composition).

## Objective

Build a reusable, dependency-free family of SVG chart components in Svelte 5 (runes mode) for the common cases — bar and line first, pie later — designed from day one to visualize the same plain-array data the DataTable renders. The end state (Phase 3) is a slide showing a DataTable and a chart driven by one shared dataset and one shared `TableState`: filter the table, watch the chart change.

## Hard Constraints (all phases)

- Svelte 5 with runes (`$state`, `$derived`, `$props`, `$bindable`). No legacy `export let` / stores-based reactivity.
- Zero runtime dependencies. No D3, no chart libraries, no utility libraries. All math is ours.
- TypeScript throughout (`<script lang="ts">`), with exported types for the public API.
- All geometry/data math must be pure functions in a separate module (`chartCore.ts`), independently unit-testable without rendering a component — this is where the bugs live (scales, ticks, stacking, arcs), exactly as `tableCore.ts` is for the DataTable.
- SSR/prerender-safe: a chart must render its full SVG server-side from props alone. Anything that needs the DOM (pointer tracking, resize observation) attaches in `onMount` and only *enhances*.
- Accessible by default (see Accessibility section).

## Architectural Decisions (settled — do not revisit)

**1. SVG with a fixed logical coordinate system, not canvas.** Each chart renders into `<svg viewBox="0 0 {width} {height}">` (logical defaults 640×400) and scales visually via CSS. Declarative SVG fits Svelte's rendering model, survives prerendering, stays crisp under the deck's FITTED scaling, and is themable with plain CSS custom properties. No `ResizeObserver` in Phase 1 — `viewBox` handles size.

**2. Pure geometry in `chartCore.ts`.** Scale factories, tick generation, path building, stacking, and aggregation are pure functions. Components contain only `$derived` wiring and SVG markup. The chained-`$derived` discipline from the DataTable applies: `data → per-series values → scales → geometry (paths/rects) → SVG`, each step its own `$derived`, never merged.

**3. The accessor convention is shared with the DataTable.** Anywhere a chart needs a value out of a row it accepts `Accessor<T> = string | ((row: T) => unknown)` — the same field-name-or-function pattern as the DataTable's `rowKey`/`sortValue`. Charts consume plain `T[]` arrays — including exactly what `tableCore`'s `filterRows`/`sortRows` emit — so a chart can sit downstream of a table's `bind:state` without any coupling. **Charts must not import from `$lib/datatable`**; the only contract is "plain arrays + accessors + pure pipeline".

**4. One component per chart type, sharing primitives.** `BarChart.svelte`, `LineChart.svelte` (Phase 1), `PieChart.svelte` (Phase 3) — not a mega `<Chart type=...>`. Shared internals: `Axis.svelte`, later `ChartLegend.svelte`/`ChartTooltip.svelte`. Shared props shape across chart types (`data`, `x`, `series`, `width`, `height`, `title`, `description`).

**5. Theming via `--chart-*` custom properties**, mirroring `--dt-*`: `--chart-bg`, `--chart-fg`, `--chart-grid`, `--chart-axis`, `--chart-font-size`, and a series palette `--chart-series-1` … `--chart-series-8` with sensible built-in defaults. A `SeriesDef.color` overrides the palette.

## File Structure

```
src/lib/chart/
  chartCore.ts         # pure: accessors, extents, scales, ticks, paths (+ stacks/arcs/aggregation later)
  types.ts             # Accessor, SeriesDef, AxisDef, scale/tick types
  Axis.svelte          # x/y axis: line, ticks, labels, gridlines
  BarChart.svelte      # Phase 1
  LineChart.svelte     # Phase 1
  index.ts             # public exports
tests/
  chartCore.test.ts    # unit tests for the pure functions
  Charts.test.ts       # component smoke tests (structure, not pixels)
```

## Public API (target shape — full surface; Phase 1 uses the subset it needs)

```ts
// types.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Accessor<T = any> = string | ((row: T) => unknown);

export interface SeriesDef<T = any> {
  key: string;                       // stable identity (legend toggling, colors)
  label: string;                     // legend / tooltip text
  value: Accessor<T>;                // the y value (or slice size)
  color?: string;                    // overrides --chart-series-N
  format?: (value: number) => string; // tooltip/axis-adjacent label text
}

export interface AxisDef<T = any> {
  value: Accessor<T>;                // the x value
  type?: 'band' | 'linear' | 'time'; // default: band for bars, linear for lines ('time' lands in Phase 2)
  label?: string;
  format?: (value: unknown) => string; // tick text
  ticks?: number;                    // tick-count hint (linear/time)
}

// chartCore.ts — pure factories return plain objects, no classes
export interface LinearScale {
  map: (value: unknown) => number;   // domain → range px (NaN-safe: blanks map to NaN)
  ticks: number[];                   // "nice" tick values covering the domain
  domain: [number, number];
}
export interface BandScale {
  map: (value: unknown) => number;   // band start px
  bandwidth: number;
  domain: unknown[];                 // in first-seen order
}
```

## Scales & Ticks (get this right — it's the classic bug)

In `chartCore.ts`:

- `valueOf(row, accessor)` — the shared accessor resolver (field name or function).
- `numericExtent(rows, accessor)` — `[min, max]` ignoring `null`/`undefined`/`''`/`NaN` (reuse the DataTable's blank semantics).
- `niceTicks(min, max, count≈5)` — 1/2/5×10ⁿ steps; ticks land on round numbers and *cover* the data (first tick ≤ min, last ≥ max). Handle: min === max (pad to a unit span), all-blank data (fall back to [0, 1]), negative-only and mixed-sign domains.
- `linearScale(domain, range, {nice: true, zero: false})` — `zero: true` forces the domain to include 0 (bars **always** use it; lines don't by default).
- `bandScale(values, range, {paddingInner: 0.15, paddingOuter: 0.1})` — categorical x for bars; domain in first-seen order (the caller controls order by sorting rows — same philosophy as the table's pipeline).
- `linePath(points)` — builds the SVG `d` string from `{x, y}` pairs; a blank/NaN y **breaks the line into a gap** (`M` restart), never plots 0.

## Phase 1 Deliverables

1. `chartCore.ts` with `valueOf`, `numericExtent`, `niceTicks`, `linearScale`, `bandScale`, `linePath` — all pure, all unit-tested (see gates).
2. `Axis.svelte`: renders one axis (x or y) from a scale — axis line, ticks, tick labels (via `format`), optional gridlines across the plot area, optional axis label.
3. `BarChart.svelte`: single-series vertical bars over a band x-scale; y linear with forced zero baseline; negative values hang below the zero line; per-bar `aria-label`.
4. `LineChart.svelte`: single-series line over a linear x-scale; blank y values produce gaps; optional point dots (`points` prop).
5. Theming with `--chart-*` custom properties + the series palette; charts inherit `color` for text so they sit on light or dark slides unchanged.
6. Demo route (`chart-component.html`, registered in `pages.ts`, with the standard slide `+layout.js`) showing a bar chart and a line chart over a hardcoded dataset with negatives, blanks, and an uneven x spacing — the sorting-edge-case dataset of this spec.

## Phase 1 Acceptance Criteria

- A domain of `[3, 987]` produces ticks like `0, 200, 400, 600, 800, 1000` — round steps covering the data, not `[3, 199.8, …]`.
- Bars for negative values render below a visible zero line; the y domain includes 0 even when all values are positive and far from it.
- A `null` y in the middle of a line series renders a visible gap (two sub-paths), not a dip to 0.
- `min === max` (e.g. every value is 42) still renders a sensible axis, not a collapsed or NaN scale.
- The demo slide prerenders: the built HTML already contains the full `<svg>` markup.

## Accessibility Requirements (all phases)

- Each chart root: `role="img"` with a required `title` prop → SVG `<title>`, optional `description` → `<desc>`, and `aria-label`.
- Text (axis labels, tick labels) is real SVG `<text>`, not paths — selectable and readable by AT.
- Marks carry `aria-label`s where enumerable (bars, pie slices): "us-east: 1,234 requests".
- Don't rely on color alone where it matters; Phase 2's legend and tooltips carry the labels. When a chart accompanies a DataTable of the same data (Phase 3), the table *is* the accessible data representation — say so in the chart's `<desc>`.

## Styling (all phases)

Plain scoped CSS with `--chart-*` custom properties; no Tailwind, no external CSS. Neutral defaults that inherit `color`; the deck themes via the custom properties exactly like `--dt-*`.

## Testing & Quality Gates (all phases)

- Vitest for `chartCore.ts`. Target: every branch of `niceTicks`, `linearScale`, `bandScale`, and `linePath` covered — including empty data, single datum, all-blank, min===max, negative-only, and mixed-sign domains.
- Component smoke tests (Vitest + @testing-library/svelte, jsdom): SVG structure assertions — bar `<rect>` count equals row count, gap in the path `d` for a blank, tick label texts, zero-line presence. No pixel testing.
- `svelte-check` passes with no new errors; Vitest suite green before each commit.
- Each phase ends with the demo route(s) updated to showcase the new features.

## Commit Cadence

One commit per numbered deliverable, message format `feat(chart): <deliverable>`, with tests in the same commit as the code they cover. Run `svelte-check` and the test suite before each commit.
