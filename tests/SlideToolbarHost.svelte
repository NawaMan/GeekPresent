<!-- SlideToolbar fixture. SlideDeck normally mounts the toolbar in its window-fixed overlay and
     feeds it the PRESENT / ADJUST / OVERVIEW / CAPTURE / PRINT snippets; the pieces the tests care
     about — the owned ANNOTATE pen toggle and the folded-in DISPLAY control — need none of those,
     so the host mounts it bare and drives the annotation stores directly. -->
<script lang="ts">
	import SlideToolbar from '../src/lib/components/SlideToolbar.svelte';

	export let width = 1920;
	export let height = 1080;
</script>

<SlideToolbar {width} {height} />
