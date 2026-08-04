<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';
	import Link from '$lib/components/Link.svelte';

</script>

<ContentPage title="Code" subtitle="Snippets, editors, terminal, source">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Code</b> components range from tiny Shiki snippets to full Monaco editors, diffs, a fake terminal, and in-slide source viewers.</p>
		<p style="margin-top: 0.6em;">Rule of thumb: if the slide can be reached by client-side navigation (View Transitions, animated appendix), avoid Monaco — use QuickCode, CssSnippet, or SourceView.</p>
		<p style="margin-top: 1em;"><Link href="./code/title.html">Open the Code reference →</Link></p>



	</div>
</ContentPage>
