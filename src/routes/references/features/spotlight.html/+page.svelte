<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Spotlight" subtitle="Dim around a named Block">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Spotlight</b> is a canvas singleton: driven from speaker notes / triggers to ring a Block the author named. Toast can reuse the same punch-out.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<!-- author names the target -->
<Block name="api">…</Block>
<!-- speaker console / Note trigger activates spotlight on that name -->`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>(via notes / triggers)</code> — not usually imported on the slide</li>
	</ul>

	</div>
</ContentPage>
