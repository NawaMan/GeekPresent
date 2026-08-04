<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="SourceView" subtitle="Shiki source panel (SPA-safe)">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>SourceView</b> is the client-navigation-safe counterpart to ViewSource’s in-slide panel: Shiki instead of Monaco. EDIT still opens the unscaled popup editor.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<SourceView {source} path="src/routes/…/+page.svelte" />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>source / path</code> — same contract as ViewSource</li>
	</ul>

	<Callout kind="warn" title="Gotcha" style="margin-top: 0.8em;">
		On View-Transition decks and animated appendices, prefer SourceView over ViewSource for the in-slide panel.
	</Callout>
	</div>
</ContentPage>
