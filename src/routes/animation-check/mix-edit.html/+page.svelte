<!--
  Step 1c — a Block and a Shape on ONE slide, both editable.
  File: src/routes/animation-check/mix-edit.html/+page.svelte

  The Block and the Draw share the one LAYOUT gate. Draw's "Copy changed"
  bundles the moved Block AND the moved shape into a single OLD/NEW patch.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Block from '$lib/components/Block.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Rect } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation-check/mix-edit.html/+page.svelte';
</script>

<ContentPage title="Block + Shape — editable" subtitle="Both on one slide, both under one LAYOUT toggle.">
	<p class="hint">
		A <Label>Block</Label> (HTML) and a <Label>Draw</Label> shape (SVG) sit on the
		same slide in the same coordinate space and share the <i>one</i> LAYOUT gate.
		Flip <b>LAYOUT</b> and drag either one; Draw's <b>Copy&nbsp;changed</b> even
		bundles the moved Block <i>and</i> the moved shape into a single patch.
	</p>
</ContentPage>

<Block name="card" x={230} y={480} width={480} height={220}>
	<div class="demo-card">
		◆ A Block
		<span>HTML</span>
	</div>
</Block>

<Draw
	title="A Block and a Shape side by side"
	name="mix-edit"
	description="An HTML Block card on the left and a rounded Rect shape on the right, both editable in LAYOUT mode on one slide."
>
	<Rect name="frame" x={1210} y={480} width={480} height={220} rounded={16} color="#4aa3f0" thickness={4} />
</Draw>

<ViewSource {source} {path} />

<style>
	.hint {
		line-height: 1.4em;
	}
	.demo-card {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.2em;
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
