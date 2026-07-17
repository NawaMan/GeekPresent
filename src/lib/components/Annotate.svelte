<!--
  Annotate — the speaker's ink overlay.

  Mounted ONCE per deck by SlideDeck (a canvas-level singleton, like <Spotlight>), so no
  slide has to place it. Inert until the speaker arms ANNOTATE: then the surface takes the
  pointer and freehand strokes land on the live slide — circle the term, underline the line
  of code, cross out the wrong branch. <Spotlight> can already ring a Block, but only one
  the AUTHOR named in advance; this is for what the speaker decides to point at while
  answering a question.

  Geometry is not ours: sampled pointer positions go through annotateCore.simplifyPoints
  and then drawCore's `smoothPath` — the SAME Catmull-Rom smoothing <Polyline> and <Curve>
  render through, so ink inherits the NaN-safe, total discipline the Draw family is already
  tested against, and a stroke is nothing more exotic than a `d` string.

  INK PERSISTS, per slide, across reloads (stores/annotation.inkBook). Two windows share it
  for free — they are the same origin, so the audience's copy of the store hears the
  speaker's strokes through the `storage` event, with no relay to keep in step. The price of
  keeping ink is that it can go STALE, so a slide whose marks are older than a day says so
  on arrival and offers to clear them; RESET (this slide) and RESET ALL live on the bar, and
  again in the presenter console.

  The overlay is still SSR-inert: `persisted` degrades to an empty in-memory book on the
  server, so a prerendered page ships no surface, no listener and no ink — whatever happens
  to be in the author's browser.

  Three z-layers, and the order matters: the ink surface (40) sits over the slide's own
  Blocks; the bar and the ANNOTATE toggle (41/42) sit over the surface, because while the
  pen is armed the surface owns EVERY pointer on the canvas — anything the speaker must
  still be able to click has to out-rank it, or they can arm the pen and never put it down.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import {
		annotationMode,
		canAnnotate,
		annotateTool,
		annotateColor,
		strokes,
		staleInk,
		addStroke,
		undoStroke,
		resetSlideInk,
		resetAllInk,
		dismissStale
	} from '$lib/stores/annotation';
	import {
		clampBarPos,
		inkAgeText,
		levelPoints,
		simplifyPoints,
		strokeD,
		strokeWidth,
		toCanvasPoint,
		type AnnotateTool,
		type Stroke
	} from '$lib/annotate/annotateCore';
	import { barPos } from '$lib/stores/annotation';
	import { trackPointer } from '$lib/utils/drag';
	import type { Point } from '$lib/draw/types';

	interface Props {
		canvasWidth?: number;
		canvasHeight?: number;
		/** Stroke widths in canvas px. The highlighter is a BAND, not a line — to highlight
		 *  is to swipe OVER the words, so it must cover a line of text. */
		penWidth?: number;
		highlighterWidth?: number;
		/** The swatches offered in the bar. The FIRST is always the theme's own colour
		 *  (`null` → painted by the --annot-* role token), so the default follows a re-theme
		 *  instead of freezing today's hex into every mark. */
		inkColors?: (string | null)[];
		/** Keep a highlighter swipe LEVEL — the band sits on the row you swiped, rather than
		 *  sloping along with the hand that drew it. Set false for a freehand highlighter. */
		levelHighlight?: boolean;
	}

	let {
		canvasWidth = 1920,
		canvasHeight = 1080,
		penWidth = 6,
		highlighterWidth = 34,
		inkColors = [null, '#E5484D', '#3FA9F5', '#4BD07A', '#FFFFFF'],
		levelHighlight = true
	}: Props = $props();


	// Armed = the control is offered here AND the speaker turned it on. Both halves matter:
	// a stale persisted `true` must stay inert on a deck that never offers the pen.
	const armed = $derived($canAnnotate && $annotationMode);

	// The surface renders whenever there is ink to show OR the pen is armed — the AUDIENCE
	// window mirrors strokes with the mode OFF, so "armed" alone would leave it blank, and
	// "has ink" alone would give the speaker nothing to draw on.
	const showSurface = $derived(armed || $strokes.length > 0);

	const color = $derived($annotateColor[$annotateTool]);

	let surface: SVGSVGElement | undefined = $state();
	let live: Point[] = $state([]);
	let seq = 0;

	/** `null` colour → no inline style → the role token paints it. */
	function paint(c: string | null | undefined): string {
		return c ? `stroke:${c};` : '';
	}

	/** The shape a gesture actually takes. A highlighter is LEVELLED — the band sits on the
	    row you swiped instead of sloping with your hand (see levelPoints). Applied to the LIVE
	    stroke as well as the committed one, so what you watch yourself draw is what you get;
	    levelling only at commit would make the band jump straight the instant the pen lifted.

	    Committed strokes are stored already-levelled, so re-rendering never re-levels: a stroke
	    drawn with `levelHighlight={false}` keeps its curve for good. */
	function shapeOf(points: Point[], tool: AnnotateTool): Point[] {
		return tool === 'highlighter' && levelHighlight ? levelPoints(points) : points;
	}

	function pointFrom(ev: PointerEvent): Point {
		// Measured, not computed: the surface's own on-screen rect already encodes the display
		// mode's transform (FITTED centres, SCALED pans from the top-left, the presenter
		// console applies none), so we never have to ask which one is in force.
		return toCanvasPoint(
			ev.clientX,
			ev.clientY,
			surface?.getBoundingClientRect(),
			canvasWidth,
			canvasHeight
		);
	}

	/** Pointer capture keeps a stroke coming to us even when the pen leaves the surface
	    mid-drag. It is an optimisation, not the mechanism — the stroke is already ours once
	    `live` is non-empty — so a capture that is unavailable or refuses (an unknown
	    pointerId, a synthetic event) must not take the stroke down with it. */
	function capture(id: number, take: boolean): void {
		try {
			if (take) surface?.setPointerCapture?.(id);
			else surface?.releasePointerCapture?.(id);
		} catch {
			// best-effort
		}
	}

	function onPointerDown(ev: PointerEvent): void {
		if (!armed || ev.button !== 0) return;
		ev.preventDefault();
		capture(ev.pointerId, true);
		live = [pointFrom(ev)];
	}

	function onPointerMove(ev: PointerEvent): void {
		if (!armed || live.length === 0) return;
		const p = pointFrom(ev);
		// A 2px gate while drawing keeps the live array (and the path we re-render on every
		// move) from filling with near-duplicates at the pointer's sample rate; simplifyPoints
		// does the real decimation once, on commit.
		const last = live[live.length - 1];
		if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2) return;
		live = [...live, p];
	}

	function onPointerUp(ev: PointerEvent): void {
		if (live.length === 0) return;
		capture(ev.pointerId, false);

		// Decimate first, THEN level: levelling reduces a swipe to two points, so simplifying
		// afterwards would have nothing left to do — and the mean-y that levelling takes should
		// be the mean of the samples the hand actually produced, not of a thinned subset.
		const points = shapeOf(simplifyPoints(live, 4), $annotateTool);
		live = [];
		if (points.length === 0) return;

		const stroke: Stroke = { id: `ink-${Date.now()}-${++seq}`, tool: $annotateTool, points };
		if (color) stroke.color = color;
		addStroke(stroke);
	}

	// ── Dragging the bar ────────────────────────────────────────────────────────────────
	// The bar is wide and it sits over the slide, so wherever it defaults to it is in someone's
	// way — over the code they want to circle, or the chart's x-axis. So it moves, by a grip
	// rather than by its body (a bar you drag by its face is a bar whose buttons you cannot
	// press), and it REMEMBERS where it was put.
	let bar: HTMLDivElement | undefined = $state();

	/** Screen px per canvas px, right now, in whatever display mode is in force. The ink
	    surface is laid out at exactly canvas size, so its rect answers this directly. */
	function liveScale(): number {
		const r = surface?.getBoundingClientRect();
		return r && r.width > 0 ? r.width / canvasWidth : 1;
	}

	function onGripDown(ev: PointerEvent): void {
		if (ev.button !== 0) return;
		ev.preventDefault();
		ev.stopPropagation(); // never let the grip's own gesture also draw a stroke

		const barRect = bar?.getBoundingClientRect();
		const surfRect = surface?.getBoundingClientRect();
		if (!barRect || !surfRect) return;

		const scale = liveScale();
		// Where the bar is NOW, in canvas px — measured, because until the first drag it is
		// placed by CSS (bottom-centre) and has no coordinates of its own to read.
		const startX = (barRect.left - surfRect.left) / scale;
		const startY = (barRect.top - surfRect.top) / scale;
		const barW = barRect.width / scale;
		const barH = barRect.height / scale;
		const before = $barPos;

		trackPointer(ev, {
			scaleFrom: liveScale,
			onMove: (dx, dy) =>
				barPos.set(clampBarPos(startX + dx, startY + dy, barW, barH, canvasWidth, canvasHeight)),
			// Esc mid-drag puts it back where it was, like every other gesture in the deck.
			onCancel: () => barPos.set(before)
		});
	}

	/** Double-click the grip to send the bar home. The escape hatch for a bar parked somewhere
	    regrettable — and, since the position is persisted, regrettable *permanently*. */
	function homeBar(): void {
		barPos.set(null);
	}

	// `null` → let the CSS place it (bottom-centre). Dragged → explicit canvas coords, and the
	// centring transform has to go with them or the bar would sit half a bar-width to the left.
	const barStyle = $derived(
		$barPos ? `left:${$barPos.x}px; top:${$barPos.y}px; bottom:auto; transform:none;` : ''
	);

	function pick(tool: AnnotateTool): void {
		annotateTool.set(tool);
	}

	function setColor(c: string | null): void {
		annotateColor.update((m) => ({ ...m, [$annotateTool]: c }));
	}

	/** Escape puts the pen down; Ctrl/Cmd+Z takes back a stroke.

	    The paging keys are deliberately NOT captured: a speaker must never be unable to
	    advance, and a key that both dismisses a tool and navigates away is the trap the
	    appendix Escape note already warns about. So ←/→/Space keep paging — and now that ink
	    persists, paging away no longer destroys it; it is still there when you come back. */
	function onKeydown(ev: KeyboardEvent): void {
		if (!armed) return;
		if (ev.key === 'Escape') {
			ev.preventDefault();
			annotationMode.set(false);
		} else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
			ev.preventDefault();
			undoStroke();
		}
	}
</script>

<svelte:window on:keydown={onKeydown} />

{#if showSurface}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg
		bind:this={surface}
		class="annot-surface"
		class:armed
		viewBox="0 0 {canvasWidth} {canvasHeight}"
		style="width:{canvasWidth}px; height:{canvasHeight}px; pointer-events:{armed ? 'auto' : 'none'};"
		aria-hidden="true"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		{#each $strokes as stroke (stroke.id)}
			<path
				class="annot-stroke"
				class:highlighter={stroke.tool === 'highlighter'}
				d={strokeD(stroke.points)}
				stroke-width={strokeWidth(stroke.tool, penWidth, highlighterWidth)}
				style={paint(stroke.color)}
			/>
		{/each}

		<!-- The stroke under the pen right now. Same paint as a committed one, so the ink does
		     not shift the instant the pen lifts. -->
		{#if live.length > 0}
			<path
				class="annot-stroke"
				class:highlighter={$annotateTool === 'highlighter'}
				d={strokeD(shapeOf(live, $annotateTool))}
				stroke-width={strokeWidth($annotateTool, penWidth, highlighterWidth)}
				style={paint(color)}
			/>
		{/if}
	</svg>
{/if}

<!-- The top-centre PRESENT | ANNOTATE | ADJUST | DISPLAY | ☰ cluster used to live HERE, but it
     was anchored to the slide's own (scaled, letterboxed) content — so it hung off the slide's
     top edge and shrank with the fit transform. It now lives in <SlideToolbar>, which SlideDeck
     mounts in the viewport-fixed overlay so it sticks to the WINDOW's top edge at a constant
     size. The ANNOTATE pen toggle moved with it (it reads the same shared stores); the overlay's
     z-index 50 keeps it above this surface (40), so an armed pen still can't bury the toggle. -->

<!-- Old ink, found on arrival. The reason a persisted pen needs a conscience: without this,
     last week's rehearsal marks appear on stage and the speaker has to notice them before
     the audience does. Only for ink OLDER than the threshold — today's marks never nag. -->
{#if $staleInk}
	<div class="annot-stale no-print" role="status">
		<span class="annot-stale-text">
			This slide has annotations from <b>{inkAgeText($staleInk.ts, browser ? Date.now() : 0)}</b>.
		</span>
		<button type="button" class="annot-btn" onclick={resetSlideInk}>RESET SLIDE</button>
		<button type="button" class="annot-btn" onclick={resetAllInk}>RESET ALL</button>
		<button type="button" class="annot-btn keep" onclick={dismissStale}>KEEP</button>
	</div>
{/if}

{#if armed}
	<!-- The pen's own palette. It has to live ABOVE the ink surface: while the mode is on the
	     surface takes every pointer on the canvas, so anything still clickable must out-rank
	     it. Ghosted until pointed at (the fadeChrome trick), because it hangs over the slide
	     the audience is reading — but it keeps its full hit area, so it is exactly where the
	     speaker last left it. -->
	<div class="annot-bar no-print" role="toolbar" aria-label="Annotation tools" bind:this={bar} style={barStyle}>
		<!-- Drag by the GRIP, not by the bar's face — a bar you drag by its body is a bar whose
		     buttons you can no longer press. Double-click sends it home. -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<span
			class="annot-grip"
			role="button"
			tabindex="-1"
			aria-label="Move the annotation bar"
			title="Drag to move · double-click to reset"
			onpointerdown={onGripDown}
			ondblclick={homeBar}
		>⠿</span>
		<button
			type="button"
			class="annot-btn"
			class:on={$annotateTool === 'pen'}
			aria-pressed={$annotateTool === 'pen'}
			onclick={() => pick('pen')}>PEN</button
		>
		<button
			type="button"
			class="annot-btn"
			class:on={$annotateTool === 'highlighter'}
			aria-pressed={$annotateTool === 'highlighter'}
			onclick={() => pick('highlighter')}>HIGHLIGHT</button
		>
		<span class="annot-sep" aria-hidden="true"></span>

		<!-- Swatches for speed (you are on stage), plus a picker for anything else. The first
		     swatch is the THEME's colour, and picking it stores `null` rather than a hex. -->
		{#each inkColors as c, i (i)}
			<button
				type="button"
				class="annot-swatch"
				class:on={color === c}
				class:theme={c === null}
				class:hl={$annotateTool === 'highlighter'}
				style={c ? `--swatch:${c};` : ''}
				aria-label={c === null ? 'Theme colour' : `Colour ${c}`}
				aria-pressed={color === c}
				onclick={() => setColor(c)}
			></button>
		{/each}
		<label class="annot-custom" title="Custom colour">
			<input
				type="color"
				aria-label="Custom ink colour"
				value={color ?? '#F0A33E'}
				oninput={(e) => setColor((e.currentTarget as HTMLInputElement).value)}
			/>
		</label>

		<span class="annot-sep" aria-hidden="true"></span>
		<button type="button" class="annot-btn" disabled={$strokes.length === 0} onclick={undoStroke}
			>UNDO</button
		>
		<button type="button" class="annot-btn" disabled={$strokes.length === 0} onclick={resetSlideInk}
			>RESET</button
		>
		<button type="button" class="annot-btn" onclick={resetAllInk}>RESET ALL</button>
		<span class="annot-sep" aria-hidden="true"></span>
		<button type="button" class="annot-btn done" onclick={() => annotationMode.set(false)}>DONE</button>
	</div>
{/if}

<style>
	.annot-surface {
		position: absolute;
		left: 0;
		top: 0;
		display: block;
		/* Over the slide's own Blocks — including one lifted to 35 while being edited — but
		   under the Box modal (1000) and the ADJUST-raised Draw surface (60). Ink is a
		   foreground cue: it is the last thing drawn on the slide. */
		z-index: 40;
	}
	.annot-surface.armed {
		/* The pen is the pointer's job now, so say so — and kill the text-selection drag that
		   would otherwise fight every stroke over a paragraph. */
		cursor: crosshair;
		touch-action: none;
		user-select: none;
	}

	.annot-stroke {
		fill: none;
		stroke: var(--annot-pen, #F0A33E);
		stroke-linecap: round;
		stroke-linejoin: round;
		/* The same crisp-at-scale glow Spotlight's ring uses, drawn in the SVG so it scales
		   with the canvas: ink has to read over whatever the slide put behind it — a photo, a
		   chart, a code box. */
		filter: drop-shadow(0 0 6px var(--annot-pen-glow, rgba(0, 0, 0, 0.55)));
	}

	/* A highlighter is the same stroke, painted as a translucent BAND that lets the words
	   through instead of covering them.

	   The blend mode is the whole trick, and it is a role token because it is the one thing
	   that MUST flip with the theme. `screen` is the dark-deck default (the deck's own):
	   screening a yellow band over a dark background turns the background yellow while light
	   text stays light — a highlighter. A LIGHT theme sets `multiply`, where the band tints
	   the white page and dark text stays dark. Get it backwards and the highlighter smears
	   over the very words it is meant to point at. */
	.annot-stroke.highlighter {
		stroke: var(--annot-highlighter, #F5E663);
		opacity: var(--annot-highlighter-alpha, 0.45);
		mix-blend-mode: var(--annot-highlighter-blend, screen);
		filter: none;
	}

	/* ── The stale-ink notice ───────────────────────────────────────────────────────── */
	.annot-stale {
		position: absolute;
		top: 2.6em;
		left: 50%;
		transform: translateX(-50%);
		z-index: 42;
		display: flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.5em 0.8em;
		border-radius: 10px;
		font-size: calc(var(--base-font, 16px) * 0.75);
		background: var(--annot-bar-bg, rgba(20, 22, 26, 0.92));
		border: 1px solid var(--annot-stale-edge, #F0A33E);
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
	}
	.annot-stale-text {
		color: var(--annot-bar-fg, #D7DDE5);
		margin-right: 0.3em;
	}

	/* ── The palette ────────────────────────────────────────────────────────────────── */
	.annot-bar {
		position: absolute;
		left: 50%;
		bottom: 28px;
		/* 75% of prior size — the pen palette was reading large next to the window-edge chrome. */
		transform: translateX(-50%) scale(0.75);
		transform-origin: center bottom;
		z-index: 41;
		display: flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.45em 0.7em;
		border-radius: 999px;
		font-size: calc(var(--base-font, 16px) * 0.8);
		background: var(--annot-bar-bg, rgba(20, 22, 26, 0.92));
		border: 1px solid var(--annot-bar-edge, rgba(255, 255, 255, 0.16));
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);

		/* Ghosted until pointed at — the same opacity trick (never visibility/display) that
		   fadeChrome uses on the deck's own controls, and for the same reason: a ghosted bar
		   keeps its FULL hit area, so the pointer finds it exactly where it always was. */
		opacity: var(--annot-bar-idle, 0.28);
		transition: opacity 0.18s ease-in-out;
	}
	.annot-bar:hover,
	.annot-bar:focus-within {
		opacity: 1;
	}
	/* A touch reader has no hover to summon it with, so a ghosted bar there is just a lost
	   bar — exactly the carve-out fadeChrome makes. */
	@media (hover: none) {
		.annot-bar {
			opacity: 1;
		}
	}

	.annot-btn {
		cursor: pointer;
		font: inherit;
		font-weight: bold;
		letter-spacing: 0.03em;
		padding: 0.25em 0.8em;
		border-radius: 999px;
		border: 1px solid transparent;
		background: transparent;
		color: var(--annot-bar-fg, #D7DDE5);
		white-space: nowrap;
	}
	.annot-btn:hover:not(:disabled) {
		background: var(--annot-bar-hover, rgba(255, 255, 255, 0.1));
	}
	.annot-btn.on {
		background: var(--annot-pen, #F0A33E);
		color: var(--annot-bar-on-fg, #1A1206);
	}
	.annot-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}
	.annot-btn.done {
		color: var(--annot-bar-done, #7FD1A0);
	}
	.annot-btn.keep {
		color: var(--annot-bar-fg, #D7DDE5);
		opacity: 0.75;
	}

	.annot-swatch {
		cursor: pointer;
		width: 1.35em;
		height: 1.35em;
		padding: 0;
		border-radius: 50%;
		border: 2px solid transparent;
		background: var(--swatch, var(--annot-pen, #F0A33E));
	}
	/* The theme swatch has no hex of its own — it SHOWS the token, so it keeps meaning the
	   right thing after a re-theme (which is exactly what storing `null` buys). */
	.annot-swatch.theme {
		background: var(--annot-pen, #F0A33E);
	}
	.annot-swatch.theme.hl {
		background: var(--annot-highlighter, #F5E663);
	}
	.annot-swatch.on {
		border-color: var(--annot-bar-fg, #D7DDE5);
		box-shadow: 0 0 0 2px var(--annot-bar-bg, rgba(20, 22, 26, 0.92));
	}

	.annot-custom {
		display: flex;
		align-items: center;
		cursor: pointer;
	}
	.annot-custom input[type='color'] {
		width: 1.35em;
		height: 1.35em;
		padding: 0;
		border: 2px dashed var(--annot-bar-edge, rgba(255, 255, 255, 0.16));
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
	}

	.annot-sep {
		width: 1px;
		align-self: stretch;
		background: var(--annot-bar-edge, rgba(255, 255, 255, 0.16));
	}

	.annot-grip {
		cursor: grab;
		user-select: none;
		/* The gesture is ours: without this, a drag over the bar would also be a scroll or a
		   text-selection on a touch screen. */
		touch-action: none;
		padding: 0 0.35em 0 0.15em;
		line-height: 1;
		font-size: 1.1em;
		color: var(--annot-bar-fg, #D7DDE5);
		opacity: 0.5;
	}
	.annot-grip:hover {
		opacity: 1;
	}
	.annot-grip:active {
		cursor: grabbing;
	}
</style>
