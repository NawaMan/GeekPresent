# Charts & tables

Charts are pure Svelte + SVG with their own math (no d3, no npm chart library). Every chart is
SSR-safe: the full `<svg>` renders from props alone, and hover tooltips, legends' interactivity and
the `animate` reveal are client-only enhancements. `DataTable` is a dependency-free sortable,
searchable, paginated table. Both families take the **same plain array**, so one data set can
drive a table and several charts on one slide.

Import from the module barrels:

```ts
import { BarChart, LineChart, aggregate, sumOf, type AxisDef, type SeriesDef } from '@geekpresent/core/chart';
import { DataTable, ColumnToggle, exportCsv, type ColumnDef, type TableState } from '@geekpresent/core/datatable';
import { RemoteData, fetchRows, toQuery, buildUrl } from '@geekpresent/core/data';
```

## Shared data shape

Every chart takes `data: T[]` (plain rows) plus **accessors**. An `Accessor<T>` is a field name
(`'requests'`) or a function (`(row) => row.a + row.b`).

```ts
// x dimension (cartesian charts, PieChart labels)
interface AxisDef<T> {
	value: Accessor<T>;                     // the x value
	type?: 'band' | 'linear' | 'time';      // band = categories, time = Date / ISO string / ms
	label?: string;                         // axis caption
	format?: (value: unknown) => string;    // tick text
	ticks?: number;                         // tick-count hint (linear/time)
}

// one plotted series
interface SeriesDef<T> {
	key: string;                            // stable identity (legend toggling, colour)
	label: string;                          // legend / tooltip text
	value: Accessor<T>;                     // the y value (or slice size)
	color?: string;                         // overrides --chart-series-N
	format?: (value: number) => string;     // tooltip / tick / aria text
	mark?: 'bar' | 'line';                  // ComboChart only
	axis?: 'left' | 'right';                // ComboChart only
	size?: Accessor<T>;                     // ScatterChart only (bubble)
}
```

Props common to the cartesian charts (BarChart, LineChart, AreaChart, ScatterChart, ComboChart):

| prop | type | default | meaning |
|---|---|---|---|
| `data` | `T[]` | required | the rows |
| `x` | `AxisDef<T>` | required | the x dimension |
| `series` | `SeriesDef<T>` or `SeriesDef<T>[]` | required | one series or many (ComboChart: array only) |
| `title` | `string` | **required** | accessible name, rendered as SVG `<title>` |
| `description` | `string` | | SVG `<desc>` |
| `width` / `height` | `number` | `640` / `400` | the logical **viewBox**, i.e. the aspect ratio (see Gotchas) |
| `legend` | `boolean` | `false` | clickable legend; each chip toggles a series |
| `hidden` | `Set<string>` | empty | hidden series keys; `bind:hidden` to drive or observe |
| `highlighted` | `unknown[]` | | row keys to emphasise; everything else dims |
| `rowKeyAccessor` | `Accessor<T>` | | how to read a row's key, matched against `highlighted` |
| `animate` | `boolean` | `false` | one-off left-to-right draw-in on mount |
| `tooltip` | `Snippet<[x, TooltipPoint[], row]>` | | replace the hover tooltip body |

`TooltipPoint` is `{ key, label, value: number | null, formatted, color }`.

Blank values (null, undefined, '', non-numeric) are never plotted as 0: a bar is omitted, a line
or area gaps, a scatter dot is dropped. Stacked bars/areas and waterfalls treat a blank as 0.

Gotchas for the whole chart family:

- **Charts take no `style` / `id` / `class` props.** The SVG is `width: 100%; height: auto` of its
  container, so size a chart by wrapping it (`<div style="width: 900px">…</div>`), and use
  `width`/`height` only to set the aspect ratio and the logical units the font size is measured in.
- **`title` is required** on every chart. Put the data story in `description`; when a DataTable of
  the same data sits beside it, say so there (the table is the accessible representation).
- **Points are drawn in array order.** LineChart/AreaChart do not sort; sort rows by x first.
- **`animate` is not the AnimationBar timeline.** It is a one-shot clip wipe when the chart mounts
  (client only, skipped under `prefers-reduced-motion`, never in the prerendered markup). Duration
  via `--chart-animate-ms` (default 850ms). PieChart has no `animate`.
- **Colour by series index**: `--chart-series-1`, `--chart-series-2`, … (built-in palette as the
  fallback). A hidden series keeps its colour slot, so legend swatches always match.
- Other theme tokens: `--chart-fg`, `--chart-bg`, `--chart-axis`, `--chart-grid`,
  `--chart-font-size` (13px), `--chart-highlight`, `--chart-tooltip-bg`, `--chart-tooltip-fg`.
  Text defaults to `currentColor`, so charts read on a dark deck without theming.

## Aggregation helpers

Raw table-shaped rows often need grouping before charting. `aggregate` buckets rows by an accessor
(first-seen order) and reduces each group to one number:

```ts
import { aggregate, sumOf, avgOf, countOf } from '@geekpresent/core/chart';

const byRegion = aggregate(rows, 'region', { value: sumOf('requests') });
// → [{ group: 'us-east', value: 1840, count: 6 }, …]
```

Chart the result with `x={{ value: 'group' }}` and a series whose `value` is `'value'`. The reducers
skip blanks (never count them as 0). `countOf()` with no accessor counts rows. `groupRows(rows, by)`
returns `{ group, rows }[]` if you need the buckets themselves.

## BarChart

Vertical bars over categories, grouped (default) or stacked; the y axis always includes zero.

```ts
import { BarChart, type AxisDef, type SeriesDef } from '@geekpresent/core/chart';
```

```svelte
<script lang="ts">
	import { BarChart, type AxisDef, type SeriesDef } from '@geekpresent/core/chart';
	type Region = { region: string; desktop: number; mobile: number; api: number | null };
	const regions: Region[] = [
		{ region: 'us-east', desktop: 320, mobile: 260, api: 180 },
		{ region: 'eu-central', desktop: 260, mobile: 210, api: null }
	];
	const x: AxisDef<Region> = { value: 'region', type: 'band' };
	const series: SeriesDef<Region>[] = [
		{ key: 'desktop', label: 'Desktop', value: 'desktop' },
		{ key: 'mobile', label: 'Mobile', value: 'mobile' },
		{ key: 'api', label: 'API', value: 'api' }
	];
</script>

<div style="width: 820px">
	<BarChart data={regions} {x} {series} stacked legend title="Requests by region" />
</div>
```

| prop | type | default | meaning |
|---|---|---|---|
| `stacked` | `boolean` | `false` | stack series into one bar per category instead of grouping |
| (common) | | | `data`, `x`, `series`, `title`, `description`, `width`, `height`, `legend`, `hidden`, `highlighted`, `rowKeyAccessor`, `animate`, `tooltip` |

Gotchas:

- There is no separate StackedBar component; stacking is the `stacked` prop.
- With a single series the y axis is labelled with the series `label`; with several, the legend
  labels them and the y axis has no caption.
- The x axis is always a band (category) scale here. For a numeric distribution use `Histogram`.

## LineChart

One line per series over a linear or time x axis; y does not force zero. Supports two independent
y axes.

```ts
import { LineChart } from '@geekpresent/core/chart';
```

```svelte
<script lang="ts">
	import { LineChart, type AxisDef, type SeriesDef } from '@geekpresent/core/chart';
	type Deploy = { deployed: Date; requests: number; cost: number | null };
	const deploys: Deploy[] = [
		{ deployed: new Date(2023, 4, 14), requests: 1_398_000, cost: 366.7 },
		{ deployed: new Date(2023, 11, 2), requests: 1_620_000, cost: null }, // gap
		{ deployed: new Date(2024, 5, 21), requests: 1_930_000, cost: 501.26 }
	];
	const x: AxisDef<Deploy> = { value: 'deployed', type: 'time', label: 'Deploy date' };
	const series: SeriesDef<Deploy>[] = [
		{ key: 'requests', label: 'Requests', value: 'requests', format: (v) => v.toLocaleString('en-US') },
		{ key: 'cost', label: 'Cost', value: 'cost', format: (v) => `$${v.toFixed(2)}` }
	];
</script>

<LineChart data={deploys} {x} {series} points legend dualAxis title="Requests and cost over time" />
```

| prop | type | default | meaning |
|---|---|---|---|
| `points` | `boolean` | `false` | draw a dot at each finite point |
| `dualAxis` | `boolean` | `false` | first series on the left y axis, second on the right, each with its own scale and tinted to match |
| (common) | | | see the shared table |

Gotchas:

- `dualAxis` needs **exactly two** series; with any other count it is silently ignored and all
  series share one axis. Use it when magnitudes differ (millions vs dollars); for more series with
  mixed units use `ComboChart`.
- `x.type` defaults to linear. A Date column needs `type: 'time'` for calendar-aware ticks;
  `x.format` then receives a `Date`.
- A blank y breaks that line into a gap; it never dips to 0.
- `highlighted` reveals point markers on the matched rows even when `points` is off.

## AreaChart

Filled regions under each series, overlaid (default) or stacked; y always includes zero.

```ts
import { AreaChart } from '@geekpresent/core/chart';
```

```svelte
<AreaChart
	data={traffic}
	x={{ value: 'month', type: 'time', label: 'Month' }}
	series={[
		{ key: 'organic', label: 'Organic', value: 'organic' },
		{ key: 'referral', label: 'Referral', value: 'referral' },
		{ key: 'social', label: 'Social', value: 'social' }
	]}
	stacked
	legend
	animate
	title="Traffic by source over time"
/>
```

| prop | type | default | meaning |
|---|---|---|---|
| `stacked` | `boolean` | `false` | cumulative bands instead of overlaid translucent regions |
| `points` | `boolean` | `false` | dot at each finite point |
| (common) | | | see the shared table |

Gotchas:

- Overlaid: a blank gaps the region. Stacked: a blank contributes 0 (the band pinches shut).
- Fill opacity of overlaid regions is `--chart-area-opacity`.

## ScatterChart

One dot per row on two continuous axes; give a series a `size` accessor for a bubble chart.

```ts
import { ScatterChart } from '@geekpresent/core/chart';
```

```svelte
<ScatterChart
	data={metros}
	x={{ value: 'rent', type: 'linear', label: 'Median 1BR rent ($/mo)' }}
	series={{ key: 'income', label: 'Median income', value: 'income', size: 'pop' }}
	sizeRange={[7, 30]}
	title="Income vs rent, sized by population"
>
	{#snippet tooltip(_x, points, metro)}
		<strong>{metro.city}</strong>
		{#each points as p (p.key)}<div>{p.label}: {p.formatted}</div>{/each}
	{/snippet}
</ScatterChart>
```

| prop | type | default | meaning |
|---|---|---|---|
| `pointRadius` | `number` | `6` | dot radius when a series has no `size` |
| `sizeRange` | `[number, number]` | `[5, 22]` | min/max radius in bubble mode |
| (common) | | | see the shared table |

Gotchas:

- Bubble **area** (not radius) is proportional to `size`; the size scale is shared across all
  sized series so bubbles are comparable.
- A blank x **or** y drops the point. Rows need no sorting.
- The tooltip's third argument is the hovered row, so it can show fields the chart never plots
  (a city name).
- `x.type: 'time'` is supported.

## ComboChart

Bars and lines over one category axis with two independent y axes; each series picks its mark and
axis.

```ts
import { ComboChart } from '@geekpresent/core/chart';
```

```svelte
<ComboChart
	data={months}
	x={{ value: 'month', type: 'band', label: 'Month' }}
	series={[
		{ key: 'desktop', label: 'Desktop', value: 'desktop', mark: 'bar', axis: 'left' },
		{ key: 'mobile', label: 'Mobile', value: 'mobile', mark: 'bar', axis: 'left' },
		{ key: 'conversion', label: 'Conversion', value: 'conversion', mark: 'line', axis: 'right',
		  format: (v) => `${v.toFixed(1)}%` }
	]}
	legend
	title="Sessions and conversion by month"
/>
```

| prop | type | default | meaning |
|---|---|---|---|
| `series` | `SeriesDef<T>[]` | required | an array; each may set `mark` and `axis` |
| `stacked` | `boolean` | `false` | stack bar series within each band (per axis) |
| (common) | | | see the shared table (except `series` is array-only) |

Gotchas:

- Defaults when `mark`/`axis` are omitted: the **first** series is a bar on the left, **every
  other** series is a line on the right. Set them explicitly once you have more than two series.
- An axis carrying a single series is tinted and labelled to match it; an axis with several stays
  neutral and the legend carries the labels.
- `mark`/`axis` on a SeriesDef are ignored by every other chart.

## PieChart

A pie, or a donut via `innerRadius`, of one series: one slice per row.

```ts
import { PieChart } from '@geekpresent/core/chart';
```

```svelte
<PieChart
	data={byRegion}
	x={{ value: 'group' }}
	series={{ key: 'value', label: 'Requests', value: 'value' }}
	innerRadius={0.58}
	legend
	title="Share of requests by region"
/>
```

| prop | type | default | meaning |
|---|---|---|---|
| `x` | `AxisDef<T>` | required | `x.value` names each slice, `x.format` formats the name |
| `series` | `SeriesDef<T>` | required | a single series; `value` is the slice size |
| `innerRadius` | `number` | `0` | donut hole as a fraction (0 to 1) of the radius |
| `minSliceLabel` | `number` | `0.04` | slices below this fraction of the whole get no in-slice label |
| `legend`, `hidden`, `highlighted`, `rowKeyAccessor`, `width`, `height`, `title`, `description` | | | as in the shared table |
| `tooltip` | `Snippet<[x, TooltipPoint[]]>` | | no row argument |

Gotchas:

- Only finite **positive** values become slices; zero, negative and blank rows are skipped.
- Hiding a slice via the legend re-normalises the rest to 100%.
- `hidden` keys for a pie are internal slice keys (`'t:' + label` for strings), not your labels.
  Let the legend own it rather than seeding `hidden` by hand.
- No `animate` prop.

## Waterfall

One series walked across categories as floating bars: each bar starts where the previous ended,
showing how a start value becomes an end value.

```ts
import { Waterfall } from '@geekpresent/core/chart';
```

```svelte
<!-- wins = [{ step: 'Index join', delta: -640 }, { step: 'After quick wins', delta: null, checkpoint: true }, { step: 'Retry storm', delta: 95 }] -->
<Waterfall data={wins} x={{ value: 'step', type: 'band' }} value="delta" label="p95"
           format={(v) => `${v} ms`} isTotal="checkpoint" start={2100} endTotal
           title="How the p95 came down from 2.1 s" />
```

| prop | type | default | meaning |
|---|---|---|---|
| `data`, `x` | | required | rows and the category axis |
| `value` | `Accessor<T>` | required | the signed contribution per row (no `series` prop) |
| `label` | `string` | | y-axis caption and tooltip row name |
| `format` | `(n: number) => string` | | values in ticks, tooltips, aria-labels |
| `isTotal` | `Accessor<T>` | | rows reading truthy are total columns drawn from zero |
| `start` | `number` | `0` | value the first bar starts from |
| `endTotal` | `boolean` | `false` | append a closing total column |
| `endTotalLabel` | `string` | `'Total'` | that column's label |
| `connectors` | `boolean` | `true` | step lines joining each bar to the next |
| `width`, `height`, `title`, `description`, `animate`, `tooltip` | | | as in the shared table; tooltip `row` is `undefined` on the `endTotal` column |

Gotchas:

- A total row's own `value` is ignored: it **asserts** the running total so far, it does not add.
- A blank contributes 0 and keeps its slot (flat marker); the walk continues.
- Colours: `--chart-rise`, `--chart-fall`, `--chart-total`. No legend.

## Gantt

Tasks as spans on a time axis, one lane per row, with finish-to-start dependency arrows,
milestones, progress and a "today" rule.

```ts
import { Gantt } from '@geekpresent/core/chart';
```

```svelte
<script lang="ts">
	const plan = [
		{ phase: 'Audit schema', from: '2026-03-02', to: '2026-03-13', done: 100 },
		{ phase: 'Dual-write', from: '2026-03-13', to: '2026-03-27', done: 70, after: 'Audit schema' },
		{ phase: 'Cutover', from: '2026-04-20', after: 'Dual-write' } // no end → milestone
	];
</script>

<Gantt
	data={plan}
	task="phase"
	start="from"
	end="to"
	progress="done"
	dependsOn="after"
	today="2026-04-01"
	xLabel="2026"
	height={420}
	title="Database migration plan"
/>
```

| prop | type | default | meaning |
|---|---|---|---|
| `data` | `T[]` | required | one lane per row, in order |
| `task` | `Accessor<T>` | required | lane label (also the name `dependsOn` refers to) |
| `start` | `Accessor<T>` | required | Date / ISO string / ms |
| `end` | `Accessor<T>` | required | span end; blank makes the row a milestone |
| `progress` | `Accessor<T>` | | fraction done, 0 to 1 or 0 to 100 |
| `dependsOn` | `Accessor<T>` | | predecessor task name, or an array of names |
| `today` | `Date \| string \| number` | | "you are here" rule |
| `dateFormat` | `(d: Date) => string` | | date text in ticks, tooltips, aria |
| `ticks` | `number` | `6` | tick-count hint |
| `xLabel` | `string` | | caption under the time axis |
| `barHeight` | `number` | `0.62` | bar thickness as a fraction of its lane |
| `width`, `height`, `title`, `description`, `animate`, `tooltip` | | | as in the shared table |

Gotchas:

- `end` is a required prop (pass the accessor even if some rows have no end).
- Dependencies are matched **by task name**; a name that matches no task is dropped. Only
  finish-to-start is modelled. A dependent that starts before its predecessor ends is drawn as a
  dashed warning arrow, not corrected.
- A row with no usable start keeps its lane but draws no bar.
- Theme: `--chart-task`, `--chart-task-done`, `--chart-milestone`, `--chart-link`,
  `--chart-link-warn`, `--chart-today`.
- For evenly spaced events without date arithmetic, a timeline component is the better fit.

## Histogram

Bins a sample of raw numbers into contiguous buckets; bar height is the count.

```ts
import { Histogram } from '@geekpresent/core/chart';
```

```svelte
<Histogram
	data={latencies}
	value="ms"
	bins={6}
	xLabel="Response time"
	label="Requests"
	format={(v) => `${v}ms`}
	animate
	title="Response time distribution"
/>
```

| prop | type | default | meaning |
|---|---|---|---|
| `data` | `T[]` | required | raw rows |
| `value` | `Accessor<T>` | required | the numeric field to bin; blanks dropped |
| `bins` | `number` | Sturges' rule | desired bin count (snapped to round edges) |
| `domain` | `[number, number]` | | clamp the binned range; values outside are dropped |
| `edges` | `number[]` | | explicit boundaries (2 or more); overrides `bins`/`domain` |
| `label` | `string` | `'Frequency'` | y-axis caption |
| `xLabel` | `string` | | x-axis caption |
| `format` | `(n: number) => string` | | bin-edge text |
| `color` | `string` | `--chart-series-1` | bar fill |
| `gap` | `number` | `1` | visual gap between bars (logical px) |
| `width`, `height`, `title`, `description`, `animate`, `tooltip` | | | tooltip gets `(binLabel, points, undefined)` |

Gotchas:

- Pass **raw** rows, not pre-counted ones. For pre-made categories use `BarChart`.
- `bins` is a hint: edges snap to round numbers, so you may get a slightly different count.
- No legend, single series only.

## Heatmap

A matrix of cells (column category x row category), each tinted by its value on a two-token colour
ramp.

```ts
import { Heatmap } from '@geekpresent/core/chart';
```

```svelte
<Heatmap
	data={load}
	x="day"
	y="block"
	value="rps"
	xLabel="Weekday"
	yLabel="Time of day"
	showValues
	title="Request load by weekday and time of day"
/>
```

| prop | type | default | meaning |
|---|---|---|---|
| `data` | `T[]` | required | long-format rows, one per measurement |
| `x` | `Accessor<T>` | required | column category (note: an accessor, **not** an `AxisDef`) |
| `y` | `Accessor<T>` | required | row category |
| `value` | `Accessor<T>` | required | numeric field colouring the cell |
| `domain` | `[number, number]` | data extent | clamp the colour scale |
| `xLabel` / `yLabel` | `string` | | axis captions |
| `format` | `(n: number) => string` | | cell value text (aria, tooltip, legend ends) |
| `xFormat` / `yFormat` | `(v: unknown) => string` | `String` | category tick text |
| `gap` | `number` | `1` | visual gap between cells |
| `showValues` | `boolean` | `false` | print each value inside its cell (small matrices only) |
| `legend` | `boolean` | `true` | colour-ramp legend under the plot |
| `width`, `height`, `title`, `description`, `animate`, `tooltip` | | | tooltip gets `(cellLabel, points, undefined)` |

Gotchas:

- Data is **long format**: build one row per (x, y) pair. Rows sharing a cell are **averaged**.
- Categories appear in first-seen order; order the rows to order the axes.
- A cell with no measurement is drawn empty (`--chart-heat-empty`), not as the low colour.
- Ramp: `--chart-heat-low` to `--chart-heat-high`, mixed in oklab.

## ChartLegend

The legend the charts render when `legend` is set; usable standalone when one legend should drive
several charts.

```ts
import { ChartLegend } from '@geekpresent/core/chart';
```

```svelte
<script lang="ts">
	let hidden = $state(new Set<string>());
</script>

<ChartLegend {series} bind:hidden />
<BarChart data={a} {x} {series} bind:hidden title="2025" />
<BarChart data={b} {x} {series} bind:hidden title="2026" />
```

| prop | type | default | meaning |
|---|---|---|---|
| `series` | `SeriesDef<T>[]` | required | swatch + label per series |
| `hidden` | `Set<string>` | empty | hidden keys, `bind:hidden` |

Gotcha: to change visibility from code, **reassign** a new `Set`; mutating the existing one does not
trigger the charts to re-fit.

`Axis` and `ChartTooltip` are also exported but are internal building blocks; use the charts'
`tooltip` snippet instead of `ChartTooltip`.

## Linking a table to a chart

Selection in a DataTable can highlight chart marks. Charts never import the table; you map selected
rows to keys:

```svelte
<script lang="ts">
	import { BarChart, aggregate, sumOf } from '@geekpresent/core/chart';
	import { DataTable } from '@geekpresent/core/datatable';
	let selected = $state<Row[]>([]);
	const byRegion = $derived(aggregate(rows, 'region', { value: sumOf('requests') }));
	const selectedRegions = $derived([...new Set(selected.map((r) => r.region))]);
</script>

<BarChart data={byRegion} x={{ value: 'group' }}
          series={{ key: 'value', label: 'Requests', value: 'value' }}
          rowKeyAccessor="group" highlighted={selectedRegions} title="Requests by region" />
<DataTable {rows} {columns} selectable rowKey="id" bind:selected />
```

`highlighted` does nothing without `rowKeyAccessor`; an empty list means no highlighting.

## DataTable

Sortable, searchable, paginated table with optional per-column filters, row selection, custom cells
and a server mode.

```ts
import { DataTable, type ColumnDef } from '@geekpresent/core/datatable';
```

```svelte
<script lang="ts">
	import { DataTable, type ColumnDef } from '@geekpresent/core/datatable';
	type Server = { id: number; name: string; status: string; requests: number | null; deployed: string };
	const columns: ColumnDef<Server>[] = [
		{ key: 'id', label: 'ID', width: '5.5em' },
		{ key: 'name', label: 'Name', filterable: true },
		{ key: 'status', label: 'Status' },
		{ key: 'requests', label: 'Requests', type: 'number', align: 'right',
		  format: (v) => (v == null ? '—' : v.toLocaleString('en-US')) },
		{ key: 'deployed', label: 'Last deploy', type: 'date', filterable: true }
	];
</script>

{#snippet statusBadge(row: Server, value: Server['status'])}
	<span class="badge badge-{value}">{value}</span>
{/snippet}

<DataTable rows={servers} {columns} snippets={{ status: statusBadge }} height="420px" striped />
```

`ColumnDef<T>`:

| field | type | default | meaning |
|---|---|---|---|
| `key` | `string` | required | the row property (flat keys only, no dot paths) |
| `label` | `string` | required | header text |
| `sortable` | `boolean` | `true` | header click cycles none, asc, desc, none |
| `type` | `'string' \| 'number' \| 'date' \| 'auto'` | `'auto'` | drives sorting and typed filters; auto samples the data |
| `format` | `(value, row) => string` | | display text (also what search matches) |
| `sortValue` | `(row) => unknown` | | sort by something other than what is shown |
| `width` | `string` | | CSS width |
| `align` | `'left' \| 'center' \| 'right'` | | cell and header alignment |
| `filterable` | `boolean` | | adds a filter input under the header |
| `visible` | `boolean` | `true` | `false` hides the column (see ColumnToggle) |

DataTable props:

| prop | type | default | meaning |
|---|---|---|---|
| `rows` | `T[]` | `[]` | the data |
| `columns` | `ColumnDef<T>[]` | `[]` | column config |
| `pageSize` | `number` | `10` | initial page size (ignored if you bind `state`) |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | the "Show N entries" choices |
| `state` | `TableState` | internal | `bind:state` for controlled mode |
| `searchable` | `boolean` | `true` | global search box |
| `striped` | `boolean` | `false` | zebra rows |
| `height` | `string` (CSS) | | **fixes** body height; filtering cannot shrink the table |
| `maxHeight` | `string` (CSS) | | caps body height; scrolls under a sticky header |
| `selectable` | `boolean` | `false` | checkbox column with page-scoped select-all |
| `rowKey` | `string \| (row) => unknown` | | row identity; required with `selectable` |
| `selected` | `T[]` | `[]` | `bind:selected` |
| `snippets` | `Record<colKey, Snippet<[row, value, rowIndex]>>` | | custom cells |
| `headerSnippets` | `Record<colKey, Snippet<[ColumnDef]>>` | | custom header content (sorting still works) |
| `empty` | `Snippet` | | replaces "No results found" |
| `mode` | `'client' \| 'server'` | `'client'` | see server mode below |
| `totalCount` | `number` | `rows.length` | server mode: total matching rows |
| `loading` | `boolean` | `false` | shows a "Loading…" overlay |
| `onstatechange` | `(state: TableState) => void` | | fires after every user-initiated sort/search/page change |

`TableState` is `{ sort: { key, direction } | null, search, columnFilters: Record<string,string>,
page /* 1-based */, pageSize }`.

Gotchas:

- **No `style` / `id` / `class` props.** Theme with CSS custom properties on a wrapper:
  `--dt-bg`, `--dt-color` (the table's own surface, e.g. a light panel on a dark deck),
  `--dt-border`, `--dt-header-bg`, `--dt-row-hover`, `--dt-accent`, `--dt-font-size`,
  `--dt-stripe-bg`, `--dt-selected-bg`, `--dt-height`, `--dt-max-height`, `--dt-header-height`.
- On a slide, prefer `height` over `maxHeight`: a fixed height means a search does not make the
  slide jump.
- **Custom cells use the `snippets` map**, not named `cell_*` snippets. A snippet's `value` is the
  raw value (`format` is not applied first). Precedence per cell: snippet, then `format`, then raw.
  Sorting still uses the raw value (or `sortValue`); search matches the `format` text.
- `selectable` without `rowKey` throws. Never key by array index; selection is meant to survive
  sort, filter and paging.
- Typed filters on number/date columns accept `42`, `<`, `<=`, `>`, `>=`, `!=`, `in(1,2,3)`
  (dates too, e.g. `>=2025-06-01`); anything else falls back to substring.
- When you bind `state`, your object wins: set `pageSize` inside it, not as the prop.
- To change state from code, **reassign** the object (`tableState = { ...tableState, page: 1 }`).
- `onstatechange` does not fire for your own external state changes, and not on first render.

### Server mode

`mode="server"` renders `rows` exactly as given and leaves sort/search/paging to you: refetch in
`onstatechange` and pass back one page plus `totalCount`.

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { DataTable, type TableState } from '@geekpresent/core/datatable';
	import { fetchRows, toQuery } from '@geekpresent/core/data';
	let state = $state<TableState>({ sort: null, search: '', columnFilters: {}, page: 1, pageSize: 10 });
	let rows = $state([]), total = $state(0), loading = $state(true);

	async function load(next: TableState) {
		loading = true;
		({ rows, total } = await fetchRows('/api/fleet', { params: toQuery(next) }));
		loading = false;
	}
	onMount(() => load($state.snapshot(state) as TableState)); // first page: client only
</script>

<DataTable {rows} {columns} bind:state mode="server" totalCount={total} {loading} onstatechange={load} />
```

Gotcha: the first page is not requested by the table; load it yourself in `onMount` (or use
`RemoteData` with `params={toQuery(state)}`, which refetches when params change).

## ColumnToggle

A row of checkboxes that shows/hides DataTable columns.

```ts
import { ColumnToggle } from '@geekpresent/core/datatable';
```

```svelte
<script lang="ts">
	let columns = $state<ColumnDef<Row>[]>([ /* … */ ]);
</script>

<ColumnToggle bind:columns label="Columns" />
<DataTable rows={data} {columns} />
```

| prop | type | default | meaning |
|---|---|---|---|
| `columns` | `ColumnDef<T>[]` | `[]` | `bind:columns`, the same array the table gets |
| `label` | `string` | `'Columns'` | fieldset legend |

Gotcha: `columns` must be `$state` (not a `const`) for the bind to work. A hidden column also drops
out of search, its column filter and `exportCsv`.

`SearchBox` and `Pagination` are exported but are the table's internal parts; DataTable renders
both itself (turn search off with `searchable={false}`).

## Table utilities

Pure functions from `@geekpresent/core/datatable`, the same ones the table uses internally:
`filterRows`, `sortRows`, `paginateRows`, `resolveColumnTypes`, and `exportCsv(rows, columns)`
(a CSV string of the visible columns). CSV of exactly what the table shows (all pages):

```ts
const types = resolveColumnTypes(rows, columns);
const col = state.sort ? columns.find((c) => c.key === state.sort!.key) : undefined;
const filtered = filterRows(rows, state.search, columns, state.columnFilters, types);
const sorted = sortRows(filtered, state.sort, col ? types[col.key] : 'string', col?.sortValue);
const csv = exportCsv(sorted, columns);
```

## RemoteData

Fetches JSON at view time and hands the rows to a snippet; tables and charts downstream are
unchanged.

```ts
import { RemoteData } from '@geekpresent/core/data';
```

```svelte
<script lang="ts">
	import { RemoteData } from '@geekpresent/core/data';
	import { BarChart, aggregate, sumOf } from '@geekpresent/core/chart';
	import { DataTable } from '@geekpresent/core/datatable';
	import feedUrl from './fleet.json?url'; // colocated, hashed, base-path safe
	const toRow = (raw: FleetRaw): FleetRow => ({ ...raw, status: raw.error_rate < 1 ? 'healthy' : 'failing' });
</script>

<RemoteData url={feedUrl} rowsPath="data" map={toRow}>
	{#snippet children(rows, meta)}
		<BarChart data={aggregate(rows, 'region', { value: sumOf('requests') })}
		          x={{ value: 'group' }} series={{ key: 'value', label: 'Requests', value: 'value' }}
		          title="Requests by region" />
		<DataTable {rows} {columns} />
	{/snippet}
	{#snippet pending()}<p>Loading…</p>{/snippet}
	{#snippet failed(message, reload)}<p>{message} <button onclick={reload}>Retry</button></p>{/snippet}
</RemoteData>
```

| prop | type | default | meaning |
|---|---|---|---|
| `url` | `string` | required | endpoint; relative is fine |
| `params` | `Record<string, string \| number \| boolean \| null>` | | query params, blanks dropped; changing it refetches |
| `headers` | `Record<string, string>` | | extra request headers |
| `rowsPath` | `string` | auto | dot path to the row array (auto-detects `data`, `items`, `results`, `rows`, `records`, `content`, or a bare array) |
| `totalPath` | `string` | auto | dot path to the total count |
| `map` | `(raw, index) => T` | | reshape each record; also types `rows` |
| `poll` | `number` (ms) | `0` | refetch interval (minimum 250); 0 fetches once |
| `rows` / `total` / `loading` / `error` | | | all bindable |
| `onload` / `onerror` | callbacks | | `({ rows, total, payload })` / `(message)` |
| `children` | `Snippet<[rows, { total, loading, reload }]>` | | the content |
| `pending` / `failed(message, reload)` / `empty` | snippets | built-in lines | the other states |
| `style` / `id` / `class` | | | on the root element |

Gotchas:

- **There is no server.** The request leaves the audience's browser, so the endpoint must send
  `Access-Control-Allow-Origin`, and any key in `headers` ships in the bundle. Public endpoints only.
- Use a colocated file imported as `./x.json?url` for offline-safe, base-path-safe demo data;
  never a hardcoded `/x.json`.
- SSR-inert: the fetch runs in an effect, so the prerendered page shows `pending`.
- Once rows are on screen, a failed or slow refresh keeps them (no blanking mid-talk); the error is
  still in `bind:error` / `onerror`.
- A surprising payload yields `[]` (the `empty` state), not an exception; a failed request shows
  `failed`.
- `fetchRows(url, { params, headers, rowsPath, totalPath, map })` is the same request without UI,
  returning `{ rows, total, payload }`; it throws on a failed request.
- `toQuery(state, names?)` turns a `TableState` into params (`page`, `pageSize`, `search`, `sort`,
  `order`, `filter.<key>`); rename for your API with e.g.
  `toQuery(state, { search: 'q', filterPrefix: '' })`. `buildUrl(base, params)` shows the URL.
