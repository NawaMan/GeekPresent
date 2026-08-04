<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="PieChart" subtitle="Parts of a whole">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>PieChart</b> shows share-of-total. Prefer few slices; for many categories, a bar chart usually reads better.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<PieChart {slices} width={420} height={420} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>slices</code> — label + value entries</li>
	</ul>

	</div>
</ContentPage>
