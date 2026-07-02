# Chart — Phase 2: Multi-Series, Legend, Tooltips, Time Axis

> Part 2 of 3. Builds on [CHART-1.md](./CHART-1.md) (core MVP). See also [CHART-3.md](./CHART-3.md) (pie/donut, aggregation, DataTable composition).
>
> **Read CHART-1.md first** — the Hard Constraints, Architectural Decisions, File Structure, Public API types, Accessibility, Styling, and Testing & Quality Gates sections there apply to every phase and are not repeated in full here.

## Prerequisites

Phase 1 complete: pure `chartCore.ts` (accessors, extents, nice ticks, linear/band scales, gap-aware line paths), `Axis.svelte`, single-series `BarChart`/`LineChart`, `--chart-*` theming, demo route.

## Recap of Relevant Architecture

Charts take `data: T[]` + `x: AxisDef` + `series: SeriesDef[]`. Phase 1 used exactly one series; this phase makes `series` plural everywhere. All new math (stacking, time ticks, nearest-point search) is pure in `chartCore.ts`; components stay wiring + SVG. Interactivity is an `onMount` enhancement — SSR output is the complete, non-interactive chart.

## Usage Target

```svelte
<LineChart
  data={rows}
  x={{ value: 'deployed', type: 'time', label: 'Deploy date' }}
  series={[
    { key: 'requests', label: 'Requests', value: 'requests' },
    { key: 'cost', label: 'Cost', value: 'cost', format: (v) => `$${v.toFixed(2)}` }
  ]}
  title="Requests and cost over time"
>
  {#snippet tooltip(x, points)}
    <strong>{x}</strong>
    {#each points as p}<div>{p.label}: {p.formatted}</div>{/each}
  {/snippet}
</LineChart>

<BarChart data={rows} x={{ value: 'region' }} series={regionSeries} stacked title="…" />
```

## Phase 2 Deliverables

1. **Multi-series rendering.** `LineChart`: one line per series, colored from the palette (`--chart-series-N` by series index, `SeriesDef.color` override). `BarChart`: `grouped` (default — bands subdivided per series) and `stacked` (boolean prop). `stackSeries(rows, series)` is a pure function in `chartCore.ts`; blanks stack as 0 **and this is documented** (contrast with lines, where blanks gap).
2. **Legend.** `ChartLegend.svelte` (shared component, rendered by charts when `legend` prop is set, or usable standalone): swatch + label per series, click/keyboard toggles a series' visibility. Hidden series are excluded from scale domains (y re-fits). Visibility is internal `$state` exposed via `bind:hidden` (a `Set<string>`/array of series keys) so a parent can drive it — the `bind:state` philosophy from the DataTable applied to charts.
3. **Hover tooltip.** Pointer tracking over the plot area finds the nearest x (pure `nearestIndex(xs, px)` — binary search, unit-tested); a vertical guide line highlights the x; `ChartTooltip.svelte` shows x + one entry per visible series using `format`. Content overridable via a `tooltip` snippet receiving `(xValue, points)`. Pointer-only enhancement: attaches `onMount`, nothing rendered during SSR, no layout shift.
4. **Time x-axis.** `x.type: 'time'`: values coerce via the same date semantics as the DataTable's sorting (`Date`, ISO strings; invalid dates are blanks). `timeTicks(min, max, count≈6)` picks calendar-aware steps (year / quarter / month / week / day) with a matching default label format; `AxisDef.format` overrides.

## Phase 2 Acceptance Criteria

- Two series with different magnitudes render legibly; hiding the larger one via the legend re-scales the y axis to fit the smaller.
- Stacked bars: each stack's total equals the sum of its visible series values; a blank contributes 0 and doesn't corrupt segments above it.
- Tooltip shows formatted values (`$501.26`, `1,253,153`) for every visible series at the hovered x, and never appears in the prerendered HTML.
- A time axis spanning ~3 years shows year/quarter ticks; the same axis over 2 weeks shows day ticks — no unlabeled or overlapping tick spam.

## Cross-Cutting Requirements (carried from Phase 1 — see CHART-1.md for full text)

- **Accessibility (this phase adds):** legend toggles are real `<button>`s with `aria-pressed`; the tooltip container is `aria-hidden` (pointer-transient info must also exist accessibly — series `aria-label`s and, in Phase 3, the paired DataTable).
- **Pipeline purity:** stacking, time ticks, and nearest-point search are pure `chartCore.ts` functions; the chained `$derived` stages are never merged.
- **SSR-safety:** interactive layers mount client-side only; the static SVG is byte-identical with or without JS.

## Testing & Quality Gates

- Unit-test `stackSeries` (blanks as 0, negative segments, single series degenerates to plain bars), `timeTicks` (year/month/day ranges, DST-adjacent spans, min===max), and `nearestIndex` (exact hit, midpoints, out-of-range clamping).
- Extend component tests: N series → N `<path>`s / N rects per band; legend toggle removes a series and changes the y tick labels; grouped vs stacked rect layouts; tooltip snippet renders on simulated pointer move.
- `svelte-check` passes with no new errors; Vitest suite green before each commit.

## Commit Cadence

One commit per numbered deliverable, message format `feat(chart): <deliverable>`, tests in the same commit as the code they cover. Run `svelte-check` and the test suite before each commit. End the phase with the demo route updated to showcase multi-series lines, grouped/stacked bars, the legend, tooltips, and the time axis.
