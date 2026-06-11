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
	import { onMount }    from 'svelte';
	import { scaleMode }  from '$lib/stores/scaleMode';
	import type { Page }  from '$lib/utils/navigate';

	/** This deck's slide list — for the Table of Contents rendered in the shell. */
	export let pages: Array<Page> = [];
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
		// fill: content box == canvas, so scale straight to the container's INNER
		// width (clientWidth excludes the 1.5px border) and it fills the area inside
		// the frame on both axes — keeping the white border line visible.
		// Legacy: the -45 compensates for the +20/padding fudge.
		let scale = fill
			? container.clientWidth / width
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

<div
	class="container"
	class:scale-mode={isScaled}
	style="--canvas-w:{width}px; --canvas-h:{height}px; --base-font:{baseFontSize};"
	bind:this={container}
>
	<div class="content" class:fill bind:this={content}>
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
		background: #181818;
		border: 1.5px solid #ccc;
		position: relative;
	}
	.container.scale-mode {
		width: 100%;
		height: 100%;
		max-width: 100vw;
		max-height: 100vh;
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
		color: #C0F1FF;
		background: #181818;
		font-family: 'Noto Sans', 'Cormorant Garamond', serif;
	}
	.content.fill {
		/* Exact-fit width: the box IS the canvas width (padding folded in via
		   border-box), so it fills inside the left/right border with no fudge.
		   Height keeps the same -30 bottom slack as landscape so the slide chrome
		   (nav bar / copyright, which hang at bottom:-10) sits INSIDE the bottom
		   border instead of spilling over it. */
		box-sizing: border-box;
		width: var(--canvas-w);
		height: calc(var(--canvas-h) - 30px);
		min-width: var(--canvas-w);
		min-height: calc(var(--canvas-h) - 30px);
	}

	.container:not(.scale-mode) {
		/** Bookmark : Here is where we control how much the slide shift up. */
		transform: translateY(-120px);
	}

</style>
