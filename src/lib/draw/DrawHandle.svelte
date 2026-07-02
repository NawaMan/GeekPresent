<!--
  DrawHandle — internal point-handle primitive for LAYOUT-mode shape editing.
  Not part of the public API.

  An SVG knob bound to a Point in canvas units (it scales with the deck,
  exactly like Block's chrome) and draggable via the shared trackPointer
  helper: grid snapping, an optional Shift-snap hook (H/V/45° for endpoints),
  Esc-cancel restoring the drag's start point, and a commit callback that
  fires only when the point actually moved (the caller records undo/redo).

  Screen→canvas scale: SVG elements have no offsetWidth, so the scale is the
  owner svg's rendered width ÷ the canvas width from Draw's context.

  Styled like the existing grips: --ctrl-strong-bg knob with an --on-accent
  ring; `kind="control"` is the hollow variant for Bézier control points,
  `kind="bend"` the accent variant for the arc's apex handle.
-->
<script lang="ts">
	import { getContext } from 'svelte';
	import { trackPointer } from '$lib/utils/drag';
	import { DRAW_CONTEXT_KEY, type DrawContext, type Point } from './types';

	interface Props {
		point: Point;
		/** Snap step in canvas px while dragging (1 = freeform). */
		grid?: number;
		kind?: 'point' | 'control' | 'bend';
		/** Tooltip (SVG <title>). */
		title?: string;
		/** Applied to the already-grid-snapped point while Shift is held. */
		shiftSnap?: (p: Point) => Point;
		/** Live position during the drag. */
		onmove: (p: Point) => void;
		/** Gesture committed with a net change — record undo/redo here. */
		oncommit?: (before: Point, after: Point) => void;
		/** Pointer went down on the handle — select the owning shape. */
		onselect?: () => void;
	}

	let {
		point,
		grid = 1,
		kind = 'point',
		title,
		shiftSnap,
		onmove,
		oncommit,
		onselect
	}: Props = $props();

	const ctx = getContext<DrawContext | undefined>(DRAW_CONTEXT_KEY);
	let el = $state<SVGCircleElement>();

	const snap = (n: number) => (grid > 1 ? Math.round(n / grid) * grid : Math.round(n));

	function start(event: PointerEvent) {
		event.preventDefault();
		event.stopPropagation();
		onselect?.();
		const [sx, sy] = point;
		let current: Point = [sx, sy];
		trackPointer(event, {
			scaleFrom: () => {
				const svg = el?.ownerSVGElement;
				if (!svg || !ctx) return 1;
				return svg.getBoundingClientRect().width / ctx.width || 1;
			},
			onMove: (dx, dy, e) => {
				let p: Point = [snap(sx + dx), snap(sy + dy)];
				if (e.shiftKey && shiftSnap) p = shiftSnap(p);
				current = p;
				onmove(p);
			},
			onEnd: () => {
				if (current[0] === sx && current[1] === sy) return;
				oncommit?.([sx, sy], current);
			},
			onCancel: () => onmove([sx, sy])
		});
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<circle
	bind:this={el}
	class="draw-handle {kind}"
	cx={point[0]}
	cy={point[1]}
	r={kind === 'control' ? 8 : 10}
	onpointerdown={start}
>
	{#if title}<title>{title}</title>{/if}
</circle>

<style>
	/* The surface is pointer-events:none; handles re-enable it — the ONLY
	   elements that do, and they exist only in LAYOUT mode. */
	.draw-handle {
		pointer-events: all;
		cursor: grab;
		touch-action: none;
		fill: var(--ctrl-strong-bg, #2980b9);
		stroke: var(--on-accent, #ffffff);
		stroke-width: 2.5;
	}
	.draw-handle:active {
		cursor: grabbing;
	}
	/* Bézier control points: hollow, so they read as satellites of the
	   endpoints they steer. */
	.draw-handle.control {
		fill: var(--ctrl-bg, #181818);
		stroke: var(--ctrl-strong-bg, #2980b9);
	}
	/* The arc's bend handle: accent-colored, one per arc, at the apex. */
	.draw-handle.bend {
		fill: var(--ctrl-selected-bg, #00b356);
	}
</style>
