<!--
  Example: ScatterChart as a BUBBLE chart
  File: src/routes/slides/chart-scatter.html/+page.svelte

  The SAME plain array drives a DataTable and a ScatterChart. This is the chart
  for CORRELATION rather than trend or magnitude: each metro is a dot placed by
  two continuous axes — median 1-bedroom rent (x) against median household
  income (y) — and its AREA scales with metro population (the `size` accessor →
  a bubble). Neither axis forces a zero baseline (a scatter reads position), and
  the blank Boise income draws no dot, the same blank rule as the rest of the
  family. Chart geometry is pure in $lib/chart/chartCore.ts.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { ScatterChart, type AxisDef, type SeriesDef } from '$lib/chart';
	import { DataTable, type ColumnDef } from '$lib/datatable';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/chart-scatter.html/+page.svelte';

	// One array — a table AND a bubble scatter. rent vs income (the two axes),
	// population as the bubble size. Boise's blank income draws no dot.
	type Metro = { city: string; rent: number; income: number | null; pop: number };
	const metros: Metro[] = [
		{ city: 'San Francisco', rent: 3200, income: 126, pop: 4.7 },
		{ city: 'New York', rent: 3600, income: 95, pop: 19.2 },
		{ city: 'Seattle', rent: 2100, income: 110, pop: 4.0 },
		{ city: 'Denver', rent: 1800, income: 92, pop: 3.0 },
		{ city: 'Austin', rent: 1700, income: 88, pop: 2.4 },
		{ city: 'Chicago', rent: 1900, income: 78, pop: 9.4 },
		{ city: 'Miami', rent: 2600, income: 67, pop: 6.2 },
		{ city: 'Detroit', rent: 1100, income: 63, pop: 4.3 },
		{ city: 'Boise', rent: 1400, income: null, pop: 0.8 } // blank → no dot
	];

	const rentFmt = (v: number | null) => (v == null ? '—' : `$${v.toLocaleString('en-US')}`);
	const incFmt = (v: number | null) => (v == null ? '—' : `$${v}k`);
	const popFmt = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}M`);

	// Table view of the same data.
	const columns: ColumnDef<Metro>[] = [
		{ key: 'city', label: 'Metro' },
		{ key: 'rent', label: 'Rent', type: 'number', align: 'right', format: (v) => rentFmt(v) },
		{ key: 'income', label: 'Income', type: 'number', align: 'right', format: (v) => incFmt(v) },
		{ key: 'pop', label: 'Pop.', type: 'number', align: 'right', format: (v) => popFmt(v) }
	];

	// Chart view: rent on x, income on y, population as the bubble size.
	const rentX: AxisDef<Metro> = {
		value: 'rent',
		type: 'linear',
		label: 'Median 1BR rent ($/mo)',
		format: (v) => `$${Number(v).toLocaleString('en-US')}`
	};
	const incomeSeries: SeriesDef<Metro> = {
		key: 'income',
		label: 'Median income',
		value: 'income',
		size: 'pop', // ← bubble: dot area scales with metro population
		format: (v) => incFmt(v)
	};
</script>

<ContentPage
	title="Chart — Bubble Scatter"
	subtitle="Two continuous axes for correlation; a third value sizes each dot"
>
	<div class="demo">
		<div class="data">
			<DataTable rows={metros} {columns} searchable={false} striped />
		</div>

		<figure class="viz">
			<ScatterChart
				data={metros}
				x={rentX}
				series={incomeSeries}
				sizeRange={[7, 30]}
				title="Income vs rent across metros, sized by population"
				description="Each metro is a dot placed by its median 1-bedroom rent (x) and median household income (y); the dot's area scales with metro population. Rent and income rise together across the metros. Boise's blank income draws no dot. The table beside this chart is the accessible representation of the same data."
			>
				{#snippet tooltip(_rent, points, metro)}
					<strong>{metro.city}</strong>
					{#each points as p (p.key)}
						<div class="tip-row">
							<span class="tip-swatch" style:background={p.color}></span>
							{p.label}: <b>{p.formatted}</b>
						</div>
					{/each}
					<div class="tip-sub">
						Rent {rentFmt(metro.rent)} · Pop. {popFmt(metro.pop)}
					</div>
				{/snippet}
			</ScatterChart>
			<figcaption>
				<code>x</code> = rent · <code>y</code> = income · bubble <b>area</b> = population (the
				<code>size</code> accessor) · rent and income climb together · hover a dot · Boise's blank income
				is dropped.
			</figcaption>
		</figure>
	</div>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		/* light "inverted panel" on the dark deck, shared by chart + table */
		--chart-fg: #1a2530;
		--chart-series-1: #2f8f83;
		--chart-grid: rgba(30, 60, 90, 0.14);
		--chart-axis: rgba(30, 60, 90, 0.5);
		--chart-font-size: 13px;
		--chart-bg: #eef2f5; /* bubble stroke reads against the panel */
		--chart-tooltip-bg: #1a2530;
		--chart-tooltip-fg: #f4f7fa;

		--dt-font-size: 0.7em;
		--dt-bg: #eef2f5;
		--dt-color: #1a2530;
		--dt-border: #9fb0bc;
		--dt-header-bg: rgba(30, 60, 90, 0.14);
		--dt-stripe-bg: rgba(30, 60, 90, 0.06);
		--dt-accent: #2f8f83;

		display: flex;
		/* chart first (left), table second (right); pin LTR so an inherited text
		   direction can't flip the columns. */
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
		flex: 1 1 420px;
		max-width: 560px;
		line-height: 1.35;
	}
	.tip-row {
		display: flex;
		align-items: center;
		gap: 0.4em;
	}
	.tip-sub {
		margin-top: 0.15em;
		opacity: 0.7;
		font-size: 0.85em;
	}
	.tip-swatch {
		width: 0.7em;
		height: 0.7em;
		border-radius: 50%;
	}
	code {
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
		color: #2f8f83;
	}
</style>
