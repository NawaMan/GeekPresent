<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="ScrollDiv & WideDiv" subtitle="Overflow that can pan">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>ScrollDiv</b> is a wheel-pannable region for content larger than its box. Set <code>axis</code> to <code>x</code>, <code>y</code>, or <code>both</code>. <b>WideDiv</b> is the <code>axis="x"</code> alias.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<ScrollDiv axis="y" style="height: 420px; width: 800px;">
  <!-- tall content -->
</ScrollDiv>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>axis</code> — x | y | both</li>
			<li><code>scrollbar</code> — optional draggable scrollbar affordance</li>
	</ul>

	</div>
</ContentPage>
