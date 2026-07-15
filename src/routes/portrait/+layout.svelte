<!--
  A portrait presentation deck — 1080x1920, for YouTube Shorts.

  This is a normal peer deck: same components, same templates, same navigation as
  the landscape deck. The ONLY thing that makes it portrait is the canvas — `deck`
  in pages.ts, handed to <SlideDeck> below (it lives there, not here, so that the
  printable handout can read it without mounting this layout). Each slide here is
  authored for this tall frame
  (short, big, vertically-stacked) — orientation is fixed per deck, never toggled.

  baseFontSize is the per-deck typography lever, and it is the ONE knob that
  makes a Portrait readable. The reusable templates/components are sized for the
  wide 1920 landscape canvas seen on a monitor; a Portrait is the opposite — a
  narrow 1080 canvas seen full-screen on a phone, so the SAME text needs to be
  MUCH bigger relative to the frame (counter-intuitively larger than landscape's
  1.5em, not smaller). This lever scales all the em-based text up at once, here,
  without touching any shared component. Keep Portrait slides to a few large words.
-->
<script lang="ts">
	import SlideDeck      from '$lib/components/SlideDeck.svelte';
	import { deck, pages } from './pages';
	import { setPages }   from '$lib/presentation';

	// Publish this deck's slide list to its slides (nav + ToC read it). Must be
	// set here, not in SlideDeck: the slotted slides read THIS layout's context.
	setPages(pages);
</script>

<SlideDeck
	{pages}
	title="GeekPortrait"
	description="GeekPortrait — a 1080×1920 portrait deck for YouTube Shorts and mobile, built from the same GeekPresent components in a taller frame."
	width={deck.width}
	height={deck.height}
	baseFontSize={deck.baseFontSize}
	fill
>
	<slot />
</SlideDeck>
