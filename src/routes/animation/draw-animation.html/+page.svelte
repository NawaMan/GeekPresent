<!--
  Example: Draw — animated diagram (draw + drawDelay on one timeline)
  File: src/routes/animation/draw-animation.html/+page.svelte

  A diagram that builds itself: each shape's `draw` is a plain CSS
  animation, and `drawDelay` staggers them into a sequence — request arrow
  (0–1s), query arrow (1–2s), response arc (2–3.2s), then the ellipse
  circles the hot path (3.4–4.2s). Labels and arrowheads ride their shape's
  timing. Because it's all CSS @keyframes, the whole build-up runs in the
  prerendered page without JS AND is one envelope for <AnimationBar> —
  pause it, scrub it, restart it like any other slide animation.
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

	const path = 'src/routes/animation/draw-animation.html/+page.svelte';
</script>

<ContentPage title="Draw — Animated Diagram" subtitle="draw + drawDelay: the diagram builds itself, on one scrubbable timeline">
	<div style="line-height: 1.5em;">
		<p>
			Give each shape a <Label>draw</Label> duration and stagger the starts with
			<Label>drawDelay</Label>: the request fires, the query follows, the response
			returns, and the hot path gets circled — four beats, one timeline. It's all
			CSS, so it plays in the prerendered page and the <b>ANIMATION</b> bar can
			pause, scrub, and restart the whole build-up like any slide animation.
		</p>
		<QuickCode style="margin-top: 0.5em;">
			&lt;Line from=&#123;…&#125; to=&#123;…&#125; arrow="end" draw=&#123;1&#125; /&gt;<br/>
			&lt;Line from=&#123;…&#125; to=&#123;…&#125; arrow="end" draw=&#123;1&#125; drawDelay=&#123;1&#125; /&gt;<br/>
			&lt;Arc&nbsp; from=&#123;…&#125; to=&#123;…&#125; bend=&#123;-0.15&#125; arrow="end" draw=&#123;1.2&#125; drawDelay=&#123;2&#125; /&gt;<br/>
			&lt;Ellipse x=&#123;…&#125; … draw=&#123;0.8&#125; drawDelay=&#123;3.4&#125; /&gt;
		</QuickCode>
	</div>
</ContentPage>

<!-- The three nodes of the diagram, parked low to clear the title + text. -->
<Block name="client" x={151} y={688} width={300} height={140}>
	<div class="node a"><b>Client</b></div>
</Block>
<Block name="api" x={809} y={683} width={300} height={140}>
	<div class="node b"><b>API</b></div>
</Block>
<Block name="db" x={1437} y={692} width={300} height={140}>
	<div class="node c"><b>DB</b></div>
</Block>

<Draw title="Request lifecycle, drawn in sequence" name="lifecycle"
	description="An arrow from client to API draws first, then one from API to DB, then a dashed response arc returns underneath, and finally an ellipse circles the API node.">
	<Line name="call" from={[461, 755]} to={[796, 755]} arrow="end" thickness={6} label="request from client to API" labelText="request" draw={1} />
	<Line name="query" from={[1124, 757]} to={[1435, 753]} arrow="end" thickness={6} label="query from API to DB" labelText="query" draw={1} drawDelay={1} />
	<Arc name="reply" from={[1580, 837]} to={[317, 836]} bend={0.094} arrow="end" color="#00b356" dash label="response from DB back to the client" labelText="response" labelOffset={-32} draw={1.2} drawDelay={2} />
	<Ellipse name="hot" color="#e74c3c" label="the API node, circled as the hot path" draw={0.8} drawDelay={3.4} x={717} y={662} width={492} height={185} />
</Draw>

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
</style>
