<!--
  Example: ANNOTATE — FREEZE (5 of 5: keeping a mark).
  File: src/routes/slides/annotate-freeze.html/+page.svelte

  Like the other four annotate slides, this one IS its own demo: press ✎ ANNOTATE, circle
  something below, then pick ❄ FREEZE and tap the mark you drew. It stops being ink.

  The three slides before this one are about MAKING marks and the ink outliving the slide.
  This one is the way out the other side: ink is still transient by design, and FREEZE is
  the single bridge from a live stroke to authored <Draw> source.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Label       from '$lib/components/Label.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/annotate-freeze.html/+page.svelte';
</script>

<ContentPage title="Freeze" subtitle="The one mark you'd rather keep">
	<div style="line-height: 1.55em;">
		<p>
			Ink is <b>transient on purpose</b> &mdash; it's the speaker's pen, kept per slide,
			offered up for clearing once it goes stale. A <Label>Draw</Label> shape is the
			opposite: it's <b>source</b>. <b>FREEZE</b> is the one bridge between them.
		</p>
		<p style="margin-top: 0.7em;">
			Pick <b>&#10052; FREEZE</b> on the pen's bar and it stops drawing and starts
			<b>choosing</b>: hover lights a mark, a tap keeps it lit, tap again to change your
			mind. Nothing happens until you press <b>FREEZE (n)</b> &mdash; then the marks come
			back as <Label>Polyline</Label>, <Label>Line</Label> and <Label>Rect</Label> tags.
		</p>
	</div>
</ContentPage>

<!-- Something worth circling: a term a speaker would ring while answering a question, and
     then decide belongs on the slide for good. -->
<Block name="ring-me" x={1090} y={360} width={760} height={150}>
	<div class="demo a">
		the <code>p99</code> is the number that matters &mdash; <b>ring it</b>
	</div>
</Block>

<!-- Something worth underlining, and something worth boxing: one target per shape the
     mapping produces, so the demo covers the whole table below. -->
<Block name="underline-me" x={1090} y={545} width={760} height={140}>
	<div class="demo b">
		<span>every request pays it</span>
		<span class="tip">underline a line &middot; box a region &middot; arrow at a word</span>
	</div>
</Block>

<!-- The mapping, stated where the speaker meets it. This is the whole feature: it is not
     new geometry, it is a translation between two things that already share a coordinate
     space (the ink surface and <Draw> are both 1920x1080). -->
<Block name="mapping" x={65} y={430} width={950} height={300}>
	<div class="tools">
		<p><b>What each mark becomes.</b></p>
		<ul>
			<li><b>Pen</b> &rarr; a smoothed <Label>Polyline</Label> &mdash; the same curve you drew</li>
			<li><b>Highlighter</b> &rarr; a fat, translucent <Label>Polyline</Label>, never a box</li>
			<li><b>Line / Arrow</b> &rarr; a <Label>Line</Label>, with the arrowhead kept</li>
			<li><b>Rectangle</b> &rarr; a <Label>Rect</Label>, corners the right way up</li>
			<li><b>Text</b> &rarr; stays ink &mdash; the Draw family has no counterpart for it</li>
		</ul>
	</div>
</Block>

<!-- The two destinations, and WHY there are two — the honest version, because a speaker who
     expects a source write and gets a clipboard copy will think it failed. -->
<Block name="lands" x={65} y={760} width={950} height={210}>
	<div class="tools quiet">
		<p>
			<b>Where it lands.</b> Running the deck in <b>dev</b>, FREEZE writes the markup
			<b>straight into this slide's source</b> &mdash; the same write ADJUST's SAVE does,
			and the frozen ink then leaves the pen so the mark can't paint twice.
		</p>
		<p>
			On a <b>built deck</b> there's no source to write, so it copies the markup to the
			<b>clipboard</b> instead &mdash; and the ink <i>stays</i>, because a copy hasn't
			landed until you paste it.
		</p>
	</div>
</Block>

<Hint text="Press ✎ ANNOTATE (top-centre), draw on a box, then pick ❄ FREEZE and tap your mark" />

<ViewSource {source} {path} />

<style>
	.tools p {
		margin-bottom: 0.5em;
		line-height: 1.45;
		font-size: 1.02em;
	}
	.tools ul {
		margin: 0;
		padding-left: 1.2em;
		line-height: 1.5;
		font-size: 0.98em;
	}
	.tools li {
		margin-bottom: 0.15em;
	}
	.tools.quiet {
		opacity: 0.9;
		font-size: 0.95em;
	}
	.demo {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		border-radius: 12px;
		font-size: 1.3em;
		line-height: 1.4;
		padding: 0 0.8em;
	}
	.demo.a {
		background: #17303d;
		border: 2px solid #3f9fc4;
		color: #cfeeff;
	}
	.demo.a code {
		color: #ffe08a;
	}
	.demo.b {
		gap: 0.3em;
		background: #1e2a1f;
		border: 2px solid #4f9a5c;
		color: #d8f0da;
	}
	.demo.b .tip {
		font-size: 0.7em;
		opacity: 0.75;
	}
</style>
