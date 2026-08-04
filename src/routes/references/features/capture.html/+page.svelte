<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Capture" subtitle="PNG of the true canvas">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Capture</b> re-renders the 1920×1080 canvas to a PNG (ink in, chrome out). Offered via deck <code>capture</code> / sticky query / dev. Refuses rather than lying when an iframe cannot be read.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<SlideDeck {pages} capture captureScale={2} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>capture / captureScale</code> — offer button; output multiplier</li>
	</ul>

	</div>
</ContentPage>
