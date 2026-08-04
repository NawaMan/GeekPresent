<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="WebSite" subtitle="Embedded site in a frame">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>WebSite</b> iframes a URL inside the canvas for live docs or apps during a talk.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<WebSite src="https://example.com" width="1200px" height="700px" />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>src</code> — page URL</li>
			<li><code>width / height</code> — frame size</li>
	</ul>

	</div>
</ContentPage>
