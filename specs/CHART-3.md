# Chart — Phase 3: Pie/Donut, Aggregation, DataTable Composition

> Part 3 of 3. Builds on [CHART-1.md](./CHART-1.md) (core MVP) and [CHART-2.md](./CHART-2.md) (multi-series, legend, tooltips, time axis).
>
> **Read CHART-1.md first** — the Hard Constraints, Architectural Decisions, File Structure, Public API types, Accessibility, Styling, and Testing & Quality Gates sections there apply to every phase and are not repeated in full here.

## Prerequisites

Phases 1 & 2 complete: pure `chartCore.ts` through stacking/time ticks/nearest-point, `BarChart` (grouped/stacked) + `LineChart` (multi-series), `ChartLegend` with `bind:hidden`, tooltips, `--chart-*` theming.

This phase is the payoff: charts and the DataTable working as one system over shared data — which is why the modules were kept decoupled (plain arrays + accessors only, no cross-imports).

## Usage Target (the composition demo this phase must enable)

```svelte
<!-- one dataset, one state — the table and the charts stay in sync -->
<DataTable rows={servers} {columns} bind:state={tableState} selectable rowKey="id" bind:selected />

<BarChart
  data={aggregate(visibleRows, 'region', { value: sumOf('requests'), label: 'Requests' })}
  x={{ value: 'group' }}
  series={[{ key: 'value', label: 'Requests', value: 'value' }]}
  highlighted={selectedKeys}
  title="Requests by region (follows the table's filters)"
/>

<script lang="ts">
  // the same pure pipeline the table runs internally, reused outside it —
  // identical to how the CSV export and the fake server already work
  const visibleRows = $derived(
    sortRows(filterRows(servers, tableState.search, columns, tableState.columnFilters), tableState.sort, /* … */)
  );
</script>
```

## Phase 3 Deliverables

1. **Aggregation helpers** (pure, in `chartCore.ts`): `groupRows(rows, by)` (accessor-keyed grouping, first-seen order) and `aggregate(rows, by, {value, label})` producing `{group, value, count}` rows ready to chart — with `sumOf(accessor)`, `avgOf(accessor)`, `countOf()` reducer factories. Blank values are skipped (not zeroed) and this is documented. These turn *table-shaped* rows into *chart-shaped* rows; unit-tested.
2. **`PieChart.svelte` (donut via `innerRadius`).** `arcPath(cx, cy, r, innerR, startAngle, endAngle)` pure in `chartCore.ts` (handle the full-circle single-slice case — two arcs, not a degenerate path). Slices from `data` + one `SeriesDef`; labels outside or in the legend; slices under a `minSliceLabel` fraction get no in-slice label (legend/tooltip still carry them). Per-slice `aria-label` with value and percentage.
3. **Selection highlighting.** All chart types accept `highlighted?: unknown[]` (row keys) + `rowKeyAccessor?: Accessor` — when set, marks whose row key is in the list render emphasized (full opacity + `--chart-highlight` stroke) and the rest dim. This is the chart-side hook for the DataTable's `bind:selected`; the parent maps selected rows to keys. No coupling: charts never import DataTable types.
4. **Composition demo slide** (`datatable-chart.html`, registered in `pages.ts`, with the standard slide `+layout.js`): a DataTable (search + filters + selection enabled) beside a bar chart ("requests by region", via `aggregate`) and a line or pie chart, all driven by one dataset and the table's `bind:state`/`bind:selected` exactly as in the Usage Target. Filtering the table visibly reshapes the charts; selecting rows highlights their marks.

## Phase 3 Acceptance Criteria

- Typing in the table's search reshapes the bar chart to the filtered subset within one debounce cycle — no chart-specific filter code, just the shared pure pipeline.
- Selecting rows in the table highlights exactly those marks in the chart(s); clearing selection un-dims everything.
- A pie of 5 regions shows slices summing to 100% (±rounding), a donut hole when `innerRadius` is set, and no in-slice label on slices under the threshold.
- `aggregate` over the demo dataset: blank `requests` rows don't drag averages down (skipped, not zeroed); group order follows the (sorted) input order.

## Cross-Cutting Requirements (carried from Phase 1 — see CHART-1.md for full text)

- **Accessibility (this phase adds):** pie slices carry value + percentage `aria-label`s; the composition slide's DataTable is the accessible representation of the charted data and the charts' `<desc>` says so.
- **Pipeline purity:** aggregation and arc math are pure `chartCore.ts` functions; the demo derives chart data via chained `$derived` from `TableState`, never inside chart components.
- **Theming:** `--chart-highlight` joins the `--chart-*` set; the composition slide themes table and charts coherently (pick one of the deck's three looks).

## Out of Scope (do not build)

Zoom/pan/brush, canvas or WebGL rendering, streaming/real-time updates, animations beyond simple CSS transitions, axis dragging, annotations, exporting charts to PNG/SVG files. Note where hooks exist (pure geometry means an exporter could serialize the SVG; `bind:hidden`/`highlighted` are the interaction seams) but write no code for these.

## Testing & Quality Gates

- Unit-test `groupRows`/`aggregate`/reducers (blank skipping, first-seen order, empty groups) and `arcPath` (quadrant boundaries, full circle, zero-size slice, donut radii).
- Extend component tests: pie slice count/percentage labels, `highlighted` dims non-selected marks, and a composition test — a host fixture with a DataTable and a BarChart sharing state, asserting a search filters the chart's rects and a selection adds the highlight class.
- `svelte-check` passes with no new errors; Vitest suite green before each commit.

## Commit Cadence

One commit per numbered deliverable, message format `feat(chart): <deliverable>`, tests in the same commit as the code they cover. Run `svelte-check` and the test suite before each commit. End the phase with the composition demo slide live in the deck (slide dir needs the standard `+layout.js`, entry in `pages.ts`), showing table + charts moving together.
