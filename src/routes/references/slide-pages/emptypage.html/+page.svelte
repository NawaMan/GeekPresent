<script>
	import EmptyPage from '$lib/templates/EmptyPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Hint from '$lib/components/Hint.svelte';
	import Block from '$lib/components/Block.svelte';
	import { Draw, Line } from '$lib/draw';
</script>

<EmptyPage>
	<!-- Full stage: no ContentPage header, no artificial max-width — 100% of the canvas. -->
	<Block name="header" x={193} y={163} width={292} height={92}>
		<p class="heading">EmptyPage</p>
	</Block>
	<Block name="content" x={762} y={103} width={1039} height={263}>
		<p class="lead">
			A full-canvas slide <b>without</b> a title band. Use it when the layout
			(Blocks, Draw, media) <i>is</i> the slide — not a titled document.
			<br/>
			<br/>
			Different from <b>WebPage</b> / <b>VideoPage</b>: those fill the stage with one embed.
			EmptyPage is the blank stage for your own markup.
		</p>
	</Block>
	<Block name="code" x={385} y={557} width={1139} height={235}>
		<div class="code">
			<QuickCode lang="svelte" code={`<EmptyPage>
  <!-- free-form content: Blocks, Draw, anything -->
  <Block name="hero" x={200} y={300} width={600} height={200}>…</Block>
</EmptyPage>`} />
		</div>
	</Block>

	<Hint text="This slide has no ContentPage header — only EmptyPage filling the canvas." />
</EmptyPage>

<!-- Frozen from an ANNOTATE stroke. -->
<Draw>
	<Line from={[498.67, 228]} to={[733.33, 229.33]} arrow="end" thickness={6} />
	<Line from={[1109.33, 365.33]} to={[934.67, 584]} arrow="end" thickness={6} />
</Draw>

<style>
	.stage {
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		padding: 2.5em 3em 4em;
		line-height: 1.5;
	}
	.heading {
		margin: 0;
		font-size: 2.5em;
		font-family: 'Playfair Display Bolds', 'Cormorant Garamond', serif;
		color: var(--page-title-fg, #f0a33e);
	}
	.lead {
		margin: 0.9em 0 0;
		font-size: 1.25em;
		max-width: none;
	}
	.lead.muted {
		opacity: 0.85;
		font-size: 1.15em;
	}
	.code {
		margin-top: 1.4em;
		width: 100%;
	}
</style>
