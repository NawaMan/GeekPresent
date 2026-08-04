<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Canvas" subtitle="Imperative pixels on the playhead">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Canvas</b> is the escape hatch: draw with JS/TS against the same animation clock as Draw shapes when SVG is not enough.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Canvas width={800} height={450} draw={(ctx, t) => {
  /* t is playhead time */
}} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>draw</code> — frame callback</li>
			<li><code>width / height</code> — buffer size</li>
	</ul>

	</div>
</ContentPage>
