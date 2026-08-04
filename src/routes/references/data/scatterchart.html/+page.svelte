<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="ScatterChart" subtitle="Points and bubbles">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>ScatterChart</b> maps x/y (and optional size) for correlations and clusters.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<ScatterChart {series} xAxis={x} yAxis={y} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>series</code> — point series; size channel optional</li>
	</ul>

	</div>
</ContentPage>
