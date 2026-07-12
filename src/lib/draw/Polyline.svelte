<!--
  Polyline — straight or smoothed segments through a list of canvas points:

      <Polyline points={[[100, 900], [400, 700], [700, 950], [1100, 600]]} smooth />

  `smooth` runs a Catmull-Rom through the points (converted to cubic
  segments in drawCore's smoothPath): the curve passes exactly THROUGH every
  input point — no overshoot-prone fitting. `close` joins the last point
  back to the first (a polygon; with `smooth` the loop stays smooth through
  the seam). Stroke-only, like Line/Curve/Arc.
-->
<script lang="ts">
	import { polylinePath, smoothPath } from './drawCore';
	import type { DrawOnProps, Point, ShapeStyleProps } from './types';

	interface Props extends ShapeStyleProps, DrawOnProps {
		points: Point[];
		/** Join the last point back to the first. */
		close?: boolean;
		/** Catmull-Rom smoothing through every point. */
		smooth?: boolean;
		/** Inline style for the root element, applied last so it wins. */
		style?: string;
		/** DOM id for the root element. */
		id?: string;
		/** Extra class(es) for the root element. NOTE: a slide's own scoped styles
		 *  will NOT match — use global CSS (global.css / roles.css / a :global(...)
		 *  block) or a utility class. See AGENTS.md. */
		class?: string;
	}

	let {
		points,
		close = false,
		smooth = false,
		color,
		thickness,
		dash = false,
		label,
		draw,
		drawDelay,
		style = '',
		id = '',
		class: klass = ''
	}: Props = $props();

	// Draw-on: pathLength=1 normalizes any path so the dash trick needs no
	// DOM measurement (SSR-safe); the animation then owns the dash pattern.
	// drawDelay staggers shapes into a sequence on one AnimationBar timeline.
	const drawSecs = $derived(draw && Number.isFinite(draw) && draw > 0 ? draw : null);
	const delaySecs = $derived(
		drawSecs && drawDelay && Number.isFinite(drawDelay) && drawDelay > 0 ? drawDelay : 0
	);

	const d = $derived(smooth ? smoothPath(points, close) : polylinePath(points, close));

	const stroke = $derived(color ?? 'var(--draw-stroke, currentColor)');
	const strokeWidth = $derived(thickness ?? 'var(--draw-thickness, 4)');
	const dasharray = $derived(dash === true ? '12 8' : dash === false ? undefined : dash);
</script>

{#if d}
	<path
		id={id || undefined}
		class="draw-polyline {klass}"
		class:draw-anim={drawSecs}
		{d}
		fill="none"
		pathLength={drawSecs ? 1 : undefined}
		style="stroke:{stroke}; stroke-width:{strokeWidth};{drawSecs
			? ` animation-duration:${drawSecs}s;${delaySecs ? ` animation-delay:${delaySecs}s;` : ''}`
			: ''}{style}"
		stroke-dasharray={drawSecs ? undefined : dasharray}
		stroke-linejoin="round"
		aria-label={label}
		role={label ? 'img' : undefined}
	/>
{/if}

<style>
	/* Draw-on: the shape draws itself; duration comes inline from `draw`. */
	path.draw-anim {
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation-name: draw-on;
		animation-timing-function: ease-in-out;
		animation-fill-mode: forwards;
	}
	@keyframes draw-on {
		to {
			stroke-dashoffset: 0;
		}
	}
</style>
