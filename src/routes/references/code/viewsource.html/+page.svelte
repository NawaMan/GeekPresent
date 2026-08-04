<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="ViewSource" subtitle="Monaco source panel + EDIT">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>ViewSource</b> registers the slide’s source (<code>?raw</code>) for ☰ → SOURCE / EDIT. In dev, SAVE can write the buffer back; on a static host SAVE refuses.</p>
		<p style="margin-top: 0.5em;">In modern dev, SOURCE/EDIT are also available deck-wide via the shell; a mounted ViewSource still supplies bytes for static hosts.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<script>
  import ViewSource from '\$lib/components/ViewSource.svelte';
  import source from './+page.svelte?raw';
</script>
<ViewSource {source} path="src/routes/…/+page.svelte" />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>source / path</code> — raw file text and display path</li>
	</ul>

	</div>
</ContentPage>
