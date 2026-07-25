<!--
  Example: Waterfall — the running-total breakdown
  File: src/routes/slides/chart-waterfall.html/+page.svelte

  Two walks, the two shapes this chart is for:

    LEFT — where a budget GOES. Each stage adds to the running total and the
    appended `endTotal` column asserts the sum. One stage is a blank (no
    measurement yet), which contributes 0 and keeps its slot rather than
    silently shortening the walk. One stage is negative (a cache hit gives
    time back), so it falls — the sign is the point.

    RIGHT — how a number came DOWN. `start` seeds the walk at the old p95 and
    each optimisation is a negative contribution; `isTotal` marks a mid-walk
    checkpoint ("after the quick wins") that is drawn from the baseline
    instead of moving the total. `animate` draws it in on mount.

  Chart geometry is pure in $lib/chart/chartCore.ts (waterfallBars).
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Waterfall, type AxisDef } from '$lib/chart';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/chart-waterfall.html/+page.svelte';

	const ms = (v: number) => `${v.toLocaleString('en-US')} ms`;

	// Where the p95 request time goes. `profiled: null` is a stage nobody has
	// measured yet — it contributes 0 and the walk carries on.
	type Stage = { stage: string; cost: number | null };
	const budget: Stage[] = [
		{ stage: 'DNS + TLS', cost: 180 },
		{ stage: 'Auth check', cost: 45 },
		{ stage: 'Query', cost: 90 },
		{ stage: 'Cache hit', cost: -35 }, // gives time back → falls
		{ stage: 'Serialize', cost: 70 },
		{ stage: 'Middleware', cost: null }, // not profiled yet → contributes 0
		{ stage: 'Render', cost: 60 }
	];
	const stageX: AxisDef<Stage> = { value: 'stage', type: 'band', label: 'Request stage' };

	// The optimisation walk: from the old p95 down, with a checkpoint partway.
	type Win = { step: string; delta: number | null; checkpoint?: boolean };
	const wins: Win[] = [
		{ step: 'Old p95', delta: 0, checkpoint: true },
		{ step: 'Index the join', delta: -640 },
		{ step: 'Drop N+1', delta: -410 },
		{ step: 'After quick wins', delta: null, checkpoint: true },
		{ step: 'Gzip payload', delta: -220 },
		{ step: 'Warm pool', delta: -130 },
		{ step: 'Retry storm', delta: 95 } // a regression we shipped and kept
	];
	const winX: AxisDef<Win> = { value: 'step', type: 'band' };
</script>

<ContentPage
	title="Chart — Waterfall (Running Totals)"
	subtitle="Where the budget goes, and how a number came down — one series, signed, walked across categories"
>
	<div class="demo">
		<figure class="viz">
			<Waterfall
				data={budget}
				x={stageX}
				value="cost"
				label="Cost"
				format={ms}
				endTotal
				endTotalLabel="p95 total"
				title="Where the p95 request time goes"
				description="Each stage's cost added to a running total: DNS and TLS 180 ms, auth 45 ms, query 90 ms, a 35 ms cache saving, serialization 70 ms, middleware not yet profiled, render 60 ms, for a 410 ms p95 total. Every bar carries its contribution and the running total in its accessible label."
			/>
			<figcaption>
				Additive — each stage starts where the last ended. The cache hit <em>falls</em>; the
				unprofiled stage contributes 0 and keeps its slot; <code>endTotal</code> asserts the sum.
			</figcaption>
		</figure>

		<figure class="viz">
			<Waterfall
				data={wins}
				x={winX}
				value="delta"
				label="p95"
				format={ms}
				isTotal="checkpoint"
				start={2100}
				animate
				title="How the p95 came down from 2.1 s"
				description="Starting from a 2,100 ms p95: indexing the join saved 640 ms, dropping the N+1 saved 410 ms, a checkpoint marks 1,050 ms after the quick wins, gzip saved 220 ms, a warm pool 130 ms, and a retry-storm regression added 95 ms back, ending at 795 ms."
			/>
			<figcaption>
				Subtractive — <code>start</code> seeds the walk, <code>isTotal</code> marks checkpoints
				drawn from the baseline, and the regression at the end rises where everything else fell.
			</figcaption>
		</figure>
	</div>

	<p class="aside">
		A waterfall is <strong>not</strong> a stacked bar. A stack sums many series inside one
		category; a waterfall walks one series across categories and makes the sign the point — so it
		answers "how did we get from here to there", which a stack cannot.
	</p>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		/* light "inverted panel" on the dark deck, shared by both charts */
		--chart-fg: #1a2530;
		--chart-rise: #2f6db0;
		--chart-fall: #b25f00;
		--chart-total: #33404b;
		--chart-step: rgba(30, 60, 90, 0.45);
		--chart-grid: rgba(30, 60, 90, 0.14);
		--chart-axis: rgba(30, 60, 90, 0.5);
		--chart-font-size: 12px;
		--chart-tooltip-bg: #1a2530;
		--chart-tooltip-fg: #f4f7fa;

		display: flex;
		/* pin LTR so an inherited text direction can't flip the two walks */
		direction: ltr;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: center;
		gap: 1.2em;
		margin: 0.3em auto 0;
		max-width: 1620px;
		text-align: initial;
	}
	.viz {
		flex: 1 1 420px;
		margin: 0;
		padding: 0.6em 0.8em 0.4em;
		background: #eef2f5;
		border: 1px solid #9fb0bc;
		border-radius: 10px;
	}
	.viz figcaption {
		margin-top: 0.2em;
		color: #33404b;
		font-size: 0.58em;
		line-height: 1.4;
		text-align: center;
	}
	.viz figcaption code {
		font-size: 0.95em;
	}
	.aside {
		max-width: 1200px;
		margin: 0.7em auto 0;
		font-size: 0.62em;
		line-height: 1.45;
		text-align: center;
		opacity: 0.9;
	}
</style>
