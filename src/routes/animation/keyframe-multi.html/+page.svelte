<!--
  Example: SEVERAL objects on one slide, each authored by its OWN SpriteStudio.
  File: src/routes/animation/keyframe-multi.html/+page.svelte

  A SpriteStudio flies ONE element along its stops. So "many independently
  keyframed objects" = many <SpriteStudio/> instances, one per object. Each one
  brings its own ghosts, its own stop editor (the Draw toolbar, keyed by `name`
  so they don't collide), and its own Copy — you author each object separately.

  Three different KINDS of moving element, to show the slot is anything renderable:
    1. a GLYPH   — the 🚀 emoji (HTML text; grows via fontScale).
    2. a BLOCK   — an HTML card, i.e. exactly the kind of box <Block> wraps.
    3. a SHAPE   — a self-contained inline <svg> star (grows + spins).

  WHY THE SHAPE IS INLINE SVG, NOT <Line/>: a Draw shape (<Line>, <Curve>, …)
  renders BARE svg elements and only works inside <Draw>'s <svg>; it can't be a
  SpriteStudio slot on its own. To fly a shape as a Sprite you hand it a COMPLETE
  little <svg> as the slot. The tighter many-objects-on-one-timeline path is
  instead ONE <Draw> with several <Sprite>s (see the "Sprites × Many" slide) —
  one AnimationBar governing every sprite, with per-sprite LAYOUT editing.

  ONE CAVEAT WORTH SEEING: each SpriteStudio also bundles an <AnimationBar/>, and
  that bar defaults to scope `.content` — the whole slide. So the three bars overlap
  at the bottom and the visible one scrubs ALL three objects together on the shared
  slide timeline. The AUTHORING is independent (three panels); the PLAYBACK is shared.
  That shared-timeline behaviour is exactly what one <Draw> + <Sprite>s makes
  first-class (one bar, on purpose) — the point of the "Sprites × Many" slide.

    1. Open with `?layout` (or toggle LAYOUT, top-right, in dev).
    2. Click an object, drag its ghosts to re-pose it; swing a grip to rotate.
    3. Each panel: edit %, L/T/W/H/R + easing, +keyframe, ✕, Copy.
-->
<script>
	import ContentPage  from '$lib/templates/ContentPage.svelte';
	import SpriteStudio from '$lib/components/SpriteStudio.svelte';
	import ViewSource   from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/animation/keyframe-multi.html/+page.svelte';

	// 1) GLYPH — 🚀 climbs from the lower-left, growing as it goes (fontScale).
	const rocketStops = [
		{ pct: 0,   x: 80,   y: 930, w: 56,  h: 55,  rot: 20,  ease: 'ease-in' },
		{ pct: 60,  x: 980,  y: 300, w: 120, h: 118, rot: 18 },
		{ pct: 100, x: 1600, y: 150, w: 160, h: 157, rot: -30 },
	];

	// 2) BLOCK — an HTML card at constant size (pure position), tracing a triangle
	//    in the lower-right. No fontScale, so the label keeps its size.
	const cardStops = [
		{ pct: 0,   x: 1480, y: 880, w: 240, h: 130 },
		{ pct: 50,  x: 820,  y: 660, w: 240, h: 130 },
		{ pct: 100, x: 1480, y: 440, w: 240, h: 130 },
	];

	// 3) SHAPE — an inline SVG star that grows and spins a full turn.
	const starStops = [
		{ pct: 0,   x: 180, y: 600, w: 70,  h: 70,  rot: 0,   ease: 'ease-in-out' },
		{ pct: 50,  x: 520, y: 470, w: 140, h: 140, rot: 180 },
		{ pct: 100, x: 900, y: 820, w: 210, h: 210, rot: 360 },
	];
</script>

<ContentPage title="SpriteStudio × many" subtitle="Three objects — a glyph, a Block card, an SVG shape — each its own studio">
	<div style="line-height: 1.5em;">
		<p>
			A <code>&lt;SpriteStudio/&gt;</code> flies <b>one</b> element, so three
			independently keyframed objects means <b>three</b> studios. Each keeps its
			own <b>ghosts</b>, its own <b>panel</b> (add/remove stops, edit
			<code>%&nbsp;· L/T/W/H/R</code> + easing), and its own <b>Copy</b> &mdash;
			author each on its own.
		</p>
		<p style="margin-top: 0.6em;">
			The moving element is <i>anything renderable</i>: a <b>glyph</b> (🚀), a
			<b>Block-style card</b>, or a self-contained inline <b>SVG shape</b>. A Draw
			<code>&lt;Line/&gt;</code> can't fly here directly (it needs
			<code>&lt;Draw/&gt;</code>'s <code>&lt;svg&gt;</code>); for many objects on
			<i>one</i> timeline, reach for one <code>&lt;Draw&gt;</code> +
			<code>&lt;Sprite/&gt;</code>s instead.
		</p>
		<p style="margin-top: 0.6em; opacity: 0.8;">
			Note the bottom bars overlap: every studio bundles an
			<code>&lt;AnimationBar/&gt;</code> scoped to the whole slide, so playback is
			<b>shared</b> while authoring stays <b>separate</b>. Making that shared
			timeline first-class (one bar, on purpose) is what one <b>Draw</b> +
			<b>Sprites</b> is for &mdash; see <i>Sprites × Many</i>.
		</p>
	</div>
</ContentPage>

<!-- Three studios = three flying objects, each with its own authoring loop. -->
<SpriteStudio name="rocket" initialStops={rocketStops} duration={2.5} fontScale={0.84}>🚀</SpriteStudio>

<SpriteStudio name="card" initialStops={cardStops} duration={4}>
	<div class="card">◆ Block card</div>
</SpriteStudio>

<SpriteStudio name="star" initialStops={starStops} duration={3} origin="50% 50%">
	<svg class="star" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
		<polygon points="50,4 61,37 96,37 68,58 79,92 50,72 21,92 32,58 4,37 39,37" />
	</svg>
</SpriteStudio>

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
