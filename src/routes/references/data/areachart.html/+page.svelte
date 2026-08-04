<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="AreaChart" subtitle="Filled series, stackable">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>AreaChart</b> fills under lines — strong for composition over time. Can draw in with the animation timeline.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<AreaChart {series} xAxis={x} yAxis={y} stacked />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>stacked</code> — stack series when true</li>
	</ul>

	</div>
</ContentPage>
