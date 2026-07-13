<!-- Annotate fixture. The overlay is a canvas-level singleton that SlideDeck normally
     mounts, so the host just stands in for the deck: it supplies the canvas size and the
     chrome flag, and the test drives the stores and the pointer directly. The ink PATH is
     set by the test (SlideDeck's job in real life). -->
<script lang="ts">
	import Annotate from '../src/lib/components/Annotate.svelte';

	export let canvasWidth = 1920;
	export let canvasHeight = 1080;
	export let chrome = true;
	export let inkColors: (string | null)[] = [null, '#E5484D', '#3FA9F5'];
</script>

<Annotate {canvasWidth} {canvasHeight} {chrome} {inkColors} />
