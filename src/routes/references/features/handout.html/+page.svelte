<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Handout" subtitle="Deck as one printable document">
	<div style="width: 100%; line-height: 1.5;">
		<p>The handout stacks every slide at <code>/_handout/&lt;deck-id&gt;.html</code>. Optional <code>?notes</code>, <code>?grid</code>, <code>?grid&amp;notes</code>. Nested reference decks use ids like <code>references-shell</code>.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<!-- e.g. /_handout/references-shell.html?notes -->`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>?notes / ?grid</code> — layout variants</li>
	</ul>

	</div>
</ContentPage>
