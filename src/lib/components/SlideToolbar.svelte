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
  while presenting, one flick of the mouse away when the speaker wants it. PIN latches it fully
  out (and the bottom ControlBar with it — one shared preference) until the speaker unpins and
  returns both to auto-hide.

  The ANNOTATE pen toggle is OWNED here (it reads the shared annotation stores directly);
  everything else — PRESENT, ADJUST/SAVE, OVERVIEW/CAPTURE/PRINT/SOURCE — arrives as a snippet from
  SlideDeck, which owns that logic. The pen toggle MUST out-rank the armed ink surface, or a
  speaker could arm the pen and never put it down: the overlay sits at z-index 50, the surface
  at 40, so being in the overlay guarantees this for free (it used to need an explicit z 42).

  `browser &&` because a pen is nothing without JS: prerendering would ship dead controls and
  bake authoring chrome into the static HTML of every deck built on a dev machine.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { annotationMode, canAnnotate } from '$lib/stores/annotation';
	import { toolBarPinned } from '$lib/stores/chromePin';
	import { chromeArmed, moreMenuHeldClosed, releaseMoreMenuHold } from '$lib/stores/chromeArm';
	import { overviewOpen } from '$lib/stores/overviewOpen';
	import SizeMode from './SizeMode.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** This deck's canvas, handed to DISPLAY so its resolutions read from the real size. */
		width?: number;
		height?: number;
		/** The cluster's contents, supplied by SlideDeck (which owns their logic): the PRESENT
		 *  anchor, the ADJUST/SAVE group, and the OVERVIEW/CAPTURE/PRINT/SOURCE menu items. The
		 *  ANNOTATE toggle is NOT slotted — it is owned here, because the pen's state lives in a
		 *  store this component reads directly. */
		presentBtn?: Snippet;
		overviewBtn?: Snippet;
		adjustGroup?: Snippet;
		captureItem?: Snippet;
		printBtn?: Snippet;
		sourceItem?: Snippet;
	}

	let {
		width = 1920,
		height = 1080,
		presentBtn,
		overviewBtn,
		adjustGroup,
		captureItem,
		printBtn,
		sourceItem
	}: Props = $props();

	// When OVERVIEW opens, force-close the ☰ drop: CSS :hover/:focus-within would otherwise
	// keep it painted over the grid (the toolbar sits above the overview scrim).
	$effect(() => {
		if (browser && $overviewOpen && document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
	});
</script>

{#if browser}
	<!-- The tool bar: PIN first (this bar only — independent of the bottom ControlBar),
	     then PRESENT, ANNOTATE / ADJUST (+ SAVE), DISPLAY, and the ☰ menu (OVERVIEW /
	     CAPTURE / PRINT). Mode toggles are direct bar buttons so arming the pen or entering
	     ADJUST is one click; the dropdown hangs off the hamburger — NOT off PRESENT — so
	     those items don't read as sub-options of PRESENT. role="group" names the bar. -->
	<div
		class="annot-tools no-print"
		class:pinned={$toolBarPinned}
		class:armed={$chromeArmed}
		role="group"
		aria-label="Slide tools"
	>
		<!-- PIN — latch THIS bar fully out of its auto-hide tuck. Independent of the bottom
		     ControlBar's pin (see stores/chromePin). Icon-only (pushpin SVG); aria-label +
		     title carry the name. Filled when on. -->
		<button
			type="button"
			class="annot-tab pin-tab"
			class:on={$toolBarPinned}
			aria-pressed={$toolBarPinned}
			aria-label={$toolBarPinned ? 'PIN on' : 'PIN off'}
			title={$toolBarPinned
				? 'PIN — this bar stays visible (click to auto-hide again)'
				: 'PIN — keep this bar visible'}
			onclick={() => toolBarPinned.update((v) => !v)}
		>
			<svg class="pin-icon" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
				<!-- Classic pushpin (Material-style): head + shaft + needle. currentColor tracks the tab. -->
				<path
					fill="currentColor"
					d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"
				/>
			</svg>
		</button>

		<span class="annot-bar-sep" aria-hidden="true"></span>

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
		>ANNOTATE (A)</button>

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

		<!-- The hamburger menu. Groups: navigate (OVERVIEW) · export (CAPTURE, PRINT) ·
		     source (SOURCE, EDIT). Separators sit between groups; empty capture leaves a
		     zero-height row so the sep still reads as "navigate | export | source". -->
		<!-- svelte-ignore a11y_no_static_element_interactions — mouseenter only clears Esc's
		     "hold ☰ closed" latch so hover can open the menu again; no keyboard role needed. -->
		<div
			class="annot-menu"
			class:menu-suppressed={$overviewOpen || $moreMenuHeldClosed}
			role="presentation"
			onmouseenter={() => releaseMoreMenuHold()}
		>
			<button
				type="button"
				class="annot-hamburger"
				aria-haspopup="menu"
				aria-label="More tools (M)"
				title="More — Overview, Capture, Print, Source, Edit"
			>☰ (M)</button>
			<div class="annot-drop" role="menu" aria-label="More tools">
				{@render overviewBtn?.()}
				<div class="menu-sep" role="separator"></div>
				{@render captureItem?.()}
				{@render printBtn?.()}
				<div class="menu-sep" role="separator"></div>
				{@render sourceItem?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── The top-centre tool bar ────────────────────────────────────────────────────
	   One horizontal pill, flush to the WINDOW's top edge and centred: PIN, PRESENT, the
	   ANNOTATE / ADJUST word toggles (+ SAVE), DISPLAY, and the ☰ menu. Its parent
	   (SlideDeck's .overlay) is position:fixed at z-index 50 — above the ink surface (40) —
	   so the bar always out-ranks an armed pen, which is what keeps the ANNOTATE toggle
	   reachable to put the pen back down. */
	.annot-tools {
		position: absolute;
		top: 0;
		left: 50%;
		/* Auto-hide: tucked up so only a peek strip shows at the top edge. A hover on that strip
		   — or keyboard focus reaching a button inside — slides the whole bar down. -72% leaves
		   ~28% peeking; nudge toward -85% to hide more, -60% to show more. */
		transform: translateX(-50%) translateY(-80%);
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

	/* Bring the tucked bar fully into view on hover, or when a click/tab moves focus into it.
	   `.pinned` is the sticky latch (see stores/chromePin): the bar stays fully out until the
	   speaker unpins, without needing continuous hover/focus. */
	.annot-tools:hover,
	.annot-tools:focus-within,
	.annot-tools.pinned,
	.annot-tools.armed {
		transform: translateX(-50%) translateY(0);
	}
	/* Keyboard arm (Alt+.) — soft halo so the speaker sees chrome is "live" for mnemonics. */
	.annot-tools.armed {
		box-shadow:
			0 3px 14px rgba(0, 0, 0, 0.4),
			0 0 0 2px color-mix(in srgb, var(--annot-toggle-fg, #F0A33E) 55%, transparent);
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
	/* ☰ menu-row mnemonics (O/C/P/S/E) keep underlines; bar labels use "NAME (K)" form. */
	.annot-drop :global(.tool-mn) {
		text-decoration: underline;
		text-underline-offset: 0.18em;
		text-decoration-thickness: 1px;
	}
	/* Key chip at the end of "☰ (M)" — slightly quieter than the glyph. */
	.annot-hamburger {
		gap: 0.2em;
		letter-spacing: 0.02em;
		font-weight: bold;
		white-space: nowrap;
	}

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
		/* A word button, like .annot-tab: its label ("PRESENT (P)") must stay on one line —
		   a bar squeezed narrow would otherwise wrap "(P)" under the word. */
		white-space: nowrap;
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

	/* The dropdown hangs under the ☰, revealed on hover/focus of the menu. `right: 0` aligns
	   its right edge to the hamburger and it opens LEFTWARD. `top: 100%` seats it on the bar's
	   bottom edge with no dead gap, so the pointer can move from ☰ into the panel without
	   dropping hover. */
	.annot-drop {
		position: absolute;
		top: 100%;
		right: 0;
		z-index: 1;
		min-width: 13.5em;
		display: flex;
		flex-direction: column;
		padding: 0.35em;
		gap: 0.1em;
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
	/* OVERVIEW is open — keep the drop closed even if the pointer is still over ☰. */
	.annot-menu.menu-suppressed .annot-drop,
	.annot-menu.menu-suppressed:hover .annot-drop,
	.annot-menu.menu-suppressed:focus-within .annot-drop {
		opacity: 0;
		pointer-events: none;
		transform: translateY(-8px);
	}

	/* Group dividers: navigate | export | source. */
	.menu-sep {
		height: 1px;
		margin: 0.3em 0.45em;
		background: var(--annot-bar-edge, rgba(255, 255, 255, 0.16));
		flex: none;
	}

	/* Dropdown rows: icon · label (mnemonic underline) · trail (kbd / chevron / external).
	   CAPTURE may wrap the button in `.capture-btn` for the refusal tip. */
	.annot-drop :global(.capture-btn) {
		display: block;
		width: 100%;
		position: relative;
	}
	.annot-drop :global(.annot-tool) {
		display: flex;
		align-items: center;
		gap: 0.55em;
		width: 100%;
		text-align: left;
		cursor: pointer;
		font: inherit;
		font-weight: bold;
		letter-spacing: 0.04em;
		padding: 0.42em 0.65em;
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
	.annot-drop :global(.tool-ico) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.15em;
		height: 1.15em;
		flex: none;
		opacity: 0.9;
	}
	.annot-drop :global(.tool-ico svg) {
		display: block;
		width: 1em;
		height: 1em;
	}
	.annot-drop :global(.tool-label) {
		flex: 1 1 auto;
		min-width: 0;
	}

	.annot-drop :global(.tool-kbd) {
		flex: none;
		font: inherit;
		font-size: 0.78em;
		font-weight: 600;
		letter-spacing: 0.04em;
		opacity: 0.55;
		border: 1px solid var(--annot-bar-edge, rgba(255, 255, 255, 0.28));
		border-radius: 3px;
		padding: 0.05em 0.35em;
		line-height: 1.3;
	}
	.annot-drop :global(.tool-trail) {
		flex: none;
		opacity: 0.5;
		font-size: 0.85em;
		line-height: 1;
	}
	.annot-drop :global(.tool-ext) {
		display: flex;
		align-items: center;
		opacity: 0.55;
	}
	.annot-drop :global(.tool-ext svg) {
		display: block;
		width: 0.95em;
		height: 0.95em;
	}

	/* PRINT nested submenu — left of the row, part of the ☰ panel. */
	.annot-drop :global(.print-flyout) {
		position: relative;
		width: 100%;
	}
	.annot-drop :global(.print-sub) {
		position: absolute;
		right: calc(100% + 0.2em);
		top: -0.35em;
		z-index: 5;
		display: flex;
		flex-direction: column;
		min-width: 13.5em;
		padding: 0.35em;
		gap: 0.1em;
		border: 1px solid var(--annot-bar-edge, rgba(255, 255, 255, 0.16));
		border-radius: 10px;
		background: var(--annot-toggle-bg, rgba(20, 22, 26, 0.98));
		box-shadow: 0 8px 26px rgba(0, 0, 0, 0.55);
	}
	/* Invisible bridge so the pointer can travel from PRINT into the submenu
	   without dropping mouseleave on the flyout. */
	.annot-drop :global(.print-sub::after) {
		content: '';
		position: absolute;
		left: 100%;
		top: 0;
		width: 0.45em;
		height: 100%;
	}
	.annot-drop :global(.print-sub button) {
		display: flex;
		align-items: center;
		gap: 0.6em;
		width: 100%;
		text-align: left;
		cursor: pointer;
		padding: 0.42em 0.65em;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: var(--annot-toggle-fg, #F0A33E);
		font: inherit;
		font-weight: bold;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}
	.annot-drop :global(.print-sub button:hover) {
		background: var(--annot-bar-hover, rgba(255, 255, 255, 0.1));
	}
	.annot-drop :global(.print-sub-label) {
		flex: 1 1 auto;
	}
	.annot-drop :global(.print-sub-kbd) {
		flex: none;
		font: inherit;
		font-size: 0.78em;
		font-weight: 600;
		opacity: 0.55;
		border: 1px solid var(--annot-bar-edge, rgba(255, 255, 255, 0.28));
		border-radius: 3px;
		padding: 0.05em 0.4em;
		line-height: 1.3;
		min-width: 1.2em;
		text-align: center;
	}
	.annot-drop :global(.print-menu-sep) {
		height: 1px;
		margin: 0.3em 0.45em;
		background: var(--annot-bar-edge, rgba(255, 255, 255, 0.16));
		flex: none;
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

	/* PIN is icon-only: square-ish pill so the pushpin sits centred without word-button padding. */
	.pin-tab {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25em 0.45em;
		min-width: 1.7em;
	}
	.pin-icon {
		display: block;
		width: 1.15em;
		height: 1.15em;
	}
</style>
