<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Heatmap" subtitle="2-D intensity grid">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Heatmap</b> colours a matrix — day×hour traffic, confusion matrices, correlation grids.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Heatmap {matrix} xLabels={xs} yLabels={ys} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>matrix</code> — 2-D numeric values</li>
			<li><code>xLabels / yLabels</code> — axis categories</li>
	</ul>

	</div>
</ContentPage>
