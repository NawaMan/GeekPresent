<!--
  SlideDeck — the reusable shell for a Presentation artifact.

  A Presentation is many discrete, fixed-size slide pages. This component is the
  whole canvas: it draws a fixed width x height box, scales that box to fit the
  window (preserving aspect ratio), and mounts the slide chrome (Table of
  Contents, size-mode toggle, copyright). The slides themselves flow in via the
  default <slot/>.

  Orientation lives HERE, set by a deck's +layout.svelte through the width/height
  props — never a runtime toggle. A landscape deck wraps its <slot/> in
  <SlideDeck width={1920} height={1080}>; a portrait deck (e.g. a YouTube Short)
  uses <SlideDeck width={1080} height={1920}>. Each slide's layout is authored
  for its deck's fixed dimension, so a deck is landscape OR portrait, full stop.

  Note: the deck's +layout.svelte must still call setPages(pages) itself — the
  slotted slide content is lexically owned by the layout, so it reads the
  layout's context, not this component's. `pages` is passed here only for the
  Table of Contents rendered inside this shell.
-->
<script lang="ts">
	import '$lib/styles/global.css';
	import '$lib/styles/note.css';
	import '$lib/styles/presentation.css';
	import '$lib/styles/tooltip.css';

	import Copyright      from '$lib/components/Copyright.svelte';
	import TableOfContent from '$lib/components/TableOfContent.svelte';
	import SizeMode       from '$lib/components/SizeMode.svelte';

	import { browser }    from '$app/environment';
	import { page }       from '$app/stores';
	import { onMount }    from 'svelte';
	import { scaleMode }  from '$lib/stores/scaleMode';
	import { documentTitle } from '$lib/utils/navigate';
	import type { Page }  from '$lib/utils/navigate';

	/** This deck's slide list — for the Table of Contents rendered in the shell. */
	export let pages: Array<Page> = [];
	/** Presentation-level document title (the deck name) — the <title> counterpart
	    to the presentation favicon a +layout.svelte sets. Composed with the current
	    slide's own `title` into the browser-tab <title>; falls back to the site
	    default (SITE_TITLE) when left undefined. */
	export let title: string | undefined = undefined;
	/** Canvas size in px. Landscape: 1920x1080. Portrait (Tall): 1080x1920. */
	export let width  = 1920;
	export let height = 1080;
	/* Base font-size lever: every em-based size in the reused components scales
	   from here in one place. The landscape canvas grew x1.5 from the original
	   1280x720, hence 1.5em; a narrower portrait canvas wants a smaller base. */
	export let baseFontSize = '1.5em';
	/* Exact-fit mode. When false (the landscape default) the content box keeps its
	   legacy fudge (+20 width / -30 height / -45 scale offset) — values hand-tuned
	   for the 1920 canvas, which leave a small margin. That margin is a tiny
	   fraction at 1920 but a visible gap on the much smaller portrait render, so a
	   Tall opts into fill=true: the content box IS the canvas (border-box, no
	   fudge), so it shares the frame's aspect exactly and fills it edge to edge. */
	export let fill = false;

	let container: HTMLElement;
	let content:   HTMLElement;

	let   isScaled    = $scaleMode;
	let   initialized = false;
	$: aspectRatio = width / height;

	// Page-level favicon. The shell renders at SSR (only the slide *content* below
	// is gated on onMount), so emitting the current slide's favicon HERE puts it in
	// the prerendered HTML — no flicker, works without JS. Last <link rel="icon">
	// wins, so a slide's favicon (declared in its pages.ts entry) overrides both the
	// site default (app.html) and any presentation favicon set in the deck's layout.
	$: currentSlide   = $page.url.pathname.replace(/\/+$/, '').split('/').pop();
	$: currentFavicon = pages.find((p) => p.path === currentSlide)?.favicon;
	// Page-level document title, same cascade idea as the favicon above but emitted
	// as ONE <title> (the browser uses the FIRST <title>, so it can't stack the way
	// the favicon links do): the current slide's own `title` from pages.ts, composed
	// with this deck's `title` prop into "Slide — Deck". See documentTitle.
	$: currentTitle   = pages.find((p) => p.path === currentSlide)?.title;
	$: docTitle       = documentTitle(currentTitle, title);

	function adjustSize() {
		if (!container)
			return;

		if (!isScaled) {
			container.style.width   = `${width}px`;
			container.style.height  = `${height}px`;
			content.style.transform = `scale(1)`;
			content.style.transformOrigin = 'top left';
			return;
		}

		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;
		const windowRatio = windowWidth / windowHeight;

		if (windowRatio > aspectRatio) {
			container.style.height = 'calc(100vh - 10px)';
			container.style.width = `${Math.round(container.offsetHeight*aspectRatio)}px`;
		} else {
			container.style.width = 'calc(100vw - 10px)';
			container.style.height = `${Math.round(container.offsetWidth / aspectRatio)}px`;
		}
		// fill: content box == full canvas (same aspect as the frame), so fit it to
		// the container's INNER box (client* excludes the 1.5px border) by the
		// binding axis. The two ratios are equal up to rounding; Math.min guarantees
		// the box never overflows the border on either axis. Result: edge-to-edge.
		// Legacy (non-fill): the -45 compensates for the +20/padding width fudge.
		let scale = fill
			? Math.min(container.clientWidth / width, container.clientHeight / height)
			: (container.offsetWidth - 45) / width;
		content.style.transform = `scale(${scale})`;
		content.style.transformOrigin = 'top left';
	}

	onMount(() => {
		if (browser) {
			scaleMode.subscribe(value => {
				isScaled = value;

				window.removeEventListener('resize', adjustSize);
				document.body.classList.add('rendering');
				adjustSize();
				document.body.classList.remove('rendering');
				if (isScaled) {
					window.addEventListener('resize', adjustSize);
				}
			});

			initialized = true;
		}
	});

</script>

<svelte:head>
	<title>{docTitle}</title>
	{#if currentFavicon}
		<link rel="icon" href={currentFavicon} />
	{/if}
</svelte:head>

<div
	class="container"
	class:scale-mode={isScaled}
	style="--canvas-w:{width}px; --canvas-h:{height}px; --aspect:{aspectRatio}; --base-font:{baseFontSize};"
	bind:this={container}
>
	<div class="content" class:fill class:ready={initialized} bind:this={content}>
		{#if initialized}
		<slot />
		<TableOfContent {pages} />
		<SizeMode  />
		<Copyright />
		{/if}
	</div>
</div>

<style>
	.container {
		width: var(--canvas-w);
		height: var(--canvas-h);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		background: var(--surface-bg, #181818);
		border: 1.5px solid var(--frame-border, #CCCCCC);
		position: relative;
	}
	.container.scale-mode {
		/* Fit the frame to the window by ASPECT, in pure CSS, so first paint is
		   already the right shape — before onMount/adjustSize() runs. Without this
		   the frame starts at width:100% (full window width) and then JS snaps it
		   to the fitted size: a barely-visible nudge on a ~landscape window, but a
		   jarring wide->narrow blink on a portrait (Tall) canvas. adjustSize() still
		   sets equivalent px inline (and tracks resize); this just owns first paint.
		   Both axes are set EXPLICITLY (not width:auto + aspect-ratio) so the inner
		   content's min-width can't inflate the frame back to canvas width. --aspect
		   is canvas w/h as a unitless number, so length/number is valid in calc(). */
		width:  min(calc(100vw - 10px), calc((100vh - 10px) * var(--aspect)));
		height: min(calc(100vh - 10px), calc((100vw - 10px) / var(--aspect)));
	}
	.content {
		/* Base font-size lever (see baseFontSize prop): every em-based size in the
		   reused components scales from here in one place, instead of editing each
		   component. px values are scaled individually; %/vw/vh already track the
		   canvas. */
		font-size: var(--base-font);
		width: calc(var(--canvas-w) + 20px);
		height: calc(var(--canvas-h) - 30px);
		min-width: calc(var(--canvas-w) - 30px);
		min-height: calc(var(--canvas-h) - 30px);
		overflow: visible;
		padding: 15px;
		margin: 0px;
		display: flex;
		justify-content: center;
		align-items: center;
		color: var(--surface-fg, #C0F1FF);
		background: var(--surface-bg, #181818);
		font-family: 'Noto Sans', 'Cormorant Garamond', serif;
	}
	/* Keep the content OUT OF LAYOUT until JS has applied the scale transform (the
	   `ready` class flips on at onMount, right after the first adjustSize()). At its
	   native px size (e.g. 1080x1920 for a Tall) the unscaled box overflows the
	   fitted frame; with visibility:hidden it still triggers scrollbars and a
	   wide->narrow "blink" on navigation. display:none removes it from layout
	   entirely — adjustSize() only measures the CONTAINER, so this is safe. The
	   container stays visible (correctly sized in CSS), so the gap shows an empty
	   fitted frame, never an overflowing box. */
	.content:not(.ready) {
		display: none;
	}
	.content.fill {
		/* Exact-fit: the box IS the full canvas (padding folded in via border-box),
		   so it fills the frame edge to edge on BOTH axes with no fudge — no aspect
		   mismatch, no reserved bottom lane. The slide chrome (nav / copyright) would
		   otherwise hang past the bottom border at its default bottom:-10, so it is
		   pulled back inside below. */
		box-sizing: border-box;
		width: var(--canvas-w);
		height: var(--canvas-h);
		min-width: var(--canvas-w);
		min-height: var(--canvas-h);
	}
	/* With a full-canvas fill box the chrome that normally hangs at bottom:-10 (in
	   the content's own unscaled coords) would spill past the bottom border. Nudge
	   it just inside, so it floats over the slide's bottom corners. Scoped to .fill,
	   so non-fill landscape and the fixed text-mode nav are left untouched. */
	.content.fill :global(.nav),
	.content.fill :global(.copyright) {
		bottom: 20px;
	}

	.container:not(.scale-mode) {
		/** Bookmark : Here is where we control how much the slide shift up. */
		transform: translateY(-120px);
	}

</style>
