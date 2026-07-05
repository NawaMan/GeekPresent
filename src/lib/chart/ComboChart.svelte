<!--
  ComboChart — bars and lines over one CATEGORICAL (band) x-axis and two
  independent y-axes. Each series declares its `mark` ('bar' | 'line') and `axis`
  ('left' | 'right'); by default the first series is a bar on the left and the
  rest are lines on the right. Distinguishing the axes by MARK SHAPE (not just
  color) keeps a chart readable when several series share an axis — where color
  alone runs out.

  Bars render grouped (default) or `stacked` within each category band; lines
  draw through the band centers. Each series is scaled against its own axis, so
  very different magnitudes (e.g. volume as bars on the left, a rate as a line on
  the right) both read. An axis with a single series is tinted to match it; with
  several, it stays neutral and the legend carries the labels.

  Wiring + SVG only; all math is pure in chartCore.ts (bandScale, linearScale,
  stackSeries, linePath, nearestIndex). Reuses Axis / ChartLegend / ChartTooltip.
  SSR-safe: the full <svg> renders from props alone; the hover layer mounts
  client-side only. Theme via --chart-*.
-->
<script lang="ts" generics="T">
	import { onMount, type Snippet } from 'svelte';
	import Axis from './Axis.svelte';
	import ChartLegend from './ChartLegend.svelte';
	import ChartTooltip from './ChartTooltip.svelte';
	import {
		bandScale,
		keyString,
		linePath,
		linearScale,
		nearestIndex,
		numericExtent,
		seriesColor,
		stackExtent,
		stackSeries,
		toNumber,
		valueOf
	} from './chartCore';
	import type { Accessor, AxisDef, Point, SeriesDef, TooltipPoint } from './types';

	interface Props {
		data: T[];
		x: AxisDef<T>;
		/** Two or more series; each may set `mark` and `axis` (see defaults above). */
		series: SeriesDef<T>[];
		/** Stack the bar series within each band (per axis) instead of grouping. */
		stacked?: boolean;
		/** Show a clickable legend (chips reflect each series' mark). */
		legend?: boolean;
		/** Hidden series keys — bindable so a parent can drive/observe visibility. */
		hidden?: Set<string>;
		/** Row keys (from `rowKeyAccessor`) to emphasise; every other mark dims —
		 *  the chart-side hook for a DataTable's `bind:selected`. */
		highlighted?: unknown[];
		/** How to read a row's key, matched against `highlighted`. */
		rowKeyAccessor?: Accessor<T>;
		width?: number;
		height?: number;
		/** Accessible name (SVG <title>) — required. */
		title: string;
		description?: string;
		/** Override the hover tooltip body; receives (xValue, points). */
		tooltip?: Snippet<[unknown, TooltipPoint[]]>;
	}

	let {
		data,
		x,
		series,
		stacked = false,
		legend = false,
		hidden = $bindable(new Set<string>()),
		highlighted,
		rowKeyAccessor,
		width = 640,
		height = 400,
		title,
		description,
		tooltip
	}: Props = $props();

	// Selection highlighting: with a non-empty `highlighted` list + a
	// `rowKeyAccessor`, matching bars/points are emphasised and the rest dim.
	const hlKeys = $derived(new Set((highlighted ?? []).map(keyString)));
	const hlActive = $derived(!!rowKeyAccessor && hlKeys.size > 0);
	const isHighlighted = (row: T): boolean =>
		hlActive && hlKeys.has(keyString(valueOf(row, rowKeyAccessor!)));

	interface Resolved extends SeriesDef<T> {
		mark: 'bar' | 'line';
		axis: 'left' | 'right';
		index: number;
	}

	// Fill in each series' mark/axis defaults: first series → bar/left, rest →
	// line; a line defaults to the right axis, a bar to the left.
	const resolved = $derived.by<Resolved[]>(() =>
		series.map((s, index) => {
			const mark = s.mark ?? (index === 0 ? 'bar' : 'line');
			const axis = s.axis ?? (mark === 'bar' ? 'left' : 'right');
			return { ...s, mark, axis, index };
		})
	);
	const shown = $derived(resolved.filter((s) => !hidden.has(s.key)));

	// Color by a series' position in the FULL list, so hiding one never recolors
	// the rest and the legend chips always match the marks.
	const colorOf = $derived((key: string) => {
		const s = resolved.find((o) => o.key === key);
		return s ? seriesColor(s.color, s.index) : 'var(--chart-series-1, #4c78a8)';
	});

	const hasRight = $derived(shown.some((s) => s.axis === 'right'));
	const leftSeries = $derived(shown.filter((s) => s.axis === 'left'));
	const rightSeries = $derived(shown.filter((s) => s.axis === 'right'));
	const barSeries = $derived(shown.filter((s) => s.mark === 'bar'));
	const lineSeries = $derived(shown.filter((s) => s.mark === 'line'));

	// A single-series axis is tinted to that series; a multi-series axis stays
	// neutral (color can't identify it — the mark shape and legend do).
	const leftLabel = $derived(leftSeries.length === 1 ? leftSeries[0].label : undefined);
	const rightLabel = $derived(rightSeries.length === 1 ? rightSeries[0].label : undefined);
	const leftColor = $derived(leftSeries.length === 1 ? colorOf(leftSeries[0].key) : undefined);
	const rightColor = $derived(rightSeries.length === 1 ? colorOf(rightSeries[0].key) : undefined);

	const margin = $derived({
		top: 18,
		right: hasRight ? 52 + (rightLabel ? 20 : 0) : 18,
		bottom: 40 + (x.label ? 22 : 0),
		left: 52 + (leftLabel ? 20 : 0)
	});
	const plot = $derived({
		left: margin.left,
		right: width - margin.right,
		top: margin.top,
		bottom: height - margin.bottom
	});

	const categories = $derived(data.map((row) => valueOf(row, x.value)));
	const xScale = $derived(bandScale(categories, [plot.left, plot.right]));

	// [min, max] for one axis: stacked bars → the stack extent; otherwise every
	// bar/line series on that axis contributes its own extent.
	const extentFor = (axis: 'left' | 'right'): [number, number] => {
		const onAxis = shown.filter((s) => s.axis === axis);
		const bars = onAxis.filter((s) => s.mark === 'bar');
		const lines = onAxis.filter((s) => s.mark === 'line');
		let min = Infinity;
		let max = -Infinity;
		const acc = (lo: number, hi: number) => {
			if (Number.isFinite(lo) && lo < min) min = lo;
			if (Number.isFinite(hi) && hi > max) max = hi;
		};
		if (stacked && bars.length) {
			const [lo, hi] = stackExtent(stackSeries(data, bars));
			acc(lo, hi);
		} else {
			for (const s of bars) acc(...numericExtent(data, s.value));
		}
		for (const s of lines) acc(...numericExtent(data, s.value));
		return min === Infinity ? [NaN, NaN] : [min, max];
	};

	// Bars force a zero baseline on their axis; a line-only axis does not.
	const leftHasBar = $derived(leftSeries.some((s) => s.mark === 'bar'));
	const rightHasBar = $derived(rightSeries.some((s) => s.mark === 'bar'));
	const yLeft = $derived(
		linearScale(extentFor('left'), [plot.bottom, plot.top], { zero: leftHasBar, nice: true })
	);
	const yRight = $derived(
		linearScale(extentFor('right'), [plot.bottom, plot.top], { zero: rightHasBar, nice: true })
	);
	const yFor = (s: Resolved) => (s.axis === 'left' ? yLeft : yRight);

	const catLabel = (cat: unknown): string => (cat === null || cat === undefined ? '' : String(cat));
	const fmtSeries = (s: SeriesDef<T>, v: number): string =>
		s.format ? s.format(v) : v.toLocaleString('en-US');
	const ariaLabel = (cat: unknown, s: SeriesDef<T>, v: number): string =>
		`${catLabel(cat)} — ${s.label}: ${fmtSeries(s, v)}`;
	const axisFormat = (label: string | undefined, s: Resolved | undefined) => (v: unknown) => {
		const n = Number(v);
		return s?.format ? s.format(n) : Number.isFinite(n) ? n.toLocaleString('en-US') : String(v);
	};

	interface Bar {
		x: number;
		y: number;
		width: number;
		height: number;
		fill: string;
		key: string;
		label: string;
		hl: boolean; // this bar's row is in the highlighted set
	}

	// Bars: stacked stacks the bar series per axis; grouped subdivides each band
	// across all bar series. Each bar is scaled against its own axis.
	const bars = $derived.by<Bar[]>(() => {
		const out: Bar[] = [];
		if (stacked) {
			for (const axis of ['left', 'right'] as const) {
				const bs = barSeries.filter((s) => s.axis === axis);
				if (!bs.length) continue;
				const scale = axis === 'left' ? yLeft : yRight;
				const stacks = stackSeries(data, bs);
				data.forEach((row, i) => {
					const cat = valueOf(row, x.value);
					const bx = xScale.map(cat);
					if (Number.isNaN(bx)) return;
					const hl = isHighlighted(row);
					stacks[i]?.forEach((seg, si) => {
						if (seg.value === 0) return; // blank / zero → no rect
						const s = bs[si];
						const yTop = scale.map(seg.y1);
						const yBase = scale.map(seg.y0);
						out.push({
							x: bx,
							y: Math.min(yTop, yBase),
							width: xScale.bandwidth,
							height: Math.abs(yTop - yBase),
							fill: colorOf(s.key),
							key: `${catLabel(cat)}|${s.key}`,
							label: ariaLabel(cat, s, seg.value),
							hl
						});
					});
				});
			}
			return out;
		}

		const keys = barSeries.map((s) => s.key);
		for (const row of data) {
			const cat = valueOf(row, x.value);
			const bx = xScale.map(cat);
			if (Number.isNaN(bx)) continue;
			const inner = bandScale(keys, [bx, bx + xScale.bandwidth], {
				paddingInner: barSeries.length > 1 ? 0.12 : 0,
				paddingOuter: 0
			});
			const hl = isHighlighted(row);
			for (const s of barSeries) {
				const scale = yFor(s);
				const v = toNumber(valueOf(row, s.value));
				if (Number.isNaN(v)) continue; // blank → no bar
				const vy = scale.map(v);
				const z = scale.map(0);
				out.push({
					x: inner.map(s.key),
					y: Math.min(vy, z),
					width: inner.bandwidth,
					height: Math.abs(vy - z),
					fill: colorOf(s.key),
					key: `${catLabel(cat)}|${s.key}`,
					label: ariaLabel(cat, s, v),
					hl
				});
			}
		}
		return out;
	});

	interface Dot extends Point {
		hl: boolean; // this point's row is in the highlighted set
	}
	interface Line {
		key: string;
		label: string;
		color: string;
		d: string;
		dots: Dot[];
	}

	// Lines draw through the band centers, each scaled against its own axis; a
	// blank y gaps the line (linePath) and the dots skip it.
	const lines = $derived.by<Line[]>(() =>
		lineSeries.map((s) => {
			const scale = yFor(s);
			const pts: Dot[] = data.map((row) => {
				const bx = xScale.map(valueOf(row, x.value));
				return {
					x: Number.isNaN(bx) ? NaN : bx + xScale.bandwidth / 2,
					y: scale.map(valueOf(row, s.value)),
					hl: isHighlighted(row)
				};
			});
			return {
				key: s.key,
				label: s.label,
				color: colorOf(s.key),
				d: linePath(pts),
				dots: pts.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
			};
		})
	);

	// A single zero baseline where the bars originate (their axis).
	const zeroY = $derived(leftHasBar ? yLeft.map(0) : rightHasBar ? yRight.map(0) : null);

	// ── Hover tooltip (client-only enhancement) ──────────────────────────────
	let svgEl: SVGSVGElement | undefined = $state();
	let mounted = $state(false);
	let hoverIdx = $state<number | null>(null);
	onMount(() => {
		mounted = true;
	});

	const anchors = $derived(
		data
			.map((row, i) => {
				const bx = xScale.map(valueOf(row, x.value));
				return { i, px: bx + xScale.bandwidth / 2 };
			})
			.filter((a) => Number.isFinite(a.px))
			.sort((a, b) => a.px - b.px)
	);

	function onMove(e: PointerEvent) {
		if (!svgEl || anchors.length === 0) return;
		const rect = svgEl.getBoundingClientRect();
		const lx = ((e.clientX - rect.left) / rect.width) * width;
		const k = nearestIndex(
			anchors.map((a) => a.px),
			lx
		);
		hoverIdx = k < 0 ? null : anchors[k].i;
	}
	function onLeave() {
		hoverIdx = null;
	}

	interface Hover {
		px: number;
		leftPct: number;
		topPct: number;
		xValue: unknown;
		xLabel: string;
		points: TooltipPoint[];
	}
	const hover = $derived.by<Hover | null>(() => {
		if (!mounted || hoverIdx === null) return null;
		const row = data[hoverIdx];
		if (row === undefined) return null;
		const cat = valueOf(row, x.value);
		const bx = xScale.map(cat);
		if (Number.isNaN(bx)) return null;
		const px = bx + xScale.bandwidth / 2;

		const pts: TooltipPoint[] = shown.map((s) => {
			const num = toNumber(valueOf(row, s.value));
			const blank = Number.isNaN(num);
			return {
				key: s.key,
				label: s.label,
				value: blank ? null : num,
				formatted: blank ? '—' : fmtSeries(s, num),
				color: colorOf(s.key)
			};
		});

		const ys = shown
			.map((s) => yFor(s).map(valueOf(row, s.value)))
			.filter((y) => Number.isFinite(y));
		const topY = ys.length ? Math.min(...ys) : plot.top + (plot.bottom - plot.top) / 2;

		return {
			px,
			leftPct: (px / width) * 100,
			topPct: (topY / height) * 100,
			xValue: cat,
			xLabel: x.format ? x.format(cat) : catLabel(cat),
			points: pts
		};
	});
</script>

<div class="chart-root">
	<div class="plot-wrap">
		<svg
			class="chart"
			viewBox="0 0 {width} {height}"
			role="img"
			aria-label={title}
			preserveAspectRatio="xMidYMid meet"
			bind:this={svgEl}
			onpointermove={onMove}
			onpointerleave={onLeave}
		>
			<title>{title}</title>
			{#if description}<desc>{description}</desc>{/if}

			{#if hover}
				<line class="guide" x1={hover.px} y1={plot.top} x2={hover.px} y2={plot.bottom} />
			{/if}

			<Axis
				orientation="left"
				scale={yLeft}
				left={plot.left}
				right={plot.right}
				top={plot.top}
				bottom={plot.bottom}
				format={axisFormat(leftLabel, leftSeries.length === 1 ? leftSeries[0] : undefined)}
				color={leftColor}
				gridlines
				label={leftLabel}
			/>
			{#if hasRight}
				<Axis
					orientation="right"
					scale={yRight}
					left={plot.left}
					right={plot.right}
					top={plot.top}
					bottom={plot.bottom}
					format={axisFormat(rightLabel, rightSeries.length === 1 ? rightSeries[0] : undefined)}
					color={rightColor}
					label={rightLabel}
				/>
			{/if}

			<g class="bars">
				{#each bars as bar (bar.key)}
					<rect
						x={bar.x}
						y={bar.y}
						width={bar.width}
						height={bar.height}
						fill={bar.fill}
						class:hl={bar.hl}
						class:dim={hlActive && !bar.hl}
						aria-label={bar.label}
					/>
				{/each}
			</g>

			{#if zeroY !== null}
				<line class="zero-line" x1={plot.left} y1={zeroY} x2={plot.right} y2={zeroY} />
			{/if}

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

			<g class="lines">
				{#each lines as line (line.key)}
					<path
						class="line"
						class:dim={hlActive}
						d={line.d}
						fill="none"
						stroke={line.color}
						aria-label={line.label}
					/>
					<g class="dots">
						{#each line.dots as p, i (i)}
							<circle
								cx={p.x}
								cy={p.y}
								r={p.hl ? 4.5 : 3}
								fill={line.color}
								class:hl={p.hl}
								class:dim={hlActive && !p.hl}
							/>
						{/each}
					</g>
				{/each}
			</g>
		</svg>

		{#if hover}
			<ChartTooltip
				xLabel={hover.xLabel}
				xValue={hover.xValue}
				points={hover.points}
				left={hover.leftPct}
				top={hover.topPct}
				{tooltip}
			/>
		{/if}
	</div>

	{#if legend}
		<ChartLegend series={resolved} bind:hidden />
	{/if}
</div>

<style>
	.chart-root {
		display: block;
		width: 100%;
	}
	.plot-wrap {
		position: relative;
		width: 100%;
	}
	.chart {
		display: block;
		width: 100%;
		height: auto;
		color: var(--chart-fg, currentColor);
		font-size: var(--chart-font-size, 13px);
		font-family: inherit;
		background: var(--chart-bg, transparent);
	}
	.guide {
		stroke: var(--chart-axis, color-mix(in srgb, currentColor 55%, transparent));
		stroke-width: 1;
		stroke-dasharray: 3 3;
		pointer-events: none;
	}
	.bars rect {
		transition: opacity 0.15s ease;
	}
	/* Selection highlighting: emphasise the chosen marks, dim the rest. */
	.bars rect.dim,
	.dots circle.dim,
	.line.dim {
		opacity: 0.34;
	}
	.bars rect.hl,
	.dots circle.hl {
		stroke: var(--chart-highlight, color-mix(in srgb, currentColor 85%, transparent));
		stroke-width: 2;
		paint-order: stroke;
	}
	.dots circle {
		transition: opacity 0.15s ease;
	}
	.zero-line {
		stroke: var(--chart-axis, color-mix(in srgb, currentColor 55%, transparent));
		stroke-width: 1.25;
	}
	.line {
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
		transition: opacity 0.15s ease;
	}
</style>
