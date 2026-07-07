<!--
  Example: stacked AreaChart on a TIME axis, with a draw-in animation
  File: src/routes/slides/chart-area.html/+page.svelte

  The SAME plain array drives a DataTable and a stacked AreaChart. On show here:
  THREE traffic sources STACKED into cumulative bands over a calendar TIME axis
  (each blank contributes 0, pinching its band to zero thickness — never a gap,
  the running-total semantics it shares with stacked bars); a clickable LEGEND; a
  hover TOOLTIP whose custom snippet reads the hovered SOURCE ROW (the new
  bar/line/area contract) to show a per-month TOTAL the chart never plots; and an
  `animate` draw-in that wipes the bands in on mount (an animation that lives
  within the slide). Chart geometry is pure in $lib/chart/chartCore.ts.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { AreaChart, type AxisDef, type SeriesDef } from '$lib/chart';
	import { DataTable, type ColumnDef } from '$lib/datatable';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/chart-area.html/+page.svelte';

	// One array — a table AND a stacked area of three sources over ~6 months.
	type Traffic = { month: Date; organic: number; referral: number; social: number | null };
	const traffic: Traffic[] = [
		{ month: new Date(2024, 0, 1), organic: 42_000, referral: 18_000, social: 9_000 },
		{ month: new Date(2024, 1, 1), organic: 46_500, referral: 20_400, social: 11_200 },
		{ month: new Date(2024, 2, 1), organic: 51_800, referral: 19_100, social: null }, // blank → 0
		{ month: new Date(2024, 3, 1), organic: 58_200, referral: 22_700, social: 14_600 },
		{ month: new Date(2024, 4, 1), organic: 63_900, referral: 25_300, social: 17_800 },
		{ month: new Date(2024, 5, 1), organic: 71_400, referral: 27_900, social: 21_500 }
	];

	const monthFmt = (d: Date | null) =>
		d == null ? '—' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
	const numFmt = (v: number | null) => (v == null ? '—' : v.toLocaleString('en-US'));
	const total = (r: Traffic) => (r.organic ?? 0) + (r.referral ?? 0) + (r.social ?? 0);

	// Table view of the same data.
	const columns: ColumnDef<Traffic>[] = [
		{ key: 'month', label: 'Month', type: 'date', format: (v) => monthFmt(v as Date) },
		{ key: 'organic', label: 'Organic', type: 'number', align: 'right', format: (v) => numFmt(v) },
		{
			key: 'referral',
			label: 'Referral',
			type: 'number',
			align: 'right',
			format: (v) => numFmt(v)
		},
		{ key: 'social', label: 'Social', type: 'number', align: 'right', format: (v) => numFmt(v) }
	];

	// Chart view: a time x-axis, three stacked series.
	const monthX: AxisDef<Traffic> = { value: 'month', type: 'time', label: 'Month' };
	const series: SeriesDef<Traffic>[] = [
		{ key: 'organic', label: 'Organic', value: 'organic', format: numFmt },
		{ key: 'referral', label: 'Referral', value: 'referral', format: numFmt },
		{ key: 'social', label: 'Social', value: 'social', format: (v) => numFmt(v) }
	];
</script>

<ContentPage
	title="Chart — Stacked Area + Draw-In"
	subtitle="Three sources stacked over a time axis, a legend, a row-aware tooltip, and a mount animation"
>
	<div class="demo">
		<div class="data">
			<DataTable rows={traffic} {columns} searchable={false} striped />
		</div>

		<figure class="viz">
			<AreaChart
				data={traffic}
				x={monthX}
				{series}
				stacked
				legend
				animate
				title="Traffic by source over time"
				description="Three traffic sources — organic, referral, social — stacked into cumulative bands over a six-month time axis. The null social value in March contributes 0 (its band pinches shut) rather than breaking the stack. The table beside this chart is the accessible representation of the same data."
			>
				{#snippet tooltip(x, points, row)}
					<strong>{monthFmt(x as Date)}</strong>
					{#each points as p (p.key)}
						<div class="tip-row">
							<span class="tip-swatch" style:background={p.color}></span>
							{p.label}: <b>{p.formatted}</b>
						</div>
					{/each}
					<div class="tip-total">Total: <b>{numFmt(total(row as Traffic))}</b></div>
				{/snippet}
			</AreaChart>
			<figcaption>
				Stacked <code>organic + referral + social</code> · time x-axis · the tooltip's
				<code>Total</code> comes from the hovered <code>row</code> — a column the chart never plots
				· the bands <code>animate</code> in on mount.
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
		--chart-series-3: #4b8b3b;
		--chart-grid: rgba(30, 60, 90, 0.14);
		--chart-axis: rgba(30, 60, 90, 0.5);
		--chart-font-size: 13px;
		--chart-tooltip-bg: #1a2530;
		--chart-tooltip-fg: #f4f7fa;
		--chart-area-opacity: 0.5;

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
	.tip-total {
		margin-top: 0.25em;
		padding-top: 0.2em;
		border-top: 1px solid rgba(244, 247, 250, 0.25);
	}
	code {
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
		color: #b25f00;
	}
</style>
