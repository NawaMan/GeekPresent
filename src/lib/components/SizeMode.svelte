<!--
  SizeMode — the display-mode (zoom) control.

  A TOC-style dropdown that switches between FITTED (fit to window) and SCALED
  (an exact zoom factor). The menu offers the same factor through two lenses —
  a SCALE % group and a RESOLUTION group — plus a custom %. It renders two ways:
  standalone it pins to the window's top-right corner; with `inline` it folds into
  <SlideToolbar>'s top bar as the DISPLAY segment. Either way it stays reachable while
  a SCALED slide is panned/zoomed. Reads/writes the displayMode + displayFactor stores.
-->
<script lang="ts">
	import CtrlBtn from './CtrlBtn.svelte';
	import { displayMode, displayFactor, clampFactor, MIN_FACTOR, MAX_FACTOR } from '$lib/stores/displayMode';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';

	/** This deck's canvas, so resolutions/dimensions are computed correctly
	    (a portrait deck reads its own sizes; the friendly names assume 1920x1080). */
	export let width  = 1920;
	export let height = 1080;
	/** Sit in a flex row (folded into SlideToolbar) rather than pinning to the window's
	    top-right corner. The menu still drops beneath the control either way. */
	export let inline = false;

	let open = false;
	let rootRef: HTMLElement;
	let customPct = '';

	// Scale presets (as factors). Dimensions are always computed from THIS canvas;
	// the friendly name shows only when it matches the standard 1920x1080 canvas.
	const SCALE_PRESETS = [2, 1.5, 1.25, 1, 0.75, 0.5, 0.25];
	// Well-known 16:9 output resolutions, expressed as factors of 1920x1080.
	const RES_PRESETS = [
		{ factor: 1600 / 1920, name: 'HD+'  },
		{ factor: 1280 / 1920, name: '720p' },
		{ factor:  960 / 1920, name: 'qHD'  },
		{ factor:  854 / 1920, name: '480p' },
		{ factor:  640 / 1920, name: 'nHD'  },
	];
	const isStdLandscape = width === 1920 && height === 1080;

	const pct = (f: number) => `${Math.round(f * 100)}%`;
	const dim = (f: number) => `${Math.round(width * f)}×${Math.round(height * f)}`;
	const near = (a: number, b: number) => Math.abs(a - b) < 0.005;
	const knownName = (f: number) => (near(f, 2) ? '4K' : near(f, 1) ? '1:1' : '');

	$: isFitted = $displayMode === 'FITTED';
	$: factor   = $displayFactor;
	$: label    = isFitted ? 'FITTED' : pct(factor);

	function chooseFitted() {
		displayMode.set('FITTED');
		open = false;
	}
	function chooseFactor(f: number) {
		displayFactor.set(clampFactor(f));
		displayMode.set('SCALED');
		open = false;
	}
	function applyCustom() {
		const v = parseFloat(customPct);
		if (Number.isFinite(v) && v > 0) chooseFactor(v / 100);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
	function onClickOutside(e: MouseEvent) {
		if (rootRef && !rootRef.contains(e.target as Node)) open = false;
	}
	onMount(() => {
		if (browser) {
			window.addEventListener('keydown', onKeydown);
			document.addEventListener('click', onClickOutside);
		}
	});
	onDestroy(() => {
		if (browser) {
			window.removeEventListener('keydown', onKeydown);
			document.removeEventListener('click', onClickOutside);
		}
	});
</script>

<div class="mode gp-chrome no-print" class:expanded={open} class:inline bind:this={rootRef}>
	<!-- The ADJUST toggle used to live here; it moved into SlideDeck's content layer
	     so slide blocks can render on top of it (see SlideDeck `.layout-ctrl`). -->
	<CtrlBtn chrome text={label} hoverText={label} on:click={() => (open = !open)} isSelected={open} />

	{#if open}
	<div class="menu">
		<button type="button" class="row" class:current={isFitted} on:click={chooseFitted}>
			<span class="k">FITTED</span><span class="v">fit to window</span>
		</button>

		<div class="sep">SCALE</div>
		{#each SCALE_PRESETS as f}
			<button type="button" class="row" class:current={!isFitted && near(factor, f)} on:click={() => chooseFactor(f)}>
				<span class="k">{pct(f)}</span>
				<span class="v">{dim(f)}{#if isStdLandscape && knownName(f)} · {knownName(f)}{/if}</span>
			</button>
		{/each}

		{#if isStdLandscape}
		<div class="sep">RESOLUTION</div>
		{#each RES_PRESETS as r}
			<button type="button" class="row" class:current={!isFitted && near(factor, r.factor)} on:click={() => chooseFactor(r.factor)}>
				<span class="k">{dim(r.factor)}</span><span class="v">{pct(r.factor)} · {r.name}</span>
			</button>
		{/each}
		{/if}

		<div class="sep">CUSTOM</div>
		<form class="row custom" on:submit|preventDefault={applyCustom}>
			<input
				type="number"
				min={Math.round(MIN_FACTOR * 100)}
				max={Math.round(MAX_FACTOR * 100)}
				step="1"
				placeholder="%"
				bind:value={customPct}
			/>
			<button type="submit">Set</button>
		</form>
	</div>
	{/if}
</div>

<style>
	.mode {
		/* DISPLAY is a WINDOW control: it lives in the screen-fixed overlay and pins to
		   the VIEWPORT's top-right corner, a fixed inset from the window edge, so it is
		   always in reach however the slide is scaled or panned. (It used to anchor to
		   the slide FRAME's corner via --ctrl-top/--ctrl-right; SlideDeck no longer sets
		   those, so a simple fixed inset is the whole story now.) */
		position: absolute;
		top: 14px;
		right: 16px;
		margin-right: 0;
		/* Sized independently of the slide's fit transform (it's not on the slide), and
		   a touch larger than the in-slide chrome so this always-present control reads
		   clearly. 1em is the overlay's inherited --base-font. */
		font-size: 1.2em;
	}

	/* Folded into SlideToolbar: drop the fixed corner inset and join the flex row instead.
	   position:relative (not static) so the dropdown `.menu` still anchors to THIS control
	   rather than to the toolbar's right edge, and font-size:inherit so it matches the bar. */
	.mode.inline {
		position: relative;
		top: auto;
		right: auto;
		margin-right: 0;
		font-size: inherit;
		display: flex;
		align-items: center;
	}

	/* Dress DISPLAY like the bar's word toggles when folded in — CtrlBtn's default `chrome`
	   look is grey and recessed, but here it sits among PRESENT / ANNOTATE / ADJUST and must
	   read as one of them: amber text, transparent, muted at rest, a filled amber pill while
	   its menu is open (matching `.annot-tab.on`). :global reaches CtrlBtn's own <button>; the
	   `.mode.inline` prefix keeps it from touching the corner (standalone) DISPLAY. */
	.mode.inline :global(button.chrome) {
		font-size: inherit;
		font-weight: bold;
		letter-spacing: 0.04em;
		padding: 0.25em 0.7em;
		margin: 0.2em 0.1em;
		border-radius: 999px;
		background: transparent;
		color: var(--annot-toggle-fg, #F0A33E);
		opacity: 0.62;
		transition: opacity 120ms ease, background 120ms ease;
	}
	.mode.inline :global(button.chrome:hover:not(:disabled)) {
		opacity: 1;
		color: var(--annot-toggle-fg, #F0A33E);
		background: var(--annot-bar-hover, rgba(255, 255, 255, 0.1));
		border-color: transparent;
	}
	.mode.inline :global(button.chrome.selected) {
		opacity: 1;
		background: var(--annot-pen, #F0A33E);
		color: var(--annot-bar-on-fg, #1A1206);
		border-color: transparent;
	}

	.menu {
		position: absolute;
		top: 100%;
		right: 0;
		min-width: 16.8em;   /* ~40% wider than the former 12em, so the two columns breathe */
		max-height: 80vh;
		overflow-y: auto;
		border: 1.5px solid var(--toc-border, #CCCCCC);
		border-radius: 3px;
		background-color: var(--toc-bg, #EEEEEE);
		color: var(--toc-fg, #111111);
		font-size: 0.7em;
	}
	.menu .sep {
		padding: 0.3em 0.6em 0.1em;
		font-weight: bold;
		opacity: 0.55;
		letter-spacing: 0.05em;
	}
	.menu .row {
		display: flex;
		justify-content: space-between;
		gap: 1.2em;
		width: 100%;
		padding: 0.25em 0.6em;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	.menu .row:hover {
		background-color: var(--toc-row-hover-bg, #DDDDDD);
	}
	.menu .row.current {
		background-color: var(--ctrl-selected-bg, #00B356);
		color: var(--on-accent, #FFFFFF);
	}
	.menu .row .v {
		opacity: 0.7;
	}
	.menu .row.current .v {
		opacity: 0.9;
	}
	.menu .custom {
		/* The other rows use space-between (label left, value right); the CUSTOM row
		   is an input + Set button, so keep them grouped at the left instead — else
		   Set is pushed to the menu's right edge and clipped. */
		justify-content: flex-start;
		gap: 0.4em;
	}
	.menu .custom input {
		width: 4em;
		font: inherit;
	}
	.menu .custom button {
		cursor: pointer;
		font: inherit;
	}
</style>
