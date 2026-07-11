<!--
  Example: Block component (LAYOUT mode — drag to place, copy the values)
  File: src/routes/slides/block-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Label       from '$lib/components/Label.svelte';
	import Block       from '$lib/components/Block.svelte';
	import ImageBlock  from '$lib/components/ImageBlock.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import codecat     from './codecat.png';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/block-component.html/+page.svelte';
</script>

<ContentPage title="Block" subtitle="Drag-to-place layout, in fixed canvas pixels">
	<div style="line-height: 1.5em;">
		<p>
			Wrap content in a <Label>Block</Label> to pin it at an exact
			<code>(x, y)</code> with a fixed <code>width</code>/<code>height</code> in
			canvas pixels &mdash; then flip <b>LAYOUT</b> on (top-right, next to the
			display control) to drag and resize it by hand.
		</p>
		<QuickCode style="margin-top: 0.5em;" lang="svelte" code={`<Block x={180} y={620} width={520} height={200}>
  <h2>Pinned content</h2>
</Block>`} />
		<p style="margin-top: 0.6em; opacity: 0.8;">
			Drag tracks the cursor 1:1 in both FITTED and SCALED modes. The cat is an
			<Label>ImageBlock</Label> &mdash; it fills its panel and keeps its aspect
			ratio (hold <b>Alt</b> to reshape it). Press <b>Esc</b> mid-drag to cancel,
			or <b>Ctrl+Z</b> / <b>Ctrl+Shift+Z</b> to undo / redo. The <b>Copy</b> button
			hands back an updated <code>&lt;ImageBlock&gt;</code> tag.
		</p>
		<p style="margin-top: 0.6em; opacity: 0.8;">
			Overlapping Blocks paint in DOM order &mdash; give one a <code>z</code> to
			change that. In LAYOUT mode the <b>&#x2912;</b> / <b>&#x2913;</b> buttons
			bring a Block to the front or send it to the back; the value rides along in
			<b>Copy</b> / <b>Save</b>. The two swatches below overlap: <code>front</code>
			carries <code>z={1}</code>, so it sits over <code>back</code>.
		</p>
	</div>
</ContentPage>

<!-- Demo objects, parked low on the canvas so they clear the title + text. -->
<Block name="hero" x={90} y={740} width={520} height={200} grid={10}>
	<div class="demo a"><b>Drag me</b><br/>snaps to 10px</div>
</Block>

<!-- bounds="none": drag/resize past the canvas edge (off-stage or bleeding over). -->
<Block name="aside" x={1245} y={709} width={400} height={280} bounds="none">
	<div class="demo b"><b>Resize me</b><br/>or drag me off-edge</div>
</Block>

<!-- ImageBlock: the image fills the panel, so it takes whatever shape you drag
     the box into (fit="fill", the default). -->
<ImageBlock name="cat" src={codecat} alt="Coding Booth cat" x={777} y={685} width={303} height={303} bounds="none" />

<!-- Stacking order: `front` comes FIRST in the markup, so DOM paint order alone
     would bury it — but z={1} lifts it over `back` (default z=0). Flip LAYOUT on
     and use the ⤒ / ⤓ buttons to reorder them; Copy/Save writes the z back. -->
<Block name="front" x={1331} y={310} width={280} height={168} z={1}>
	<div class="demo c"><b>front</b><br/>z=1</div>
</Block>
<Block name="back" x={1518} y={399} width={280} height={168}>
	<div class="demo d"><b>back</b><br/>z=0 (default)</div>
</Block>

<ViewSource {source} {path} />

<style>
	.demo {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		border-radius: 12px;
		font-size: 1.5em;
		line-height: 1.4;
	}
	.demo.a {
		background: #1f3a4d;
		border: 2px solid #2980b9;
		color: #c0f1ff;
	}
	.demo.b {
		background: #1f4d33;
		border: 2px solid #00b356;
		color: #d8ffe9;
	}
	/* Overlapping z-order pair: solid fills so the overlap reads clearly. */
	.demo.c {
		background: #4d2f1f;
		border: 2px solid #d98a2b;
		color: #ffe9d0;
	}
	.demo.d {
		background: #3a1f4d;
		border: 2px solid #9b59b6;
		color: #f0d8ff;
	}
</style>
