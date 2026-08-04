<!--
  References — Media — component reference deck.
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
	title="References — Media"
	description="GeekPresent media: YouTube, WebSite, WebPage, Video, VideoPage."
	width={1920}
	height={1080}
	fill
	article
	articleText="← Component References"
	articleHref="../title.html"
	fadeChrome
>
	<slot />
</SlideDeck>
