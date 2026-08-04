<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="BarChart" subtitle="Grouped and stacked bars">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>BarChart</b> plots categorical series as bars — grouped or stacked — with shared axis helpers from <code>$lib/chart</code>.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<BarChart {series} xAxis={x} yAxis={y} width={900} height={480} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>series</code> — named numeric series</li>
			<li><code>xAxis / yAxis</code> — axis definitions</li>
	</ul>

	</div>
</ContentPage>
