<!--
  Step 3b — SpriteStudio, the studio that replaced KeyframeStudio.
  File: src/routes/animation-check/sprite-studio.html/+page.svelte

  The same box-flight as slides 5–7, packaged as the drop-in <SpriteStudio/> — a
  Sprite-in-Draw wrapper. It carries the exact drop-in shape KeyframeStudio did
  (name / initialStops / duration / fontScale), yet the motion is pure CSS
  @keyframes and it is edited by the shared Draw toolbar — now WITH numeric
  L/T/W/H/R fields (flip ADJUST, click the card). KeyframeStudio is gone; this is
  the one authoring tool.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import SpriteStudio from '$lib/components/SpriteStudio.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation-check/sprite-studio.html/+page.svelte';

	// The SAME box-flight data as slides 5–7 — the drop-in shape KeyframeStudio used.
	const cardStops = [
		{ pct: 0,   x: 210,  y: 855, w: 340, h: 160, rot: -6, ease: 'ease-in'  },
		{ pct: 55,  x: 820,  y: 690, w: 400, h: 188, rot: 4  },
		{ pct: 100, x: 1360, y: 835, w: 340, h: 160, rot: -4, ease: 'ease-out' }
	];
</script>

<ContentPage title="SpriteStudio — the one studio" subtitle="The drop-in wrapper that replaced KeyframeStudio — Sprite-in-Draw under the hood.">
	<p class="hint">
		This flies a card through the <Label>SpriteStudio</Label> wrapper &mdash; a
		<Label>Sprite</Label> inside a <Label>Draw</Label> on a bundled
		<Label>AnimationBar</Label>, packaged so it drops onto any slide with no
		wiring. It kept KeyframeStudio's exact drop-in shape, but the motion is now
		pure <b>CSS @keyframes</b> (it prerenders), and it is edited by the
		<b>shared Draw toolbar</b> &mdash; now with <b>numeric <code>L/T/W/H/R</code></b>
		fields per stop, the one thing the old panel had that the Draw editor lacked.
	</p>
	<p class="watch">
		▶ Flip <b>ADJUST</b> and click the card: drag its ghosts <i>or</i> type exact
		<code>L/T/W/H/R</code> in the toolbar &mdash; same setter, live preview. One
		box vocabulary, one unified editor.
	</p>
</ContentPage>

<SpriteStudio name="card-fly" initialStops={cardStops} duration={3} highlight>
	<div class="demo-card">
		◆ A Block
		<span>via SpriteStudio</span>
	</div>
</SpriteStudio>

<ViewSource {source} {path} />

<style>
	.hint {
		line-height: 1.4em;
	}
	.watch {
		margin: 0.6em 0 0;
		font-size: 0.92em;
		color: #d6e6f2;
	}
	.demo-card {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.2em;
		text-align: center;
		padding: 0 0.8em;
		border-radius: 16px;
		font-size: 32px;
		font-weight: bold;
		color: #cfe9ff;
		background: #14293a;
		border: 2px solid #4aa3f0;
	}
	.demo-card span {
		font-size: 17px;
		font-weight: normal;
		color: #9fc4e0;
	}
</style>
