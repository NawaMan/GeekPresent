<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AppendixLink from '$lib/components/AppendixLink.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Columns from '$lib/components/Columns.svelte';
	import Column from '$lib/components/Column.svelte';
	import Hint from '$lib/components/Hint.svelte';
	import Flow from '../AppendixFlowSvg.svelte';
</script>

<ContentPage title="AppendixPage" subtitle="Call in · return out — not a stop on the main march">
	<div class="body">
		<p>
			An appendix is a <b>function call</b>. Jump in with
			<AppendixLink to="appendix-a.html">AppendixLink</AppendixLink>
			(try it); land on <b>AppendixPage</b>. The link stamps
			<code>?return=…</code> so RETURN / ↑ / Backspace always know the way home.
			NEXT off the end of the chapter returns too.
		</p>

		<Columns widths={[5, 4]} gap="1.2em" align="center" style="margin-top: 0.7em;">
			<Column>
				<QuickCode lang="svelte" code={`<!-- caller -->
<AppendixLink to="appendix-a.html">deep dive</AppendixLink>

<!-- destination -->
<AppendixPage title="Deep dive">
  <p>Detail for when someone asks.</p>
</AppendixPage>`} />
			</Column>
			<Column>
				<Flow compact />
			</Column>
		</Columns>

		<p class="next">
			→ next: <code>hidden: true</code> keeps the chapter off the linear march · later: props on AppendixLink
		</p>
	</div>
</ContentPage>

<Hint text="In the appendix: → / NEXT through it · RETURN, ↑, or Backspace to leave early." />

<style>
	.body {
		width: 100%;
		line-height: 1.4;
		font-size: 0.95em;
	}
	.next {
		margin-top: 0.55em;
		opacity: 0.75;
		font-size: 0.92em;
	}
</style>
