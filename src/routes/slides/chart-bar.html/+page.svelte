<!--
  Example: multi-series BarChart — grouped vs stacked (Phase 2)
  File: src/routes/slides/chart-bar.html/+page.svelte

  The SAME plain array drives a DataTable and two BarCharts of THREE series
  (desktop / mobile / api requests per region). Phase-2 features on show: GROUPED
  bars (each region's band subdivided per series) vs STACKED bars (the same
  series summed into one column per region, a blank contributing 0); a clickable
  LEGEND toggling series on both; and a hover TOOLTIP listing every visible
  series at the region. Chart geometry is pure in $lib/chart/chartCore.ts.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { BarChart, type AxisDef, type SeriesDef } from '$lib/chart';
	import { DataTable, type ColumnDef } from '$lib/datatable';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/chart-bar.html/+page.svelte';

	// One array — a table AND two charts (grouped + stacked) of three series.
	type Region = { region: string; desktop: number; mobile: number; api: number | null };
	const regions: Region[] = [
		{ region: 'us-east', desktop: 320, mobile: 260, api: 180 },
		{ region: 'us-west', desktop: 210, mobile: 300, api: 90 },
		{ region: 'eu-central', desktop: 260, mobile: 210, api: null }, // blank → stacks as 0
		{ region: 'ap-south', desktop: 140, mobile: 190, api: 120 },
		{ region: 'sa-east', desktop: 90, mobile: 150, api: 60 }
	];

	const numFmt = (v: number | null) => (v == null ? '—' : v.toLocaleString('en-US'));

	// Table view of the same data.
	const columns: ColumnDef<Region>[] = [
		{ key: 'region', label: 'Region' },
		{ key: 'desktop', label: 'Desktop', type: 'number', align: 'right', format: (v) => numFmt(v) },
		{ key: 'mobile', label: 'Mobile', type: 'number', align: 'right', format: (v) => numFmt(v) },
		{ key: 'api', label: 'API', type: 'number', align: 'right', format: (v) => numFmt(v) }
	];

	// Chart view: one band x, three series shared by both layouts.
	const regionX: AxisDef<Region> = { value: 'region', type: 'band' };
	const series: SeriesDef<Region>[] = [
		{ key: 'desktop', label: 'Desktop', value: 'desktop', format: numFmt },
		{ key: 'mobile', label: 'Mobile', value: 'mobile', format: numFmt },
		{ key: 'api', label: 'API', value: 'api', format: (v) => numFmt(v) }
	];
</script>

<ContentPage
	title="Chart — Grouped & Stacked Bars"
	subtitle="Three series, two layouts, a toggling legend, and a hover tooltip"
>
	<div class="demo">
		<div class="data">
			<DataTable rows={regions} {columns} searchable={false} striped />
		</div>

		<div class="charts">
			<figure class="viz">
				<BarChart
					data={regions}
					x={regionX}
					{series}
					legend
					title="Requests by region — grouped"
					description="Three series grouped side by side within each region's band. The table beside these charts is the accessible representation of the same data."
				/>
				<figcaption>Grouped — a bar per series, side by side in each band.</figcaption>
			</figure>

			<figure class="viz">
				<BarChart
					data={regions}
					x={regionX}
					{series}
					stacked
					legend
					title="Requests by region — stacked"
					description="The same three series stacked into one column per region; the blank eu-central API value contributes 0 and the segments above it stack undisturbed."
				/>
				<figcaption>Stacked — series summed per region; a blank stacks as 0.</figcaption>
			</figure>
		</div>
	</div>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		/* light "inverted panel" on the dark deck, shared by charts + table */
		--chart-fg: #1a2530;
		--chart-series-1: #2f6db0;
		--chart-series-2: #b25f00;
		--chart-series-3: #3f8f4f;
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
		/* charts first (left), table second (right); pin LTR so an inherited text
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
	.charts {
		flex: 1.6 1 480px;
		display: flex;
		flex-wrap: wrap;
		gap: 1em;
	}
	.viz {
		flex: 1 1 300px;
		margin: 0;
		padding: 0.6em 0.8em 0.4em;
		background: #eef2f5;
		border: 1px solid #9fb0bc;
		border-radius: 10px;
	}
	.viz figcaption {
		margin-top: 0.2em;
		color: #33404b;
		font-size: 0.62em;
		line-height: 1.35;
		text-align: center;
	}
	.data {
		flex: 1 1 300px;
		max-width: 440px;
		line-height: 1.35;
	}
</style>
