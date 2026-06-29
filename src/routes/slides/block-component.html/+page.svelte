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
		<QuickCode style="margin-top: 0.5em;">
			&lt;Block x=&#123;180&#125; y=&#123;620&#125; width=&#123;520&#125; height=&#123;200&#125;&gt;<br/>
			&nbsp;&nbsp;&lt;h2&gt;Pinned content&lt;/h2&gt;<br/>
			&lt;/Block&gt;
		</QuickCode>
		<p style="margin-top: 0.6em; opacity: 0.8;">
			Drag tracks the cursor 1:1 in both FITTED and SCALED modes. The cat is an
			<Label>ImageBlock</Label> &mdash; it fills its panel and keeps its aspect
			ratio (hold <b>Alt</b> to reshape it). Press <b>Esc</b> mid-drag to cancel,
			or <b>Ctrl+Z</b> / <b>Ctrl+Shift+Z</b> to undo / redo. The <b>Copy</b> button
			hands back an updated <code>&lt;ImageBlock&gt;</code> tag.
		</p>
	</div>
</ContentPage>

<!-- Demo objects, parked low on the canvas so they clear the title + text. -->
<Block name="hero" x={180} y={640} width={520} height={200} grid={10}>
	<div class="demo a"><b>Drag me</b><br/>snaps to 10px</div>
</Block>

<!-- bounds="none": drag/resize past the canvas edge (off-stage or bleeding over). -->
<Block name="aside" x={1180} y={560} width={400} height={280} bounds="none">
	<div class="demo b"><b>Resize me</b><br/>or drag me off-edge</div>
</Block>

<!-- ImageBlock: the image fills the panel, so it takes whatever shape you drag
     the box into (fit="fill", the default). -->
<ImageBlock name="cat" src={codecat} alt="Coding Booth cat" x={760} y={560} width={320} height={320} bounds="none" />

<ViewSource {source} {path} />

<style>
	.demo {
		width: 100%;
		height: 100%;
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
</style>
