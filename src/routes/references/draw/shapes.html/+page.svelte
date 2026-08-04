<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Shapes" subtitle="Rect, Ellipse, Line, Curve, Arc, Polyline">
	<div style="width: 100%; line-height: 1.5;">
		<p>Primitive shapes under Draw: boxes, ellipses, straight and curved strokes, arcs, polylines. Many support <code>draw</code> / <code>drawDelay</code> for stroke-reveal on the shared timeline.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Rect x={40} y={40} width={200} height={120} />
<Ellipse x={300} y={40} width={160} height={120} />
<Curve name="road" from={[0,0]} c1={[80,120]} c2={[160,120]} to={[240,0]} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>draw / drawDelay</code> — seconds to reveal; delay before start</li>
			<li><code>name</code> — for sprites to ride and ADJUST labels</li>
	</ul>

	</div>
</ContentPage>
