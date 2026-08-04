<script>
	import AppendixPage from '$lib/templates/AppendixPage.svelte';
	import WebPage from '$lib/components/WebPage.svelte';
	import Hint from '$lib/components/Hint.svelte';
</script>

<!--
  Hidden appendix: full-canvas WebPage + AppendixPage for RETURN / run edges.
  WebPage is absolute over the canvas; AppendixPage’s NavigationBar (RETURN) stays above.
-->
<AppendixPage title="" subtitle="" rule={false}>
	<WebPage src="https://svelte.dev" title="svelte.dev" />
</AppendixPage>

<Hint
	text="Click the site to interact — Release lights up in the top bar. RETURN / ↑ / Backspace leaves the appendix."
/>
