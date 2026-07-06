<!--
  Example: plotting a mathematical function y = f(x) with NO new component.
  File: src/routes/slides/function-graph.html/+page.svelte

  The only missing seam between a formula and the existing data-driven charts was
  a sampler. `sampleFunction(fn, [x0, x1], samples)` (pure, in chartCore.ts) turns
  a function into the same {x, y} rows LineChart already plots — every scale, tick,
  axis, and path works unchanged. Two demos:

    • sin x / cos x share one axis (two series over the same sampled x).
    • tan x shows the payoff of linePath's gapping: values past the asymptotes are
      clamped to NaN, so the curve BREAKS at each pole instead of spiking or
      wrecking the y-scale — exactly the non-finite-y-is-a-gap contract.

  This is deliberately LineChart, not a bespoke graph component: it proves function
  plotting needs no new component, while the manual asymptote clamp + edge (not
  origin-crossing) axes hint at what a dedicated FunctionGraph would add later.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { LineChart, sampleFunction, type AxisDef, type SeriesDef } from '$lib/chart';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/function-graph.html/+page.svelte';

	const TAU = Math.PI * 2;
	const domain: [number, number] = [-TAU, TAU];
	const SAMPLES = 240;

	// ── sin x & cos x on one shared axis ──────────────────────────────────────
	// Sample each function, then zip into one row array (same x, two y columns) —
	// the shape LineChart's multi-series accessors expect.
	type Wave = { x: number; sin: number; cos: number };
	const sin = sampleFunction(Math.sin, domain, SAMPLES);
	const cos = sampleFunction(Math.cos, domain, SAMPLES);
	const waves: Wave[] = sin.map((p, i) => ({ x: p.x, sin: p.y, cos: cos[i].y }));

	// ── tan x, clamped near its asymptotes so the poles read as gaps ──────────
	// tan blows up to ±∞ at ±π/2, ±3π/2. Mapping |y| over a cutoff to NaN makes
	// linePath lift the pen there — a clean break, and the y-scale stays sane.
	type Tan = { x: number; y: number };
	const CLIP = 8;
	const tan: Tan[] = sampleFunction(Math.tan, domain, SAMPLES).map((p) => ({
		x: p.x,
		y: Math.abs(p.y) > CLIP ? NaN : p.y
	}));

	// A τ-fraction tick label: -2π … 2π in units of π.
	const piLabel = (v: unknown): string => {
		const k = Math.round((Number(v) / Math.PI) * 2) / 2; // nearest half-π
		if (k === 0) return '0';
		if (k === 1) return 'π';
		if (k === -1) return '−π';
		return `${k}π`;
	};

	const xAxis: AxisDef<Wave> = { value: 'x', type: 'linear', label: 'x (radians)', format: piLabel };
	const tanX: AxisDef<Tan> = { value: 'x', type: 'linear', label: 'x (radians)', format: piLabel };

	const waveSeries: SeriesDef<Wave>[] = [
		{ key: 'sin', label: 'sin x', value: 'sin' },
		{ key: 'cos', label: 'cos x', value: 'cos' }
	];
	const tanSeries: SeriesDef<Tan> = { key: 'tan', label: 'tan x', value: 'y' };
</script>

<ContentPage
	title="Chart — Plotting y = f(x)"
	subtitle="A pure sampleFunction() feeds a formula straight into the existing LineChart — no new component"
>
	<div class="demo">
		<figure class="viz">
			<LineChart
				data={waves}
				x={xAxis}
				series={waveSeries}
				legend
				title="sin x and cos x over [−2π, 2π]"
				description="Two trigonometric functions sampled into 240 points each and drawn on one shared linear axis. The table-free chart is generated purely from Math.sin and Math.cos via sampleFunction."
			/>
			<figcaption>
				<code>sin x</code> and <code>cos x</code> — each <code>sampleFunction(fn, [−2π, 2π], 240)</code>,
				zipped into one row array, two series on a shared axis.
			</figcaption>
		</figure>

		<figure class="viz">
			<LineChart
				data={tan}
				x={tanX}
				series={tanSeries}
				title="tan x over [−2π, 2π], clamped near its poles"
				description="tan x sampled into 240 points, with values beyond ±8 mapped to NaN so the curve breaks cleanly at each vertical asymptote instead of spiking. Demonstrates linePath's non-finite-y-is-a-gap contract on a real function."
			/>
			<figcaption>
				<code>tan x</code> — values past the asymptotes clamped to <code>NaN</code>, so the curve
				<b>gaps</b> at each pole (linePath lifts the pen on a non-finite y).
			</figcaption>
		</figure>
	</div>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		/* light "inverted panel" on the dark deck, shared by both charts */
		--chart-fg: #1a2530;
		--chart-series-1: #2f6db0;
		--chart-series-2: #b25f00;
		--chart-grid: rgba(30, 60, 90, 0.14);
		--chart-axis: rgba(30, 60, 90, 0.5);
		--chart-font-size: 13px;

		display: flex;
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
		flex: 1 1 420px;
		max-width: 680px;
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
	code {
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
		color: #b25f00;
	}
</style>
