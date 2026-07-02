<!--
  DataTable — dependency-free jQuery-DataTables replacement (Phase 1: core MVP).
  Rendering + state wiring only; all data processing is pure functions in
  tableCore.ts, flowing through the chained pipeline (each stage its own
  $derived, never merged):

      rows → filtered → sorted → paginated → visible rows

  Uncontrolled by default: pass raw `rows` + `columns` and the component
  filters/sorts/paginates internally. A column can sort by something other
  than what it displays via `sortValue: (row) => value` — see types.ts.
  All processing state lives in one TableState object exposed as
  `bind:state` — bind it and internal changes write back to the parent;
  change it externally and the table follows (controlled mode).

  Server-side data: mode="server" renders `rows` verbatim (no client
  pipeline) and emits onstatechange(state) after every sort/search/page
  interaction — refetch there and hand back the new page of rows plus
  `totalCount` for the readout and page math.

  Custom cells: pass `snippets={{ columnKey: mySnippet }}` — an explicit
  map, NOT dynamically-named `cell_*` snippets (those aren't resolvable in
  Svelte). Each snippet receives (row, value, rowIndex); precedence per cell
  is snippet > column.format > raw. `headerSnippets` does the same for
  header content (rendered inside the sort button, so sorting keeps
  working); the `empty` snippet customizes the "No results found" row. Theme via CSS custom properties (--dt-border, --dt-header-bg,
  --dt-row-hover, --dt-accent, --dt-font-size, --dt-max-height, and
  --dt-bg/--dt-color for the table's own surface — set them light for an
  "inverted panel" on a dark deck; `striped` adds --dt-stripe-bg zebra rows).
  Give it a maxHeight (prop or --dt-max-height) and big page sizes scroll
  inside the body under a sticky header instead of growing the page; use
  height (or --dt-height) instead to FIX the size so a filtered-down result
  set doesn't shrink the table either.
-->
<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import Pagination from './Pagination.svelte';
	import SearchBox from './SearchBox.svelte';
	import {
		cellText,
		cellValue,
		clampPage,
		filterRows,
		inferColumnType,
		pageCount,
		pageWindow,
		paginateRows,
		sortRows
	} from './tableCore';
	import type {
		CellSnippets,
		ColumnDef,
		HeaderSnippets,
		ResolvedColumnType,
		SortDirection,
		TableMode,
		TableState
	} from './types';

	let {
		rows = [],
		columns = [],
		pageSize = 10,
		// All processing state in one bindable object. The default seeds pageSize
		// from the prop — when the parent binds its own state, that object wins
		// and the pageSize prop is ignored.
		// svelte-ignore state_referenced_locally
		state: table = $bindable({
			sort: null,
			search: '',
			columnFilters: {},
			page: 1,
			// svelte-ignore state_referenced_locally
			pageSize
		}),
		pageSizeOptions = [10, 25, 50, 100],
		mode = 'client',
		totalCount,
		onstatechange,
		searchable = true,
		loading = false,
		striped = false,
		maxHeight,
		height,
		snippets,
		headerSnippets,
		empty
	}: {
		rows?: T[];
		columns?: ColumnDef<T>[];
		pageSize?: number;
		/** Full processing state, `bind:state`-able for controlled mode: bind it
		 *  and every internal change (sort click, search, paging) writes back;
		 *  reassign or mutate it externally and the table follows. Internal
		 *  changes always REASSIGN the whole object (a $bindable fallback isn't
		 *  deeply reactive), so `$state` snapshots of it stay coherent. */
		state?: TableState;
		pageSizeOptions?: number[];
		/** 'client' (default): filter/sort/paginate `rows` internally.
		 *  'server': render `rows` verbatim — the parent owns processing and
		 *  reacts to onstatechange (or bind:state) by supplying the next page
		 *  of rows plus `totalCount`. */
		mode?: TableMode;
		/** Server mode only: the total result count (post-filter, pre-paging)
		 *  backing the readout and page math. Falls back to rows.length. */
		totalCount?: number;
		/** Fires after every internally-initiated state change (sort click,
		 *  search, paging) with the new TableState. In server mode this is the
		 *  refetch signal; external bind:state changes don't echo. */
		onstatechange?: (state: TableState) => void;
		searchable?: boolean;
		loading?: boolean;
		/** Custom cell renderers, keyed by column key — an explicit map by
		 *  design (dynamic `cell_*` snippet names aren't resolvable). Each
		 *  snippet receives (row, value, rowIndex); precedence per cell is
		 *  snippet > column.format > raw. Sorting still compares the raw (or
		 *  sortValue) value and search still matches the format()/raw text. */
		snippets?: CellSnippets<T>;
		/** Custom header content, keyed by column key; each snippet receives
		 *  the ColumnDef. Rendered inside the sort button for sortable columns
		 *  (sorting and the ▲/▼ indicator keep working), bare otherwise. */
		headerSnippets?: HeaderSnippets<T>;
		/** Replaces the default "No results found" row when a search matches
		 *  nothing (the distinct "No data" state for empty `rows` remains). */
		empty?: Snippet;
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
	// not the raw rows. In server mode every stage passes rows through
	// verbatim — the parent did the processing — and `total` comes from
	// totalCount; the pure functions stay the single source of truth for
	// client mode.
	const filtered = $derived(mode === 'client' ? filterRows(rows, table.search, columns) : rows);
	const sortColumn = $derived(
		table.sort ? columns.find((column) => column.key === table.sort?.key) : undefined
	);
	const sorted = $derived(
		mode === 'client'
			? sortRows(
					filtered,
					table.sort,
					(table.sort && columnTypes[table.sort.key]) || 'string',
					sortColumn?.sortValue
				)
			: filtered
	);
	const total = $derived(mode === 'client' ? sorted.length : (totalCount ?? rows.length));
	// Clamp, don't trust table.page — a filter can shrink the set under it.
	const currentPage = $derived(clampPage(table.page, total, table.pageSize));
	const visibleRows = $derived(
		mode === 'client' ? paginateRows(sorted, currentPage, table.pageSize) : sorted
	);
	const totalPages = $derived(pageCount(total, table.pageSize));
	const readout = $derived(pageWindow(currentPage, table.pageSize, total));

	function sortDirectionOf(column: ColumnDef<T>): SortDirection {
		return table.sort?.key === column.key ? table.sort.direction : null;
	}

	// State changes reassign the whole object (never deep-mutate): that's what
	// makes bind:state write back to the parent — and what keeps an unbound
	// $bindable fallback (which isn't deeply reactive) reactive at all.
	// onstatechange fires only here, i.e. for internally-initiated changes —
	// external bind:state writes don't echo back.
	function commit(next: TableState) {
		table = next;
		onstatechange?.(next);
	}

	// Header click: none → asc → desc → none (back to natural order).
	function cycleSort(column: ColumnDef<T>) {
		const current = sortDirectionOf(column);
		const next: SortDirection = current === null ? 'asc' : current === 'asc' ? 'desc' : null;
		commit({
			...table,
			sort: next === null ? null : { key: column.key, direction: next },
			page: 1
		});
	}

	function ariaSortOf(column: ColumnDef<T>): 'ascending' | 'descending' | undefined {
		const direction = sortDirectionOf(column);
		return direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined;
	}

	function applySearch(text: string) {
		commit({ ...table, search: text, page: 1 }); // a new filter invalidates the old page
	}

	function goToPage(page: number) {
		commit({ ...table, page: clampPage(page, total, table.pageSize) });
	}

	function setPageSize(size: number) {
		// keep the first visible row on screen across the size change
		const firstVisible = (currentPage - 1) * table.pageSize + 1;
		commit({ ...table, pageSize: size, page: clampPage(Math.ceil(firstVisible / size), total, size) });
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
							{@const header = headerSnippets?.[column.key]}
							<th
								scope="col"
								style:width={column.width}
								style:text-align={column.align}
								aria-sort={ariaSortOf(column)}
							>
								{#if column.sortable !== false}
									<button type="button" class="sort-button" onclick={() => cycleSort(column)}>
										<span>
											{#if header}{@render header(column)}{:else}{column.label}{/if}
										</span>
										<span class="sort-indicator" aria-hidden="true">
											{sortDirectionOf(column) === 'asc'
												? '▲'
												: sortDirectionOf(column) === 'desc'
													? '▼'
													: ''}
										</span>
									</button>
								{:else if header}
									{@render header(column)}
								{:else}
									{column.label}
								{/if}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#if visibleRows.length === 0}
						<!-- keyed on the search, not rows.length, so server mode (where a
						     no-hit search also means empty rows) picks the right message -->
						{#if table.search.trim() !== ''}
							<tr class="empty">
								<td colspan={columns.length}>
									{#if empty}{@render empty()}{:else}No results found{/if}
								</td>
							</tr>
						{:else}
							<tr class="empty">
								<td colspan={columns.length}>No data</td>
							</tr>
						{/if}
					{:else}
						{#each visibleRows as row, rowIndex}
							<tr class:stripe={striped && rowIndex % 2 === 1}>
								{#each columns as column (column.key)}
									{@const cell = snippets?.[column.key]}
									<td style:text-align={column.align}>
										{#if cell}
											{@render cell(row, cellValue(row, column), rowIndex)}
										{:else}
											{cellText(row, column)}
										{/if}
									</td>
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
