<!--
  DataTable — dependency-free jQuery-DataTables replacement (Phase 1: core MVP).
  Rendering + state wiring only; all data processing is pure functions in
  tableCore.ts, flowing through the chained pipeline (each stage its own
  $derived, never merged):

      rows → filtered → sorted → paginated → visible rows

  Uncontrolled by default: pass raw `rows` + `columns` and the component
  filters/sorts/paginates internally. A column can sort by something other
  than what it displays via `sortValue: (row) => value` — see types.ts. All processing state lives in one
  TableState object — the seam for $bindable/controlled and server mode
  (Phase 2). Theme via CSS custom properties (--dt-border, --dt-header-bg,
  --dt-row-hover, --dt-accent, --dt-font-size, --dt-max-height, and
  --dt-bg/--dt-color for the table's own surface — set them light for an
  "inverted panel" on a dark deck; `striped` adds --dt-stripe-bg zebra rows).
  Give it a maxHeight (prop or --dt-max-height) and big page sizes scroll
  inside the body under a sticky header instead of growing the page; use
  height (or --dt-height) instead to FIX the size so a filtered-down result
  set doesn't shrink the table either.
-->
<script lang="ts" generics="T">
	import Pagination from './Pagination.svelte';
	import SearchBox from './SearchBox.svelte';
	import {
		cellText,
		clampPage,
		filterRows,
		inferColumnType,
		pageCount,
		pageWindow,
		paginateRows,
		sortRows
	} from './tableCore';
	import type { ColumnDef, ResolvedColumnType, SortDirection, TableState } from './types';

	let {
		rows = [],
		columns = [],
		pageSize = 10,
		pageSizeOptions = [10, 25, 50, 100],
		searchable = true,
		loading = false,
		striped = false,
		maxHeight,
		height
	}: {
		rows?: T[];
		columns?: ColumnDef<T>[];
		pageSize?: number;
		pageSizeOptions?: number[];
		searchable?: boolean;
		loading?: boolean;
		/** Alternate-row background (zebra striping); tint via --dt-stripe-bg. */
		striped?: boolean;
		/** CSS length (e.g. '560px'). Caps the table body: larger page sizes
		 *  scroll inside it (sticky header) instead of growing the page.
		 *  Also settable as the --dt-max-height custom property. */
		maxHeight?: string;
		/** CSS length. FIXES the body height: the table stays this size even
		 *  when a filter/last page leaves fewer rows — no layout jumping
		 *  (which is what you want on a presentation slide). Scrolls like
		 *  maxHeight when there are more rows. Also settable as --dt-height. */
		height?: string;
	} = $props();

	// All processing state in one object (bindable/server-driven in Phase 2).
	const table = $state<TableState>({
		sort: null,
		search: '',
		columnFilters: {},
		page: 1,
		// deliberately the *initial* value — pageSize then lives in TableState
		// svelte-ignore state_referenced_locally
		pageSize
	});

	// Resolve 'auto' column types once per (rows, columns) — never per
	// comparison. Inference samples the sortValue accessor when one exists,
	// since those are the values that get compared.
	const columnTypes: Record<string, ResolvedColumnType> = $derived.by(() => {
		const map: Record<string, ResolvedColumnType> = {};
		for (const column of columns) {
			map[column.key] =
				!column.type || column.type === 'auto'
					? inferColumnType(rows, column.key, column.sortValue)
					: column.type;
		}
		return map;
	});

	// The pipeline. Total for the readout comes from `sorted` (post-filter),
	// not the raw rows.
	const filtered = $derived(filterRows(rows, table.search, columns));
	const sortColumn = $derived(
		table.sort ? columns.find((column) => column.key === table.sort?.key) : undefined
	);
	const sorted = $derived(
		sortRows(
			filtered,
			table.sort,
			(table.sort && columnTypes[table.sort.key]) || 'string',
			sortColumn?.sortValue
		)
	);
	const total = $derived(sorted.length);
	// Clamp, don't trust table.page — a filter can shrink the set under it.
	const currentPage = $derived(clampPage(table.page, total, table.pageSize));
	const visibleRows = $derived(paginateRows(sorted, currentPage, table.pageSize));
	const totalPages = $derived(pageCount(total, table.pageSize));
	const readout = $derived(pageWindow(currentPage, table.pageSize, total));

	function sortDirectionOf(column: ColumnDef<T>): SortDirection {
		return table.sort?.key === column.key ? table.sort.direction : null;
	}

	// Header click: none → asc → desc → none (back to natural order).
	function cycleSort(column: ColumnDef<T>) {
		const current = sortDirectionOf(column);
		const next: SortDirection = current === null ? 'asc' : current === 'asc' ? 'desc' : null;
		table.sort = next === null ? null : { key: column.key, direction: next };
		table.page = 1;
	}

	function ariaSortOf(column: ColumnDef<T>): 'ascending' | 'descending' | undefined {
		const direction = sortDirectionOf(column);
		return direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined;
	}

	function applySearch(text: string) {
		table.search = text;
		table.page = 1; // a new filter invalidates the old page
	}

	function goToPage(page: number) {
		table.page = clampPage(page, total, table.pageSize);
	}

	function setPageSize(size: number) {
		// keep the first visible row on screen across the size change
		const firstVisible = (currentPage - 1) * table.pageSize + 1;
		table.pageSize = size;
		table.page = clampPage(Math.ceil(firstVisible / size), total, size);
	}
</script>

<div class="datatable">
	{#if searchable}
		<div class="toolbar">
			<SearchBox value={table.search} onSearch={applySearch} />
		</div>
	{/if}
	<div class="body">
		<div class="scroll" style:height style:max-height={maxHeight}>
			<table>
				<thead>
					<tr>
						{#each columns as column (column.key)}
							<th
								scope="col"
								style:width={column.width}
								style:text-align={column.align}
								aria-sort={ariaSortOf(column)}
							>
								{#if column.sortable !== false}
									<button type="button" class="sort-button" onclick={() => cycleSort(column)}>
										<span>{column.label}</span>
										<span class="sort-indicator" aria-hidden="true">
											{sortDirectionOf(column) === 'asc'
												? '▲'
												: sortDirectionOf(column) === 'desc'
													? '▼'
													: ''}
										</span>
									</button>
								{:else}
									{column.label}
								{/if}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#if rows.length === 0}
						<tr class="empty">
							<td colspan={columns.length}>No data</td>
						</tr>
					{:else if total === 0}
						<tr class="empty">
							<td colspan={columns.length}>No results found</td>
						</tr>
					{:else}
						{#each visibleRows as row, rowIndex}
							<tr class:stripe={striped && rowIndex % 2 === 1}>
								{#each columns as column (column.key)}
									<td style:text-align={column.align}>{cellText(row, column)}</td>
								{/each}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		{#if loading}
			<div class="loading" role="status">Loading…</div>
		{/if}
	</div>
	<Pagination
		page={currentPage}
		pageCount={totalPages}
		pageSize={table.pageSize}
		{pageSizeOptions}
		{total}
		start={readout.start}
		end={readout.end}
		onPage={goToPage}
		onPageSize={setPageSize}
	/>
</div>

<style>
	.datatable {
		font-size: var(--dt-font-size, 0.95em);
		color: inherit;
	}
	.toolbar {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0.5em;
	}
	.body {
		position: relative;
	}
	.scroll {
		overflow: auto;
		height: var(--dt-height, auto);
		max-height: var(--dt-max-height, none);
		/* --dt-bg + --dt-color give the table its own surface — e.g. a light
		   panel on a dark deck. Toolbar/pagination sit outside on the page
		   background, so they keep the inherited page color. */
		background: var(--dt-bg, transparent);
		color: var(--dt-color, inherit);
		border: 1px solid var(--dt-border, rgba(128, 128, 128, 0.35));
		border-radius: 8px;
	}
	table {
		width: 100%;
		/* separate, not collapse: collapsed borders detach from sticky headers */
		border-collapse: separate;
		border-spacing: 0;
		font-size: 1em;
	}
	thead th {
		position: sticky;
		top: 0;
		z-index: 1;
		/* header tint layered over an opaque base so scrolled rows can't show
		   through the sticky header; theme the base with --dt-bg */
		background: linear-gradient(
				var(--dt-header-bg, rgba(128, 128, 128, 0.14)),
				var(--dt-header-bg, rgba(128, 128, 128, 0.14))
			)
			var(--dt-bg, Canvas);
		border-bottom: 2px solid var(--dt-border, rgba(128, 128, 128, 0.35));
		padding: 0.45em 0.7em;
		text-align: left;
		font-weight: 700;
		white-space: nowrap;
	}
	.sort-button {
		display: inline-flex;
		align-items: baseline;
		gap: 0.35em;
		width: 100%;
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		font-weight: 700;
		text-align: inherit;
		cursor: pointer;
	}
	.sort-button:focus-visible {
		outline: 2px solid var(--dt-accent, #4a9eda);
		outline-offset: 2px;
	}
	.sort-indicator {
		font-size: 0.75em;
		min-width: 1em;
		color: var(--dt-accent, #4a9eda);
	}
	tbody td {
		padding: 0.4em 0.7em;
		border-bottom: 1px solid var(--dt-border, rgba(128, 128, 128, 0.35));
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	tr.stripe td {
		background: var(--dt-stripe-bg, rgba(128, 128, 128, 0.07));
	}
	tbody tr:hover td {
		background: var(--dt-row-hover, rgba(128, 128, 128, 0.09));
	}
	.empty td {
		text-align: center;
		padding: 1.6em 0.7em;
		opacity: 0.7;
	}
	/* Overlay, not replacement — the table keeps its layout (and focus) while
	   loading; min-height covers the rows.length === 0 case. */
	.loading {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 4em;
		background: rgba(128, 128, 128, 0.12);
		backdrop-filter: blur(1.5px);
		font-weight: 700;
	}
</style>
