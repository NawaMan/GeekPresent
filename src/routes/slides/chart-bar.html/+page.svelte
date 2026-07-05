<!--
  Example: BarChart beside its data (Phase 1)
  File: src/routes/slides/chart-bar.html/+page.svelte

  The SAME plain array drives a DataTable and a BarChart, side by side — the
  design goal of the chart family. Here they're independent views of one
  dataset (Phase 3 wires the table's bind:state so filtering reshapes the
  chart). The bar cases on show: a FORCED-ZERO baseline with negatives
  (us-west, ap-south) hanging below it, and a BLANK (eu-west) that draws no
  bar. Chart geometry is pure in $lib/chart/chartCore.ts; theme via --chart-*
  and --dt-*.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { BarChart, type AxisDef, type SeriesDef } from '$lib/chart';
	import { DataTable, type ColumnDef } from '$lib/datatable';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/chart-bar.html/+page.svelte';

	// One array — rendered as a table AND charted.
	type Region = { region: string; net: number | null };
	const regions: Region[] = [
		{ region: 'us-east', net: 320 },
		{ region: 'us-west', net: -140 },
		{ region: 'eu-central', net: 210 },
		{ region: 'eu-west', net: null }, // blank → no bar
		{ region: 'ap-south', net: -60 },
		{ region: 'sa-east', net: 480 }
	];

	const netFmt = (v: number | null) => (v == null ? '—' : v.toLocaleString('en-US'));

	// Table view of the data.
	const columns: ColumnDef<Region>[] = [
		{ key: 'region', label: 'Region' },
		{ key: 'net', label: 'Net change', type: 'number', align: 'right', format: (v) => netFmt(v) }
	];

	// Chart view of the same data.
	const regionX: AxisDef<Region> = { value: 'region', type: 'band' };
	const netSeries: SeriesDef<Region> = {
		key: 'net',
		label: 'Net change',
		value: 'net',
		color: '#f0a33e',
		format: (v) => netFmt(v)
	};
</script>

<ContentPage
	title="Chart — Bar"
	subtitle="One array, two views: a DataTable and a BarChart side by side"
>
	<div class="demo">
		<div class="data">
			<DataTable rows={regions} {columns} searchable={false} striped />
		</div>

		<figure class="viz">
			<BarChart
				data={regions}
				x={regionX}
				series={netSeries}
				title="Net change by region"
				description="Vertical bars over regions; negatives hang below a forced-zero baseline and the blank eu-west value draws no bar. The table beside this chart is the accessible representation of the same data."
			/>
			<figcaption>
				Forced-zero baseline — <code>us-west</code> / <code>ap-south</code> hang below it, blank
				<code>eu-west</code> draws no bar.
			</figcaption>
		</figure>
	</div>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		/* light "inverted panel" on the dark deck, shared by chart + table */
		--chart-fg: #1a2530;
		--chart-grid: rgba(30, 60, 90, 0.14);
		--chart-axis: rgba(30, 60, 90, 0.5);
		--chart-font-size: 13px;

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
		flex: 1 1 320px;
		max-width: 460px;
		line-height: 1.35;
	}
	code {
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
		color: #b25f00;
	}
</style>
