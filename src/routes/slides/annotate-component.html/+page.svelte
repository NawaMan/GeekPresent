<!--
  Example: ANNOTATE — the speaker's pen (1 of 3: drawing).
  File: src/routes/slides/annotate-component.html/+page.svelte

  Like adjust-mode.html, this slide IS its own demo: the ✎ ANNOTATE button at the top of
  the canvas is real in the deployed build (the deck sets `annotate` on <SlideDeck>), so
  the audience watches the ink land on the very slide that explains it.

  What ink DOES afterwards — that it stays, and can therefore go stale — is the next
  slide's job, and the payoff needs this one to have been drawn on first.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Label       from '$lib/components/Label.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import Kbd         from '$lib/components/Kbd.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/annotate-component.html/+page.svelte';
</script>

<ContentPage title="Annotate" subtitle="The speaker's pen — draw on the live slide">
	<div style="line-height: 1.55em;">
		<p>
			<b>ANNOTATE</b> is a <i>speaker</i> tool. <Label>Spotlight</Label> can already ring a
			named <Label>Block</Label> &mdash; but only one the <i>author</i> thought to name ahead
			of time. The pen is for what you decide to point at <i>while answering a question</i>:
			circle the term, underline the line of code, cross out the wrong branch.
		</p>
		<p style="margin-top: 0.7em;">
			Press <b>✎ ANNOTATE</b> at the top of the slide, and draw on the boxes below.
		</p>
	</div>
</ContentPage>

<!-- The tools, as a list the audience can follow while the speaker demonstrates each one. -->
<Block name="tools" x={65} y={430} width={880} height={330}>
	<div class="tools">
		<p><b>PEN</b> &mdash; an opaque, freehand line.</p>
		<p>
			<b>HIGHLIGHT</b> &mdash; a fat translucent band you <i>swipe over</i> the words. It
			comes out <b>level</b> however wobbly your hand was, because a highlight belongs on the
			row you swiped, not sloping across it. No DOM ranges to select, so it works over code,
			images and diagrams alike.
		</p>
		<p><b>Swatches</b> &mdash; pick a colour, or open the picker for any other.</p>
		<p>
			<Kbd keys="Mod+Z" /> takes back a stroke &middot; <b>UNDO</b> does the same &middot;
			<Kbd keys="Escape" /> puts the pen down &middot; drag the bar by its <b>⠿</b> grip if it
			is in your way.
		</p>
	</div>
</Block>

<!-- The things to draw ON. Concrete targets beat an empty canvas: the audience sees the ink
     land on something, not float in space. -->
<Block name="circle-me" x={1151} y={355} width={700} height={110}>
	<div class="demo a"><b>Circle me</b></div>
</Block>

<Block name="highlight-me" x={1151} y={504} width={700} height={110}>
	<div class="demo b">Swipe the highlighter over this line</div>
</Block>

<!-- The one thing the pen deliberately does NOT take. Stated here because a speaker's first
     worry about a tool that eats the pointer is whether it also eats their paging keys. -->
<Block name="keys" x={1151} y={663} width={700} height={90}>
	<div class="demo c">
		The pen eats the <b>pointer</b>, never the <b>keyboard</b> &mdash; <Kbd keys="→" /> still pages.
	</div>
</Block>

<Hint text="Press ✎ ANNOTATE (top-centre) and draw on the boxes — then page to the next slide" />

<ViewSource {source} {path} />

<style>
	.tools p {
		margin-bottom: 0.55em;
		line-height: 1.45;
		font-size: 1.05em;
	}
	.demo {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		border-radius: 12px;
		font-size: 1.35em;
		line-height: 1.4;
		padding: 0 0.8em;
	}
	.demo.a {
		background: #1f3a4d;
		border: 2px solid #2980b9;
		color: #c0f1ff;
	}
	.demo.b {
		background: #2a2118;
		border: 2px solid #d98a2b;
		color: #f3e3cf;
	}
	/* Quieter: a footnote, not a third toy. A footnote is a SENTENCE, so it lays out as one
	   — the flex column above stacks each inline child on its own line, which turned this
	   into a ransom note. */
	.demo.c {
		display: block;
		background: #23262b;
		border: 1px solid #3a3f47;
		color: #cfd6de;
		font-size: 1em;
		line-height: 1.5;
		padding: 0.6em 1em;
	}
</style>
