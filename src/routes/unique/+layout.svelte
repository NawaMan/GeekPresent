<!--
  The "What Makes It Unique" presentation — landscape 1920x1080.

  A standalone deck (sibling of slides/). The canvas + scaling machinery lives in
  <SlideDeck>; this layout just picks the dimension and publishes the slide list.
  Mirrors src/routes/slides/+layout.svelte.
-->
<script lang="ts">
	import SlideDeck    from '$lib/components/SlideDeck.svelte';
	import { pages }    from './pages';
	import { setPages } from '$lib/presentation';

	// Presentation-level favicon for this deck — overrides the site default
	// (static/favicon.png) on every /unique/* page. Reuses the main deck's icon.
	import favicon from '$lib/assets/codecat-zoom.png';

	// Publish this presentation's slide list to its slides (nav + ToC read it).
	setPages(pages);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SlideDeck {pages} title="What Makes GeekPresent Unique" width={1920} height={1080} fill>
	<slot />
</SlideDeck>
