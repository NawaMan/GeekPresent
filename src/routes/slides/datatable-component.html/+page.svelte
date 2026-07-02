<!--
  Example: DataTable component — static data (client mode)
  File: src/routes/slides/datatable-component.html/+page.svelte

  A dependency-free jQuery-DataTables replacement over a hardcoded array:
  the component filters, sorts, and paginates the 200 mixed-type rows
  itself. Type-aware sorting (2 < 10 < 100, natural names, dates; 'N/A'
  and blanks sink), custom cells — the Status column renders a colored
  badge via the `snippets` prop map, Cost renders via `format`, and both
  still sort by the raw value / search by the formatted text — plus a 🚀
  header snippet. See the next slide for the same table fed by a (fake)
  server. Theme via the --dt-* CSS custom properties.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { DataTable, type ColumnDef } from '$lib/datatable';
	import { servers, type ServerRow } from './data';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/datatable-component.html/+page.svelte';

	const columns: ColumnDef<ServerRow>[] = [
		{ key: 'id', label: 'ID', width: '4.5em' }, // auto-inferred: number
		{ key: 'name', label: 'Name' }, // natural sort: node-2 before node-10
		{ key: 'region', label: 'Region' },
		{ key: 'status', label: 'Status' }, // rendered by the statusBadge snippet
		{
			key: 'requests',
			label: 'Requests',
			type: 'number', // explicit: data holds a few 'N/A' strings (NaN → last)
			align: 'right',
			format: (v) =>
				v == null ? '—' : typeof v === 'number' ? v.toLocaleString('en-US') : String(v)
		},
		{
			key: 'cost',
			label: 'Cost / mo',
			type: 'number',
			align: 'right',
			// currency via format(): displays "$123.45" but sorts by the raw
			// number, and search matches this formatted text
			format: (v) =>
				v == null
					? '—'
					: `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
		},
		{
			key: 'deployed',
			label: 'Last deploy',
			type: 'date',
			// custom sort key: 'pending' counts as the latest deploy (leads a
			// newest-first sort) while the cell still displays "pending"
			sortValue: (r) => (r.deployed === 'pending' ? '9999-12-31' : r.deployed)
		}
	];
</script>

{#snippet statusBadge(row: ServerRow, value: ServerRow['status'])}
	<span class="badge badge-{value}">{value}</span>
{/snippet}

{#snippet deployHeader(column: ColumnDef<ServerRow>)}
	🚀 {column.label}
{/snippet}

<ContentPage
	title="DataTable — Static Data"
	subtitle="Client mode: hand it an array, it sorts, searches, and paginates"
>
	<div class="demo">
		<DataTable
			rows={servers}
			{columns}
			snippets={{ status: statusBadge }}
			headerSnippets={{ deployed: deployHeader }}
			height="490px"
			striped
		/>
	</div>

	<p class="hint">
		<b>Status</b> is a per-column snippet (<code>snippets</code> prop map), <b>Cost</b> a
		<code>format</code> fn — both sort by the raw value and search by the displayed text. Headers
		cycle <b>asc → desc → natural order</b>; nulls and <code>'N/A'</code> sink to the bottom, and
		<code>sortValue</code> makes <code>pending</code> deploys sort as the latest.
	</p>
	<p class="props">
		Props: <code>rows</code>, <code>columns</code> (<code>key</code>, <code>label</code>,
		<code>type</code>, <code>format</code>, <code>sortValue</code>, <code>sortable</code>,
		<code>width</code>, <code>align</code>), <code>snippets</code> (key → snippet, gets
		<code>row, value, rowIndex</code>), <code>headerSnippets</code> (gets the
		<code>ColumnDef</code> — see 🚀), <code>empty</code> snippet, <code>pageSize</code>,
		<code>searchable</code>, <code>loading</code>, <code>striped</code>,
		<code>height</code>/<code>maxHeight</code>. Pure core in
		<code>$lib/datatable/tableCore.ts</code>; theme via the <code>--dt-*</code> custom properties.
	</p>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		--dt-font-size: 0.72em;
		/* light "inverted panel" theme on the dark deck */
		--dt-bg: #eef2f5;
		--dt-color: #1a2530;
		--dt-border: #9fb0bc;
		--dt-header-bg: rgba(30, 60, 90, 0.14);
		--dt-stripe-bg: rgba(30, 60, 90, 0.06);
		--dt-row-hover: rgba(30, 60, 90, 0.13);
		--dt-accent: #b25f00;
		margin: 0.3em auto 0;
		max-width: 1600px;
		line-height: 1.35;
		text-align: initial;
	}
	.badge {
		display: inline-block;
		padding: 0.1em 0.6em;
		border-radius: 999px;
		font-size: 0.85em;
		font-weight: 700;
		line-height: 1.5;
	}
	.badge-healthy {
		background: #d6efd9;
		color: #1d6b2a;
	}
	.badge-degraded {
		background: #fbe3c4;
		color: #8a4c00;
	}
	.badge-offline {
		background: #f3d2d2;
		color: #8f1d1d;
	}
	.hint {
		margin: 0.6em 0 0;
		text-align: center;
		opacity: 0.85;
		font-size: 0.8em;
	}
	.props {
		margin: 0.4em 0 0;
		text-align: center;
		opacity: 0.8;
		font-size: 0.72em;
	}
	.hint code,
	.props code {
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
		color: #f0d09e;
	}
</style>
