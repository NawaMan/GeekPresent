<!--
  Example: ANNOTATE — a straight edge (2 of 4: Shift snaps the pen).
  File: src/routes/slides/annotate-snap.html/+page.svelte

  Like annotate-component.html, this slide IS its own demo: press ✎ ANNOTATE (the deck
  sets `annotate` on <SlideDeck>), hold Shift, and the pen lays a dead-straight line on the
  very slide that explains it — an underline under the code, a plumb line down the column.

  The HIGHLIGHTER already comes out level (annotate-component's job); this is the PEN
  borrowing the same straight-edge discipline from Shift (annotateCore.snapAxis).
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Label       from '$lib/components/Label.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import Kbd         from '$lib/components/Kbd.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/annotate-snap.html/+page.svelte';
</script>

<ContentPage title="A Straight Edge" subtitle="Hold Shift and the pen draws a ruler">
	<div style="line-height: 1.55em;">
		<p>
			Freehand can't hold a straight line on stage &mdash; and underlining a line of code
			or dropping a plumb line down a column is exactly the move you reach for. So the
			<b>PEN</b> borrows the discipline the <Label>Highlight</Label> already has: hold
			<Kbd keys="Shift" /> and the stroke snaps to a <b>dead-straight axis</b>.
		</p>
		<p style="margin-top: 0.7em;">
			The line follows whichever way you've travelled furthest &mdash; sideways for an
			<b>underline</b>, down for a <b>plumb line</b> &mdash; anchored where you pressed.
			Let <Kbd keys="Shift" /> go and it's freehand again.
		</p>
	</div>
</ContentPage>

<!-- Underline target: a mostly-horizontal drag with Shift lays flat under the words. -->
<Block name="underline-me" x={1151} y={355} width={700} height={110}>
	<div class="demo a"><code>deploy(build)</code> &mdash; Shift &amp; underline this</div>
</Block>

<!-- Plumb-line target: a mostly-vertical drag with Shift stands dead vertical. -->
<Block name="plumb-me" x={1151} y={504} width={330} height={256}>
	<div class="demo b">
		<span>one</span>
		<span>two</span>
		<span>three</span>
		<span>four</span>
		<span class="tip">Shift &amp; drop a plumb line down the edge</span>
	</div>
</Block>

<!-- Why it's Shift, stated where a speaker meets the modifier: it's LIVE, so it snaps and
     un-snaps mid-stroke without lifting the pen. -->
<Block name="live" x={65} y={430} width={880} height={330}>
	<div class="tools">
		<p>
			<b><Kbd keys="Shift" /> is a live modifier.</b> Press it partway through a stroke and
			the wobble straightens at once; release it and the mark bows back to freehand &mdash;
			you never have to lift the pen to change your mind.
		</p>
		<p>
			<b>Anchored where you pressed.</b> The ruler grows out from the point the pen went
			down, so the line sits exactly where you started it, not where the wander drifted.
		</p>
		<p>
			<b>A tap is still a dot.</b> A press that hasn't travelled has no axis to snap to, so
			it's left alone &mdash; Shift never swallows a point-mark.
		</p>
	</div>
</Block>

<Hint text="Press ✎ ANNOTATE (top-centre), hold Shift, and draw on the boxes — the line snaps straight" />

<ViewSource {source} {path} />

<style>
	.tools p {
		margin-bottom: 0.7em;
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
	.demo.a code {
		color: #ffe08a;
	}
	/* A stack of rows with a straight left edge — something to run a plumb line down. */
	.demo.b {
		gap: 0.15em;
		background: #2a2118;
		border: 2px solid #d98a2b;
		color: #f3e3cf;
		font-size: 1.1em;
		align-items: flex-start;
		padding: 0.6em 1em;
	}
	.demo.b .tip {
		margin-top: 0.5em;
		font-size: 0.75em;
		opacity: 0.75;
	}
</style>
