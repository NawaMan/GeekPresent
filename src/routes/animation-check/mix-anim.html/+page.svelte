<!--
  Step 2c — animate a Block AND a Shape together.
  File: src/routes/animation-check/mix-anim.html/+page.svelte

  A <Sprite> (the moving Block) and an animated shape (a <Line> drawing itself
  in) in ONE <Draw> on ONE <AnimationBar>. Both are pure CSS @keyframes, so one
  bar scrubs them on one timeline and the one Draw toolbar edits either.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Sprite, Line } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation-check/mix-anim.html/+page.svelte';
</script>

<ContentPage title="Block + Shape — animated" subtitle="One Draw, one AnimationBar, one editor — together.">
	<p class="hint">
		Put a <Label>Sprite</Label> (the moving Block) and an animated shape (a
		<Label>Line</Label> drawing itself in) in the <i>same</i> <Label>Draw</Label>, and
		<b>one</b> <Label>AnimationBar</Label> scrubs both on one timeline; the same Draw
		toolbar edits either. Press <b>ANIMATE</b>.
	</p>
</ContentPage>

<Draw
	title="A card flies while a beam draws itself in — one timeline"
	name="mix-anim"
	description="A Sprite card flying a keyframed path while a Line beam draws itself in beneath it, both scrubbed together by a single AnimationBar."
>
	<Sprite
		name="card"
		animate={3}
		stops={[
			{ pct: 0,   x: 210,  y: 640, w: 360, h: 170, rot: -6, ease: 'ease-in'  },
			{ pct: 55,  x: 820,  y: 470, w: 430, h: 203, rot: 4  },
			{ pct: 100, x: 1360, y: 610, w: 360, h: 170, rot: -4, ease: 'ease-out' }
		]}
	>
		<div class="demo-card">
			◆ A Block
			<span>a Sprite</span>
		</div>
	</Sprite>

	<Line name="beam" from={[200, 980]} to={[1500, 980]} draw={3} color="#f39c12" thickness={7} />
</Draw>

<AnimationBar highlight />

<ViewSource {source} {path} />

<style>
	.hint {
		line-height: 1.4em;
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
		font-size: 34px;
		font-weight: bold;
		color: #cfe9ff;
		background: #14293a;
		border: 2px solid #4aa3f0;
	}
	.demo-card span {
		font-size: 18px;
		font-weight: normal;
		color: #9fc4e0;
	}
</style>
