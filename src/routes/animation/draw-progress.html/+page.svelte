<!--
  Example: Draw — keyframed PROGRESS on every shape (Line, Curve, Arc)
  File: src/routes/animation/draw-progress.html/+page.svelte

  Three shapes, one 4-second timeline, each with a `drawn` reveal track in
  its stops:
    · Line  — reveal only: a straight beam whose DRAW PROGRESS is keyframed
      non-linearly (half-drawn at 75%);
    · Curve — geometry (c1) + reveal: bends more as it draws itself in;
    · Arc   — geometry (bend) + reveal: opens up while drawing.
  Each keyframe also carries its own EASING (animation-timing-function on
  that keyframe), so the reveal accelerates/decelerates per segment — the
  Line eases in then out, the Curve sweeps ease-in, the Arc runs linear.
  All pure generated CSS (d: path() / sampled polyline + stroke-dashoffset
  keyframes), so it prerenders and the ANIMATE bar scrubs every track
  together. Flip ADJUST on and select ANY shape: the keyframe panel shows a
  %, a drawn % field, and an easing picker per keyframe — editable on all
  three — plus a LIVE readout (▸ 48% · 62% drawn) that tracks the playhead
  as you drag the ANIMATE bar. The panel stays up while you scrub.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Arc, Curve, Draw, Line } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/draw-progress.html/+page.svelte';
</script>

<ContentPage title="Draw — Keyframed Progress" subtitle="Keyframe the DRAW progress on every shape — Line, Curve, Arc">
	<div style="line-height: 1.4em;">
		<p>
			Each keyframe carries a <Label>drawn</Label> fraction, so the SELF-DRAW is
			keyframed non-linearly (half-drawn at <b>75%</b>) — on all three shapes.
			<Label>Curve</Label> and <Label>Arc</Label> also morph their geometry as they
			go, and each keyframe carries its own <b>easing</b> (the Line's crawl
			eases <i>in</i> then its sweep eases <i>out</i>; the Curve sweeps
			<i>ease-in</i>, the Arc <i>linear</i>). Flip <b>ADJUST</b> on, select any
			shape, and edit each keyframe's <b>%</b>, <b>drawn %</b>, and <b>easing</b>
			right in the panel — which shows a <b>live ▸ progress · drawn</b> readout
			that follows the playhead as you press <b>ANIMATE</b> and drag the bar
			(the panel stays up while you scrub).
		</p>
		<QuickCode style="margin-top: 0.4em;" lang="svelte" code={`<Line stops={[{ pct: 0, drawn: 0, ease: "ease-in" }, { pct: 25, drawn: 0.05, ease: "ease-out" }, …]} animate={4} />`} />
	</div>
</ContentPage>

<Draw title="Keyframed draw-progress on a line, a curve and an arc" name="progress"
	description="A straight line, a curve and an arc, each drawing itself in with a non-linear reveal — half-drawn at three-quarters of the timeline; the curve and arc also bend more as they go.">
	<!-- Row labels (raw SVG through the escape hatch — static, not animated). -->
	<text x="150" y="560" fill="#f39c12" font-family="'Fira Code', monospace" font-size="34">Line</text>
	<text x="150" y="760" fill="#4aa3ff" font-family="'Fira Code', monospace" font-size="34">Curve</text>
	<text x="150" y="980" fill="#00c56a" font-family="'Fira Code', monospace" font-size="34">Arc</text>

	<!-- Line: reveal ONLY — a straight beam drawn in non-linearly. -->
	<Line name="beam" from={[360, 550]} to={[1640, 550]} stops={[{ pct: 0, drawn: 0, ease: "ease-in" }, { pct: 75, drawn: 0.95 }, { pct: 100, drawn: 1 }, { pct: 25, drawn: 0.05, ease: "ease-out" }]} animate={4} color="#f39c12" thickness={7} />

	<!-- Curve: geometry (c1 pulls up → more bend) + non-linear reveal. -->
	<Curve name="sweep" from={[360, 780]} to={[1640, 720]} c1={[1000, 900]} stops={[{ pct: 0, c1: [1000, 900], drawn: 0 }, { pct: 75, drawn: 0.95 }, { pct: 100, c1: [1001, 520], drawn: 1 }, { pct: 25, c1: [1000, 900], drawn: 0.05, ease: "ease-in" }]} animate={4} color="#4aa3ff" thickness={7} />

	<!-- Arc: bend morph (opens up) + non-linear reveal. -->
	<Arc name="loop" from={[360, 980]} to={[1640, 980]} bend={0.12} stops={[{ pct: 0, bend: 0.12, drawn: 0 }, { pct: 75, drawn: 0.95 }, { pct: 100, bend: 0.34, drawn: 1 }, { pct: 25, bend: 0.12, drawn: 0.05, ease: "linear" }]} animate={4} color="#00c56a" thickness={7} />
</Draw>

<!-- ANIMATE control: all tracks are ordinary CSS animations on one timeline,
     so the bar scrubs every shape's bend + draw progress together. -->
<AnimationBar highlight />

<ViewSource {source} {path} />
