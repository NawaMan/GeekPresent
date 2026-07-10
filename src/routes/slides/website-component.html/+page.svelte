<!--
  Example: WebSite component
  File: src/routes/slides/website-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import WebSite     from '$lib/components/WebSite.svelte';
	import Callout     from '$lib/components/Callout.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/website-component.html/+page.svelte';
</script>

<ContentPage title="WebSite" subtitle="A live website, bounded to the space you give it">
	<div style="max-width: 900px;">
		<p>
			<b>WebSite</b> is an <code>&lt;iframe&gt;</code> made safe for a slide. Wrap it
			in a <code>Block</code> and it fills the box.
		</p>

		<QuickCode style="margin-top: 0.6em;" lang="svelte" code={`<Block x={120} y={260} width={760} height={520}>
  <WebSite src="https://example.com" />
</Block>`} />

		<p style="margin-top: 0.7em;">
			The frame is <b>inert</b> until you click it — otherwise it would swallow the
			paging keys. Clicking anywhere outside hands control back to the deck.
			<code>lazy</code> (on by default) mounts the frame only when it scrolls into
			view, so a prerendered slide fetches nothing. <code>zoom</code> shrinks a
			desktop layout instead of triggering the site's phone breakpoints.
		</p>

		<Callout kind="warn" title="Not every site can be framed" style="margin-top: 0.8em;">
			<code>X-Frame-Options</code> / <code>frame-ancestors</code> let a site refuse.
			That is its call, not ours — the frame renders empty and the bar's
			<b>Open&nbsp;↗</b> is the way out. Check the target before the talk.
		</Callout>
	</div>
</ContentPage>

<!-- Default: chrome bar + shield, mounted lazily. -->
<Block name="plain" x={1000} y={250} width={840} height={330} grid={10}>
	<WebSite src="https://example.com" />
</Block>

<!-- Same site at 60%: the DESKTOP layout shrinks into the box. A custom `zoomLevels`
     ladder gives the − / + buttons three stops that suit this embed. -->
<Block name="zoomed" x={1000} y={610} width={840} height={330} grid={10}>
	<WebSite src="https://example.com" zoom={0.6} zoomLevels={[0.4, 0.6, 1]} />
</Block>

<Hint text="Zoom (− % +) and reload (⟳) work without arming. Click a frame to interact; click the slide to release." />

<!-- The lower embed walks its own three-stop ladder: 40% / 60% / 100%. -->

<ViewSource {source} {path} />
