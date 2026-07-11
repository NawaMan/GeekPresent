<!--
  Example: authoring a flying element with SpriteStudio.
  File: src/routes/animation/keyframe-studio.html/+page.svelte

  SpriteStudio is the drop-in authoring wrapper (successor to KeyframeStudio): a
  <Sprite> inside a decorative <Draw> on its own <AnimationBar>. Drop ONE
  component and you get ghosts, the shared Draw toolbar (drag OR numeric
  L/T/W/H/R + per-stop easing), a scrubbable bar and a <Sprite>-tag Copy. The
  motion is pure CSS @keyframes, so the slide prerenders.

    1. Open this slide with `?layout` (or toggle LAYOUT, top-right, in dev).
    2. Click the element; drag a ghost to move / resize / rotate that stop, or
       type exact L/T/W/H/R in the toolbar.
    3. Retime a stop's %, set its per-segment easing, "+ keyframe", ✕ to remove.
    4. Scrub the AnimationBar, then Copy the <Sprite> tag.
-->
<script lang="ts">
	import ContentPage   from '$lib/templates/ContentPage.svelte';
	import QuickCode      from '$lib/components/QuickCode.svelte';
	import SpriteStudio   from '$lib/components/SpriteStudio.svelte';
	import ViewSource     from '$lib/components/ViewSource.svelte';
	import source        from './+page.svelte?raw';

	const path = 'src/routes/animation/keyframe-studio.html/+page.svelte';

	// Start poses for the rocket — the Sprite clones these into editable stops.
	// Five stops with a rotation flourish: climbs nose-up (20→26°), banks hard
	// the other way (-48°) and settles at -45°. (font-size = h × fontScale.)
	const stops = [
		{ pct: 0,   x: 0,    y: 1025, w: 56,  h: 55,  rot: 20,  ease: 'ease-in'  },
		{ pct: 50,  x: 950,  y: 437, w: 142, h: 137, rot: 26  },
		{ pct: 75,  x: 1419, y: 307, w: 191, h: 200, rot: 24  },
		{ pct: 85,  x: 1531, y: 246, w: 215, h: 212, rot: -48, ease: 'ease-out' },
		{ pct: 100, x: 1528, y: 432, w: 228, h: 219, rot: -45 },
	];
</script>

<ContentPage title="Sprite Studio" subtitle="Drag, type, rotate, add/remove stops & scrub — one drop-in authoring loop">
	<div style="line-height: 1.5em;">
		<p>
			The rocket flies through a row of faint <b>ghost</b> stops. Flip
			<b>LAYOUT</b> on, click it, then drag a ghost to <b>move / resize / rotate</b>
			that stop &mdash; or type exact <code>L/T/W/H/R</code> in the Draw toolbar.
			Retime each stop's <code>%</code>, set its <b>easing</b> (the launch eases
			<i>in</i>, the bank eases <i>out</i>), <b>+&nbsp;keyframe</b> to add one,
			<b>✕</b> to remove. It's pure CSS <code>@keyframes</code>, so it prerenders:
		</p>
		<QuickCode style="margin-top: 0.5em;" lang="svelte" code={`<SpriteStudio name="fly" initialStops={stops} duration={2.5} fontScale={0.84}>🚀</SpriteStudio>`} />
		<p style="margin-top: 0.6em; opacity: 0.8;">
			The whole authoring loop is one <code>&lt;SpriteStudio/&gt;</code> &mdash; a
			<b>Sprite</b> in a <b>Draw</b> on a bundled <b>AnimationBar</b> &mdash; so it
			drops onto any slide. Nothing is saved; it's a preview. <b>Copy</b> emits a
			<code>&lt;Sprite&gt;</code> tag with the stops and per-stop easing;
			<code>fontScale</code> grows the 🚀 glyph with its box as it travels.
		</p>
	</div>
</ContentPage>

<!-- The whole authoring loop: ghosts + the Draw toolbar + AnimationBar + Copy. -->
<SpriteStudio name="fly" initialStops={stops} duration={2.5} fontScale={0.84}>🚀</SpriteStudio>

<ViewSource {source} {path} />
