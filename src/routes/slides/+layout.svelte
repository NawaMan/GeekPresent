<!--
  The main presentation deck — landscape 1920x1080.

  All the canvas + scaling machinery lives in <SlideDeck>; this layout just picks
  the dimension and publishes the slide list. To make a portrait deck (e.g. a
  YouTube Short), copy this file and pass a portrait width/height instead — see
  src/routes/tall/+layout.svelte.
-->
<script lang="ts">
	import SlideDeck    from '$lib/components/SlideDeck.svelte';
	import { pages }    from './pages';
	import { setPages } from '$lib/presentation';

	// Publish this presentation's slide list to its slides (nav + ToC read it).
	// Must be set here, not in SlideDeck: the slotted slides read THIS layout's
	// context, not the shell's.
	setPages(pages);
</script>

<SlideDeck {pages} width={1920} height={1080}>
	<slot />
</SlideDeck>
