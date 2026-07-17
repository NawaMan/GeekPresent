<!--
  Example: Sprite — flying a polyline path (waypoints, straight or smoothed).
  File: src/routes/animation/sprite-polyline.html/+page.svelte

  `path` also takes a POLYLINE: waypoints instead of from/to. Straight
  segments give a zig-zag flight whose heading SNAPS at every corner (there is
  no continuous tangent at a corner — angle-unwrapped, so it turns the short
  way, but abruptly; that crispness IS the look). Add `smooth: true` and the
  same waypoints become a Catmull-Rom that passes exactly THROUGH every point,
  so the flight curves continuously instead. Everything else is the curve
  machinery untouched: arc-length sampling (constant travel speed), generated
  CSS keyframes, one scrubbing AnimationBar.

  Two flights here, showing the two orientation modes: the triangle zig-zags an
  INVISIBLE straight polyline with the default `orient` — a nose-up glyph banks
  to the tangent, so watch its nose SNAP at each vertex. The truck rides a
  VISIBLE <Polyline name="route" smooth> by NAME with `upright`: a side-view
  glyph would flip upside down if it banked, so upright keeps it LEVEL and
  MIRRORS it to face travel, flipping at each turnaround. One live geometry
  drives both the road and the flight (the named shape must come earlier in the
  markup — Connector's rule). In ADJUST, the zig-zag grows one handle PER
  WAYPOINT; the named route is edited on the Polyline itself — select its
  stroke, drag any waypoint, and the truck re-routes live off the shared geometry.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Polyline, Sprite } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/sprite-polyline.html/+page.svelte';
</script>

<ContentPage
	title="Sprite — Riding a Polyline"
	subtitle="waypoints as a path — and two ways to orient a rider: bank to the tangent, or ride upright"
>
	<div style="line-height: 1.5em;">
		<p>
			A <code>path</code> can be a <b>polyline</b>: a list of <b>waypoints</b>
			instead of from/to. Straight segments make the heading <b>snap</b> at every
			corner — the triangle's nose flicks at each vertex of its invisible zig-zag
			(no continuous tangent exists there; that crispness is the look). Give the
			same idea <code>smooth: true</code> and the waypoints become a Catmull-Rom
			through <b>every</b> point — a continuous curve. The truck is a
			<b>side-view</b> glyph, so instead of banking (which would flip it
			upside down) it rides <code>upright</code>: kept level and
			<b>mirrored</b> to face its direction of travel. The road is a named
			<Label>Polyline</Label> and the truck rides it <b>by name</b>
			(<code>path="route"</code>), so one geometry drives both the stroke and
			the flight. Flip <b>ADJUST</b>: the zig-zag grows one handle
			<b>per waypoint</b>, and selecting the <b>road</b> lets you drag its
			waypoints — the truck re-routes live off the shared geometry.
		</p>
		<QuickCode
			style="margin-top: 0.5em;"
			lang="svelte"
			code={`<Sprite name="zig" path={{ kind: "polyline", points: [[140, 1030], […], [1260, 990]] }} animate={4.5} size={60}>▲</Sprite>
<Polyline name="route" points={[[1180, 1030], […], [1800, 700]]} smooth dash />
<Sprite name="truck" path="route" animate={4.5} upright>🚚</Sprite>`}
		/>
	</div>
</ContentPage>

<Draw
	title="A zig-zag of straight legs and a smoothed road, one timeline"
	name="sprite-polyline"
	description="A triangle glyph zig-zags along an invisible straight polyline, its heading snapping at every corner, while a truck rides a visible smoothed polyline road by name — both scrubbed on one shared timeline."
>
	<!-- The road, drawn AND ridden: `name` publishes the live geometry, the
	     truck below rides it by name — author the waypoints once. -->
	<Polyline name="route" points={[[1592, 974], [1400, 870], [1792, 785], [1500, 747]]} smooth color="#7f8c8d" thickness={3} dash />

	<!-- The triangle: straight legs, invisible. The heading SNAPS at each
	     waypoint — no corner rounding, that abruptness is the demo. -->
	<Sprite name="zig" path={{ kind: "polyline", points: [[140, 1030], [420, 700], [700, 1010], [980, 680], [1260, 990]] }} animate={4.5} size={60} fontScale={0.8}>
		<span class="zig-glyph">▲</span>
	</Sprite>

	<!-- The truck: rides the named road above in `upright` mode — a side-view
	     glyph stays level and mirrors to face travel, instead of banking to the
	     tangent (which would roll a 🚚 onto its roof on the right-to-left legs). -->
	<Sprite name="truck" path="route" animate={4.5} size={64} upright fontScale={0.9}>
		<span class="truck-glyph">🚚</span>
	</Sprite>
</Draw>

<AnimationBar highlight />

<ViewSource {source} {path} />

<style>
	.zig-glyph {
		color: #e74c3c;
		filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
	}
	.truck-glyph {
		filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
	}
</style>
