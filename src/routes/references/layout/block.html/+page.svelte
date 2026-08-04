<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Block" subtitle="Absolute box in canvas pixels">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Block</b> pins children at <code>x</code>/<code>y</code> with a fixed <code>width</code>/<code>height</code> in the deck canvas (default 1920×1080). Everything scales with the slide transform.</p>
		<p style="margin-top: 0.5em;">Give it a <code>name</code> when Connectors, Spotlight, or Toast need to find it.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Block name="hero" x={120} y={240} width={400} height={160}>
  <h2>Pinned content</h2>
</Block>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>x y width height</code> — canvas pixels</li>
			<li><code>name</code> — label + registry key for connectors / highlights</li>
			<li><code>grid / aspect / bounds</code> — snap, lock aspect, clamp to canvas</li>
			<li><code>fill</code> — false keeps natural content size</li>
	</ul>

	</div>
</ContentPage>
