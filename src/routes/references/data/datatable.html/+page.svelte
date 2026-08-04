<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="DataTable" subtitle="Sortable, filterable table">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>DataTable</b> renders row data with optional search, pagination, and column toggles. Keep datasets in a colocated module; prefer static JSON-shaped data for GitHub Pages (no server).</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<DataTable {rows} {columns} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>rows / columns</code> — data and column defs</li>
			<li><code>pageSize</code> — pagination size when enabled</li>
	</ul>

	<Callout kind="warn" title="Gotcha" style="margin-top: 0.8em;">
		There is no runtime server on GitHub Pages. “Server-side” table demos in the product tour need an external API or a different host — pure static rows always work.
	</Callout>
	</div>
</ContentPage>
