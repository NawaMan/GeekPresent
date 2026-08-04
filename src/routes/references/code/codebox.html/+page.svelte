<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="CodeBox & JavaCodeBox" subtitle="Monaco inside a Box">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>CodeBox</b> / <b>JavaCodeBox</b> combine the expandable Box overlay with a Monaco buffer — open for detail, close to return to the slide.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<CodeBox language="js" code={src} width={1000} height={560} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>expanded</code> — optional bindable open state</li>
			<li><code>code / language</code> — same as Code</li>
	</ul>

	</div>
</ContentPage>
