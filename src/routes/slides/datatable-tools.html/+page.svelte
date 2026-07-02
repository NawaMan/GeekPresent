<!--
  Example: DataTable component — table tools (selection, filters, toggle, CSV)
  File: src/routes/slides/datatable-tools.html/+page.svelte

  The Phase 3 surface, on the same dataset as the static-data slide: row
  selection with rowKey identity (bind:selected + page-scoped select-all),
  per-column filters on Name/Region (AND-composed with the global search,
  sticky under the header), ColumnToggle flipping column visibility on the
  bound columns array, and CSV export of the whole filtered+sorted set —
  recomputed from the bound TableState with the same pure tableCore
  functions the table itself uses. Styled DARK — the middle of the deck's
  light (static) → dark (tools) → colorful (server) theming range; same
  component, only the --dt-* values differ.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import {
		ColumnToggle,
		DataTable,
		exportCsv,
		filterRows,
		inferColumnType,
		sortRows,
		type ColumnDef,
		type TableState
	} from '$lib/datatable';
	import { servers, type ServerRow } from '../datatable-component.html/data';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/datatable-tools.html/+page.svelte';

	// $state (not const): ColumnToggle flips `visible` on this bound array
	let columns = $state<ColumnDef<ServerRow>[]>([
		{ key: 'id', label: 'ID', width: '4.5em' },
		{ key: 'name', label: 'Name', filterable: true },
		{ key: 'region', label: 'Region', filterable: true },
		{ key: 'status', label: 'Status' }, // rendered by the statusBadge snippet
		{
			key: 'requests',
			label: 'Requests',
			type: 'number',
			align: 'right',
			format: (v) =>
				v == null ? '—' : typeof v === 'number' ? v.toLocaleString('en-US') : String(v)
		},
		{
			key: 'cost',
			label: 'Cost / mo',
			type: 'number',
			align: 'right',
			format: (v) =>
				v == null
					? '—'
					: `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
		},
		{ key: 'deployed', label: 'Last deploy', type: 'date' }
	]);

	let tableState = $state<TableState>({
		sort: null,
		search: '',
		columnFilters: {},
		page: 1,
		pageSize: 10
	});
	let selected = $state<ServerRow[]>([]);

	// CSV of the filtered+sorted set — every matching row, not just the
	// visible page — recomputed from the bound TableState with the same pure
	// tableCore functions the table itself uses.
	function downloadCsv() {
		const state = $state.snapshot(tableState) as TableState;
		const column = state.sort ? columns.find((c) => c.key === state.sort?.key) : undefined;
		const type = !column
			? 'string'
			: column.type && column.type !== 'auto'
				? column.type
				: inferColumnType(servers, column.key, column.sortValue);
		const filtered = filterRows(servers, state.search, columns, state.columnFilters);
		const sorted = sortRows(filtered, state.sort, type, column?.sortValue);
		const blob = new Blob([exportCsv(sorted, columns)], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'servers.csv';
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

{#snippet statusBadge(row: ServerRow, value: ServerRow['status'])}
	<span class="badge badge-{value}">{value}</span>
{/snippet}

<ContentPage
	title="DataTable — Table Tools"
	subtitle="Row selection, per-column filters, column toggling, CSV export"
>
	<div class="demo">
		<div class="table-toolbar">
			<ColumnToggle bind:columns />
			<span class="selected-count" aria-live="polite">{selected.length} selected</span>
			<button type="button" class="export" onclick={downloadCsv}>⬇ Export CSV</button>
		</div>
		<DataTable
			rows={servers}
			{columns}
			bind:state={tableState}
			selectable
			rowKey="id"
			bind:selected
			snippets={{ status: statusBadge }}
			height="420px"
			striped
		/>
	</div>

	<p class="hint">
		Selection is keyed by <code>rowKey="id"</code> — tick rows, then sort or page away: it sticks.
		<b>Name</b>/<b>Region</b> filters AND with the global search; the toggle hides columns live;
		Export CSV writes the <b>whole filtered+sorted set</b>, not just the visible page.
	</p>
	<p class="props">
		Phase 3: <code>selectable</code> + <code>rowKey</code> + <code>bind:selected</code>,
		<code>ColumnDef.filterable</code>/<code>visible</code>, <code>ColumnToggle</code>
		(<code>bind:columns</code>), <code>exportCsv(rows, columns)</code>. Pure core in
		<code>$lib/datatable/tableCore.ts</code>; the dark look is just <code>--dt-*</code> values.
	</p>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		--dt-font-size: 0.72em;
		/* dark theme — the middle of the deck's light → dark → colorful
		   theming range. Same component, only --dt-* values differ. */
		--dt-bg: #101821;
		--dt-color: #d7e2ec;
		--dt-border: #35485c;
		--dt-header-bg: rgba(120, 170, 220, 0.12);
		--dt-stripe-bg: rgba(120, 170, 220, 0.05);
		--dt-row-hover: rgba(120, 170, 220, 0.14);
		--dt-selected-bg: rgba(240, 168, 64, 0.26);
		--dt-accent: #f0a840;
		margin: 0 auto;
		max-width: 1600px;
		line-height: 1.35;
		text-align: initial;
	}
	.table-toolbar {
		display: flex;
		align-items: center;
		gap: 0.9em;
		margin-bottom: 0.25em;
		font-size: 0.72em;
	}
	.selected-count {
		margin-left: auto;
		opacity: 0.85;
	}
	.export {
		font: inherit;
		color: inherit;
		background: rgba(120, 170, 220, 0.12);
		border: 1px solid #35485c;
		border-radius: 6px;
		padding: 0.25em 0.9em;
		cursor: pointer;
	}
	.export:hover {
		border-color: #f0a840;
	}
	/* dark-surface badges: translucent fills, bright text */
	.badge {
		display: inline-block;
		padding: 0.1em 0.6em;
		border-radius: 999px;
		font-size: 0.85em;
		font-weight: 700;
		line-height: 1.5;
	}
	.badge-healthy {
		background: rgba(80, 200, 110, 0.18);
		color: #7ce29a;
	}
	.badge-degraded {
		background: rgba(240, 170, 60, 0.18);
		color: #f5c069;
	}
	.badge-offline {
		background: rgba(235, 100, 100, 0.18);
		color: #f49a9a;
	}
	.hint {
		margin: 0.4em 0 0;
		text-align: center;
		opacity: 0.85;
		font-size: 0.8em;
	}
	.props {
		margin: 0.25em 0 0;
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
