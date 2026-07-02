<!--
  Example: Draw component family — SVG annotation in canvas pixels
  File: src/routes/slides/draw-component.html/+page.svelte

  <Draw> is a full-canvas, pointer-transparent SVG overlay whose user units
  ARE canvas pixels — the same coordinates as Block x/y. Flip LAYOUT on
  (top-right) and every shape becomes editable in place: drag a Line/Arc
  endpoint, a Curve's control points, or the Arc's green bend handle;
  Rect/Ellipse move and resize exactly like Blocks. Then hit Copy — the
  floating toolbar (or the box's own Copy) emits the shape's updated
  opening tag, formatted exactly like the tags below, so you paste it over
  the original line and the diff is just the numbers.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import Block from '$lib/components/Block.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Arc, Curve, Draw, Ellipse, Line, Polyline, Rect } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/draw-component.html/+page.svelte';
</script>

<ContentPage title="Draw" subtitle="Dependency-free SVG annotation — now visually editable">
	<div style="line-height: 1.5em;">
		<p>
			<Label>Draw</Label> lays one SVG surface over the whole canvas; inside it,
			<Label>Line</Label>, <Label>Curve</Label>, <Label>Arc</Label>,
			<Label>Polyline</Label>, <Label>Rect</Label>, and <Label>Ellipse</Label> take
			the <b>same pixel coordinates as Block</b>. Flip <b>LAYOUT</b> on (top-right)
			and drag: endpoints and control points grow handles, the arc gets a green
			<i>bend</i> handle at its apex, and the boxes move/resize like Blocks.
			<b>Copy</b> hands back the shape's updated tag — paste it over the source
			line; nothing is saved behind your back. Moved several shapes?
			<b>Copy changed (N)</b> grabs one OLD/NEW patch of all of them — paste it
			to your AI assistant (or apply it by hand) to update the source in one go.
		</p>
		<QuickCode style="margin-top: 0.5em;">
			&lt;Arc name="request" from=&#123;[510, 760]&#125; to=&#123;[1410, 760]&#125; bend=&#123;0.124&#125; arrow="end" /&gt;<br/>
			&lt;!-- LAYOUT → drag → Copy → paste that one line back --&gt;
		</QuickCode>
	</div>
</ContentPage>

<!-- Demo content, parked low on the canvas so it clears the title + text. -->
<Block name="client" x={180} y={700} width={320} height={140}>
	<div class="node a"><b>Client</b></div>
</Block>
<Block name="server" x={1420} y={700} width={320} height={140}>
	<div class="node b"><b>Server</b></div>
</Block>
<Block name="word" x={1180} y={960} width={160} height={70}>
	<div class="word">here</div>
</Block>

<!-- Shape tags are written in EXACTLY the attribute order Copy emits, so a
     drag → Copy → paste-over shows up as a numbers-only diff. -->
<Draw title="Request flow annotation" name="flow"
	description="A labelled arc from the client box to the server box, a dashed response line back, a rounded frame around the server, a smooth polyline drawing itself on, and a curve arrow onto the word 'here', circled by an ellipse.">
	<Arc name="request" from={[510, 760]} to={[1410, 760]} bend={0.124} arrow="end" thickness={6} label="request from client to server" labelText="request" />
	<Line name="response" from={[1410, 820]} to={[507, 797]} arrow="end" color="#00b356" dash label="response from server to client" labelText="response" labelOffset={28} />
	<Rect name="frame" rounded={16} color="#2980b9" x={1395} y={675} width={370} height={190} />
	<!-- Smooth Polyline (Catmull-Rom through every point) drawing itself in 2s. -->
	<Polyline points={[[180, 1000], [400, 950], [620, 1020], [900, 1010]]} smooth draw={2} color="#f39c12" label="a smooth polyline drawing itself" />
	<Curve name="hop" from={[900, 1010]} to={[1143, 992]} c1={[874, 844]} arrow="end" color="#e74c3c" label="curve arrow onto the word 'here'" />
	<Ellipse name="ring" color="#e74c3c" label="the word 'here', circled" x={1160} y={950} width={200} height={90} />
	<!-- Raw SVG passes straight through (escape hatch). -->
	<circle cx="960" cy="790" r="10" fill="currentColor" />
</Draw>

<ViewSource {source} {path} />

<style>
	.node {
		width: 100%;
		height: 100%;
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
		background: #1f4d33;
		border: 2px solid #00b356;
		color: #d8ffe9;
	}
	.word {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.8em;
		font-style: italic;
	}
</style>
