<!-- SSR host for the hand-drawn (rough) render: a <Draw rough> surface with
     every shape, one shape opting back OUT with rough={false}, a filled box in
     each fill style, an arrowed + labelled shape, a draw-on reveal and an
     animated shape. Rendered via svelte/server with no DOM — the point is that
     the wobble is computed from props alone, identically on both sides of the
     wire, so a prerendered slide hydrates without a snap. -->
<script lang="ts">
	import Arc from '../src/lib/draw/Arc.svelte';
	import Curve from '../src/lib/draw/Curve.svelte';
	import Draw from '../src/lib/draw/Draw.svelte';
	import Ellipse from '../src/lib/draw/Ellipse.svelte';
	import Line from '../src/lib/draw/Line.svelte';
	import Path from '../src/lib/draw/Path.svelte';
	import Polyline from '../src/lib/draw/Polyline.svelte';
	import Rect from '../src/lib/draw/Rect.svelte';
</script>

<Draw title="Hand-drawn flow" rough>
	<!-- Inherits the surface's rough, with an arrowhead and a visible label. -->
	<Line name="request" from={[200, 200]} to={[900, 200]} arrow="end" labelText="request" />
	<!-- Opts back OUT of the surface default: this one stays machine-drawn. -->
	<Line name="crisp" from={[200, 260]} to={[900, 260]} rough={false} />
	<!-- An explicit roughness, and a fixed seed for a repeatable draw. -->
	<Curve name="hop" from={[200, 400]} to={[900, 400]} c1={[550, 250]} rough={1.6} seed={7} />
	<Arc name="round" from={[200, 600]} to={[900, 600]} bend={0.4} arrow="both" />
	<Polyline name="route" points={[[200, 700], [400, 780], [700, 700]]} draw={1.5} />
	<Path
		name="chain"
		start={[200, 850]}
		segments={[{ to: [400, 850] }, { to: [600, 780], c1: [500, 850] }]}
		arrow="end"
	/>
	<!-- Box shapes: stroke-only, hachure-filled, cross-hatched, and solid. -->
	<Rect name="frame" x={1000} y={150} width={300} height={160} />
	<Rect name="hatched" x={1000} y={350} width={300} height={160} fill="#3a6ea5" />
	<Ellipse name="crossed" x={1000} y={550} width={300} height={160} fill="#3a6ea5" fillStyle="cross-hatch" />
	<Ellipse name="flat" x={1000} y={750} width={300} height={160} fill="#3a6ea5" fillStyle="solid" />
	<!-- An animated rough shape: per-pass geometry keyframes. -->
	<Line
		name="moving"
		from={[1450, 200]}
		to={[1800, 200]}
		animate={3}
		stops={[
			{ pct: 0, from: [1450, 200], to: [1800, 200] },
			{ pct: 100, from: [1450, 400], to: [1800, 500] }
		]}
	/>
</Draw>
