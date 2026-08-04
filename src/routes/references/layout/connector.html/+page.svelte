<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Connector" subtitle="Arrows by name, not coordinates">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Connector</b> routes an arrow between two named Blocks (or raw points). Drag a Block in ADJUST and the arrow follows — you never recompute endpoints.</p>
		<p style="margin-top: 0.5em;"><b>Order matters:</b> Connectors must appear after the Blocks they link so names exist during registration.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Block name="api" x={200} y={400} width={280} height={140}>API</Block>
<Block name="db"  x={900} y={400} width={280} height={140}>DB</Block>
<Connector from="api" to="db" label="query" />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>from / to</code> — Block name, point [x,y], or box</li>
			<li><code>route</code> — straight | ortho | curve</li>
			<li><code>fromSide / toSide</code> — top | right | bottom | left</li>
			<li><code>label / dash / drawDelay</code> — caption, stroke style, stagger</li>
	</ul>

	</div>
</ContentPage>
