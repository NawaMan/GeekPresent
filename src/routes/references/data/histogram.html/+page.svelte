<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Histogram" subtitle="Distribution of a numeric field">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Histogram</b> bins a numeric sample into counts — latency, scores, sizes.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Histogram values={samples} bins={12} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>values / bins</code> — raw numbers and bin count</li>
	</ul>

	</div>
</ContentPage>
