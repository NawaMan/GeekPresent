<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';
	import Link from '$lib/components/Link.svelte';
</script>

<ContentPage title="WebPage" subtitle="Full-canvas embedded site">
	<div style="width: 100%; line-height: 1.5;">
		<p>
			<b>WebPage</b> is a complete slide: an iframe fills the 1920×1080 canvas.
			Use <b>WebSite</b> when the embed is one element among others.
		</p>
		<p style="margin-top: 0.6em;">
			Docs (with AppendixLink to a live canvas):
			<Link href="../slide-pages/webpage.html">Slide Pages → WebPage</Link>
		</p>
		<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<WebPage src="https://svelte.dev" title="svelte.dev" />
<WebPage src="https://svelte.dev" chrome={false} />`} />
		<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
		<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>src</code> — page URL</li>
			<li><code>chrome</code> — fake browser bar (default true); <code>false</code> hides it</li>
			<li><code>controls / zoom</code> — bar zoom/reload and scale</li>
		</ul>
		<Callout kind="warn" title="Gotcha" style="margin-top: 0.8em;">
			CAPTURE cannot rasterise cross-origin iframes — expect NOT ALLOWED on a pure WebPage slide.
		</Callout>
	</div>
</ContentPage>
