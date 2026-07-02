<!--
  Step 2a — the gap: a Block CAN'T animate.
  File: src/routes/animation-check/block-anim.html/+page.svelte

  This slide deliberately shows the wall. A <Block> has x/y/width/height and
  nothing else — no `animate`, no `stops`, no place on an AnimationBar. So there
  is no timeline to press play on. The dashed phantom is where motion "would" go;
  the ✗ is the point. The resolution (hand the content to a Sprite) arrives in
  the final step, where a Block-as-Sprite and a Shape animate together.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Block from '$lib/components/Block.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Rect, Line } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation-check/block-anim.html/+page.svelte';
</script>

<ContentPage title="Block — can't animate" subtitle="An HTML box pins content — but it has no timeline of its own.">
	<p class="hint">
		A <Label>Block</Label> gives you <code>x</code>, <code>y</code>,
		<code>width</code>, <code>height</code> &mdash; and that's the whole vocabulary.
		There's no <code>animate</code>, no <code>stops</code>, and a Block never appears
		in an <Label>AnimationBar</Label>: hand it the <b>ANIMATE</b> button and there's
		nothing to play. Making HTML <i>move</i> isn't a Block feature at all &mdash; you
		hand its content to a <Label>Sprite</Label> (a Draw citizen), which is exactly
		what the last step does.
	</p>
</ContentPage>

<!-- The Block: static, and staying that way. -->
<Block name="card" x={250} y={540} width={440} height={200}>
	<div class="demo-card">
		◆ A Block
		<span>x / y / w / h — that's all</span>
	</div>
</Block>

<!-- The gap, drawn: a dashed connector toward a dashed phantom it can't reach,
     with raw-SVG annotations passed straight through the surface. -->
<Draw
	title="A Block has no timeline to animate along"
	name="gap"
	description="A static HTML Block on the left with a dashed connector leading to a dashed phantom box on the right that it can never reach, marked with an ✗ — a Block cannot animate."
>
	<Line name="reach" from={[700, 640]} to={[1170, 640]} color="#6f6552" thickness={5} dash />
	<Rect name="phantom" x={1230} y={540} width={440} height={200} rounded={16} color="#8a7a52" thickness={3} dash />

	<text x="935" y="675" text-anchor="middle" style="fill:#e05a4d; font-size:92px; font-weight:bold;">✗</text>
	<text x="1450" y="628" text-anchor="middle" style="fill:#cbb985; font-size:34px; font-weight:bold;">can't get here</text>
	<text x="1450" y="676" text-anchor="middle" style="fill:#9a8f70; font-size:24px;">no animate · no stops</text>
</Draw>

<!-- No AnimationBar: there is nothing to play. That absence IS the lesson. -->

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
		gap: 0.25em;
		text-align: center;
		padding: 0 1em;
		border-radius: 16px;
		font-size: 38px;
		font-weight: bold;
		color: #cfe9ff;
		background: #14293a;
		border: 2px solid #4aa3f0;
	}
	.demo-card span {
		font-size: 20px;
		font-weight: normal;
		color: #9fc4e0;
	}
</style>
