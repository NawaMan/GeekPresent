<!--
  Example: the hand-drawn (rough) option — the Excalidraw look, our own math
  File: src/routes/slides/draw-rough.html/+page.svelte

  `rough` is a RENDER option on the whole Draw family. Put it on <Draw> and
  every shape inside is drawn by hand; put it on a shape to override, or
  `rough={false}` to keep one crisp. Nothing else changes: the coordinates are
  the same, ADJUST handles still ride the true geometry, Copy still emits the
  tag, draw-on and keyframes still scrub on the AnimationBar.

  The wobble is seeded from each shape's own props, so it is identical on the
  server and in the browser — the prerendered page already contains the
  finished hand-drawn markup, and nothing snaps on hydration.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import Block from '$lib/components/Block.svelte';
	import Connector from '$lib/components/Connector.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Ellipse, Line, Rect } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/draw-rough.html/+page.svelte';
</script>

<ContentPage title="Rough" subtitle="The hand-drawn option — one word on the surface">
	<div style="line-height: 1.5em;">
		<p>
			Add <Label>rough</Label> to a <Label>Draw</Label> and every shape inside is
			drawn <b>by hand</b> — wobbled strokes, doubled like a pen going round
			twice, boxes whose corners overshoot, and fills made of hatching rather
			than a flat wash. A shape can override with <code>rough={'{1.6}'}</code> for
			sloppier, or opt out entirely with <code>rough={'{false}'}</code>. It is
			only a <i>render</i> option: coordinates, <b>ADJUST</b> handles, <b>Copy</b>,
			the <Label>draw</Label> reveal and keyframe morphs all behave exactly as
			before, because every evaluator still reads the true geometry.
		</p>
		<QuickCode
			style="margin-top: 0.5em;"
			lang="svelte"
			code={`<Draw title="Sketch" rough>
  <Rect x={140} y={640} width={330} height={150} fill="#2b6cb0" />
  <Line from={[470, 715]} to={[900, 715]} arrow="end" labelText="reads" />
  <Line ... rough={false} />   <!-- this one stays crisp -->
</Draw>`}
		/>
	</div>
</ContentPage>

<!-- Two labelled boxes for the Connector to join, so the whole diagram —
     boxes, arrows and hatching — reads as one hand. -->
<Block name="app" x={1100} y={744} width={260} height={120}>
	<div class="node">App</div>
</Block>
<Block name="db" x={1560} y={840} width={260} height={120}>
	<div class="node">DB</div>
</Block>

<Draw
	title="A hand-drawn diagram"
	name="sketch"
	rough
	description="A hatched box reading along a labelled arrow, a cross-hatched ellipse, one deliberately crisp line for contrast, and a hand-drawn connector between two boxes."
>
	<!-- Hachure is the default fill while rough; cross-hatch crosses it. -->
	<Rect name="cache" x={134} y={735} width={330} height={150} fill="#2b6cb0" draw={1} />
	<Ellipse
		name="blob"
		x={560}
		y={860}
		width={300}
		height={150}
		fill="#b7791f"
		fillStyle="cross-hatch"
		draw={1}
		drawDelay={1}
	/>
	<Line
		name="reads"
		from={[488, 795]}
		to={[1081, 794]}
		arrow="end"
		labelText="reads"
		draw={1}
		drawDelay={2}
	/>
	<!-- One shape opting OUT, for contrast: same surface, machine-drawn. -->
	<Line name="crisp" from={[135, 946]} to={[471, 942]} rough={false} />
	<!-- A Connector inside a rough Draw follows the surface, so the box-to-box
	     arrow is hand-drawn too rather than sitting crisp among the sketch. -->
	<Connector from="app" to="db" route="ortho" arrow="end" label="writes" gap={10} />
</Draw>

<AnimationBar />

<ViewSource {source} {path} />

<style>
	.node {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		font-size: 1.7em;
		font-weight: bold;
	}
</style>
