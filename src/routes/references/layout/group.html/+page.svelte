<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
</script>

<ContentPage title="Group" subtitle="Blocks that move, zoom and pan as one — a camera on a drawing">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Group</b> holds Blocks (Block, ImageBlock, TextBlock, SvgBlock, and other Groups) authored in its own coordinates, and maps them onto the canvas with one zoom and one shift. Change one tag and every part moves. Parts are redrawn at their true size, so they stay crisp at any zoom, and their content scales with them.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Group name="scene" focus="api" zoom={3} hide={['queue']} glide={0.9}>
  <TextBlock name="api" …>API</TextBlock>
  <TextBlock name="db" …>DB</TextBlock>
  <TextBlock name="queue" …>Queue</TextBlock>
</Group>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45; columns: 2; column-gap: 2em;">
			<li><code>x y scale</code> — placement: move and resize the whole set</li>
			<li><code>focus zoom</code> — a part (by name) or a point, centred, zoomed</li>
			<li><code>fit pad</code> — a part fills the canvas, with a margin</li>
			<li><code>view</code> — a rectangle of the drawing fills the canvas</li>
			<li><code>hide</code> — parts off stage on this slide (they fade, not pop)</li>
			<li><code>move={'{{'} db: {'{'} x: 480 {'}'} {'}}'}</code> — a part somewhere else on this slide, by name</li>
			<li><code>glide</code> — seconds to animate a change within the slide</li>
			<li><code>morph morphOn</code> — name the parts for a glide between slides</li>
			<li><code>name</code> — a nested group's name hides, moves or frames all of it</li>
	</ul>

	<p style="margin-top: 0.7em; font-size: 0.85em; opacity: 0.85;">Write the drawing once in a component and render it on every slide with that slide's shot — a <i>scene</i>. ADJUST drags parts in the drawing's own units and SAVE writes them into the scene file. Worked examples: <code>animation/scene-camera.html</code> (within a slide) and <code>transition/camera-*.html</code> (across slides).</p>

	</div>
</ContentPage>
