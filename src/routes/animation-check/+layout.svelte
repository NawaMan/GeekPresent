<!--
  "Draw & Block, step by step" — a standalone landscape 1920x1080 deck that
  builds one idea up a slide at a time: FIRST make an object editable (a Block,
  a Shape, then both), THEN make it animated (a Block, a Shape, then both). The
  canvas + scaling machinery lives in <SlideDeck>; this layout just picks the
  dimensions and publishes the slide list. Mirrors src/routes/animation/.
-->
<script lang="ts">
	import SlideDeck    from '$lib/components/SlideDeck.svelte';
	import { pages }    from './pages';
	import { setPages } from '$lib/presentation';
	import favicon      from '$lib/assets/codecat-zoom.png';

	setPages(pages);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SlideDeck
	{pages}
	title="Draw & Block"
	description="A step-by-step deck: make an object editable (Block, Shape, then both under one LAYOUT gate), then make it animated (Block-as-Sprite, Shape, then both on one AnimationBar and one Draw editor)."
	width={1920}
	height={1080}
	fill
	article
	articleText="← Back to home"
	articleHref="../"
>
	<slot />
</SlideDeck>
