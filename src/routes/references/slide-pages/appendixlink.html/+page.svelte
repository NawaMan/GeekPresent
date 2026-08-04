<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AppendixLink from '$lib/components/AppendixLink.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Columns from '$lib/components/Columns.svelte';
	import Column from '$lib/components/Column.svelte';
</script>

<ContentPage title="AppendixLink" subtitle="Call-site API · AppendixPage props">
	<div style="width: 100%; line-height: 1.45; font-size: 0.95em;">
		<p>
			<b>AppendixLink</b> is only the jump control. It stamps the current slide as
			<code>?return=</code> so the appendix never hard-codes a way home.
			Live:
			<AppendixLink to="appendix-a.html">jump into the appendix</AppendixLink>.
		</p>

		<Columns widths={[1, 1]} gap="1.5em" align="start" style="margin-top: 0.75em;">
			<Column>
				<p style="margin: 0 0 0.4em; opacity: 0.9;"><b>AppendixLink</b></p>
				<QuickCode lang="svelte" code={`<AppendixLink to="appendix-a.html">
  how it works
</AppendixLink>
<AppendixLink to="appendix-a.html" transition>
  animated detour
</AppendixLink>`} />
				<ul style="margin: 0.5em 0 0 1.1em; line-height: 1.4; opacity: 0.9;">
					<li><code>to</code> — target slide in this deck</li>
					<li><code>transition</code> — match AppendixPage for vertical motion</li>
				</ul>
			</Column>
			<Column>
				<p style="margin: 0 0 0.4em; opacity: 0.9;"><b>AppendixPage</b></p>
				<QuickCode lang="svelte" code={`<AppendixPage
  title="Deep dive"
  transition
  returnText="RETURN"
>
  …
</AppendixPage>`} />
				<ul style="margin: 0.5em 0 0 1.1em; line-height: 1.4; opacity: 0.9;">
					<li><code>title / subtitle</code> — like ContentPage</li>
					<li><code>transition</code> — set on link <i>and</i> page</li>
					<li><code>returnText / deckText</code> — RETURN vs DECK if no caller</li>
				</ul>
			</Column>
		</Columns>
	</div>
</ContentPage>
