<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Code & JavaCode" subtitle="Monaco read-only editors">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Code</b> embeds Monaco for any language; <b>JavaCode</b> is the Java-tuned variant. Ideal for long listings with fold and scroll.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Code language="typescript" code={src} width="900px" height="480px" />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>code / language</code> — buffer and Monaco language id</li>
			<li><code>width / height</code> — editor chrome size</li>
	</ul>

	<Callout kind="warn" title="Gotcha" style="margin-top: 0.8em;">
		Monaco loads from a CDN and does not survive client-side navigations cleanly — blank editor after <code>goto</code>. Use SourceView / QuickCode on those decks.
	</Callout>
	</div>
</ContentPage>
