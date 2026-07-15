<!--
  Example: how a slide reads its own PROGRESS through the deck.
  File: src/routes/slides/progress-demo.html/+page.svelte

  This slide IS its own demo. The numbers below are not typed in — they come out of
  getProgress(), the same reactive store any page can call, reading the live route. The
  thin bar at the very bottom of the window is the <ProgressBar> component (the one
  geeklight wears deck-wide); here it just rides along on this one slide, showing this
  slide's own place in the deck.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Block from '$lib/components/Block.svelte';
	import Label from '$lib/components/Label.svelte';
	import Hint from '$lib/components/Hint.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';

	import { getPages, getProgress } from '$lib/presentation';
	import { visiblePages } from '$lib/utils/navigate';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/progress-demo.html/+page.svelte';

	// The whole feature in one line: a reactive read of where this slide sits. It reads
	// the slide list setPages() already published and the live route, so it just works.
	const progress = getProgress();

	// fraction is 0..1; show it as a rounded percent beside the bar.
	$: percent = Math.round($progress.fraction * 100);

	// Awareness of the neighbours, not just the number: the deck's visible list (the same
	// one $progress.index counts against) gives the slide on either side of this one.
	const listed = visiblePages(getPages());
	$: prev = $progress.present && $progress.index > 0 ? listed[$progress.index - 1] : null;
	$: next = $progress.present && $progress.index < listed.length - 1 ? listed[$progress.index + 1] : null;
</script>

<ContentPage title="Progress" subtitle="Every slide can ask where it sits in the deck">
	<div style="line-height: 1.5em; font-size: 0.86em;">
		<p>
			The deck shell always knew your position — it is what the presenter console's
			<Label>n / N</Label> reads. <Label>getProgress()</Label> hands that same knowledge to a
			slide's <i>own</i> code, so a page can draw a bar, a "3 / 7" chip, or anything that
			reacts to where it is — without re-deriving it from the DOM.
		</p>
		<p style="margin-top: 0.5em;">
			It returns a reactive store of <Label>position</Label>, <Label>total</Label>,
			<Label>fraction</Label> and <Label>present</Label>. It counts <b>visible</b> slides only, so a
			hidden appendix neither inflates the total nor shows a bar. The maths is a pure, total core, so
			an off-list route degrades to <i>present: false</i> rather than <code>NaN</code>.
		</p>
		<QuickCode
			style="margin-top: 0.6em;"
			lang="svelte"
			code={`import { getProgress } from '$lib/presentation';
const progress = getProgress();   // a reactive store

<p>Slide {$progress.position} of {$progress.total}</p>`}
		/>
	</div>
</ContentPage>

<!-- The live readout — every value straight out of $progress, so it agrees with the bar
     at the bottom of the window necessarily, not by coincidence. -->
<Block name="live" x={68} y={667} width={1777} height={228}>
	<div class="demo">
		<h3>This slide, live</h3>
		<div class="row">
			<div class="side prev">
				{#if prev}
					<span class="dir">◀ prev</span>
					<span class="name" data-testid="prev">{prev.title}</span>
				{/if}
			</div>
			<div class="figure" data-testid="figure">
				<span class="pos">{$progress.position}</span>
				<span class="of">/</span>
				<span class="total">{$progress.total}</span>
			</div>
			<div class="side next">
				{#if next}
					<span class="dir">next ▶</span>
					<span class="name" data-testid="next">{next.title}</span>
				{/if}
			</div>
		</div>
		<div class="track" aria-hidden="true">
			<div class="fill" style="width: {percent}%"></div>
		</div>
		<div class="pct" data-testid="pct">{percent}% through the deck</div>
	</div>
</Block>

<!-- The real component, pinned to the bottom of the window. It is the deliverable itself,
     genuinely reading this slide's place in the deck — the same one geeklight wears on
     every slide. -->
<ProgressBar />

<Hint text="The 'n / total' readout and the thin bar along the bottom are the same getProgress() data — the real ProgressBar, riding on this slide." />

<ViewSource {source} {path} />

<style>
	.demo {
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.35em;
		border-radius: 12px;
		padding: 0.9em 1.2em;
		background: #1f3a4d;
		border: 2px solid #2980b9;
		color: #c0f1ff;
	}
	.demo h3 {
		margin: 0;
		font-size: 0.9em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.85;
	}
	/* prev — figure — next, so the box shows it knows its neighbours, not just its index. */
	.row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1em;
		width: 100%;
	}
	.side {
		flex: 1 1 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		font-size: 0.8em;
	}
	.side.prev {
		align-items: flex-start;
		text-align: left;
	}
	.side.next {
		align-items: flex-end;
		text-align: right;
	}
	.side .dir {
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 0.82em;
		opacity: 0.7;
	}
	.side .name {
		font-weight: 600;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.figure {
		flex: none;
		display: flex;
		align-items: baseline;
		gap: 0.25em;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
	.figure .pos {
		font-size: 3.4em;
		font-weight: bold;
	}
	.figure .of {
		font-size: 2em;
		opacity: 0.55;
	}
	.figure .total {
		font-size: 2.4em;
		opacity: 0.85;
	}
	.track {
		width: 82%;
		height: 12px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.14);
		overflow: hidden;
	}
	.track .fill {
		height: 100%;
		border-radius: inherit;
		background: #2980b9;
		transition: width 240ms ease;
	}
	.pct {
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
		opacity: 0.9;
	}
	code {
		font-family: ui-monospace, monospace;
		font-size: 0.92em;
		padding: 0 0.2em;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.12);
	}
</style>
