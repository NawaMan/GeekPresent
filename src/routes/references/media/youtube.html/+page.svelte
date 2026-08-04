<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="YouTube" subtitle="Thumbnail card with optional QR">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>YouTube</b> shows a talk thumbnail and links out to the video. Generate colocated assets with <code>utils/prepare-youtube.sh</code>, or rely on the optional QR pipeline / QRCode component.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<YouTube {thumbnail} youtubeId="dQw4w9WgXcQ" alt="Talk" width="600px" />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>youtubeId</code> — video id</li>
			<li><code>thumbnail / qr</code> — imported images; qr optional</li>
	</ul>

	<Callout kind="warn" title="Gotcha" style="margin-top: 0.8em;">
		CAPTURE cannot rasterise cross-origin iframes. A slide whose main point is an embed may refuse PNG capture — expected, not broken.
	</Callout>
	</div>
</ContentPage>
