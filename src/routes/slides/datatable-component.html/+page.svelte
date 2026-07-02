<!--
  Example: DataTable component (Phase 1: sorting, search, pagination)
  File: src/routes/slides/datatable-component.html/+page.svelte

  A dependency-free jQuery-DataTables replacement. 200 rows of mixed types
  (numbers, natural-sort names, dates, nulls, dirty values) to show off the
  type-aware sorting: click "Requests" and 2 < 10 < 100 sorts numerically,
  'N/A' and blanks always sink to the bottom; a third click restores the
  natural order. Theme via the --dt-* CSS custom properties.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { DataTable, type ColumnDef } from '$lib/datatable';
	import { servers, type ServerRow } from './data';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/datatable-component.html/+page.svelte';

	const columns: ColumnDef<ServerRow>[] = [
		{ key: 'id', label: 'ID', width: '5em' }, // auto-inferred: number
		{ key: 'name', label: 'Name' }, // natural sort: node-2 before node-10
		{ key: 'region', label: 'Region' },
		{ key: 'team', label: 'Team' }, // has nulls — they sort last
		{
			key: 'requests',
			label: 'Requests',
			type: 'number', // explicit: data holds a few 'N/A' strings (NaN → last)
			align: 'right',
			format: (v) =>
				v == null ? '—' : typeof v === 'number' ? v.toLocaleString('en-US') : String(v)
		},
		{
			key: 'cpu',
			label: 'CPU',
			align: 'right',
			format: (v) => (v == null ? '—' : `${v}%`)
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

<ContentPage
	title="DataTable"
	subtitle="Sortable, searchable, paginated tables — zero dependencies, pure-function core"
>
	<div class="demo">
		<DataTable rows={servers} {columns} pageSize={10} height="490px" striped />
	</div>

	<p class="hint">
		Headers cycle <b>asc → desc → natural order</b> — numbers, natural names (node-2 before node-10)
		and dates each sort correctly; nulls and <code>'N/A'</code> sink to the bottom, and
		<code>sortValue</code> makes <code>pending</code> deploys sort as the latest.
	</p>
	<p class="props">
		Props: <code>rows</code>, <code>columns</code> (<code>key</code>, <code>label</code>,
		<code>type</code>, <code>format</code>, <code>sortValue</code>, <code>sortable</code>,
		<code>width</code>, <code>align</code>), <code>pageSize</code>, <code>searchable</code>,
		<code>loading</code>,
		<code>striped</code>, <code>height</code>/<code>maxHeight</code>. Pure core in
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
