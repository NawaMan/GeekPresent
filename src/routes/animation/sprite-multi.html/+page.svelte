<!--
  Companion to keyframe-multi.html: the SAME three objects, done the Draw way.
  File: src/routes/animation/sprite-multi.html/+page.svelte

  keyframe-multi.html uses THREE <SpriteStudio/>s (one per object), so it also
  bundles three AnimationBars over the slide's `.content` — authoring is
  independent but the visible bar scrubs all three together. Here the same glyph,
  card and shape are three <Sprite>s inside ONE <Draw>, governed by ONE explicit
  <AnimationBar/>. The stop arrays are LITERALLY THE SAME data ({ pct, x, y, w, h,
  rot?, ease? }); only the packaging changed — three drop-in studios vs one Draw.

  What this buys, and what the exercise is meant to prove:
    · ONE timeline, on purpose. The bar scrubs all three sprites (pure CSS
      @keyframes) together — the shared playhead is now the design, not a side
      effect of `.content` scoping.
    · Per-object LAYOUT editing still works: click a sprite, drag its stops'
      MOVE / RESIZE / ROTATE ghosts, retime/ease in the panel, Copy just that tag.
    · Draw shapes can ride the SAME bar (see draw-sprite.html: a <Line> drawing
      itself in beside the rocket) — sprites and native shapes on one surface.

  THE SLOT IS STILL ANYTHING RENDERABLE: a glyph (🚀), an HTML card (what <Block>
  wraps), or a self-contained inline <svg> shape — the moving element rides in a
  <foreignObject>, so HTML and nested SVG both work.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Sprite } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/sprite-multi.html/+page.svelte';

	// The SAME three stop arrays as keyframe-multi.html — three studios vs one Draw.
	const rocketStops = [
		{ pct: 0,   x: 80,   y: 930, w: 56,  h: 55,  rot: 20,  ease: 'ease-in' },
		{ pct: 60,  x: 980,  y: 300, w: 120, h: 118, rot: 18 },
		{ pct: 100, x: 1600, y: 150, w: 160, h: 157, rot: -30 }
	];
	const cardStops = [
		{ pct: 0,   x: 1480, y: 880, w: 240, h: 130 },
		{ pct: 50,  x: 820,  y: 660, w: 240, h: 130 },
		{ pct: 100, x: 1480, y: 440, w: 240, h: 130 }
	];
	const starStops = [
		{ pct: 0,   x: 180, y: 600, w: 70,  h: 70,  rot: 0,   ease: 'ease-in-out' },
		{ pct: 50,  x: 520, y: 470, w: 140, h: 140, rot: 180 },
		{ pct: 100, x: 900, y: 820, w: 210, h: 210, rot: 360 }
	];
</script>

<ContentPage title="Draw — Sprites × Many" subtitle="The same three objects as SpriteStudio × Many — now one Draw, one bar">
	<div style="line-height: 1.4em;">
		<p>
			Same glyph, card and shape as the <Label>SpriteStudio × Many</Label> slide —
			but where that uses three studios (and so three bundled bars), here three
			<Label>Sprite</Label>s sit in <b>one</b> <Label>Draw</Label> on <b>one</b>
			<Label>AnimationBar</Label>. The stop data is <i>identical</i>
			(<code>&#123; pct, x, y, w, h, rot, ease &#125;</code>) — only the packaging
			changed: three drop-in studios vs one explicit Draw.
		</p>
		<p style="margin-top: 0.4em;">
			The shared timeline is now <b>the design</b>, not a scoping accident. Flip
			<b>LAYOUT</b> on, click any sprite to edit just its stops
			(<b>move / resize / rotate</b>), then <b>Copy</b> that one tag. Native Draw
			shapes can ride the same bar too (see <i>Draw — Flying Sprite</i>).
		</p>
	</div>
</ContentPage>

<Draw title="Three sprites — a glyph, a Block card and an SVG shape — on one timeline" name="sprites"
	description="An HTML rocket glyph, an HTML card, and an inline-SVG star each fly their own keyframe path, all scrubbed together by one AnimationBar.">
	<!-- 1) GLYPH — grows via fontScale as it climbs. -->
	<Sprite name="rocket" animate={2.5} fontScale={0.84} stops={rocketStops}>🚀</Sprite>

	<!-- 2) BLOCK — an HTML card at constant size (pure position). -->
	<Sprite name="card" animate={4} stops={cardStops}>
		<div class="card">◆ Block card</div>
	</Sprite>

	<!-- 3) SHAPE — a self-contained inline SVG star that grows and spins. -->
	<Sprite name="star" animate={3} stops={starStops}>
		<svg class="star" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
			<polygon points="50,4 61,37 96,37 68,58 79,92 50,72 21,92 32,58 4,37 39,37" />
		</svg>
	</Sprite>
</Draw>

<!-- ONE control for all three. Each sprite is pure generated CSS @keyframes, so
     this single bar scrubs every sprite's flight together. -->
<AnimationBar highlight />

<ViewSource {source} {path} />

<style>
	.card {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 14px;
		font-size: 34px;
		font-weight: bold;
		color: #cfe9ff;
		background: #14293a;
		border: 2px solid #4aa3f0;
	}
	.star {
		width: 100%;
		height: 100%;
		display: block;
	}
	.star polygon {
		fill: #f0c24a;
		stroke: #7a5c10;
		stroke-width: 4;
		stroke-linejoin: round;
	}
</style>
