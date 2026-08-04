<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Quote" subtitle="Pull quote with attribution">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Quote</b> presents a short quotation with optional citation. Use it for a human voice on an otherwise technical slide.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Quote cite="Grace Hopper">
  The most dangerous phrase is "We've always done it this way."
</Quote>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>cite</code> — attribution line</li>
	</ul>

	</div>
</ContentPage>
