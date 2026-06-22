<!--
  The "Scaling Calibration" test deck — landscape 1920x1080.

  A throwaway deck whose job is to verify the SlideDeck VIEW scale (adjustSize in
  SlideDeck.svelte) is pixel-accurate and undistorted. Uses fill={true}, matching
  the real landscape decks (slides/, unique/), so the calibration measures the
  exact path real slides take. Mirrors src/routes/unique/+layout.svelte.
-->
<script lang="ts">
	import SlideDeck    from '$lib/components/SlideDeck.svelte';
	import { pages }    from './pages';
	import { setPages } from '$lib/presentation';

	// Publish this deck's slide list to its slides (nav + ToC read it).
	setPages(pages);
</script>

<SlideDeck
	{pages}
	title="Scaling Calibration"
	description="A measurable 1920x1080 calibration target for verifying the GeekPresent canvas scales 1:1 and without distortion."
	width={1920}
	height={1080}
	fill
>
	<slot />
</SlideDeck>
