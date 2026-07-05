<!--
  Example: dual-axis 2-series LineChart on a TIME axis (Phase 2)
  File: src/routes/slides/chart-line.html/+page.svelte

  The SAME plain array drives a DataTable and a LineChart. Phase-2 features on
  show here: TWO series of very different magnitudes on INDEPENDENT axes —
  requests (~millions) on the left, cost (~dollars) on the right — via `dualAxis`,
  each axis tinted to match its line so both read legibly; a calendar-aware TIME
  x-axis (year/quarter ticks over ~3 years); a clickable LEGEND; a hover TOOLTIP
  with a custom snippet; and a NULL cost that breaks that line into a gap. Chart
  geometry is pure in $lib/chart/chartCore.ts.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { LineChart, type AxisDef, type SeriesDef } from '$lib/chart';
	import { DataTable, type ColumnDef } from '$lib/datatable';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/chart-line.html/+page.svelte';

	// One array — rendered as a table AND charted. Deploy dates span ~3 years.
	type Deploy = { deployed: Date; requests: number; cost: number | null };
	const deploys: Deploy[] = [
		{ deployed: new Date(2021, 1, 3), requests: 412_000, cost: 118.4 },
		{ deployed: new Date(2021, 7, 19), requests: 690_000, cost: 173.9 },
		{ deployed: new Date(2022, 2, 8), requests: 905_000, cost: null }, // blank → gap
		{ deployed: new Date(2022, 9, 27), requests: 1_142_000, cost: 289.1 },
		{ deployed: new Date(2023, 4, 14), requests: 1_398_000, cost: 366.7 },
		{ deployed: new Date(2023, 11, 2), requests: 1_620_000, cost: 441.2 },
		{ deployed: new Date(2024, 5, 21), requests: 1_930_000, cost: 501.26 }
	];

	const dateFmt = (d: Date | null) =>
		d == null ? '—' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
	const reqFmt = (v: number) => v.toLocaleString('en-US');
	const costFmt = (v: number | null) => (v == null ? '—' : `$${v.toFixed(2)}`);

	// Table view of the same data.
	const columns: ColumnDef<Deploy>[] = [
		{ key: 'deployed', label: 'Deployed', type: 'date', format: (v) => dateFmt(v as Date) },
		{ key: 'requests', label: 'Requests', type: 'number', align: 'right', format: (v) => reqFmt(v) },
		{ key: 'cost', label: 'Cost', type: 'number', align: 'right', format: (v) => costFmt(v) }
	];

	// Chart view: a time x-axis, two series of different magnitudes on their own axes.
	const deployX: AxisDef<Deploy> = { value: 'deployed', type: 'time', label: 'Deploy date' };
	const series: SeriesDef<Deploy>[] = [
		{ key: 'requests', label: 'Requests', value: 'requests', format: reqFmt },
		{ key: 'cost', label: 'Cost', value: 'cost', format: (v) => costFmt(v) }
	];
</script>

<ContentPage
	title="Chart — Dual-Axis Line + Time Axis"
	subtitle="Two magnitudes on their own left/right axes, a calendar axis, a legend, and a tooltip"
>
	<div class="demo">
		<div class="data">
			<DataTable rows={deploys} {columns} searchable={false} striped />
		</div>

		<figure class="viz">
			<LineChart
				data={deploys}
				x={deployX}
				{series}
				points
				legend
				dualAxis
				title="Requests and cost over time"
				description="Two series — requests (millions, left axis) and cost (dollars, right axis) — over a ~3-year time axis, each on its own scale. The null cost in early 2022 breaks that line into a gap. The table beside this chart is the accessible representation of the same data."
			>
				{#snippet tooltip(x, points)}
					<strong>{dateFmt(x as Date)}</strong>
					{#each points as p (p.key)}
						<div class="tip-row">
							<span class="tip-swatch" style:background={p.color}></span>
							{p.label}: <b>{p.formatted}</b>
						</div>
					{/each}
				{/snippet}
			</LineChart>
			<figcaption>
				Dual axes — <code>Requests</code> (left) and <code>Cost</code> (right) on their own scales ·
				time x-axis (year/quarter ticks) · hover for the tooltip · the <code>null</code> cost is a gap.
			</figcaption>
		</figure>
	</div>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		/* light "inverted panel" on the dark deck, shared by chart + table */
		--chart-fg: #1a2530;
		--chart-series-1: #2f6db0;
		--chart-series-2: #b25f00;
		--chart-grid: rgba(30, 60, 90, 0.14);
		--chart-axis: rgba(30, 60, 90, 0.5);
		--chart-font-size: 13px;
		--chart-tooltip-bg: #1a2530;
		--chart-tooltip-fg: #f4f7fa;

		--dt-font-size: 0.7em;
		--dt-bg: #eef2f5;
		--dt-color: #1a2530;
		--dt-border: #9fb0bc;
		--dt-header-bg: rgba(30, 60, 90, 0.14);
		--dt-stripe-bg: rgba(30, 60, 90, 0.06);
		--dt-accent: #b25f00;

		display: flex;
		/* chart is the first child (left), table the second (right); pin LTR so
		   an inherited text direction can't flip the columns. */
		direction: ltr;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: center;
		gap: 1.4em;
		margin: 0.4em auto 0;
		max-width: 1600px;
		text-align: initial;
	}
	.viz {
		flex: 1.4 1 460px;
		max-width: 760px;
		margin: 0;
		padding: 0.6em 0.8em 0.4em;
		background: #eef2f5;
		border: 1px solid #9fb0bc;
		border-radius: 10px;
	}
	.viz figcaption {
		margin-top: 0.2em;
		color: #33404b;
		font-size: 0.66em;
		line-height: 1.35;
		text-align: center;
	}
	.data {
		flex: 1 1 300px;
		max-width: 440px;
		line-height: 1.35;
	}
	.tip-row {
		display: flex;
		align-items: center;
		gap: 0.4em;
	}
	.tip-swatch {
		width: 0.7em;
		height: 0.7em;
		border-radius: 2px;
	}
	code {
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
		color: #b25f00;
	}
</style>
