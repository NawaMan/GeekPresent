<!--
  Component References — component reference deck.
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
	title="Component References"
	description="Catalog of GeekPresent components by group — shell, layout, content, code, media, draw, data, and deck features."
	width={1920}
	height={1080}
	fill
	article
	articleText="← Back to home"
	articleHref="../"
	fadeChrome
>
	<slot />
</SlideDeck>
