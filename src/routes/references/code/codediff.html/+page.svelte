<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="CodeDiff" subtitle="Before / after as a diff">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>CodeDiff</b> shows two buffers as a unified or split diff — refactors and migrations on one slide.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<CodeDiff before={oldSrc} after={newSrc} language="ts" />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>before / after</code> — old and new source strings</li>
			<li><code>language</code> — highlighter language</li>
	</ul>

	</div>
</ContentPage>
