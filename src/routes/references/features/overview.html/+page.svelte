<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Overview" subtitle="All-slides grid (O)">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Overview</b> (press <b>O</b>) shows a grid of live slide tiles. Click to jump. In dev, deck-structure editing (add/remove) can be armed from the grid.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<!-- always available from SlideDeck chrome; no import -->`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>O key</code> — toggle overview</li>
	</ul>

	</div>
</ContentPage>
