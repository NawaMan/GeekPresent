<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Waterfall" subtitle="Running totals">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Waterfall</b> bridges a start value through signed steps to an end — budgets, funnels, reconciliation.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Waterfall {steps} xAxis={x} yAxis={y} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>steps</code> — ordered signed contributions</li>
	</ul>

	</div>
</ContentPage>
