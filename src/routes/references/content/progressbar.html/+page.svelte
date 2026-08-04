<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="ProgressBar" subtitle="How far through the deck">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>ProgressBar</b> reads <code>getProgress()</code> after the deck calls <code>setPages</code>. No props required for the default bar. Tag it <code>gp-chrome no-print</code> in a layout so captures omit it.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<!-- deck +layout.svelte, after setPages -->
<ProgressBar class="gp-chrome no-print" />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>(none required)</code> — uses presentation context</li>
	</ul>

	</div>
</ContentPage>
