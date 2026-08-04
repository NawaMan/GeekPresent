<!--
  References — Slide Pages — full-page templates and full-canvas slides.
-->
<script lang="ts">
	import SlideDeck from '$lib/components/SlideDeck.svelte';
	import { pages } from './pages';
	import { setPages } from '$lib/presentation';
	import favicon from '$lib/assets/codecat-zoom.png';

	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import {
		isHubReturn,
		parentReturnHref,
		rememberReturnStack,
		resolveReturnStack
	} from '$lib/utils/appendixCore';

	setPages(pages);

	// Must match SlideDeck's deckName for this folder: references-slide-pages
	const DECK_ID = 'references-slide-pages';

	$: if (browser) {
		rememberReturnStack($page.url.searchParams, DECK_ID, sessionStorage, pages);
	}

	function articleHref(): string {
		if (!browser) return '../title.html';
		// Article chrome jumps all the way to the hub card (oldest external return).
		const stack = resolveReturnStack($page.url.searchParams, DECK_ID, sessionStorage, pages);
		const hub = stack.find((s) => isHubReturn(s, pages));
		return parentReturnHref(hub) ?? '../title.html';
	}

	$: backHref = articleHref();
	$: backText =
		backHref.endsWith('slide-pages.html')
			? '← Slide Pages'
			: '← Component References';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SlideDeck
	{pages}
	title="References — Slide Pages"
	description="GeekPresent full-page shapes: TitlePage, ContentPage, EmptyPage, Appendix, WebPage, VideoPage, and TextPage."
	width={1920}
	height={1080}
	fill
	article
	articleText={backText}
	articleHref={backHref}
	fadeChrome
>
	<slot />
</SlideDeck>
