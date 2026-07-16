<!--
  Two independent animation SETS, each on its OWN AnimationBar.
  File: src/routes/animation/two-scenes.html/+page.svelte

  Each set is a positioned region <div> holding a <Draw> (a Sprite "block" + a
  Shape) AND its own <AnimationBar scope=".set-x">. Because the bar collects
  getAnimations({subtree:true}) from its nearest ancestor matching `scope`, and
  anchors its controls to that same positioned ancestor, the two bars govern —
  and sit above — their own region only. Scrub or pause one; the other is
  untouched. The sets run different durations (3s vs 4s) to make that obvious.

  Coordinates in each set are LOCAL to its region's Draw (1860 wide × its own
  height), because each Draw anchors to its positioned region div, not the canvas.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Sprite, Line, Curve } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/two-scenes.html/+page.svelte';

	const cardAStops = [
		{ pct: 0,   x: 60,   y: 125, w: 220, h: 100, rot: -4, ease: 'ease-in'  },
		{ pct: 50,  x: 790,  y: 55,  w: 250, h: 114, rot: 3  },
		{ pct: 100, x: 1560, y: 125, w: 220, h: 100, rot: -3, ease: 'ease-out' }
	];
	const cardBStops = [
		{ pct: 0,   x: 1560, y: 125, w: 220, h: 100, rot: 4,  ease: 'ease-in'  },
		{ pct: 50,  x: 790,  y: 55,  w: 250, h: 114, rot: -2 },
		{ pct: 100, x: 60,   y: 125, w: 220, h: 100, rot: 3,  ease: 'ease-out' }
	];
</script>

<ContentPage title="Two scenes, two bars" subtitle="Two independent animation sets — each a Sprite + a Shape — on its own AnimationBar.">
	<p class="hint">
		Each framed region is its <b>own</b> timeline &mdash; a <Label>Sprite</Label> (a
		moving block) and a <Label>Shape</Label> (a self-drawing beam) on the
		<b>AnimationBar inside it</b>. Press <b>ANIMATE</b> on one and <b>scrub or
		pause</b>: the other keeps its own playhead (<b>3s</b> up top, <b>4s</b> below).
	</p>
</ContentPage>

<!-- SET A — top region (amber). Draw + Sprite + Line, one bar, 3s. -->
<div class="anim-set set-a">
	<div class="set-tag tag-a">Set A · its own bar · 3s</div>
	<Draw width={1860} height={330} title="Set A — a card flying while a beam draws itself in"
		name="set-a" description="A card sprite flying left to right while an amber beam draws itself in beneath it, on their own AnimationBar.">
		<Line name="beamA" from={[40, 268]} to={[1820, 268]} draw={3} color="#f39c12" thickness={6} />
		<Sprite name="cardA" animate={3} stops={cardAStops}>
			<div class="card card-a">◆ Block A</div>
		</Sprite>
	</Draw>
	<AnimationBar scope=".set-a" highlight />
</div>

<!-- SET B — bottom region (blue). Draw + Sprite + Curve, its own bar, 4s. -->
<div class="anim-set set-b">
	<div class="set-tag tag-b">Set B · its own bar · 4s</div>
	<Draw width={1860} height={330} title="Set B — a card flying while a curved beam draws itself in"
		name="set-b" description="A card sprite flying right to left while a blue curved beam draws itself in, on a separate AnimationBar.">
		<Curve name="arcB" from={[40, 278]} to={[1820, 278]} c1={[930, 215]} draw={4} color="#4aa3f0" thickness={6} />
		<Sprite name="cardB" animate={4} stops={cardBStops}>
			<div class="card card-b">◆ Block B</div>
		</Sprite>
	</Draw>
	<AnimationBar scope=".set-b" highlight />
</div>

<ViewSource {source} {path} />

<style>
	.hint {
		line-height: 1.4em;
	}

	/* Each set is a positioned canvas region: the Draw anchors here (not the
	   canvas), and the region's own AnimationBar anchors to its bottom. */
	.anim-set {
		position: absolute;
		left: 30px;
		width: 1860px;
		height: 330px;
		border-radius: 16px;
	}
	.set-a {
		top: 320px;
		border: 2px dashed rgba(240, 163, 62, 0.4);
	}
	.set-b {
		top: 690px;
		border: 2px dashed rgba(74, 163, 240, 0.45);
	}
	.set-tag {
		position: absolute;
		left: 18px;
		top: 12px;
		z-index: 2;
		font-family: 'Fira Code', monospace;
		font-size: 20px;
		letter-spacing: 0.04em;
	}
	.tag-a {
		color: #f0bd6a;
	}
	.tag-b {
		color: #8fc4f0;
	}

	.card {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 14px;
		font-size: 30px;
		font-weight: bold;
	}
	.card-a {
		color: #ffe6bf;
		background: #3a2c12;
		border: 2px solid #f0a33e;
	}
	.card-b {
		color: #cfe9ff;
		background: #14293a;
		border: 2px solid #4aa3f0;
	}
</style>
