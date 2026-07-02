<!--
  Example: Draw — keyframed geometry (a Line endpoint animating between stops)
  File: src/routes/animation/draw-move.html/+page.svelte

  Point A stays pinned; point B is KEYFRAMED — at 0% it sits on B₀, at 100%
  on B₁₀₀ — via the `stops` + `animate` props. It's a Curve, so the beam
  CURLS through a control point (which also keyframes, whipping the bend
  over). Under the hood the component generates CSS @keyframes tweening the
  path's `d` (same command structure at every stop, so the browser
  interpolates the numbers); the arrowhead and label ride along. It's all
  CSS — runs in the prerendered page — and ANIMATE opens a bar you can DRAG.

  In LAYOUT mode every stop has its own on-canvas handle (B at both B₀ and
  B₁₀₀, and the control point at each end of its arc), and the toolbar grows
  a KEYFRAMES panel to add / remove / retime stops. Copy round-trips it all.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import Block from '$lib/components/Block.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Curve, Draw } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/draw-move.html/+page.svelte';
</script>

<ContentPage title="Draw — Keyframed Geometry" subtitle="Animate a point's LOCATION between stops, scrubbed like any animation">
	<div style="line-height: 1.5em;">
		<p>
			The beam's point <Label>A</Label> is pinned; point <Label>B</Label> carries
			geometry <Label>stops</Label> — at <code>0%</code> it sits on
			<Label>B₀</Label>, at <code>100%</code> on <Label>B₁₀₀</Label>. It's a
			<Label>Curve</Label>, so it curls through a control point that keyframes
			too, whipping the bend over as B rises. Flip <b>LAYOUT</b> on to drag any
			stop's handle or add keyframes from the toolbar's panel; press
			<b>ANIMATE</b> and <b>drag</b> the bar to park the whole shape anywhere.
		</p>
		<QuickCode style="margin-top: 0.5em;">
			&lt;Curve from=&#123;[330, 812]&#125; to=&#123;[1420, 932]&#125; c1=&#123;[875, 620]&#125;<br/>
			&nbsp;&nbsp;stops=&#123;[&#123; pct: 0, to: [1420, 932], c1: [875, 760] &#125;,<br/>
			&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#123; pct: 100, to: [1420, 392], c1: [875, 470] &#125;]&#125;<br/>
			&nbsp;&nbsp;animate=&#123;4&#125; arrow="end" /&gt;
		</QuickCode>
	</div>
</ContentPage>

<!-- The pinned end and the two target positions of point B. -->
<Block name="a" x={200} y={770} width={120} height={84}>
	<div class="marker pin">A</div>
</Block>
<Block name="b0" x={1430} y={890} width={140} height={84}>
	<div class="marker">B₀</div>
</Block>
<Block name="b100" x={1430} y={350} width={140} height={84}>
	<div class="marker">B₁₀₀</div>
</Block>

<Draw title="A beam sweeping between two targets" name="beam"
	description="A curved beam pinned at A whose other endpoint B animates from the B0 marker up to the B100 marker while its control point whips the bend over; the arrowhead and the B label travel with it.">
	<Curve name="beam" from={[330, 812]} to={[1420, 932]} c1={[875, 760]} stops={[{ pct: 0, to: [1420, 932], c1: [875, 760] }, { pct: 100, to: [1420, 392], c1: [875, 470] }]} animate={4} arrow="end" thickness={6} color="#f39c12" label="a beam sweeping from B0 up to B100" labelText="B" labelAt={0.9} labelOffset={30} />
</Draw>

<!-- The ANIMATE control: opens into a bar whose playhead you drag — the
     line's geometry keyframes are ordinary CSS animations, so the bar
     scrubs them like anything else. -->
<AnimationBar highlight />

<ViewSource {source} {path} />

<style>
	.marker {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 12px;
		font-family: 'Fira Code', monospace;
		font-size: 1.6em;
		background: #1f3a4d;
		border: 2px dashed #2980b9;
		color: #c0f1ff;
	}
	.marker.pin {
		border-style: solid;
		background: #1f4d33;
		border-color: #00b356;
		color: #d8ffe9;
	}
</style>
