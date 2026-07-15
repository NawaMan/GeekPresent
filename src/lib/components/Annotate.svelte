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
	import type { Snippet } from 'svelte';

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
		/** Show the deck's own chrome (the ANNOTATE toggle)? Off under ?clean / ?present. */
		chrome?: boolean;
		/** The top-centre cluster's contents, supplied by SlideDeck (which owns their logic):
		 *  the PRESENT anchor and the OVERVIEW/ADJUST/CAPTURE/PRINT menu items. Snippet props,
		 *  not `<slot>`, because this is a runes component. Each is optional — AnnotateHost
		 *  mounts <Annotate> with none, and the pen toggle (owned here) still works. The `*Btn`
		 *  / `*Group` names avoid colliding with SlideDeck's own `present` / `adjust` / `capture`
		 *  identifiers, since a snippet passed as `{#snippet name()}` binds `name` in that scope. */
		presentBtn?: Snippet;
		overviewBtn?: Snippet;
		adjustGroup?: Snippet;
		captureItem?: Snippet;
		printBtn?: Snippet;
	}

	let {
		canvasWidth = 1920,
		canvasHeight = 1080,
		penWidth = 6,
		highlighterWidth = 34,
		inkColors = [null, '#E5484D', '#3FA9F5', '#4BD07A', '#FFFFFF'],
		levelHighlight = true,
		chrome = true,
		presentBtn,
		overviewBtn,
		adjustGroup,
		captureItem,
		printBtn
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

<!-- The top-centre tool cluster. PRESENT is the always-visible ANCHOR: it opens the presenter
     console and is offered on every deck, so it — not the pen — is what the cluster hangs on.
     The menu drops beneath it on hover/focus: OVERVIEW, the ANNOTATE pen toggle, the ADJUST
     authoring toggle (with SAVE nested under it), CAPTURE and PRINT.

     Everything EXCEPT the pen toggle arrives through a slot, so its logic stays in SlideDeck
     (PRESENT's openPresenter, ADJUST/SAVE's layout store, capture already lived there). The
     ANNOTATE toggle is owned HERE because the pen's state lives in this component's own store —
     and it must, because AnnotateHost mounts <Annotate> with no slots yet still tests the pen.

     The cluster no longer hangs on `$canAnnotate`: PRESENT is always there, so the pen toggle
     rides INSIDE the menu and merely shows DISABLED when this deck never offered the pen. Both
     the anchor and the menu sit at z-index 42, above the ink surface, so an armed pen can never
     bury the one control that puts it back down.

     `browser &&` because a pen is nothing without JS: prerendering would ship dead controls and
     put authoring chrome into the static HTML of every deck built on a dev machine. -->
{#if browser && chrome}
	<!-- The always-visible tool bar: PRESENT, then the ANNOTATE and ADJUST word toggles (SAVE beside
	     ADJUST while it's on), then a hamburger (☰) whose dropdown holds OVERVIEW / CAPTURE / PRINT.
	     The mode toggles are direct bar buttons, so arming the pen or entering ADJUST is one click
	     and never leaves a panel over the slide; the dropdown hangs off the hamburger — NOT off
	     PRESENT — so those items don't read as sub-options of PRESENT. role="group" names the bar;
	     z-index 42 keeps it above the ink surface, so an armed pen can't bury the toggle that puts
	     the pen back down. -->
	<div class="annot-tools no-print" role="group" aria-label="Slide tools">
		<!-- PRESENT — a plain button now (opens/focuses the presenter console); no menu of its own. -->
		{@render presentBtn?.()}

		<span class="annot-bar-sep" aria-hidden="true"></span>

		<!-- ANNOTATE — the pen, owned here (its state lives in this component's store). A text
		     toggle: a FILLED amber pill when armed, muted text when down, greyed when the deck
		     doesn't offer it. The tooltip says what it is and what a click will do. -->
		<button
			type="button"
			class="annot-tab annotate-tab"
			class:on={$annotationMode}
			disabled={!$canAnnotate}
			aria-pressed={$annotationMode}
			aria-label={$annotationMode ? 'ANNOTATE on' : 'ANNOTATE off'}
			title={!$canAnnotate
				? 'ANNOTATE — the pen is not offered on this deck'
				: $annotationMode
					? 'ANNOTATE — drawing (click to put the pen down)'
					: 'ANNOTATE — draw on this slide'}
			onclick={() => annotationMode.update((v) => !v)}
		>ANNOTATE</button>

		<!-- ADJUST + SAVE, slotted from SlideDeck (which owns the layout store). The snippet carries
		     the separator before them, so a deck that doesn't offer ADJUST leaves no dangling
		     divider. -->
		{@render adjustGroup?.()}

		<span class="annot-bar-sep" aria-hidden="true"></span>

		<!-- The hamburger menu — OVERVIEW / CAPTURE / PRINT. A focusable button so the panel reveals
		     on hover AND on focus (keyboard / a tap that focuses it); the dropdown is its child, so
		     it hangs off the ☰ at the bar's right edge rather than off PRESENT. -->
		<div class="annot-menu">
			<button
				type="button"
				class="annot-hamburger"
				aria-haspopup="menu"
				aria-label="More tools"
				title="More — Overview, Capture, Print"
			>☰</button>
			<div class="annot-drop" role="menu" aria-label="More tools">
				{@render overviewBtn?.()}
				{@render captureItem?.()}
				{@render printBtn?.()}
			</div>
		</div>
	</div>
{/if}

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

	/* ── The top-centre tool bar ────────────────────────────────────────────────────
	   One horizontal pill, flush to the top edge and centred: PRESENT and its hover-menu, then the
	   ANNOTATE / ADJUST icon toggles (+ SAVE). It is the one region that must survive an armed pen
	   — z-index above the ink surface (40) and the palette bar (41) — because it holds the icon
	   that puts the pen back down. */
	.annot-tools {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		z-index: 42;
		display: flex;
		align-items: stretch;
		font-size: calc(var(--base-font, 16px) * 0.6);
		border: 1px solid var(--annot-bar-edge, rgba(255, 255, 255, 0.16));
		border-top: none;
		border-radius: 0 0 10px 10px;
		background: var(--annot-toggle-bg, rgba(20, 22, 26, 0.92));
		box-shadow: 0 3px 14px rgba(0, 0, 0, 0.4);
	}

	/* The hamburger + its dropdown. position:relative anchors the panel under the ☰ at the bar's
	   right edge, and the hover/focus that reveals it is scoped HERE — reaching for a toggle, or
	   PRESENT, never pops it. */
	.annot-menu {
		position: relative;
		display: flex;
		align-items: stretch;
	}

	/* PRESENT — a plain bar button (slotted from SlideDeck, dressed via :global). Half-faded at
	   rest, full on its own hover; a click opens the console. It owns no menu now. */
	.annot-tools :global(.annot-anchor) {
		cursor: pointer;
		font: inherit;
		font-weight: bold;
		letter-spacing: 0.04em;
		opacity: 0.6;
		transition: opacity 120ms ease;
		padding: 0.3em 0.75em;
		border: 0;
		background: transparent;
		color: var(--annot-toggle-fg, #F0A33E);
	}
	.annot-tools :global(.annot-anchor:hover),
	.annot-tools :global(.annot-anchor:focus-visible) {
		opacity: 1;
	}

	/* The hamburger — the dropdown's trigger. Muted glyph at rest, full on hover or while the menu
	   is open (hover/focus of its .annot-menu parent). */
	.annot-hamburger {
		cursor: pointer;
		font: inherit;
		font-size: 1.05em;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 1.9em;
		padding: 0.2em 0.4em;
		border: 0;
		background: transparent;
		color: var(--annot-toggle-fg, #F0A33E);
		opacity: 0.6;
		transition: opacity 120ms ease, background 120ms ease;
	}
	.annot-hamburger:hover,
	.annot-menu:hover .annot-hamburger,
	.annot-menu:focus-within .annot-hamburger {
		opacity: 1;
		background: var(--annot-bar-hover, rgba(255, 255, 255, 0.1));
	}

	/* The dropdown — OVERVIEW / CAPTURE / PRINT — hangs under the ☰, revealed on hover/focus of the
	   menu. `right: 0` aligns its right edge to the hamburger and it opens LEFTWARD, so it stays
	   inside the bar's right edge. `top: 100%` seats it on the bar's bottom edge with no dead gap,
	   so moving the pointer down from the ☰ into the panel never drops the hover. */
	.annot-drop {
		position: absolute;
		top: 100%;
		right: 0;
		z-index: 1;
		min-width: 10em;
		display: flex;
		flex-direction: column;
		padding: 0.3em;
		border: 1px solid var(--annot-bar-edge, rgba(255, 255, 255, 0.16));
		border-top: none;
		border-radius: 0 0 10px 10px;
		background: var(--annot-toggle-bg, rgba(20, 22, 26, 0.96));
		box-shadow: 0 8px 26px rgba(0, 0, 0, 0.5);
		opacity: 0;
		pointer-events: none;
		transform: translateY(-8px);
		transition: opacity 150ms ease, transform 150ms ease;
	}
	.annot-menu:hover .annot-drop,
	.annot-menu:focus-within .annot-drop {
		opacity: 1;
		pointer-events: auto;
		transform: translateY(0);
	}

	/* Dropdown rows: OVERVIEW / CAPTURE / PRINT arrive as slotted `.annot-tool` buttons (CAPTURE
	   wrapped in `.capture-btn`), dressed via :global into flat full-width menu items. */
	.annot-drop :global(.capture-btn) {
		display: block;
		width: 100%;
	}
	.annot-drop :global(.annot-tool) {
		display: block;
		width: 100%;
		text-align: center;
		cursor: pointer;
		font: inherit;
		font-weight: bold;
		letter-spacing: 0.04em;
		padding: 0.4em 0.9em;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: var(--annot-toggle-fg, #F0A33E);
	}
	.annot-drop :global(.annot-tool:hover:not(:disabled)) {
		background: var(--annot-bar-hover, rgba(255, 255, 255, 0.1));
	}
	.annot-drop :global(.annot-tool:disabled) {
		cursor: default;
		opacity: 0.7;
	}

	/* Thin vertical divider between the bar's groups (PRESENT | pen | adjust). :global so it dresses
	   both the owned separator and the one slotted in with the ADJUST icons from SlideDeck. */
	:global(.annot-bar-sep) {
		width: 1px;
		align-self: stretch;
		margin: 0.35em 0;
		background: var(--annot-bar-edge, rgba(255, 255, 255, 0.16));
	}

	/* ── Text toggles (ANNOTATE, ADJUST) and the SAVE action ─────────────────────────────
	   Word buttons on the bar. The on/off signal is a strong one — muted text when OFF, a FILLED
	   amber pill when ON — not a subtle brightness change, so a glance across the room reads it.
	   ANNOTATE is owned here; ADJUST is slotted from SlideDeck — `:global` dresses both from one
	   rule, each wearing `.annot-tab`. A disabled ANNOTATE (a deck without the pen) stays on the
	   bar, deeply faded. */
	:global(.annot-tab) {
		cursor: pointer;
		font: inherit;
		font-weight: bold;
		letter-spacing: 0.04em;
		padding: 0.25em 0.7em;
		margin: 0.2em 0.1em;
		border: 1px solid transparent;
		border-radius: 999px;
		background: transparent;
		color: var(--annot-toggle-fg, #F0A33E);
		opacity: 0.62;
		transition: opacity 120ms ease, background 120ms ease;
		white-space: nowrap;
	}
	:global(.annot-tab:hover:not(:disabled)) {
		opacity: 1;
		background: var(--annot-bar-hover, rgba(255, 255, 255, 0.1));
	}
	:global(.annot-tab.on) {
		opacity: 1;
		background: var(--annot-pen, #F0A33E);
		color: var(--annot-bar-on-fg, #1A1206);
		border-color: transparent;
	}
	:global(.annot-tab:disabled) {
		opacity: 0.28;
		cursor: default;
	}

	/* SAVE is an ACTION, not a toggle, so it never wears the dim "off" look — it stays at full
	   strength (an outlined pill) so it always reads as pressable. Slotted from SlideDeck, which
	   turns it red on a refusal. */
	:global(.annot-act) {
		cursor: pointer;
		font: inherit;
		font-weight: bold;
		letter-spacing: 0.04em;
		padding: 0.25em 0.7em;
		margin: 0.2em 0.1em;
		border: 1px solid var(--annot-bar-edge, rgba(255, 255, 255, 0.22));
		border-radius: 999px;
		background: transparent;
		color: var(--annot-toggle-fg, #F0A33E);
		white-space: nowrap;
	}
	:global(.annot-act:hover) {
		background: var(--annot-bar-hover, rgba(255, 255, 255, 0.1));
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
		transform: translateX(-50%);
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
