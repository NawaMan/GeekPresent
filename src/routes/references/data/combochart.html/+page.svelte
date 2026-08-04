<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="ComboChart" subtitle="Bars + line together">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>ComboChart</b> overlays chart types (classically bars + line) when one series is magnitude and another is a rate.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<ComboChart {series} xAxis={x} yAxis={y} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>series</code> — mixed-type series defs</li>
	</ul>

	</div>
</ContentPage>
