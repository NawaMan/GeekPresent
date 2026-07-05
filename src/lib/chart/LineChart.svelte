<!--
  LineChart — single-series line over a linear x-scale and a linear y-scale
  (y does NOT force zero by default — a line reads relative change, not
  magnitude-from-zero). A blank / uncoercible y BREAKS THE LINE INTO A GAP
  (linePath restarts with a fresh M), never dipping through 0. Points are drawn
  in array order, so the caller sorts rows by x (same pipeline philosophy as the
  table) — the x-scale places each point at its true value, so uneven spacing
  shows as uneven gaps.

  Wiring + SVG only; all math is pure in chartCore.ts:

      data → x/y values → linear-x + linear-y scales → line path (+ dots) → SVG

  SSR-safe (full <svg> from props alone). Accessible: role="img" with a required
  `title` (→ <title>) and optional `description` (→ <desc>). Theme via --chart-*
  (line stroke from --chart-series-1 unless SeriesDef.color overrides). Optional
  dots via `points`. Multi-series lands in Phase 2 — a `series` array uses its
  first entry.
-->
<script lang="ts" generics="T">
	import Axis from './Axis.svelte';
	import { linePath, linearScale, numericExtent, valueOf } from './chartCore';
	import type { AxisDef, Point, SeriesDef } from './types';

	interface Props {
		data: T[];
		x: AxisDef<T>;
		/** Phase 1 is single-series; an array uses its first entry. */
		series: SeriesDef<T> | SeriesDef<T>[];
		width?: number;
		height?: number;
		/** Accessible name (SVG <title>) — required. */
		title: string;
		description?: string;
		/** Draw a dot at each (finite) data point. */
		points?: boolean;
	}

	let {
		data,
		x,
		series,
		width = 640,
		height = 400,
		title,
		description,
		points = false
	}: Props = $props();

	const s0 = $derived(Array.isArray(series) ? series[0] : series);

	const margin = $derived({
		top: 18,
		right: 18,
		bottom: 40 + (x.label ? 22 : 0),
		left: 52 + (s0.label ? 20 : 0)
	});
	const plot = $derived({
		left: margin.left,
		right: width - margin.right,
		top: margin.top,
		bottom: height - margin.bottom
	});

	const xScale = $derived(
		linearScale(numericExtent(data, x.value), [plot.left, plot.right], { nice: true })
	);
	// zero: false — lines don't force a zero baseline.
	const yScale = $derived(
		linearScale(numericExtent(data, s0.value), [plot.bottom, plot.top], { nice: true })
	);

	// Points in row order; a blank y yields a non-finite y, which linePath turns
	// into a gap. Dots skip those same non-finite points.
	const pts = $derived.by<Point[]>(() =>
		data.map((row) => ({
			x: xScale.map(valueOf(row, x.value)),
			y: yScale.map(valueOf(row, s0.value))
		}))
	);
	const d = $derived(linePath(pts));
	const dots = $derived(pts.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));

	const lineColor = $derived(s0.color ?? 'var(--chart-series-1, #4c78a8)');
	const yFormat = (v: unknown): string => {
		const n = Number(v);
		return s0.format ? s0.format(n) : Number.isFinite(n) ? n.toLocaleString('en-US') : String(v);
	};
</script>

<svg
	class="chart"
	viewBox="0 0 {width} {height}"
	role="img"
	aria-label={title}
	preserveAspectRatio="xMidYMid meet"
>
	<title>{title}</title>
	{#if description}<desc>{description}</desc>{/if}

	<Axis
		orientation="left"
		scale={yScale}
		left={plot.left}
		right={plot.right}
		top={plot.top}
		bottom={plot.bottom}
		format={yFormat}
		gridlines
		label={s0.label}
	/>
	<Axis
		orientation="bottom"
		scale={xScale}
		left={plot.left}
		right={plot.right}
		top={plot.top}
		bottom={plot.bottom}
		format={x.format}
		label={x.label}
	/>

	<path class="line" {d} fill="none" stroke={lineColor} />

	{#if points}
		<g class="dots">
			{#each dots as p, i (i)}
				<circle cx={p.x} cy={p.y} r="3" fill={lineColor} />
			{/each}
		</g>
	{/if}
</svg>

<style>
	.chart {
		display: block;
		width: 100%;
		height: auto;
		color: var(--chart-fg, currentColor);
		font-size: var(--chart-font-size, 13px);
		font-family: inherit;
		background: var(--chart-bg, transparent);
	}
	.line {
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
</style>
