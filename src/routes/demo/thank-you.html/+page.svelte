<script>
	import TitlePage from '$lib/templates/TitlePage.svelte';
	// This slide's favicon is declared in demo/pages.ts (favicon: ./favicon.svg)
	// and emitted by the deck shell, so it lands in the prerendered HTML.
</script>

<TitlePage>
	<span slot="title">That's the demo</span>
	<span slot="subtitle">A second presentation, fully independent of the main one</span>
	<span slot="subsubtitle"><a href="../" style="font-size: 0.7em; opacity: 0.85; color: inherit;">↑ back to the home page</a></span>
</TitlePage>
