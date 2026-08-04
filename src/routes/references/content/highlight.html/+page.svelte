<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Highlight" subtitle="Punch-out emphasis on a Block">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Highlight</b> dims the canvas and rings a named Block — author-planned emphasis. For freehand mid-talk marks, use Annotate under Features.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Highlight target="api" active={step === 2} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>target</code> — Block name</li>
			<li><code>active</code> — whether the dim + ring is shown</li>
	</ul>

	</div>
</ContentPage>
