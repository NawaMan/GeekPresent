<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';
	import Block from '$lib/components/Block.svelte';
</script>

<ContentPage title="TextPage" subtitle="Not a slide — the other artifact type">
	<div style="width: 100%; line-height: 1.5; font-size: 0.95em;">
		<p>
			<b>TextPage</b> is the shell for a <b>Text</b>: one long, scrolling page
			(fluid width, capped at 1080px). It calls <code>setMode('text')</code> so
			shared components adapt (nav collapses to TOP, etc.).
		</p>

		<Block name="info" x={1141} y={327} width={724} height={536}>
			<Callout kind="info" title="Not part of a deck" style="margin-top: 0.8em;">
				Do <b>not</b> put TextPage in a presentation’s <code>pages.ts</code>. A deck
				slide lives under a deck layout with <code>SlideDeck</code> and a fixed
				1920×1080 canvas. A Text is a <b>separate route</b> with its own layout that
				wraps <code>&lt;TextPage&gt;</code> — see <code>/text.html</code> and the site home.
				You can <i>link</i> from a slide to a Text; you cannot embed a Text as a
				page in the linear march without fighting the two modes.
			</Callout>
		</Block>

		<QuickCode style="margin-top: 0.8em;" lang="svelte" code={`<!-- text route: +layout.svelte -->
<script>
  import TextPage from '$lib/components/TextPage.svelte';
</script>
<TextPage title="My guide">
  <slot />
</TextPage>

<!-- +page.svelte — ordinary flowing HTML, not a fixed canvas -->
<h1>…</h1>
<p>…</p>`} />

		<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
		<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>title / description / image</code> — SEO and browser tab for that Text</li>
		</ul>
	</div>
</ContentPage>
