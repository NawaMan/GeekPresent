<!--
  Example: KeyframeStudio reuse — the SAME authoring tool on a different slide.
  File: src/routes/slides/keyframe-reuse.html/+page.svelte

  Same <KeyframeStudio/> as the rocket slide, but:
    - a plain card as the moving element (not an emoji),
    - four stops in a Z-path (constant size, so it's pure position),
    - NO fontScale, so no font-size track is emitted (the label keeps its size),
    - a different name + time.
  Nothing here is bespoke — only the slot content, the stops and the props differ.
-->
<script>
	import ContentPage   from '$lib/templates/ContentPage.svelte';
	import KeyframeStudio from '$lib/components/KeyframeStudio.svelte';
	import ViewSource     from '$lib/components/ViewSource.svelte';
	import source        from './+page.svelte?raw';

	const path = 'src/routes/slides/keyframe-reuse.html/+page.svelte';

	// Four stops, same box size — so the motion is pure position.
	const stops = [
		{ pct: 0,   x: 37,   y: 233, w: 240, h: 130 },
		{ pct: 33,  x: 1138, y: 414, w: 240, h: 130 },
		{ pct: 66,  x: 140,  y: 800, w: 240, h: 130 },
		{ pct: 100, x: 1540, y: 800, w: 240, h: 130 },
	];
</script>

<ContentPage title="KeyframeStudio, reused" subtitle="Same tool, different slide — a card on a four-stop path">
	<div style="line-height: 1.5em;">
		<p>
			This slide drops the very same <code>&lt;KeyframeStudio/&gt;</code> as the
			rocket demo &mdash; only the slotted element, the stops and the props change.
			Here it's a plain <b>card</b> on a <b>four-stop path</b> at constant size
			(pure position), with <b>no</b> <code>fontScale</code> so the label keeps its
			size and no <code>font-size</code> keyframe is emitted.
		</p>
		<p style="margin-top: 0.6em; opacity: 0.8;">
			Flip <b>LAYOUT</b> on (top-right), drag the four ghosts, scrub the
			<b>AnimationBar</b>, then <b>Copy</b> the <code>@keyframes</code>.
		</p>
	</div>
</ContentPage>

<KeyframeStudio name="travel" initialStops={stops} duration={4}>
	<div class="card">★ GeekPresent</div>
</KeyframeStudio>

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
		color: #ffe9b0;
		background: #3a2c12;
		border: 2px solid #f0a33e;
	}
</style>
