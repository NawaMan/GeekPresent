<!--
  Example: style vs. the geometry LAYOUT drags
  File: src/routes/slides/layout-style-guard.html/+page.svelte

  This slide IS the demo. The left box below really does carry
  style="left: 40px" — a declaration that used to cancel its x/y outright. Flip
  LAYOUT on and drag it: it moves, because the props own the geometry and the
  stray `left` is stripped before the style is applied. The badge over the box is
  the component telling you so.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Block       from '$lib/components/Block.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Callout     from '$lib/components/Callout.svelte';
</script>

<ContentPage title="style vs. LAYOUT" subtitle="Who owns the geometry?">
	<p>
		Every component takes a <code>style</code> prop, applied last so your declaration wins.
		On a draggable <code>Block</code> that has one sharp edge: the box writes its own
		<code>left</code>/<code>top</code>/<code>width</code>/<code>height</code>, and your style
		lands in the <em>same</em> declaration block &mdash; where the last one simply wins. A stray
		<code>left</code> would replace <code>x</code> outright, and LAYOUT would drag a box that
		could not move.
	</p>
	<p>
		So those properties are <b>reserved</b>: <b>the props own the geometry</b>, and
		<code>style</code> owns the cosmetics. A geometry declaration is stripped before the style
		is applied &mdash; never silently obeyed.
	</p>

	<!-- The geometry is elided with … on purpose, as in every other Block sample in this
	     deck. A code sample lives in the same file as the real tag, and LAYOUT's patcher
	     scans the RAW SOURCE: a sample that spells out both `name` and x/y/width/height is
	     a byte-for-byte twin of the real Block below, and SAVE rightly refuses to guess
	     which of the two you dragged — so the drag silently fails to save. -->
	<QuickCode style="margin-top: 0.4em;" lang="svelte" code={`<!-- \`left\` is IGNORED (x wins). \`border\` is applied. -->
<Block name="pinned" … style="left: 40px; border: 2px dashed" />`} />

	<Callout kind="tip" title="Try it">
		Flip <b>LAYOUT</b> on (top-right) and drag the amber box. It moves &mdash; and wears a badge
		saying which declaration it ignored. Your source is untouched: <b>Copy</b> hands the
		<code>style</code> back verbatim, dead <code>left</code> and all, for you to delete.
	</Callout>
</ContentPage>

<!-- The demo pair, side by side. Both are real; neither is a picture of a bug. -->
<Block name="pinned" x={528} y={878} width={300} height={150}
       style="left: 40px; border: 2px dashed var(--layout-warn-bg, #f0a33e); border-radius: 8px;">
	<div class="demo warn">
		<b>style="left: 40px"</b>
		<span>reserved &rarr; stripped. Drags fine; <code>x</code> wins.</span>
	</div>
</Block>

<Block name="cosmetic" x={1091} y={846} width={425} height={179}
       style="border: 2px solid var(--ACCENT, #2980b9); border-radius: 8px; transform: rotate(-2deg);">
	<div class="demo">
		<b>style="transform: rotate(-2deg)"</b>
		<span>cosmetic &rarr; kept, and still wins.</span>
	</div>
</Block>

<style>
	.demo {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.35em;
		height: 100%;
		padding: 0 0.9em;
		text-align: center;
		font-size: 0.62em;
	}
	.demo b {
		font-family: 'Fira Code', monospace;
	}
	.demo.warn b {
		color: var(--layout-warn-bg, #f0a33e);
	}
	.demo span {
		opacity: 0.75;
	}
</style>
