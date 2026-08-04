<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="CssSnippet" subtitle="CSS samples without Monaco">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>CssSnippet</b> is for stylesheets and design-token samples when you need something lighter than Code and safer than Monaco on SPA-style decks.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<CssSnippet code={'.hero { color: var(--ACCENT); }'} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>code</code> — CSS text</li>
	</ul>

	</div>
</ContentPage>
