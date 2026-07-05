<!--
  Example: LineChart beside its data (Phase 1)
  File: src/routes/slides/chart-line.html/+page.svelte

  The SAME plain array drives a DataTable and a LineChart, side by side. The
  line cases on show: UNEVEN x spacing on a linear axis (months 1, 2, 4, 5,
  6, 9, 10) and a NULL at month 5 that breaks the line into a GAP rather than
  dipping to 0 — the table shows that null as "—" in the very row the line
  skips. Chart geometry is pure in $lib/chart/chartCore.ts; theme via
  --chart-* and --dt-*.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { LineChart, type AxisDef, type SeriesDef } from '$lib/chart';
	import { DataTable, type ColumnDef } from '$lib/datatable';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/chart-line.html/+page.svelte';

	// One array — rendered as a table AND charted.
	type Sample = { month: number; latency: number | null };
	const samples: Sample[] = [
		{ month: 1, latency: 120 },
		{ month: 2, latency: 132 },
		{ month: 4, latency: 128 }, // uneven x (no month 3)
		{ month: 5, latency: null }, // blank → gap in the line
		{ month: 6, latency: 145 },
		{ month: 9, latency: 138 }, // uneven x (no 7, 8)
		{ month: 10, latency: 150 }
	];

	const msFmt = (v: number | null) => (v == null ? '—' : `${v} ms`);

	// Table view of the data.
	const columns: ColumnDef<Sample>[] = [
		{ key: 'month', label: 'Month', type: 'number', align: 'right', format: (v) => `M${v}` },
		{ key: 'latency', label: 'Latency', type: 'number', align: 'right', format: (v) => msFmt(v) }
	];

	// Chart view of the same data.
	const monthX: AxisDef<Sample> = {
		value: 'month',
		type: 'linear',
		label: 'Month',
		format: (v) => `M${v}`
	};
	const latencySeries: SeriesDef<Sample> = {
		key: 'latency',
		label: 'Latency (ms)',
		value: 'latency',
		format: (v) => msFmt(v)
	};
</script>

<ContentPage
	title="Chart — Line"
	subtitle="One array, two views: a DataTable and a LineChart side by side"
>
	<div class="demo">
		<div class="data">
			<DataTable rows={samples} {columns} searchable={false} striped />
		</div>

		<figure class="viz">
			<LineChart
				data={samples}
				x={monthX}
				series={latencySeries}
				points
				title="Latency over time"
				description="A line over uneven month values; the null at month 5 breaks the line into a gap rather than dipping to zero. The table beside this chart is the accessible representation of the same data."
			/>
			<figcaption>
				Linear x — uneven months space unevenly, and the <code>null</code> at month 5 becomes a
				<b>gap</b>, not a dive to 0.
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
		flex: 1 1 300px;
		max-width: 420px;
		line-height: 1.35;
	}
	code {
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
		color: #b25f00;
	}
</style>
