<!--
  Your deck — landscape 1920x1080.

  This is the whole deck shell: <SlideDeck> owns the canvas, scaling, navigation,
  ToC and SEO, so this file only picks the frame and publishes the slide list.
  Rename the title/description below — they are the SEO title and the ToC heading.

  Common knobs (all optional, all documented in the sample decks):
    baseFontSize  the one typography lever — raise it for a portrait/mobile frame
    layout        offer LAYOUT mode (drag Blocks to exact pixels, then SAVE)
    annotate      give the speaker a pen to draw over any slide
    capture       let a slide be exported as a PNG
    fadeChrome    hide the nav until the pointer moves
-->
<script lang="ts">
	import SlideDeck    from '$lib/components/SlideDeck.svelte';
	import { pages }    from './pages';
	import { setPages } from '$lib/presentation';

	// Publish this deck's slide list to its slides (nav + ToC read it). Must be set
	// here, not in SlideDeck: the slotted slides read THIS layout's context.
	setPages(pages);
</script>

<SlideDeck
	{pages}
	title="My Deck"
	description="A presentation built with GeekPresent."
	width={1920}
	height={1080}
	fill
>
	<slot />
</SlideDeck>
