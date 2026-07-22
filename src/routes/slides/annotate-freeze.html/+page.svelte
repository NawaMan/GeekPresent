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
	import { Draw, Line, Polyline } from '$lib/draw';
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
<Block name="ring-me" x={1101} y={495} width={760} height={150}>
	<div class="demo a">
		the <code>p99</code> is the number that matters &mdash; <b>ring it</b>
	</div>
</Block>

<!-- Something worth underlining, and something worth boxing: one target per shape the
     mapping produces, so the demo covers the whole table below. -->
<Block name="underline-me" x={1104} y={779} width={760} height={140}>
	<div class="demo b">
		<span>every request pays it</span>
		<span class="tip">underline a line &middot; box a region &middot; arrow at a word</span>
	</div>
</Block>

<!-- The mapping, stated where the speaker meets it. This is the whole feature: it is not
     new geometry, it is a translation between two things that already share a coordinate
     space (the ink surface and <Draw> are both 1920x1080). -->
<Block name="mapping" x={64} y={475} width={950} height={300}>
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

<!-- Frozen from an ANNOTATE stroke. -->
<Draw>
	<Polyline points={[[1044.35, 639.45], [1031.76, 629.38], [1024.21, 628.12], [1014.14, 623.08], [1001.55, 621.83], [988.96, 621.83], [976.37, 621.83], [968.81, 621.83], [962.52, 623.08], [954.96, 625.6], [948.67, 629.38], [943.63, 633.16], [938.6, 636.93], [936.08, 640.71], [933.56, 649.52], [933.56, 654.56], [934.82, 664.63], [939.86, 670.93], [947.41, 679.74], [952.45, 687.29], [956.22, 694.85], [961.26, 702.4], [967.55, 709.96], [973.85, 717.51], [978.89, 722.55], [983.92, 726.32], [987.7, 730.1], [995.25, 733.88], [1002.81, 733.88], [1014.14, 731.36], [1017.91, 728.84], [1022.95, 725.06], [1033.02, 716.25], [1038.06, 709.96], [1041.84, 703.66], [1045.61, 696.11], [1049.39, 688.55], [1053.17, 682.26], [1054.43, 677.22], [1054.43, 667.15], [1054.43, 662.11], [1053.17, 657.08], [1050.65, 649.52], [1046.87, 645.75], [1043.1, 640.71], [1039.32, 636.93]]} smooth thickness={6} />
	<Polyline points={[[949.93, 662.11], [957.48, 657.08], [967.55, 648.26], [971.33, 644.49], [976.37, 639.45], [983.92, 634.42], [986.44, 630.64], [991.48, 626.86], [983.92, 635.67], [976.37, 645.75], [973.85, 650.78], [965.04, 665.89], [962.52, 670.93], [958.74, 683.52], [954.96, 689.81], [953.7, 696.11], [951.19, 701.14], [963.78, 693.59], [970.07, 687.29], [982.66, 675.96], [991.48, 668.41], [997.77, 662.11], [1005.32, 657.08], [1010.36, 653.3], [1015.4, 649.52], [1019.17, 647.01], [1022.95, 644.49], [1029.25, 641.97], [1020.43, 649.52], [1011.62, 659.6], [1005.32, 667.15], [1000.29, 672.19], [997.77, 677.22], [995.25, 683.52], [991.48, 691.07], [990.22, 696.11], [987.7, 699.88], [996.51, 696.11], [1000.29, 693.59], [1026.73, 681], [1031.76, 679.74], [1049.39, 674.7], [1060.72, 672.19], [1055.69, 679.74], [1049.39, 686.03], [1039.32, 696.11], [1029.25, 704.92], [1024.21, 711.21], [1020.43, 714.99], [1016.66, 720.03], [1011.62, 725.06], [1009.1, 726.32]]} smooth color="#E5484D" thickness={6} />
	<Line from={[753.52, 759.06]} to={[928.52, 692.33]} arrow="end" color="#3FA9F5" thickness={6} />
	<Line from={[1295, 718]} to={[1076, 694]} arrow="end" color="#4BD07A" thickness={6} />
	<Line from={[902.09, 499.7]} to={[943.63, 595.39]} arrow="end" color="#4BD07A" thickness={6} />
</Draw>

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
