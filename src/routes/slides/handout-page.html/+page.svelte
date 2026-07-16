<!--
  Example: THE HANDOUT — the whole deck as one printable document.
  File: src/routes/slides/handout-page.html/+page.svelte

  Like overview-grid.html and capture-slide.html, this slide IS its own demo: the link below
  is live in the deployed build, and it opens THIS deck as paper. It also carries a <Note>,
  so that the ?notes handout has something to print under this very slide.
-->
<script>
	import { base }    from '$app/paths';
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Callout     from '$lib/components/Callout.svelte';
	import Kbd         from '$lib/components/Kbd.svelte';
	import Note        from '$lib/components/Note.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/handout-page.html/+page.svelte';
</script>

<ContentPage title="The Handout" subtitle="Print the whole talk as one PDF">
	<div style="line-height: 1.55em; font-size:0.8em">
		<p>
			Every slide is its own page, so <Kbd>Ctrl</Kbd>+<Kbd>P</Kbd> on a slide prints
			<b>that one slide</b>, on paper its own shape. The handout is the other artifact:
			<b>every slide of a deck, stacked into one document</b>.
		</p>
		<QuickCode
			style="margin-top: 0.7em;"
			lang="text"
			code={`/_handout/slides.html          the whole deck — one page per slide
/_handout/slides.html?notes    the same, with the speaker notes under each
/_handout/slides.html?grid     a thumbnail contact-sheet (landscape)
/_handout/slides.html?grid&notes   slide + note per row (portrait)
this-slide.html?notes         just this slide, and its note, on one page`}
		/>
		<p style="margin-top: 0.7em;">
			Open <a href="{base}/_handout/slides.html"><b>this deck's handout</b></a> (or
			<a href="{base}/_handout/slides.html?notes">with notes</a>), then press
			<Kbd>Ctrl</Kbd>+<Kbd>P</Kbd>. The browser is the PDF engine, so there is no export step
			and no dependency — <code>Save as PDF</code> is the feature.
		</p>
	</div>
</ContentPage>

<Block name="two-artifacts" x={54} y={564} width={882} height={433}>
	<Callout kind="tip" title="Two documents, one page" style="font-size:0.9em">
		<p>
			<b>Without notes</b> the sheet <i>is</i> the slide, inside a half-inch margin — a real
			printer cannot reach the edge of the paper, and the margin is also <b>where the browser
			prints its own header and footer</b>, so a thinner one lands the page number on your
			slide. The <b>same size</b> whether you print one slide or the whole deck: both ask
			<code>handoutCore</code>.
		</p>
		<p style="margin-top: 0.4em;">
			<b>With notes</b> the paper grows three inches and the slide gets a band beneath it: its
			number, its title, and your <code>&lt;Note&gt;</code>. A leave-behind, not a deck. The
			slide never shrinks to make room — and <code>?notes</code> works on a single slide too.
		</p>
		<p style="margin-top: 0.4em;">
			A portrait deck prints on portrait paper, from the same arithmetic. A deck whose canvas
			or theme is not the default says so once, in its <code>pages.ts</code>:
			<code>export const deck = &#123; width: 1080, height: 1920 &#125;</code> — and its
			<code>+layout.svelte</code> reads the same line, so the two cannot disagree.
		</p>
	</Callout>
</Block>

<!-- The bargain, stated on the slide rather than buried in the source. -->
<Block name="what-wont-print" x={974} y={561} width={835} height={446}>
	<Callout kind="warn" title="What paper cannot hold">
		<p>
			A <code>&lt;WebSite&gt;</code>, <code>&lt;WebPage&gt;</code> or <code>&lt;YouTube&gt;</code>
			slide is a live <code>&lt;iframe&gt;</code>, and a printer hands you a blank rectangle for
			one. The handout does not pretend otherwise: it <b>finds them and names them in ink</b>,
			on the sheet, so a reader knows a live thing stood there rather than wondering whether
			the slide was empty.
		</p>
		<p style="margin-top: 0.4em;">
			Same bargain, and the same scan, as <b>CAPTURE</b> — which refuses those slides for
			exactly the same reason. Everything else prints, <b>annotations included</b>: the pen's
			ink is content, so it is deliberately not marked <code>.no-print</code>.
		</p>
	</Callout>
</Block>

<Note>
	<p>This note is the demo: print the handout with <code>?notes</code> and you are reading it on paper.</p>
	<p>The handout renders the REAL slide components, globbed from the routes — not screenshots, not a copy. So it cannot drift from the deck.</p>
	<p>It is also the only page in the project whose slides exist in the prerendered HTML: the deck shell gates its slot on the browser, a document must not.</p>
</Note>

<ViewSource {source} {path} />
