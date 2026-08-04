<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Label" subtitle="Inline hover highlight">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Label</b> marks a term in running text so hover (or focus) emphasises it — glossary-lite without a modal.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`Open the <Label>Table of Contents</Label> to jump.`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>style</code> — optional colour / emphasis override</li>
	</ul>

	</div>
</ContentPage>
