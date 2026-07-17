<!--
  Example: Sprite — quick curve animation with the first-class `path` prop.
  File: src/routes/animation/sprite-curve.html/+page.svelte

  A <Sprite> normally tweens straight between discrete stops. Give it `path`
  instead and it follows a real curve: the component samples the shape
  internally (pointAt → position, angleAt → tangent, unwrapped so the glyph
  never spin-flips) into generated CSS keyframes, spaced by ARC LENGTH so the
  travel speed is constant. Pure CSS, so it prerenders and the AnimationBar
  scrubs it like everything else. `size` is the box that rides the path
  (centre on the curve), `orient` banks it to the tangent (default; turn it
  off for a symmetric glyph), `rotate` offsets art that doesn't point "up".

  This slide is the QUICK form: two glyphs, each on its own INVISIBLE literal
  path — a triangle banking a cubic, a circle drifting an arc the other way,
  one shared duration so they start and finish together (a sprite may also
  carry its own `animate` for an independent clock — it still scrubs on the
  same bar, it just ends earlier). In ADJUST, select either glyph's dashed flight
  path and you get that curve's own handles (from/to + c1/c2, or the arc's
  bend grip); Copy/SAVE round-trip the literal points in the sprite's tag.

  `path` also takes the NAME of a Line/Curve/Arc drawn in the same <Draw>
  (path="road") — the sprite then rides that shape's LIVE geometry and the
  shape's tag is the single source of truth. Use that when the path should be
  SEEN; note the flight tracks the draw-on tip only approximately — pixel-
  exact "thing rides the pen" choreography is <Canvas> territory.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Sprite } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/sprite-curve.html/+page.svelte';
</script>

<ContentPage
	title="Sprite — Following a Curve"
	subtitle="path= hands the Sprite a curve; it rides it — no line drawn, no stops authored"
>
	<div style="line-height: 1.5em;">
		<p>
			Give a <Label>Sprite</Label> a <code>path</code> instead of stops and it
			flies a real <b>curve</b>: the component samples the shape into generated
			keyframes — position from the point, rotation from the <b>tangent</b> — all
			pure CSS, scrubbed by the <b>one</b> AnimationBar. Here two glyphs each ride
			their own <b>invisible</b> path: the triangle banks a <b>cubic</b>; the
			circle drifts back along an <b>arc</b> (<code>orient={'{false}'}</code> —
			a dot has no nose), together on one clock. Flip <b>ADJUST</b> and select a
			dashed flight path: you get <b>that curve's handles</b>, and Copy/SAVE
			round-trip the literal points. (<code>path</code> also takes the <b>name</b>
			of a drawn <Label>Curve</Label> — <code>path="road"</code> — to ride a
			visible shape's live geometry.)
		</p>
		<QuickCode
			style="margin-top: 0.5em;"
			lang="svelte"
			code={`<Sprite name="tri" path={{ kind: "cubic", from: […], c1: […], c2: […], to: […] }} animate={4.5} size={60}>▲</Sprite>
<Sprite name="orb" path={{ kind: "arc", from: […], to: […], bend: 0.1 }} animate={4.5} orient={false}>●</Sprite>`}
		/>
	</div>
</ContentPage>

<Draw
	title="Two glyphs flying their own invisible curves"
	name="sprite-curve"
	description="A triangle glyph banks along an invisible cubic bézier from lower-left to upper-right while a circle drifts the other way along an invisible arc, starting and finishing together on one timeline."
>
	<!-- The triangle: banks a cubic, lower-left to upper-right. -->
	<Sprite name="tri" path={{ kind: "cubic", from: [170, 1010], c1: [560, 770], c2: [1524, 739], to: [1089, 629] }} animate={4.5} size={60} fontScale={0.8}>
		<span class="flier-glyph">▲</span>
	</Sprite>

	<!-- The circle: drifts back right-to-left on a shallow arc. A dot has no
	     nose, so orient={false} keeps it upright. Same duration as the
	     triangle, so the two start and finish together; give it its own
	     `animate` to run it on an independent clock instead. -->
	<Sprite name="orb" path={{ kind: "arc", from: [1750, 820], to: [1074, 619], bend: 0.5 }} animate={4.5} size={70} orient={false} fontScale={0.9}>
		<span class="orb-glyph">●</span>
	</Sprite>
</Draw>

<AnimationBar highlight />

<ViewSource {source} {path} />

<style>
	.flier-glyph {
		color: #f39c12;
		filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
	}
	.orb-glyph {
		color: #3fa7e0;
		filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
	}
</style>
