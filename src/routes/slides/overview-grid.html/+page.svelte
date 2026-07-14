<!--
  Example: OVERVIEW — the all-slides grid, demonstrated live.
  File: src/routes/slides/overview-grid.html/+page.svelte

  Like capture-slide.html and layout-mode.html, this slide IS its own demo: the OVERVIEW
  button under the ToC is real in the deployed build, and so is the `O` key. Press either
  one while reading this and the deck you are standing in opens as a grid.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Callout     from '$lib/components/Callout.svelte';
	import Kbd         from '$lib/components/Kbd.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/overview-grid.html/+page.svelte';
</script>

<ContentPage title="Overview Page" subtitle="The whole deck at once — press O">
	<div style="line-height: 1.55em;">
		<p>
			Press <Kbd>O</Kbd> (or the <b>OVERVIEW PAGE</b> button, under the Table of Contents) and every
			slide in this deck appears at once. Click one to jump there; <Kbd>Esc</Kbd> closes.
			Finding slide 40 stops being a matter of paging to it, or of reading a list of titles
			and guessing.
		</p>
		<p style="margin-top: 0.7em;">
			It comes with the deck. There is no prop to set and nothing to import.
		</p>
		<QuickCode
			style="margin-top: 0.7em;"
			lang="svelte"
			code={`<SlideDeck {pages} />   <!-- OVERVIEW PAGE is already there -->`}
		/>
	</div>
</ContentPage>

<Block name="why-live" x={70} y={582} width={888} height={354}>
	<Callout kind="tip" title="Live tiles, not screenshots">
		<p>
			A captured thumbnail would be <b>stale the moment you edit the slide</b>, and it would
			be <b>missing entirely</b> on a fresh clone &mdash; the capture script writes to a
			gitignored folder, and no deck commits a per-slide image. You would be navigating
			yesterday's deck.
		</p>
		<p style="margin-top: 0.4em;">
			So the grid pays a document per tile instead, and buys it back by mounting
			<b>lazily</b>: a tile is a cheap title card until it scrolls near the viewport. Opening
			a 65-slide deck boots the dozen you can see, not 65.
		</p>
	</Callout>
</Block>

<!-- The boundary, stated on the slide rather than hidden in the source. -->
<Block name="what-it-shows" x={987} y={582} width={867} height={357}>
	<Callout kind="warn" title="What the grid does not show">
		<p>
			<b>Appendices.</b> A slide marked <code>hidden: true</code> is a real, linkable page,
			but it is not part of the deck's forward march &mdash; <Kbd>&rarr;</Kbd> steps over it
			and the ToC omits it. The grid is <i>browsing</i>, so it omits it too. You reach an
			appendix from the slide that calls it, by name.
		</p>
		<p style="margin-top: 0.4em;">
			The grid is also absent inside the tiles themselves: <code>?clean</code> is exactly what
			the deck gates its chrome on, so a tile cannot grow a grid of its own.
		</p>
	</Callout>
</Block>

<ViewSource {source} {path} />
