<!--
  Example: Draw — a flying SPRITE and an SVG shape on ONE timeline.
  File: src/routes/animation/draw-sprite.html/+page.svelte

  This is the KeyframeStudio "flying element" folded into the Draw family: a
  <Sprite> is now just another shape inside <Draw>, so a moving HTML element
  (the 🚀) and a self-drawing SVG <Line> share one surface, one keyframe panel,
  one Copy, and ONE AnimationBar. Both are pure generated CSS animations, so
  the page prerenders and the ANIMATE bar scrubs the rocket's flight and the
  beam's draw-progress together.

  Flip LAYOUT on and click a shape:
    · the Sprite's stops each show a ghost box with MOVE / RESIZE / ROTATE
      handles — drag to author the flight; the panel retimes / adds / removes
      stops and sets per-stop easing (the launch eases in, the bank eases out);
    · the Line selects into the same panel for its endpoints + draw timing.
  Everything is finder state — Copy → paste to persist.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Line, Sprite } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/draw-sprite.html/+page.svelte';
</script>

<ContentPage title="Draw — Flying Sprite" subtitle="A moving HTML element and an SVG shape on one Draw surface, one timeline">
	<div style="line-height: 1.4em;">
		<p>
			The <Label>Sprite</Label> is the KeyframeStudio flying element folded into
			<Label>Draw</Label> — just another shape. The rocket climbs
			<b>ease-in</b>, banks hard <b>ease-out</b>, and grows with its box
			(<code>fontScale</code>); alongside it a plain <Label>Line</Label> draws
			itself in. Both are pure CSS animations on <b>one</b> AnimationBar. Flip
			<b>LAYOUT</b> on, click the rocket, and drag each stop's ghost —
			<b>move</b>, <b>resize</b>, <b>rotate</b> — then retime / add / ease the
			keyframes in the panel and <b>Copy</b>.
		</p>
		<QuickCode style="margin-top: 0.4em;">
			&lt;Sprite name="rocket" animate=&#123;2.5&#125; fontScale=&#123;0.84&#125; stops=&#123;[&#123; pct: 0, x: 0, y: 1025, w: 56, h: 55, rot: 20, ease: "ease-in" &#125;, …]&#125;&gt;🚀&lt;/Sprite&gt;
		</QuickCode>
	</div>
</ContentPage>

<Draw title="A rocket flying a keyframed path while a beam draws itself in" name="sprite"
	description="An HTML rocket sprite climbs and banks across five keyframe stops as a straight beam draws itself in beneath it — both on one timeline.">
	<!-- The flying element: five stops, a rotation flourish, grows as it climbs. -->
	<Sprite name="rocket" animate={2.5} fontScale={0.84} stops={[
		{ pct: 0,   x: 0,    y: 1025, w: 56,  h: 55,  rot: 20,  ease: "ease-in"  },
		{ pct: 50,  x: 950,  y: 437,  w: 142, h: 137, rot: 26  },
		{ pct: 75,  x: 1419, y: 307,  w: 191, h: 200, rot: 24  },
		{ pct: 85,  x: 1531, y: 246,  w: 215, h: 212, rot: -48, ease: "ease-out" },
		{ pct: 100, x: 1528, y: 432,  w: 228, h: 219, rot: -45 }
	]}>🚀</Sprite>

	<!-- A companion SVG shape on the SAME timeline: a beam that draws itself in. -->
	<Line name="beam" from={[120, 980]} to={[1780, 980]} draw={2.5} color="#f39c12" thickness={7} />
</Draw>

<!-- One control for both: the rocket's flight and the beam's draw-progress are
     ordinary CSS animations, so the bar scrubs them together. -->
<AnimationBar highlight />

<ViewSource {source} {path} />
