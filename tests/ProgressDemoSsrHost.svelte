<!--
  SSR fixture for the progress-demo slide: publishes a deck (setPages) the way the
  slides/ +layout.svelte does, then renders the REAL slide page. `stub.html` is where
  the $app/stores stub says we are (the LAST of these three visible slides), so the
  live readout must render "3 / 3" and a full bar — straight out of getProgress().
-->
<script lang="ts">
	import ProgressDemo from '../src/routes/slides/progress-demo.html/+page.svelte';
	import { setPages } from '$lib/presentation';
	import type { Page } from '$lib/utils/navigate';

	const pages: Array<Page> = [
		{ path: 'a.html', title: 'A' },
		{ path: 'b.html', title: 'B' },
		{ path: 'stub.html', title: 'Stub' }
	];
	setPages(pages);
</script>

<ProgressDemo />
