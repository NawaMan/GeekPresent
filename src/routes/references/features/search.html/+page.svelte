<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Full-deck search" subtitle="Find text across slides">
	<div style="width: 100%; line-height: 1.5;">
		<p>Search lives with the Table of Contents: query the deck’s extracted text and jump to matches. Author ordinary readable copy so search has something to find.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<!-- open ToC → search field; no per-slide import -->`} />


	</div>
</ContentPage>
