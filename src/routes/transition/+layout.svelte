<!--
  The "Page Transitions" presentation — landscape 1920x1080.

  A standalone deck (sibling of slides/). The canvas + scaling machinery lives in
  <SlideDeck>; this layout just picks the dimension, opts into the green theme, and
  publishes the slide list. Mirrors src/routes/unique/+layout.svelte, but passes
  deckClass="gp-deck theme-green" so the whole canvas is recoloured greenish via
  the role tokens (hence the themes.css + roles.css imports below).
-->
<script lang="ts">
	import SlideDeck     from '$lib/components/SlideDeck.svelte';
	import AnimationBar  from '$lib/components/AnimationBar.svelte';
	import { deck, pages } from './pages';
	import { setPages, setViewTransitions } from '$lib/presentation';

	// Theming: themes.css holds the base palettes, roles.css maps the semantic role
	// tokens onto them. deckClass below puts `gp-deck theme-green` on the frame, so
	// those tokens resolve to the green palette and inherit into the content box.
	import '$lib/themes/themes.css';
	import '$lib/themes/roles.css';

	// This deck eats its own dog food: page between slides client-side (goto)
	// wrapped in the View Transitions API, with the directional slide keyframes
	// below. setViewTransitions(true) flips NavigationBar onto that strategy.
	import './view-transitions.css';

	// Presentation-level favicon for this deck — overrides the site default on every
	// /transition/* page. Reuses the main deck's icon.
	import favicon from '$lib/assets/codecat-zoom.png';

	// Publish this presentation's slide list to its slides (nav + ToC read it).
	setPages(pages);
	setViewTransitions(true);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SlideDeck
	{pages}
	title="Page Transitions"
	description="Animating slide-to-slide with the View Transitions API in GeekPresent — each effect performed live by paging through its own from → to pair."
	width={1920}
	height={1080}
	fill
	deckClass={deck.deckClass}
>
	<slot />
	<!-- One AnimationBar for the whole deck (it re-detects per navigation). It only
	     shows itself on slides that carry an in-page animation — the "(from)" slides
	     with an <EffectDemo/> — and stays invisible on every other slide. startExpanded
	     skips the ANIMATION button so the controls are there the moment a "(from)"
	     slide appears. -->
	<AnimationBar startExpanded />
</SlideDeck>
