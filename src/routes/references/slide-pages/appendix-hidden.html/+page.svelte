<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AppendixLink from '$lib/components/AppendixLink.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';
	import Columns from '$lib/components/Columns.svelte';
	import Column from '$lib/components/Column.svelte';
	import Flow from '../AppendixFlowSvg.svelte';
</script>

<ContentPage title="Appendix — hidden" subtitle="Off the linear march, still a real slide">
	<div style="width: 100%; line-height: 1.5;">
		<p>
			<code>hidden: true</code> on a <code>pages.ts</code> entry does <b>not</b> create an
			appendix by itself — it only decides whether the deck’s forward march can
			<i>find</i> that slide. → / Space step over it; the Table of Contents does not list it.
			It remains a real, prerendered, linkable route.
		</p>

		<p style="margin-top: 0.65em;">
			<b>Contiguous</b> hidden entries are <b>one chapter</b> (A → B below). PREV/NEXT page
			through them; FIRST/LAST are the run’s own ends.
			<AppendixLink to="appendix-a.html">Jump into the demo pair</AppendixLink>.
		</p>

		<Columns widths={[5, 4]} gap="1.4em" align="start" style="margin-top: 0.85em;">
			<Column>
				<QuickCode lang="js" code={`// pages.ts — contiguous hidden = ONE chapter
{ path: "appendix-a.html", title: "Appendix — part 1", hidden: true },
{ path: "appendix-b.html", title: "Appendix — part 2", hidden: true },`} />
			</Column>
			<Column>
				<Flow compact />
			</Column>
		</Columns>

		<Callout kind="info" title="hidden is optional" style="margin-top: 0.75em;">
			Leave <code>hidden</code> off and the same <code>AppendixPage</code> is ordinary back
			matter: listed in the TOC, paged into by →/Space, still returnable when a slide
			calls it. <code>hidden</code> only hides it from the march.
		</Callout>
	</div>
</ContentPage>
