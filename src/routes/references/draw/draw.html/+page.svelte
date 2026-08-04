<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Draw" subtitle="SVG surface for shapes and sprites">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Draw</b> is the container for vector shapes and riding Sprites. Children register geometry; ADJUST can expose handles for editable shapes.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Draw>
  <Rect name="card" x={100} y={200} width={320} height={180} />
  <Line name="edge" from={[100, 200]} to={[420, 380]} />
</Draw>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>(children)</code> — shape and sprite components</li>
	</ul>

	</div>
</ContentPage>
