<!--
  Text artifact shell.

  A Text is the second kind of NawaPresent artifact: ONE long page, a fixed
  1920px wide, whose height grows with the content that flows down it. It is
  authored by hand (in +page.svelte) and reuses the same $lib components as the
  slides — it is NOT generated from a presentation.

  Layout: an own scroll container sized to the viewport holds the 1920px column.
  This keeps the document clear of the global slide-centering (which would push a
  tall page's start to its vertical middle) and needs no JS — the page opens at
  the top and scrolls down, or sideways when the window is narrower than 1920
  (FIXED mode). To make another Text, copy this whole folder.
-->
<script lang="ts">
	import '$lib/styles/global.css';
	import '$lib/styles/tooltip.css';

	import { setMode }   from '$lib/presentation';
	import NavigationBar from '$lib/components/NavigationBar.svelte';

	// Publish this artifact's mode so reused components can adapt (e.g. the slide
	// nav bar becomes a single TOP control that scrolls this container up).
	setMode('text');
</script>

<div class="text-scroll" data-text-scroll>
	<div class="text-page">
		<slot />
	</div>
</div>

<NavigationBar />

<style>
	.text-scroll {
		width: 100vw;
		height: 100vh;
		overflow: auto;
		background: #181818;
	}

	.text-page {
		/* Base font-size lever: column widened x1.5 (1280 -> 1920), so the
		   em-based component/typography sizes scale x1.5 from here. */
		font-size: 1.5em;
		width: 1920px;
		min-height: 100%;
		margin: 0 auto;
		padding: 96px 84px;
		box-sizing: border-box;
		color: #c0f1ff;
		background: #181818;
		font-family: 'Noto Sans', 'Cormorant Garamond', serif;
	}

	/* Base typography for the authored content. Slotted markup isn't scoped to
	   this component, so reach it with :global under .text-page. A specific Text
	   artifact can override any of this in its own +page.svelte. */
	.text-page :global(h1) {
		font-size: 3em;
		margin: 0 0 0.2em;
		font-family: 'Playfair Display Bold', 'Cormorant Garamond', serif;
	}
	.text-page :global(h2) {
		font-size: 1.9em;
		margin: 1.6em 0 0.4em;
		font-family: 'Playfair Display Bold', 'Cormorant Garamond', serif;
	}
	.text-page :global(p),
	.text-page :global(li) {
		font-size: 1.25em;
		line-height: 1.6em;
	}
	.text-page :global(p) {
		margin: 0.8em 0;
		text-align: justify;
		text-justify: inter-word;
	}
	.text-page :global(a) {
		color: #7fd9ff;
	}
</style>
