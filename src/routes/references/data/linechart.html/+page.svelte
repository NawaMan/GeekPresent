<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="LineChart" subtitle="Lines, dual axis, time">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>LineChart</b> is the workhorse for trends. Supports multiple series and dual axes when units differ.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<LineChart {series} xAxis={x} yAxis={y} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>series / axes</code> — same family as other cartesian charts</li>
	</ul>

	</div>
</ContentPage>
