<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="QRCode" subtitle="Scannable link on the canvas">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>QRCode</b> encodes a string as SVG (no network). Prefer it over committing a PNG. Values that look like http/mailto/tel become links.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<QRCode value="https://example.com/talk" size={220} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>value</code> — payload text</li>
			<li><code>size</code> — pixel size of the symbol</li>
	</ul>

	</div>
</ContentPage>
