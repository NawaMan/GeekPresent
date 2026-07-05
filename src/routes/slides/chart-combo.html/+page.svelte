<!--
  Example: ComboChart — bars + line on two axes (Phase 2)
  File: src/routes/slides/chart-combo.html/+page.svelte

  The SAME plain array drives a DataTable and a ComboChart. This is the case
  where COLOR alone can't tell the axes apart: TWO bar series (desktop, mobile)
  share the LEFT axis (session counts) while a line series (conversion %) rides
  the RIGHT axis on its own scale. The MARK SHAPE — grouped bars vs. a line —
  distinguishes which axis a series belongs to, and the legend chips echo it. A
  blank mobile value in Apr draws no bar; the line keeps going. Chart geometry is
  pure in $lib/chart/chartCore.ts.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { ComboChart, type AxisDef, type SeriesDef } from '$lib/chart';
	import { DataTable, type ColumnDef } from '$lib/datatable';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/chart-combo.html/+page.svelte';

	// One array — a table AND a combo chart. Sessions (bars, left) vs a rate
	// (line, right): two very different magnitudes on independent axes.
	type Month = { month: string; desktop: number; mobile: number | null; conversion: number };
	const months: Month[] = [
		{ month: 'Jan', desktop: 4200, mobile: 3100, conversion: 2.4 },
		{ month: 'Feb', desktop: 4600, mobile: 3600, conversion: 2.9 },
		{ month: 'Mar', desktop: 5100, mobile: 4200, conversion: 3.3 },
		{ month: 'Apr', desktop: 4900, mobile: null, conversion: 3.1 }, // blank → no mobile bar
		{ month: 'May', desktop: 5600, mobile: 4800, conversion: 3.8 },
		{ month: 'Jun', desktop: 6100, mobile: 5300, conversion: 4.2 }
	];

	const numFmt = (v: number | null) => (v == null ? '—' : v.toLocaleString('en-US'));
	const pctFmt = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}%`);

	// Table view of the same data.
	const columns: ColumnDef<Month>[] = [
		{ key: 'month', label: 'Month' },
		{ key: 'desktop', label: 'Desktop', type: 'number', align: 'right', format: (v) => numFmt(v) },
		{ key: 'mobile', label: 'Mobile', type: 'number', align: 'right', format: (v) => numFmt(v) },
		{ key: 'conversion', label: 'Conv.', type: 'number', align: 'right', format: (v) => pctFmt(v) }
	];

	// Chart view: two bar series on the left, one line series on the right.
	const monthX: AxisDef<Month> = { value: 'month', type: 'band', label: 'Month' };
	const series: SeriesDef<Month>[] = [
		{ key: 'desktop', label: 'Desktop', value: 'desktop', mark: 'bar', axis: 'left', format: numFmt },
		{ key: 'mobile', label: 'Mobile', value: 'mobile', mark: 'bar', axis: 'left', format: (v) => numFmt(v) },
		{
			key: 'conversion',
			label: 'Conversion',
			value: 'conversion',
			mark: 'line',
			axis: 'right',
			format: (v) => pctFmt(v)
		}
	];
</script>

<ContentPage
	title="Chart — Combo (Bars + Line, Two Axes)"
	subtitle="Bars and a line on separate axes; mark shape tells the axes apart, not just color"
>
	<div class="demo">
		<div class="data">
			<DataTable rows={months} {columns} searchable={false} striped />
		</div>

		<figure class="viz">
			<ComboChart
				data={months}
				x={monthX}
				{series}
				legend
				title="Sessions and conversion by month"
				description="Two bar series (desktop, mobile) on the left sessions axis and a conversion-rate line on the right axis. The mark shape distinguishes which axis each series belongs to; the blank April mobile value draws no bar while the line continues. The table beside this chart is the accessible representation of the same data."
			/>
			<figcaption>
				Two <b>bars</b> (Desktop, Mobile) share the left axis; the <b>line</b> (Conversion) rides the
				right axis on its own scale — <code>mark</code> shape, not color, tells them apart.
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
		--chart-series-2: #6aa0d8;
		--chart-series-3: #b25f00;
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
		flex: 1 1 300px;
		max-width: 440px;
		line-height: 1.35;
	}
	code {
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
		color: #b25f00;
	}
</style>
