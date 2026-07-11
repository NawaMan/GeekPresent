<!--
  Example: Histogram — the distribution chart
  File: src/routes/slides/histogram-component.html/+page.svelte

  The SAME flat sample of API response times (one number per request) drives two
  histograms: the LEFT one bins automatically (Sturges' rule chooses the bucket
  count and round edges); the RIGHT one asks for a fixed `bins={6}` and a hover
  tooltip. Unlike a BarChart the categories ARE the bins, computed from the raw
  numbers — blanks are dropped, never counted as 0. All binning is pure in
  $lib/chart/chartCore.ts (`histogramBins`).
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Histogram } from '$lib/chart';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/histogram-component.html/+page.svelte';

	// One flat sample: the latency (ms) of 48 requests. A histogram turns this
	// unaggregated column into a shape — where the mass sits, how long the tail.
	type Request = { ms: number | null };
	const latencies: Request[] = [
		42, 55, 61, 47, 73, 88, 51, 66, 59, 71, 64, 49, 92, 105, 57, 63,
		68, 77, 81, 53, 60, 74, 69, 58, 46, 79, 84, 62, 67, 72, 95, 111,
		56, 65, 70, 48, 82, 76, 54, 90, 128, 143, 87, 63, 52, 75, 61, 99
	].map((ms) => ({ ms }));
	// A couple of dropped requests carry no timing — a histogram omits them
	// (a blank is "no measurement", not a 0 ms request).
	latencies.push({ ms: null }, { ms: null });

	const ms = (v: number) => `${v}ms`;
</script>

<ContentPage
	title="Histogram — Distribution of a Sample"
	subtitle="One number per request, binned into a shape; auto vs. fixed bins"
>
	<div class="demo">
		<figure class="viz">
			<Histogram
				data={latencies}
				value="ms"
				title="Response time distribution — auto bins"
				description="48 request latencies binned automatically (Sturges' rule); two requests with no timing are dropped."
				xLabel="Response time"
				label="Requests"
				format={ms}
				animate
			/>
			<figcaption>Auto — Sturges' rule picks the bucket count and round edges.</figcaption>
		</figure>

		<figure class="viz">
			<Histogram
				data={latencies}
				value="ms"
				bins={6}
				title="Response time distribution — 6 bins"
				description="The same sample forced into six buckets, with a hover tooltip reporting each bin's range and count."
				xLabel="Response time"
				label="Requests"
				format={ms}
				color="#b25f00"
			/>
			<figcaption>Fixed — <code>bins=&#123;6&#125;</code> coarsens the same sample; hover a bar.</figcaption>
		</figure>
	</div>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		/* light "inverted panel" on the dark deck, shared by both charts */
		--chart-fg: #1a2530;
		--chart-series-1: #2f6db0;
		--chart-grid: rgba(30, 60, 90, 0.14);
		--chart-axis: rgba(30, 60, 90, 0.5);
		--chart-font-size: 13px;
		--chart-tooltip-bg: #1a2530;
		--chart-tooltip-fg: #f4f7fa;

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
