<!--
  Cursor — a fake mouse pointer, for demonstrating a UI without a live app.

  An author-placed glyph that glides between named targets and can flash a
  click ripple on arrival — a scriptable stand-in for "then I click Save",
  so a slide can SHOW the gesture instead of cutting to a screen recording.

      <Draw>
        <Cursor path={["menu-btn", { at: "save-btn", click: true }]} animate={1.4} />
      </Draw>

  NOT A NEW ENGINE: it's a Sprite wearing a pointer. Cursor resolves `path`
  into canvas points — a Block NAME through stores/blockAnchors.ts (the same
  registry Connector/Spotlight/Toast read, so a target dragged in ADJUST
  carries the cursor along with it) or a literal [x, y] — turns them into
  Sprite `stops` (cursorCore.ts, pure), and flies a LOCKED <Sprite> underneath.
  `lock` is Sprite's own escape hatch for generated geometry: it still flies,
  but registers no ADJUST editor and shows no chrome, so there is exactly one
  source of truth for Copy — the <Cursor> tag itself — and nothing to
  save on the Sprite side. Motion is pure generated CSS, so it prerenders and
  the AnimationBar scrubs it exactly like every other shape's animation.

  An unresolved name drops the WHOLE flight (Connector's rule): never a
  cursor stranded at a fallback point. A single `path` entry is a static
  cursor (no flight) — useful for just marking a spot with an optional click.

  CLICK is authored as a keyframe marker (`click: true` on a waypoint), not a
  separate build step — the flight already lives on one continuous timeline,
  and a marker needs no second clock. Each ripple is a plain SVG circle whose
  `animation-delay` lands it exactly when the glyph arrives (cursorCore's
  `cursorRipples`), using ONE static @keyframes shared by every ripple (only
  the delay varies) rather than Sprite's per-instance generated CSS, since
  every ripple looks the same. It honours prefers-reduced-motion — the flash
  is a flourish, not the taught content, unlike the flight itself.

  Deliberately NOT in this pass: distinct hover/drag pointer states — just
  move + a click ripple, which is what every use so far has needed. The glyph
  itself is swappable via the default slot (an emoji, a custom SVG) for a
  themed pointer.
-->
<script module lang="ts">
	import type { Point } from './types';

	/** A Block `name` or a literal canvas point. */
	export type CursorAt = string | Point;
	/** A waypoint: where to go, and whether arriving there flashes a ripple. */
	export interface CursorWaypoint {
		at: CursorAt;
		click?: boolean;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { blockAnchors } from '$lib/stores/blockAnchors';
	import Sprite from './Sprite.svelte';
	import { cursorRippleRadius, cursorRipples, cursorSpriteStops } from './cursorCore';

	interface Props {
		/** Where the pointer travels: ≥1 entries, each a Block name, a literal
		 *  [x, y], or a `{ at, click }` waypoint. Two or more animate a glide
		 *  across them (evenly timed); one is a static cursor with no flight.
		 *  A name not yet registered drops the WHOLE flight (Connector's rule). */
		path: (CursorAt | CursorWaypoint)[];
		/** Seconds for the whole glide across every leg (evenly split). */
		animate?: number;
		/** Seconds to hold at the first point before departing. */
		delay?: number;
		/** CSS timing function for the whole flight (default ease-in-out). */
		ease?: string;
		/** Glyph box size, canvas px. */
		size?: number;
		/** Extra static rotation (deg) on the glyph, e.g. to match custom art. */
		rotate?: number;
		/** Shown only in devtools/tests — Cursor has no ADJUST handles of its
		 *  own (the Sprite underneath is locked), so this is not a Copy name. */
		name?: string;
		/** Override the default pointer glyph. */
		children?: Snippet;
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
		path,
		animate = 1.2,
		delay = 0,
		ease = 'ease-in-out',
		size = 40,
		rotate = 0,
		name = '',
		children,
		style = '',
		id = '',
		class: klass = ''
	}: Props = $props();

	const anchors = $derived($blockAnchors);

	function normalize(w: CursorAt | CursorWaypoint): CursorWaypoint {
		return typeof w === 'object' && !Array.isArray(w) ? w : { at: w };
	}
	const waypoints = $derived((path ?? []).map(normalize));

	/** A name resolves to its Block's live centre; an unregistered name is
	 *  null — the whole flight then renders nothing (Connector's rule). */
	function resolvePoint(at: CursorAt): Point | null {
		if (typeof at === 'string') {
			const box = anchors.get(at);
			return box ? [box.x + box.width / 2, box.y + box.height / 2] : null;
		}
		return at;
	}
	const resolved = $derived(waypoints.map((w) => resolvePoint(w.at)));
	const unresolved = $derived(path?.length > 0 && resolved.some((p) => p === null));

	const targets = $derived(
		unresolved
			? []
			: resolved.map((p, i) => ({ x: p![0], y: p![1], click: !!waypoints[i].click }))
	);

	const stops = $derived(cursorSpriteStops(targets, size));
	const ripples = $derived(cursorRipples(targets, delay, animate));
	const rippleR = $derived(cursorRippleRadius(size));
</script>

{#snippet pointerGlyph()}
	<svg viewBox="0 0 24 24" width="100%" height="100%" class="cursor-glyph">
		<path
			d="M3 3 L10.07 19.97 L12.58 12.58 L19.97 10.07 Z"
			fill="var(--cursor-fill, #F0A33E)"
			stroke="var(--cursor-outline, rgba(0, 0, 0, 0.55))"
			stroke-width="1.4"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

{#if targets.length > 0}
	<g id={id || undefined} class="draw-cursor {klass}" style={style || undefined} aria-hidden="true">
		<Sprite lock {name} {animate} {delay} {ease} {size} {rotate} orient={false} stops={stops}>
			{#if children}{@render children()}{:else}{@render pointerGlyph()}{/if}
		</Sprite>
		{#each ripples as r, i (i)}
			<circle
				class="cursor-ripple"
				cx={r.x}
				cy={r.y}
				r={rippleR}
				style="animation-delay:{r.delaySec}s"
			/>
		{/each}
	</g>
{/if}

<style>
	.cursor-ripple {
		fill: none;
		stroke: var(--cursor-ripple, #f0a33e);
		stroke-width: 3;
		opacity: 0;
		transform-box: fill-box;
		transform-origin: center;
		animation: cursor-ripple-pulse 0.6s ease-out both;
	}
	@keyframes cursor-ripple-pulse {
		0% {
			opacity: 0.9;
			transform: scale(0.35);
		}
		100% {
			opacity: 0;
			transform: scale(1.6);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.cursor-ripple {
			animation: none;
			opacity: 0;
		}
	}
</style>
