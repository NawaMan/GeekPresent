<!--
  References — Features — component reference deck.
  Fresh reference material (not ported from the product-tour slides).
-->
<script lang="ts">
	import SlideDeck    from '$lib/components/SlideDeck.svelte';
	import { pages }    from './pages';
	import { setPages } from '$lib/presentation';
	import favicon from '$lib/assets/codecat-zoom.png';

	setPages(pages);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SlideDeck
	{pages}
	title="References — Features"
	description="GeekPresent deck features: Annotate, Spotlight, Capture, Kiosk, Overview, Search, Handout, State, Progress."
	width={1920}
	height={1080}
	fill
	article
	articleText="← Component References"
	articleHref="../title.html"
	fadeChrome
	annotate
	capture
	kiosk
>
	<slot />
</SlideDeck>
