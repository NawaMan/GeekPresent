<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Annotate" subtitle="Speaker pen on the live slide">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Annotate</b> is mounted by SlideDeck when the deck offers it (<code>annotate</code> prop). Ink is freehand (pen / highlighter), persists per slide, and never steals keyboard paging.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<SlideDeck {pages} annotate />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>annotate</code> — deck prop — offer the pen</li>
			<li><code>?annotate</code> — sticky URL offer / =off to revoke</li>
	</ul>

	</div>
</ContentPage>
