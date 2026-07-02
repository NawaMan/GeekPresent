<!--
  The "Animation" presentation — landscape 1920x1080.

  A standalone deck (sibling of slides/), gathering GeekPresent's in-slide
  animation demos in one place: the AnimationBar/Scene playback primitives, the
  SpriteStudio authoring wrapper, the animated Draw family, and scroll-driven
  animation. The canvas + scaling machinery lives in <SlideDeck>; this layout
  just picks the dimension and publishes the slide list. Mirrors
  src/routes/slides/+layout.svelte.
-->
<script lang="ts">
	import SlideDeck    from '$lib/components/SlideDeck.svelte';
	import { pages }    from './pages';
	import { setPages } from '$lib/presentation';

	// Presentation-level favicon for the whole deck — overrides the site default on
	// every /animation/* page. Reuses the main deck's icon. The layout's head
	// renders at SSR (only slide content is onMount-gated), so it lands in the
	// prerendered HTML.
	import favicon from '$lib/assets/codecat-zoom.png';

	// Publish this presentation's slide list to its slides (nav + ToC read it).
	setPages(pages);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SlideDeck
	{pages}
	title="Animation"
	description="GeekPresent's in-slide animation demos — the AnimationBar and AnimationScene playback primitives, the SpriteStudio authoring wrapper, the animated Draw family (keyframed geometry, self-draw reveal, flying sprites), and scroll-driven animation."
	width={1920}
	height={1080}
	fill
	article
	articleText="← Back to home"
	articleHref="../"
>
	<slot />
</SlideDeck>
