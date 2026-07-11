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
	import AnimationBar from '$lib/components/AnimationBar.svelte';
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
			Each shape also carries a staggered <Label>draw</Label>/<Label>drawDelay</Label>,
			so <b>ANIMATE</b> replays the whole diagram building itself on one timeline.
		</p>
		<QuickCode style="margin-top: 0.5em;" lang="svelte" code={`<Arc name="request" from={[510, 760]} to={[1410, 760]} bend={0.124} arrow="end" />
<!-- LAYOUT → drag → Copy → paste that one line back -->`} />
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
	<!-- Each shape carries a staggered draw/drawDelay, so ANIMATE builds the whole
	     diagram beat by beat on one timeline: request (0–1.2s), response
	     (1.2–2.2), the frame (2.2–3.2), the polyline (3.2–4.4), the hop
	     (4.4–5.4), then the ring closes it (5.4–6.2). Arrowheads and labels ride
	     their own shape's timing. -->
	<Arc name="request" from={[510, 760]} to={[1410, 760]} bend={0.124} arrow="end" thickness={6} label="request from client to server" labelText="request" draw={1.2} />
	<Line name="response" from={[845, 816]} to={[509, 820]} arrow="end" color="#00b356" dash label="response from server to client" labelText="response" labelOffset={28} draw={1} drawDelay={1.2} />
	<Rect name="frame" rounded={16} color="#2980b9" draw={1} drawDelay={2.2} x={1395} y={675} width={370} height={190} />
	<!-- Smooth Polyline (Catmull-Rom through every point) drawing itself in. -->
	<Polyline points={[[180, 1000], [400, 950], [620, 1020], [900, 1010]]} smooth color="#f39c12" label="a smooth polyline drawing itself" draw={1.2} drawDelay={3.2} />
	<Curve name="hop" from={[847, 818]} to={[1143, 992]} c1={[991, 882]} arrow="end" color="#e74c3c" label="curve arrow onto the word 'here'" draw={1} drawDelay={4.4} />
	<Ellipse name="ring" color="#e74c3c" label="the word 'here', circled" draw={0.8} drawDelay={5.4} x={1160} y={950} width={200} height={90} />
	<!-- Raw SVG passes straight through (escape hatch). -->
	<circle cx="960" cy="790" r="10" fill="currentColor" />
</Draw>

<!-- ANIMATE opens a scrub bar over the slide's finite animations — the shapes'
     staggered draw/drawDelay reveals, one envelope. Pause, scrub or restart the
     whole build-up like any slide animation. -->
<AnimationBar />

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
		background: #1f4d33;
		border: 2px solid #00b356;
		color: #d8ffe9;
	}
	.word {
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.8em;
		font-style: italic;
	}
</style>
