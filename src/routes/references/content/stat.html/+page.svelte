<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Stat & StatGroup" subtitle="Big numbers in a row">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Stat</b> is a single metric (value + label). <b>StatGroup</b> arranges several Stats with consistent spacing for dashboards and result slides.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<StatGroup>
  <Stat value="3×" label="faster builds" />
  <Stat value="0" label="runtime servers" />
</StatGroup>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>value / label</code> — primary figure and caption</li>
	</ul>

	</div>
</ContentPage>
