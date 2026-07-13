<!--
  Example: ANNOTATE (3 of 3: turning it on).
  File: src/routes/slides/annotate-setup.html/+page.svelte

  The authoring half: how a deck offers the pen, and why that switch is DECK-wide when
  LAYOUT's is per-slide. The distinction is the whole reason annotation's access core is a
  tier shorter than layoutAccessCore's, so it is worth a slide of its own rather than a
  parenthesis on the demo.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Callout     from '$lib/components/Callout.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/annotate-setup.html/+page.svelte';

	const deck = `<SlideDeck
    {pages}
    annotate
    inkStaleAfter={24}
    inkColors={[null, '#E5484D', '#3FA9F5']} />`;
</script>

<ContentPage title="Annotate" subtitle="Turning it on — one switch, for the whole deck">
	<div style="line-height: 1.55em;">
		<p>
			One prop on <code>&lt;SlideDeck&gt;</code> offers the pen. It makes the control
			<i>available</i>, not <i>active</i> &mdash; the mode still starts off, so the audience
			sees an ordinary slide until the speaker reaches for it.
		</p>
	</div>
</ContentPage>

<Block name="code" x={65} y={370} width={880} height={300}>
	<QuickCode lang="svelte" code={deck} />
</Block>

<Block name="props" x={65} y={700} width={880} height={230}>
	<div class="props">
		<p><code>annotate</code> &mdash; offer the pen on this deck.</p>
		<p><code>inkStaleAfter</code> &mdash; hours before old ink is worth mentioning (24).</p>
		<p><code>inkColors</code> &mdash; the swatches. <code>null</code> is the theme's own colour.</p>
		<p><code>levelHighlight</code> &mdash; keep highlighter swipes level (on).</p>
	</div>
</Block>

<!-- The design note that earns this slide: the axis is different from LAYOUT's, on purpose. -->
<Block name="why" x={995} y={370} width={860} height={330}>
	<Callout kind="info" title="Why deck-wide, and not per-slide?">
		<p>
			<code>layout: true</code> is set on the individual slides that <i>teach</i> LAYOUT,
			because LAYOUT is an <b>authoring</b> aid &mdash; the slide being authored has a real
			opinion about whether you should be dragging on it.
		</p>
		<p style="margin-top: 0.4em;">
			The pen is a <b>speaker</b> tool. The slide you happen to be standing on when someone
			asks a question has no opinion about whether you may circle a word on it. So there is
			no per-slide flag &mdash; and paging cannot take the pen out of your hand mid-answer.
		</p>
	</Callout>
</Block>

<Block name="sticky" x={995} y={730} width={860} height={200}>
	<Callout kind="tip" title="Or just ask for it, on any deck">
		<p>
			<code>?annotate</code> on any slide URL opts a built deck in by hand. It is
			<b>sticky</b> &mdash; it follows you across slides &mdash; and
			<code>?annotate=off</code> clears it again. <code>vite dev</code> always offers the pen.
		</p>
	</Callout>
</Block>

<Hint text="This deck sets `annotate` — which is why the pen is here on every slide" />

<ViewSource {source} {path} />

<style>
	.props p {
		margin-bottom: 0.5em;
		line-height: 1.45;
		font-size: 1.05em;
	}
</style>
