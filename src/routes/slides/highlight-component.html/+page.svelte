<!--
  Example: Highlight component
  File: src/routes/slides/highlight-component.html/+page.svelte

  A 3x3 ring of cards, each drawn with <Highlight> from the matching direction,
  so all eight arrow directions (4 sides + 4 diagonals) show at once. The centre
  cell holds the variant gallery (custom colour, pulse off, glow only). The red
  glow follows each target's shape; the arrow points in from the named side.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Highlight   from '$lib/components/Highlight.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/highlight-component.html/+page.svelte';

	// Ring layout: each cell's grid position matches the direction the arrow
	// comes from, so the demo reads at a glance.
	const ring = [
		'top-left',    'top',    'top-right',
		'left',        null,     'right',
		'bottom-left', 'bottom', 'bottom-right',
	];
</script>

<ContentPage title="Highlight" subtitle="Red glow on a target + an arrow pointing in from the side you choose">
	<p style="margin: 0 0 0.2em;">
		Two modes. <b>Wrap</b> a target and pick <code>from</code> — glow uses
		<code>drop-shadow</code> so it hugs the real shape. Or do it
		<b>retrospectively</b>: give an element an id and aim at it with
		<code>target="#id"</code>. A gentle pulse is on by default.
	</p>
	<br/>
	<br/>
	<div class="ring">
		{#each ring as dir}
			{#if dir}
				<div class="cell">
					<Highlight from={dir}>
						<div class="card">from=<b>{dir}</b></div>
					</Highlight>
				</div>
			{:else}
				<div class="cell">
					<div class="variants">
						<Highlight from="left" color="#19b6ff" arrowSize={104}>
							<div class="card alt">custom colour</div>
						</Highlight>
						<Highlight from="right" pulse={false} arrowSize={104}>
							<div class="card alt">static (no pulse)</div>
						</Highlight>
						<Highlight from="bottom" arrow={false} glow={40} opacity={0.7}>
							<div class="card alt">glow only</div>
						</Highlight>
					</div>
				</div>
			{/if}
		{/each}
	</div>
	<br/>
	<br/>
	<p style="margin: 0.3em 0 0; opacity: 0.85;">
		Wrap mode points at an
		<Highlight from="top" arrowSize={92}><span class="word">inline word</span></Highlight>
		&nbsp;&mdash;&nbsp; while remote mode reaches an existing chip
		<span id="remote-chip" class="chip">#remote-chip</span> from afar.
		Props: <code>from</code>, <code>target</code>, <code>color</code>, <code>glow</code>,
		<code>opacity</code>, <code>gap</code>, <code>arrowSize</code>, <code>arrow</code>,
		<code>pulse</code>, <code>show</code>.
	</p>

	<!-- REMOTE: self-closing, no slot — finds #remote-chip and floats a glow + arrow over it. -->
	<Highlight target="#remote-chip" from="bottom" color="#19b6ff" arrowSize={104} />
</ContentPage>

<ViewSource {source} {path} />

<style>
	.ring {
		display: grid;
		grid-template-columns: repeat(3, 308px);
		gap: 60px 150px;
		justify-content: center;
		align-content: center;
		width: max-content;
		margin: 0.6em auto;
	}
	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card {
		width: 297px;
		height: 92px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #1b2530;
		border: 1.5px solid #34465a;
		border-radius: 9px;
		color: #e8eaed;
		font-size: 0.95em;
		white-space: nowrap;
		text-align: center;
	}
	.card b {
		color: #f0a33e;
		margin-left: 0.35em;
	}
	.card.alt {
		width: 242px;
		height: 52px;
	}

	.variants {
		display: flex;
		flex-direction: column;
		gap: 20px;
		align-items: center;
	}

	.word {
		font-weight: 700;
		color: #f0a33e;
	}
	.chip {
		display: inline-block;
		padding: 0.05em 0.5em;
		border-radius: 6px;
		background: #14323f;
		border: 1.5px solid #1f4d5e;
		color: #aee8ff;
		font-family: ui-monospace, monospace;
		font-size: 0.9em;
	}
</style>
