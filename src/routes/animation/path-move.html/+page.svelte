<!--
  Example: Path — keyframed geometry on a MULTI-segment stroke
  File: src/routes/animation/path-move.html/+page.svelte

  A single <Path> chaining a line, a curve and an arc, whose WHOLE pose is
  keyframed: at 0% it lies flat on the baseline, at 100% it lifts into a peaked
  profile — the endpoints, the curve's control point and the arc's bend all
  travel at once. Because a chain's SVG command structure varies across segments
  (and arc flags don't interpolate), the component can't tween `d: path()`
  directly the way a lone Line/Curve/Arc does; instead it SAMPLES each pose into
  a fixed-count polyline, so any mix of segment kinds morphs smoothly. It's all
  CSS — runs in the prerendered page — and ANIMATE opens a bar you can DRAG.

  In LAYOUT mode each stop gets its own on-canvas handle set (every vertex at
  both 0% and 100%), and the toolbar grows a KEYFRAMES panel to add / remove /
  retime stops. Copy round-trips the whole `stops` + `animate` tag.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import Block from '$lib/components/Block.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Path } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/path-move.html/+page.svelte';
</script>

<ContentPage title="Path — Keyframed Geometry" subtitle="Morph a whole multi-segment stroke between poses, scrubbed like any animation">
	<div style="line-height: 1.5em;">
		<p>
			One <Label>Path</Label> — a <b>line</b>, a <b>curve</b> and an <b>arc</b>
			chained into a single stroke — whose entire pose is keyframed. At
			<code>0%</code> it lies flat on the baseline; at <code>100%</code> it lifts
			into a peak, endpoints and the curve's control point and the arc's bend all
			travelling together. A lone Line/Curve/Arc tweens <code>d: path()</code>
			exactly, but a chain's command structure varies across segments — so a Path
			<b>samples</b> each pose into a fixed-count polyline that morphs smoothly.
			A stop's <code>drawn</code> (0–1) is an <b>independent</b> track: here the
			stroke is only <b>75%</b> drawn at the <code>50%</code> mark, so the line
			paints in ahead of — then settles with — the morph. Flip <b>LAYOUT</b> to
			drag any stop's handle or retime its <b>keyframes</b> (each row has a
			<code>drawn</code> field); press <b>ANIMATE</b> and <b>drag</b> the bar to
			park it anywhere.
		</p>
		<QuickCode style="margin-top: 0.5em;" lang="svelte" code={`<Path start={[260, 820]}
  segments={[{ to: [700, 820] }, { to: [1140, 820], c1: [920, 820] }, { to: [1580, 820], bend: 0 }]}
  stops={[
    { pct: 0,   segments: [{ to: [700, 820] }, …, { to: [1580, 820], bend: 0 }],    drawn: 0 },
    { pct: 50,  drawn: 0.75 },  // ← 75% drawn at half-time, independent of the morph
    { pct: 100, segments: [{ to: [700, 520] }, …, { to: [1580, 540], bend: 0.55 }], drawn: 1 }
  ]} animate={4} arrow="end" />`} />
	</div>
</ContentPage>

<!-- The pinned start and the two positions of the end point. -->
<Block name="a" x={120} y={790} width={110} height={80}>
	<div class="marker pin">A</div>
</Block>
<Block name="e0" x={1600} y={790} width={130} height={80}>
	<div class="marker">E₀</div>
</Block>
<Block name="e100" x={1600} y={510} width={130} height={80}>
	<div class="marker">E₁₀₀</div>
</Block>

<Draw title="A multi-segment route sweeping from a flat baseline up into a peak" name="route"
	description="A single Path chaining a line, a curve and an arc, animating from a flat baseline at 0% up into a peaked profile at 100%; the arrowhead and the route label travel with the moving end.">
	<Path name="route" start={[260, 820]} segments={[{ to: [700, 820] }, { to: [1140, 820], c1: [920, 820] }, { to: [1580, 820], bend: 0 }]} stops={[{ pct: 0, segments: [{ to: [700, 820] }, { to: [1140, 820], c1: [920, 820] }, { to: [1580, 820], bend: 0 }], drawn: 0 }, { pct: 50, drawn: 0.75 }, { pct: 100, segments: [{ to: [700, 520] }, { to: [1140, 780], c1: [920, 320] }, { to: [1580, 540], bend: 0.55 }], drawn: 1 }]} animate={4} arrow="end" color="#f39c12" thickness={6} label="a multi-segment route sweeping from a flat baseline up into a peaked profile" labelText="route" labelOffset={34} />
</Draw>

<!-- The ANIMATE control: opens into a bar whose playhead you drag — the Path's
     sampled geometry keyframes are ordinary CSS animations, so the bar scrubs
     them like anything else. -->
<AnimationBar highlight />

<ViewSource {source} {path} />

<style>
	.marker {
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
