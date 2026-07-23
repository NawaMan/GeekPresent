<!--
  Example: WebPage component
  File: src/routes/slides/webpage-component.html/+page.svelte

  A whole slide made of one live site. WebPage brings its own NavigationBar, so
  there is no ContentPage here — the site IS the page.
-->
<script>
	import WebPage    from '$lib/components/WebPage.svelte';
	import Hint       from '$lib/components/Hint.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import source     from './+page.svelte?raw';

	const path = 'src/routes/slides/webpage-component.html/+page.svelte';
</script>

<WebPage src="https://codingbooth.io/" title="codingbooth.io — the whole canvas" />

<!-- Rendered after WebPage, so the deck's own chrome paints above the site. The deck
     opts into `fadeChrome`, so that chrome ghosts out until you reach for it — which
     is exactly what you want sitting on top of someone else's pixels. -->
<Hint text="WebPage fills the canvas and brings its own nav bar — the deck chrome fades until you point at it" />

<ViewSource {source} {path} />
