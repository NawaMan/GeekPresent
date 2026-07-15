<!--
  Step 1a — a Block is an editable HTML box.
  File: src/routes/animation-check/block-edit.html/+page.svelte

  Just a <Block>. In ADJUST it grows a drag body + resize handle + a Copy that
  emits the updated <Block …> tag. Nothing is saved — you paste the tag back.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Block from '$lib/components/Block.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation-check/block-edit.html/+page.svelte';
</script>

<ContentPage title="Block — editable" subtitle="An HTML box, pinned in canvas pixels.">
	<p class="hint">
		A <Label>Block</Label> wraps any HTML &mdash; text, a card, an image, a table
		&mdash; and pins it at exact <code>(x, y)</code> with a fixed size in the deck's
		1920&times;1080 space. Turn <b>ADJUST</b> on (add <code>?adjust</code> to the URL,
		then click the toggle): <b>drag</b> the body, drag the corner to <b>resize</b>,
		and <b>Copy</b> writes the updated <code>&lt;Block&gt;</code> tag.
	</p>
</ContentPage>

<Block name="card" x={710} y={470} width={500} height={230}>
	<div class="demo-card">
		◆ A Block
		<span>HTML content, pinned in canvas px</span>
	</div>
</Block>

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
		gap: 0.25em;
		text-align: center;
		padding: 0 1em;
		border-radius: 16px;
		font-size: 40px;
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
