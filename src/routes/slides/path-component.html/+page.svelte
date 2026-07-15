<!--
  Example: Path — one continuous stroke chaining line + curve + arc
  File: src/routes/slides/path-component.html/+page.svelte

  <Path> composes several segment kinds into a SINGLE <path>: authored as a
  `start` point plus a list of `segments`, where each segment's start defaults
  to the previous one's `to`. The kind follows the control data — `c1`(/`c2`)
  makes a curve, `bend` an arc, neither a straight line. Because it is one
  path, the whole route gets ONE draw-on reveal, ONE arrowhead at the real end,
  and joins that MEET (round linejoins) instead of butting stroke caps.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import Block from '$lib/components/Block.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Path } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/path-component.html/+page.svelte';
</script>

<ContentPage title="Path" subtitle="One stroke — line, curve and arc chained together">
	<div style="line-height: 1.5em;">
		<p>
			<Label>Path</Label> chains <Label>line</Label>, <Label>curve</Label> and
			<Label>arc</Label> segments into a <b>single</b>
			<code>&lt;path&gt;</code>. Author a <code>start</code> point and a list of
			<code>segments</code>; each segment continues from the previous one's
			<code>to</code>, and its <i>kind</i> follows the control data —
			<code>c1</code>/<code>c2</code> for a Bézier curve, <code>bend</code> for an
			arc, neither for a straight line. One path means one <b>draw-on</b> reveal for
			the whole route, one <b>arrowhead</b> at the real end, and joins that meet
			cleanly — not several shapes' stroke caps butting together. Flip
			<b>ADJUST</b> on and every vertex grows a handle — the start point, each
			segment's <code>to</code>, a hollow control handle per Bézier control point,
			and a green <i>bend</i> handle at each arc's apex; drag to reshape, then
			<b>Copy</b> the whole updated tag back over the source. Add
			<code>stops</code> + <code>animate</code> and the whole chain
			<b>morphs</b> between poses on the AnimationBar timeline (sampled so any mix
			of segment kinds tweens smoothly), with a per-stop <b>keyframes</b> panel in
			the ADJUST toolbar — the same animation model as <Label>Line</Label>/<Label
				>Curve</Label
			>/<Label>Arc</Label>.
		</p>
		<QuickCode
			style="margin-top: 0.5em;"
			lang="svelte"
			code={`<Path start={[200, 620]} segments={[
  { to: [520, 620] },                              // straight
  { to: [820, 470], c1: [670, 620] },              // quadratic curve
  { to: [1180, 470], bend: 0.5 },                  // circular arc
  { to: [1520, 620], c1: [1360, 470], c2: [1400, 620] } // cubic curve
]} arrow="end" />`}
		/>
	</div>
</ContentPage>

<!-- Endpoint labels, parked on the canvas under the two ends of the route. -->
<Block name="start" x={54} y={782} width={180} height={70}>
	<div class="tag">start</div>
</Block>
<Block name="finish" x={1453} y={593} width={175} height={89}>
	<div class="tag">→ end</div>
</Block>

<Draw
	title="A single Path chaining a line, a curve, an arc and a cubic into one arrow"
	name="route"
	description="One continuous stroke from the left that runs straight, curves up, arcs over, and settles down into a single arrowhead — plus a serpentine of arcs below drawing itself on as one stroke."
>
	<!-- The headline: four segment kinds, one stroke, one end arrow. These
	     <Path> tags are written on ONE line each, in the exact attribute order
	     Copy emits — so a ADJUST drag → Copy → paste-over is a numbers-only
	     diff, AND the dev "Save" button (which finds a Draw shape's tag by an
	     exact literal string) can rewrite it in place. A multi-line tag would
	     drag fine but Save couldn't find it. -->
	<Path name="flow" start={[200, 620]} segments={[{ to: [520, 620] }, { to: [820, 470], c1: [939, 643] }, { to: [1180, 470], bend: 0.778 }, { to: [1520, 620], c1: [1360, 470], c2: [1400, 620] }]} arrow="end" color="#2980b9" thickness={6} label="a straight line, a curve, an arc and a cubic chained into one arrow" labelText="one continuous stroke" labelAt={0.4} labelOffset={40} />

	<!-- A serpentine of alternating arcs, revealed as ONE draw-on stroke. -->
	<Path name="wave" start={[220, 940]} segments={[{ to: [480, 940], bend: 0.6 }, { to: [696, 732], bend: -0.6 }, { to: [1000, 940], bend: 0.6 }, { to: [1260, 940], bend: -0.6 }, { to: [1520, 940], bend: 0.6 }]} color="#f39c12" thickness={5} label="a serpentine of alternating arcs drawing itself on as one stroke" draw={2.5} />
</Draw>

<ViewSource {source} {path} />

<style>
	.tag {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		font-size: 1.5em;
		font-weight: bold;
		color: #9fd3ff;
	}
</style>
