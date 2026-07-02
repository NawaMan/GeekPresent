<!--
  Example: Draw × KeyframeStudio — annotation and keyframe motion, one timeline
  File: src/routes/slides/draw-keyframe.html/+page.svelte

  KeyframeStudio flies the 🚀 through three positioned stops (a WAAPI
  keyframe animation, authorable in LAYOUT mode); Draw annotates the same
  scene — a dashed Curve tracing the flight plan that draws itself over the
  SAME 4 seconds, and an Ellipse that circles the destination just before
  arrival. The studio's embedded AnimationBar collects every finite
  animation in the slide (WAAPI and CSS alike), so the rocket, the trace,
  and the circling all pause/scrub/restart together as ONE scene.

  Both tools are LAYOUT-editable on this very slide: drag the ghost stops
  to re-route the rocket, drag the Curve's handles to re-trace the plan,
  and retime each self-draw right in the toolbar — the Curve's draw-on
  time/delay in the Draw panel, the Ellipse's under its editing box — then
  Copy (or "Copy changed") the updated tags back into this source.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import KeyframeStudio from '$lib/components/KeyframeStudio.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import Block from '$lib/components/Block.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Curve, Draw, Ellipse } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/draw-keyframe.html/+page.svelte';

	// The flight: three stops, small → large, banking as it climbs. Centers
	// sit on the Curve's trace below — Block x/y and Draw points share the
	// same canvas pixels, so the two tools line up by construction.
	const stops = [
		{ pct: 0,   x: 300,  y: 910, w: 60,  h: 60,  rot: 0  },
		{ pct: 50,  x: 840,  y: 640, w: 120, h: 120, rot: 20 },
		{ pct: 100, x: 1470, y: 530, w: 180, h: 180, rot: 35 },
	];
</script>

<ContentPage title="Draw × KeyframeStudio" subtitle="Keyframe motion and self-drawing annotation, one scrubbable scene">
	<div style="line-height: 1.5em;">
		<p>
			<Label>KeyframeStudio</Label> flies the rocket through three LAYOUT-draggable
			stops (a WAAPI keyframe animation); <Label>Draw</Label> traces the flight
			plan with a dashed <Label>Curve</Label> over the <b>same 4 seconds</b> and
			circles the destination just before arrival. The studio's bar collects every
			finite animation in the slide — WAAPI and CSS alike — so motion and
			annotation pause, scrub, and restart as <b>one timeline</b>. Flip
			<b>LAYOUT</b> on and each self-draw is editable in place: retime the
			Curve's reveal in the Draw toolbar's <b>draw-on</b> fields (and the
			Ellipse's under its box), then Copy the updated tag back.
		</p>
		<QuickCode style="margin-top: 0.5em;">
			&lt;KeyframeStudio name="launch" initialStops=&#123;stops&#125; duration=&#123;4&#125; fontScale=&#123;0.84&#125;&gt;🚀&lt;/KeyframeStudio&gt;<br/>
			&lt;Curve from=&#123;[330, 940]&#125; to=&#123;[1560, 620]&#125; c1=&#123;[855, 620]&#125; dash draw=&#123;4&#125; /&gt;<br/>
			&lt;Ellipse x=&#123;1420&#125; … draw=&#123;0.8&#125; drawDelay=&#123;3.2&#125; /&gt;
		</QuickCode>
	</div>
</ContentPage>

<!-- The launchpad, parked at the bottom of the canvas. -->
<Block name="pad" x={180} y={980} width={300} height={70}>
	<div class="pad">LAUNCHPAD</div>
</Block>

<!-- The flight plan + destination, on the same canvas pixels as the stops.
     The Curve draws itself across the flight's 4s; the Ellipse rings the
     arrival zone over the final stretch. -->
<Draw title="Flight plan annotation" name="flightplan"
	description="A dashed curve tracing the rocket's route from the launchpad up to the destination, and an ellipse circling the arrival zone as the rocket gets there.">
	<Curve name="plan" from={[330, 940]} to={[1560, 620]} c1={[855, 620]} color="#f39c12" dash label="the planned flight path" labelText="flight plan" labelOffset={-36} draw={4} />
	<Ellipse name="arrival" color="#e74c3c" label="the arrival zone, circled on arrival" draw={0.8} drawDelay={3.2} x={1400} y={480} width={320} height={280} />
</Draw>

<!-- The moving element + ghost stops + panel + AnimationBar, all in one
     reusable component. Its bar governs the WHOLE slide's animations, so
     the Draw shapes above scrub with the rocket. -->
<KeyframeStudio name="launch" initialStops={stops} duration={4} fontScale={0.84}>🚀</KeyframeStudio>

<ViewSource {source} {path} />

<style>
	.pad {
		width: 100%;
		height: 100%;
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
