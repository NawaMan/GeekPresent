<!--
  GeekLight — a light-theme deck. Same canvas + scaling machinery as every other
  deck (it reuses <SlideDeck>); it only diverges by its theme tokens (gp-deck
  theme-light), a soft watercolor content background, and a serif font — all
  passed to SlideDeck as props, so there is no duplicated scaling logic here.
-->
<script lang="ts">
	import SlideDeck    from '$lib/components/SlideDeck.svelte';
	import { pages }    from './pages';
	import { setPages } from '$lib/presentation';

	// Theming: themes.css holds the base palettes, roles.css maps the semantic role
	// tokens onto them. The deckClass below picks the light palette.
	import '$lib/themes/themes.css';
	import '$lib/themes/roles.css';

	// Watercolor background for the content surface (Vite resolves to a URL).
	import bg from './bg.png';

	// Publish this presentation's slide list to its slides (nav + ToC read it).
	setPages(pages);
</script>

<svelte:head>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" />
</svelte:head>

<SlideDeck
	{pages}
	title="GeekLight"
	description="GeekLight — a light-theme GeekPresent deck: the same components on a soft watercolor background."
	width={1920}
	height={1080}
	deckClass="gp-deck theme-light"
	contentBackground={`url(${bg}) center / cover no-repeat, var(--surface-bg)`}
	contentFont="'Merriweather', Georgia, serif"
>
	<slot />
</SlideDeck>
