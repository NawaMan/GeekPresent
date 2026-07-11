<!--
  Example: Heatmap — the 2-D distribution chart
  File: src/routes/slides/heatmap-component.html/+page.svelte

  The SAME flat table of request volume (one row per weekday × time-of-day)
  drives two heatmaps. Both PIVOT the rows into a matrix in $lib/chart/chartCore.ts
  (`heatmapMatrix`): the distinct weekdays become columns, the time blocks become
  rows, and each cell is coloured by its value along a sequential ramp.

  LEFT: the raw shape, revealed with `animate` and read off the colour legend.
  RIGHT: the same matrix with `showValues` printing each number and a hover
  tooltip. A couple of blank cells (no row for that slot) are drawn EMPTY — a
  missing measurement is "no data", never a 0. Both axes are categorical bands;
  the third dimension is the cell's colour.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Heatmap } from '$lib/chart';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/heatmap-component.html/+page.svelte';

	// One flat table: average requests/sec by weekday × time-of-day. A heatmap
	// turns this two-key table into a shape — where the load concentrates.
	type Load = { day: string; block: string; rps: number | null };
	const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
	const blocks = ['00–06', '06–12', '12–18', '18–24'];
	// rps[block][day] — the mid-day / weekday peak, quiet nights, a light Friday
	// evening. Two slots have no reading (a monitoring gap) → left blank.
	const grid: Record<string, Record<string, number | null>> = {
		'00–06': { Mon: 12, Tue: 15, Wed: 14, Thu: 13, Fri: 18 },
		'06–12': { Mon: 68, Tue: 74, Wed: 80, Thu: 77, Fri: 62 },
		'12–18': { Mon: 92, Tue: 105, Wed: 118, Thu: 110, Fri: null },
		'18–24': { Mon: 40, Tue: 44, Wed: 47, Thu: null, Fri: 33 }
	};
	const load: Load[] = [];
	for (const block of blocks)
		for (const day of days) load.push({ day, block, rps: grid[block][day] });

	const rps = (v: number) => `${v}`;
</script>

<ContentPage
	title="Heatmap — A Two-Key Distribution"
	subtitle="Requests/sec by weekday × time-of-day; the load concentrates mid-day"
>
	<div class="demo">
		<figure class="viz">
			<Heatmap
				data={load}
				x="day"
				y="block"
				value="rps"
				title="Request load by weekday and time-of-day"
				description="Average requests per second in each weekday × 6-hour block; two slots with no reading are drawn empty."
				xLabel="Weekday"
				yLabel="Time of day"
				format={rps}
				animate
			/>
			<figcaption>Colour = load. Read it off the ramp; the two empty cells had no reading.</figcaption>
		</figure>

		<figure class="viz">
			<Heatmap
				data={load}
				x="day"
				y="block"
				value="rps"
				title="Request load — values printed"
				description="The same matrix with each cell's value printed and a hover tooltip."
				xLabel="Weekday"
				yLabel="Time of day"
				format={rps}
				showValues
			/>
			<figcaption><code>showValues</code> prints each number; hover a cell for its label.</figcaption>
		</figure>
	</div>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		/* light "inverted panel" on the dark deck, shared by both charts, plus the
		   sequential ramp the cells interpolate between (low → high). */
		--chart-fg: #1a2530;
		--chart-grid: rgba(30, 60, 90, 0.14);
		--chart-axis: rgba(30, 60, 90, 0.5);
		--chart-font-size: 13px;
		--chart-tooltip-bg: #1a2530;
		--chart-tooltip-fg: #f4f7fa;
		--chart-heat-low: #eaf2fb;
		--chart-heat-high: #08519c;

		display: flex;
		direction: ltr;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: center;
		gap: 1.4em;
		margin: 0.4em auto 0;
		max-width: 1500px;
		text-align: initial;
	}
	.viz {
		flex: 1 1 380px;
		max-width: 700px;
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
	.viz code {
		font-size: 0.95em;
	}
</style>
