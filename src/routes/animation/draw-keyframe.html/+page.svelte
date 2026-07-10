<!--
  Example: Draw × Sprite — annotation and keyframe motion, one timeline.
  File: src/routes/animation/draw-keyframe.html/+page.svelte

  The rocket is a <Sprite> flying three positioned stops INSIDE the same <Draw>
  that annotates the scene — a dashed Curve tracing the flight plan that draws
  itself over the SAME 4 seconds, and an Ellipse that circles the destination
  just before arrival. One <AnimationBar> collects every finite animation in the
  slide, and since the Sprite's flight, the Curve's trace and the Ellipse's ring
  are all pure CSS @keyframes, they pause / scrub / restart together as ONE scene
  that PRERENDERS.

  Everything is LAYOUT-editable on this very slide: click the rocket and drag its
  ghost stops (or type L/T/W/H/R) to re-route it, drag the Curve's handles to
  re-trace the plan, and retime each self-draw right in the Draw toolbar — the
  Curve's draw-on time/delay, the Ellipse's under its editing box — then Copy
  (or "Copy changed") the updated tags back into this source.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import Block from '$lib/components/Block.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Curve, Draw, Ellipse, Sprite } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/draw-keyframe.html/+page.svelte';

	// The flight: three stops, small → large, banking as it climbs. Centers sit
	// on the Curve's trace below — Sprite x/y and Draw points share the same
	// canvas pixels, so the two line up by construction.
	const stops = [
		{ pct: 0,   x: 300,  y: 910, w: 60,  h: 60,  rot: 0  },
		{ pct: 50,  x: 840,  y: 640, w: 120, h: 120, rot: 20 },
		{ pct: 100, x: 1470, y: 530, w: 180, h: 180, rot: 35 },
	];
</script>

<ContentPage title="Draw × Sprite" subtitle="Keyframe motion and self-drawing annotation, one scrubbable scene">
	<div style="line-height: 1.5em;">
		<p>
			A <Label>Sprite</Label> flies the rocket through three LAYOUT-draggable stops
			<i>inside</i> a <Label>Draw</Label> that also traces the flight plan with a
			dashed <Label>Curve</Label> over the <b>same 4 seconds</b> and circles the
			destination just before arrival. <b>One</b> AnimationBar collects every finite
			animation in the slide — all pure CSS — so motion and annotation pause, scrub,
			and restart as <b>one timeline</b>, and the whole scene prerenders. Flip
			<b>LAYOUT</b> on and each piece is editable in place: re-route the rocket
			(drag ghosts or type <code>L/T/W/H/R</code>), retime the Curve's reveal in the
			toolbar's <b>draw-on</b> fields (and the Ellipse's under its box), then Copy.
		</p>
		<QuickCode style="margin-top: 0.5em;" lang="svelte" code={`<Draw>
  <Curve from={[330, 940]} to={[1560, 620]} c1={[855, 620]} dash draw={4} />
  <Ellipse x={1400} … draw={0.8} drawDelay={3.2} />
  <Sprite name="launch" animate={4} fontScale={0.84} stops={stops}>🚀</Sprite>
</Draw>`} />
	</div>
</ContentPage>

<!-- The launchpad, parked at the bottom of the canvas. -->
<Block name="pad" x={180} y={980} width={300} height={70}>
	<div class="pad">LAUNCHPAD</div>
</Block>

<!-- One Draw: the flight-plan trace + arrival ring + the flying rocket, all on
     the same canvas pixels and one CSS timeline. -->
<Draw title="Flight plan and rocket, one scene" name="flightplan"
	description="A dashed curve tracing the rocket's route from the launchpad up to the destination, an ellipse circling the arrival zone, and the rocket flying the route — all scrubbed together.">
	<Curve name="plan" from={[330, 940]} to={[1560, 620]} c1={[855, 620]} color="#f39c12" dash label="the planned flight path" labelText="flight plan" labelOffset={-36} draw={4} />
	<Ellipse name="arrival" color="#e74c3c" label="the arrival zone, circled on arrival" draw={0.8} drawDelay={3.2} x={1400} y={480} width={320} height={280} />
	<Sprite name="launch" animate={4} fontScale={0.84} stops={stops}>🚀</Sprite>
</Draw>

<!-- One control for the whole scene: flight, trace and ring are all CSS
     animations, so this single bar scrubs them together. -->
<AnimationBar highlight />

<ViewSource {source} {path} />

<style>
	.pad {
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 10px;
		font-family: 'Fira Code', monospace;
		font-size: 1.2em;
		letter-spacing: 0.25em;
		background: #1f3a4d;
		border: 2px solid #2980b9;
		color: #c0f1ff;
	}
</style>
