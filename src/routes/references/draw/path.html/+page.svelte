<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Path" subtitle="Multi-segment stroke">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Path</b> is a multi-segment stroke for richer outlines than a single Line/Curve — logos, freeform arrows, complex routes for sprites.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Path name="route" d="M 0 0 L 100 40 Q 160 80 220 40" draw={1.2} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>d / points</code> — path data depending on API shape</li>
			<li><code>draw</code> — reveal duration</li>
	</ul>

	</div>
</ContentPage>
