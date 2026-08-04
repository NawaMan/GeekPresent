<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Callout" subtitle="Semantic admonition">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Callout</b> flags a passage as info, tip, warning, or danger — left rule, tinted panel, badge. Themes recolour via role tokens.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Callout kind="warn" title="Gotcha">
  Client-side navigation blanks Monaco — use SourceView there.
</Callout>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>kind</code> — info | tip | warn | danger</li>
			<li><code>title / icon</code> — heading and badge override</li>
	</ul>

	</div>
</ContentPage>
