<!--
  Example: Draw — a diagram that builds itself (draw + drawDelay + AnimationBar)
  File: src/routes/slides/draw-sequence.html/+page.svelte

  Every Draw shape takes a `draw` duration (it strokes itself on, pure CSS) and
  a `drawDelay` to stagger the start. Line them up and the whole diagram builds
  beat by beat on ONE timeline: request → route → query, the response arc
  returns underneath, then an ellipse circles the hot node. Arrowheads and
  labels ride their own shape's timing. Because it's all CSS @keyframes it runs
  in the prerendered page with no JS — AND it's one envelope for <AnimationBar>,
  so ANIMATE can pause, scrub and restart the build like any slide animation.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import Block from '$lib/components/Block.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Arc, Draw, Ellipse, Line } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/draw-sequence.html/+page.svelte';
</script>

<ContentPage title="Draw — Building a Diagram" subtitle="draw + drawDelay: the diagram draws itself on one scrubbable timeline">
	<div style="line-height: 1.5em;">
		<p>
			Give each shape a <Label>draw</Label> duration and stagger the starts with
			<Label>drawDelay</Label>: the request fires, gets routed, hits the database,
			the response returns underneath, and the hot node gets circled — five beats,
			one timeline. It's pure CSS, so it plays in the prerendered page, and the
			<b>ANIMATE</b> bar can pause, <b>drag</b>-scrub, and restart the whole
			build-up like any slide animation. Flip <b>LAYOUT</b> and each shape is still
			fully editable; the toolbar even retimes its <code>draw</code>/<code
				>drawDelay</code
			>.
		</p>
		<QuickCode style="margin-top: 0.5em;" lang="svelte" code={`<Line … arrow="end" draw={1} />
<Line … arrow="end" draw={1} drawDelay={1} />
<Line … arrow="end" draw={1} drawDelay={2} />
<Arc  … arrow="end" dash  draw={1.4} drawDelay={3} />
<Ellipse … draw={0.8} drawDelay={4.4} />`} />
	</div>
</ContentPage>

<!-- The four nodes of the path, parked low to clear the title + text. -->
<Block name="browser" x={90} y={760} width={280} height={140}>
	<div class="node a"><b>Browser</b></div>
</Block>
<Block name="edge" x={560} y={760} width={280} height={140}>
	<div class="node b"><b>Edge</b></div>
</Block>
<Block name="origin" x={1030} y={760} width={280} height={140}>
	<div class="node c"><b>Origin</b></div>
</Block>
<Block name="db" x={1500} y={760} width={280} height={140}>
	<div class="node d"><b>DB</b></div>
</Block>

<!-- Shapes in the exact attribute order Copy emits (drag → Copy → paste is a
     numbers-only diff), each with its beat's draw/drawDelay. -->
<Draw title="A request's path, drawn in sequence" name="path"
	description="An arrow from the browser to the edge draws first, then edge to origin, then origin to the database; a dashed response arc returns underneath from the database to the browser, and finally an ellipse circles the origin as the hot node.">
	<Line name="request" from={[370, 815]} to={[560, 815]} arrow="end" thickness={6} label="request from the browser to the edge" labelText="request" draw={1} />
	<Line name="route" from={[840, 815]} to={[1030, 815]} arrow="end" thickness={6} label="route from the edge to the origin" labelText="route" draw={1} drawDelay={1} />
	<Line name="query" from={[1310, 815]} to={[1500, 815]} arrow="end" thickness={6} label="query from the origin to the database" labelText="query" draw={1} drawDelay={2} />
	<Arc name="response" from={[1640, 910]} to={[230, 910]} bend={0.064} arrow="end" color="#00b356" dash label="response from the database back to the browser" labelText="response" labelOffset={-32} draw={1.4} drawDelay={3} />
	<Ellipse name="hot" color="#e74c3c" label="the origin, circled as the hot node" draw={0.8} drawDelay={4.4} x={1010} y={738} width={320} height={184} />
</Draw>

<!-- The ANIMATE control, opened so the build is obvious: one envelope over the
     five staggered draw-on reveals, scrubbed by dragging the bar. -->
<AnimationBar startExpanded />

<ViewSource {source} {path} />

<style>
	.node {
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 12px;
		font-size: 1.6em;
	}
	.node.a {
		background: #1f3a4d;
		border: 2px solid #2980b9;
		color: #c0f1ff;
	}
	.node.b {
		background: #4d3a1f;
		border: 2px solid #e67e22;
		color: #ffe3c0;
	}
	.node.c {
		background: #1f4d33;
		border: 2px solid #00b356;
		color: #d8ffe9;
	}
	.node.d {
		background: #3a1f4d;
		border: 2px solid #9b59b6;
		color: #ecc0ff;
	}
</style>
