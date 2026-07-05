<!--
  BarChart — single-series vertical bars over a categorical (band) x-scale and a
  linear y-scale with a FORCED ZERO baseline: the y domain always includes 0, so
  bars grow from a visible zero line and negative values hang below it. Blank /
  uncoercible values render no bar (never a zero-height stub at the baseline).

  Wiring + SVG only; all math is pure in chartCore.ts, flowing through the
  chained pipeline (each stage its own $derived, never merged):

      data → categories/values → band-x + linear-y scales → bar rects → SVG

  SSR-safe: the full <svg> renders from props alone. Accessible: role="img" with
  a required `title` (→ <title>), optional `description` (→ <desc>), and one
  aria-label per bar ("us-east: 320"). Theme via --chart-* (bar fill from
  --chart-series-1 unless SeriesDef.color overrides). Multi-series / grouped /
  stacked land in Phase 2 — a `series` array here uses its first entry.
-->
<script lang="ts" generics="T">
	import Axis from './Axis.svelte';
	import { bandScale, linearScale, numericExtent, toNumber, valueOf } from './chartCore';
	import type { AxisDef, SeriesDef } from './types';

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
	}

	let { data, x, series, width = 640, height = 400, title, description }: Props = $props();

	const s0 = $derived(Array.isArray(series) ? series[0] : series);

	// Margins leave room for tick labels and (when present) axis labels.
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

	const categories = $derived(data.map((row) => valueOf(row, x.value)));
	const xScale = $derived(bandScale(categories, [plot.left, plot.right]));

	// zero: true — bars ALWAYS include the zero baseline in their domain.
	const yScale = $derived(
		linearScale(numericExtent(data, s0.value), [plot.bottom, plot.top], { zero: true, nice: true })
	);
	const zeroY = $derived(yScale.map(0));

	const fmtValue = (v: number): string =>
		s0.format ? s0.format(v) : v.toLocaleString('en-US');
	const yFormat = (v: unknown): string => {
		const n = Number(v);
		return s0.format ? s0.format(n) : Number.isFinite(n) ? n.toLocaleString('en-US') : String(v);
	};

	interface Bar {
		x: number;
		y: number;
		width: number;
		height: number;
		value: number;
		label: string;
	}

	const bars = $derived.by<Bar[]>(() => {
		const out: Bar[] = [];
		for (const row of data) {
			const cat = valueOf(row, x.value);
			const v = toNumber(valueOf(row, s0.value));
			const bx = xScale.map(cat);
			// blank/uncoercible value or unknown category → no bar
			if (Number.isNaN(v) || Number.isNaN(bx)) continue;
			const vy = yScale.map(v);
			out.push({
				x: bx,
				y: Math.min(vy, zeroY),
				width: xScale.bandwidth,
				height: Math.abs(vy - zeroY),
				value: v,
				label: cat === null || cat === undefined ? '' : String(cat)
			});
		}
		return out;
	});

	const barColor = $derived(s0.color ?? 'var(--chart-series-1, #4c78a8)');
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

	<g class="bars">
		{#each bars as bar (bar.label)}
			<rect
				x={bar.x}
				y={bar.y}
				width={bar.width}
				height={bar.height}
				fill={barColor}
				aria-label={`${bar.label}: ${fmtValue(bar.value)}`}
			/>
		{/each}
	</g>

	<!-- zero baseline: where bars originate; negatives hang below it -->
	<line class="zero-line" x1={plot.left} y1={zeroY} x2={plot.right} y2={zeroY} />

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
	.bars rect {
		transition: opacity 0.15s ease;
	}
	.zero-line {
		stroke: var(--chart-axis, color-mix(in srgb, currentColor 55%, transparent));
		stroke-width: 1.25;
	}
</style>
