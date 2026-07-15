<!--
  Example: CAPTURE — the slide as a PNG, demonstrated live.
  File: src/routes/slides/capture-slide.html/+page.svelte

  Like layout-mode.html, this slide IS its own demo: the deck sets `capture`, so the button is
  real in the deployed build. It rides ANNOTATE's top-centre flyout — hover ANNOTATE and CAPTURE
  slides out beside it. Press it and you download *this slide* — including anything you drew on
  it, and none of the chrome you drew it with.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Callout     from '$lib/components/Callout.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/capture-slide.html/+page.svelte';
</script>

<ContentPage title="Capture" subtitle="The slide as a PNG — at its true size, not your window's">
	<div style="line-height: 1.55em;">
		<p>
			Hover <b>ANNOTATE</b> (top-centre) and press <b>CAPTURE</b> as it slides out; this slide
			downloads as
			<code>capture-slide.png</code>. Not a screenshot of the window &mdash; the canvas is
			<i>re-rendered</i>, so the file is a full <b>1920&times;1080</b> whether you are
			presenting on a projector or reading this on a laptop. Same PNG on every machine.
		</p>
		<p style="margin-top: 0.7em;">
			Draw on it first. <b>The ink comes with it</b> &mdash; that is the point of capturing a
			slide rather than photographing a screen: you circled the thing, so the circle belongs
			in the file. The pen's own bar, the buttons and the nav do <i>not</i>.
		</p>
		<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<SlideDeck {pages} capture captureScale={2} />`} />
	</div>
</ContentPage>

<Block name="what-goes" x={65} y={620} width={880} height={310}>
	<Callout kind="tip" title="What lands in the file">
		<p>
			<b>In:</b> everything on the canvas &mdash; text, <code>Block</code>s, charts,
			diagrams, images, a <code>Canvas</code> drawing, a paused <code>Video</code> frame, and
			your annotations.
		</p>
		<p style="margin-top: 0.4em;">
			<b>Out:</b> anything wearing <code>.no-print</code> &mdash; the nav bar, the TOC, the
			LAYOUT and CAPTURE buttons, the pen's palette. Capture reuses the very same rule that
			keeps chrome out of a printout, rather than inventing a second list that could drift.
		</p>
		<p style="margin-top: 0.4em;">
			<code>captureScale={2}</code> gives a 3840&times;2160 file &mdash; still crisp, because
			it is <i>re-rendered</i>, not upscaled.
		</p>
	</Callout>
</Block>

<!-- The honest boundary, on the slide — as layout-mode.html puts SAVE's refusal in front of the
     audience rather than behind it. -->
<Block name="cannot" x={995} y={620} width={860} height={310}>
	<Callout kind="warn" title="What it refuses to draw">
		<p>
			A slide built on <code>WebSite</code>, <code>WebPage</code> or <code>YouTube</code> holds
			a live <b>&lt;iframe&gt;</b> &mdash; a <i>separate document</i>, whose pixels this page
			is not allowed to read. That is the same-origin policy doing its job, not a gap to be
			patched.
		</p>
		<p style="margin-top: 0.4em;">
			So CAPTURE does not quietly hand you a PNG with a hole in it. It <b>refuses when
			pressed</b> and names the embed in the way &mdash; the same bargain <b>SAVE</b> makes.
			A button that answers is worth more than one greyed out from the start.
		</p>
	</Callout>
</Block>

<Hint text="Scribble on this slide, then press CAPTURE — the ink is in the PNG, the pen's bar isn't" />

<ViewSource {source} {path} />
