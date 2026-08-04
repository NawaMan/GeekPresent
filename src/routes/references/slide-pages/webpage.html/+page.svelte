<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AppendixLink from '$lib/components/AppendixLink.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';
	import Hint from '$lib/components/Hint.svelte';
	import Block from '$lib/components/Block.svelte';
</script>

<ContentPage title="WebPage" subtitle="Full-canvas live site — then jump in to try it">
	<div style="width: 100%; line-height: 1.45; font-size: 0.9em;">
		<p>
			<b>WebPage</b> is a complete slide: an iframe fills the 1920×1080 canvas
			(the full-bleed sibling of <b>WebSite</b> in a Block). The deck’s pager stays
			above the embed.
		</p>

		<p style="margin-top: 0.65em;">
			A bare iframe would eat every click and key. Click the site to interact; a
			highlighted <b>Release</b> appears in the chrome bar (or click outside) so
			paging keys work again.
		</p>

		<p style="margin-top: 0.7em; font-size: 1.08em;">
			Live canvas —
			<AppendixLink to="webpage-demo.html">open the WebPage demo</AppendixLink>
			(appendix: RETURN / ↑ / Backspace or NEXT off the end to come back).
		</p>

		<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<WebPage src="https://svelte.dev" title="svelte.dev" />

<!-- hide the fake browser bar (URL / Open / Release) -->
<WebPage src="https://svelte.dev" chrome={false} />`} />

		<p style="margin-top: 0.65em; opacity: 0.9;"><b>Props that matter</b></p>
		<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.4;">
			<li><code>src</code> — URL to embed</li>
			<li><code>chrome</code> — top bar (default <b>true</b>); <code>false</code> hides it</li>
			<li><code>controls</code> — zoom −/%/+ and reload (needs chrome)</li>
			<li><code>interactive</code> — start armed, no shield</li>
			<li><code>zoom / zoomLevels</code> — desktop layout scaled into the canvas</li>
		</ul>
		<Block name="warn" x={1025} y={514} width={836} height={201}>
			<Callout kind="warn" title="Gotcha" style="margin-top: 0.65em;">
				Many sites refuse framing. <b>Open ↗</b> is the escape hatch. CAPTURE refuses
				cross-origin iframes.
			</Callout>
		</Block>
	</div>
</ContentPage>
