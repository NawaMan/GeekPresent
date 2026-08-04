<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Kiosk" subtitle="Unattended auto-advance">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Kiosk</b> runs Space semantics on a timer: finish animations → steps → note lines → page → loop. Configure from ☰ or auto-start with <code>?kiosk</code>.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<SlideDeck {pages} kiosk kioskStepMs={2000} kioskPageMs={6000} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>kioskStepMs / kioskPageMs</code> — dwell for builds vs page turns</li>
	</ul>

	</div>
</ContentPage>
