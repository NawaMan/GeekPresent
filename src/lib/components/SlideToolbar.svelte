<!--
  SlideToolbar — the top-centre tool bar, lifted OUT of the slide into the window.

  This is the PRESENT | ANNOTATE | ADJUST | DISPLAY | ☰ cluster. It used to live inside
  <Annotate>, in the slide's own (scaled, letterboxed) content layer — so it hung off the
  SLIDE's top edge and shrank with the fit transform. Now SlideDeck mounts it in the
  viewport-fixed overlay instead, so it sticks to the WINDOW's top edge at a constant size,
  no matter how the slide is scaled, panned or letterboxed. The zoom control (DISPLAY, the
  <SizeMode> that used to pin to the top-right corner) is folded in as a segment, making this
  one real toolbar rather than two scattered controls.

  It AUTO-HIDES: tucked up so only a peek strip shows at the top of the window, sliding fully
  down on hover or when keyboard focus reaches a button inside it — out of the audience's way
  while presenting, one flick of the mouse away when the speaker wants it.

  The ANNOTATE pen toggle is OWNED here (it reads the shared annotation stores directly);
  everything else — PRESENT, ADJUST/SAVE, OVERVIEW/CAPTURE/PRINT — arrives as a snippet from
  SlideDeck, which owns that logic. The pen toggle MUST out-rank the armed ink surface, or a
  speaker could arm the pen and never put it down: the overlay sits at z-index 50, the surface
  at 40, so being in the overlay guarantees this for free (it used to need an explicit z 42).

  `browser &&` because a pen is nothing without JS: prerendering would ship dead controls and
  bake authoring chrome into the static HTML of every deck built on a dev machine.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { annotationMode, canAnnotate } from '$lib/stores/annotation';
	import SizeMode from './SizeMode.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** This deck's canvas, handed to DISPLAY so its resolutions read from the real size. */
		width?: number;
		height?: number;
		/** The cluster's contents, supplied by SlideDeck (which owns their logic): the PRESENT
		 *  anchor, the ADJUST/SAVE group, and the OVERVIEW/CAPTURE/PRINT menu items. The ANNOTATE
		 *  toggle is NOT slotted — it is owned here, because the pen's state lives in a store this
		 *  component reads directly. */
		presentBtn?: Snippet;
		overviewBtn?: Snippet;
		adjustGroup?: Snippet;
		captureItem?: Snippet;
		printBtn?: Snippet;
	}

	let {
		width = 1920,
		height = 1080,
		presentBtn,
		overviewBtn,
		adjustGroup,
		captureItem,
		printBtn
	}: Props = $props();
</script>

{#if browser}
	<!-- The tool bar: PRESENT, then the ANNOTATE and ADJUST word toggles (SAVE beside ADJUST while
	     it's on), then DISPLAY (the zoom control), then a hamburger (☰) whose dropdown holds
	     OVERVIEW / CAPTURE / PRINT. The mode toggles are direct bar buttons, so arming the pen or
	     entering ADJUST is one click and never leaves a panel over the slide; the dropdown hangs off
	     the hamburger — NOT off PRESENT — so those items don't read as sub-options of PRESENT.
	     role="group" names the bar. -->
	<div class="annot-tools no-print" role="group" aria-label="Slide tools">
		<!-- PRESENT — a plain button (opens/focuses the presenter console); no menu of its own. -->
		{@render presentBtn?.()}

		<span class="annot-bar-sep" aria-hidden="true"></span>

		<!-- ANNOTATE — the pen, owned here (its state lives in the annotation store). A text toggle:
		     a FILLED amber pill when armed, muted text when down, greyed when the deck doesn't offer
		     it. The tooltip says what it is and what a click will do. -->
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

		<!-- DISPLAY — the zoom control, folded into the bar (it used to pin to the top-right corner
		     on its own). `inline` makes it sit in the flex row rather than at a fixed window inset;
		     its menu still drops beneath it. -->
		<SizeMode {width} {height} inline />

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

<style>
	/* ── The top-centre tool bar ────────────────────────────────────────────────────
	   One horizontal pill, flush to the WINDOW's top edge and centred: PRESENT, the ANNOTATE /
	   ADJUST word toggles (+ SAVE), DISPLAY, and the ☰ menu. Its parent (SlideDeck's .overlay)
	   is position:fixed at z-index 50 — above the ink surface (40) — so the bar always out-ranks
	   an armed pen, which is what keeps the ANNOTATE toggle reachable to put the pen back down. */
	.annot-tools {
		position: absolute;
		top: 0;
		left: 50%;
		/* Auto-hide: tucked up so only a peek strip shows at the top edge. A hover on that strip
		   — or keyboard focus reaching a button inside — slides the whole bar down. -72% leaves
		   ~28% peeking; nudge toward -85% to hide more, -60% to show more. */
		transform: translateX(-50%) translateY(-72%);
		transition: transform 160ms ease;
		z-index: 1;
		display: flex;
		align-items: stretch;
		/* Thickness lever: the bar (text + padding + height) scales from this one font-size.
		   0.85 suits the UN-scaled overlay; the old in-slide value (0.56) was then shrunk again
		   by the fit transform, so it does NOT translate directly. Raise for a chunkier bar. */
		font-size: calc(var(--base-font, 16px) * 0.5);
		border: 3px solid var(--annot-bar-edge, rgba(255, 255, 255, 0.35));
		border-top: none;
		border-radius: 0 0 10px 10px;
		background: var(--annot-toggle-bg, rgba(20, 22, 26, 0.92));
		box-shadow: 0 3px 14px rgba(0, 0, 0, 0.4);
	}

	/* Bring the tucked bar fully into view on hover, or when a click/tab moves focus into it. */
	.annot-tools:hover,
	.annot-tools:focus-within {
		transform: translateX(-50%) translateY(0);
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

	/* Thin vertical divider between the bar's groups (PRESENT | pen | adjust | display). :global so
	   it dresses both the owned separators and the one slotted in with the ADJUST icons. */
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
</style>
