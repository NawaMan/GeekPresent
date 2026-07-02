// Public types for the DataTable component family.
// See specs/DATATABLE-1.md for the full design; this is the target API surface —
// Phase 1 uses the subset it needs (filterable/visible land in Phase 3).

export type SortDirection = 'asc' | 'desc' | null;

export interface SortDescriptor {
	key: string;
	direction: SortDirection;
}

/** Column value type driving sorting/comparison. 'auto' is resolved once per
 *  column by sampling the data (see inferColumnType in tableCore.ts). */
export type ColumnType = 'string' | 'number' | 'date' | 'auto';

/** A ColumnType after 'auto' has been resolved against the data. */
export type ResolvedColumnType = Exclude<ColumnType, 'auto'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ColumnDef<T = any> {
	key: string; // property accessor (flat keys for MVP; dot paths later)
	label: string;
	sortable?: boolean; // default true
	type?: ColumnType; // default 'auto'
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	format?: (value: any, row: T) => string;
	/** Custom sort accessor ("orthogonal data", as jQuery DataTables calls
	 *  it): returns the value a row *sorts by* in this column, independent
	 *  of what the cell displays. E.g. map a 'pending' deploy to a far-future
	 *  date so it counts as latest — after every real date ascending, first
	 *  when sorting newest-first. The result is compared under the column's
	 *  (resolved) type; blank/uncomparable results still always sort last. */
	sortValue?: (row: T) => unknown;
	width?: string; // CSS width, optional
	filterable?: boolean; // per-column filter (Phase 3)
	visible?: boolean; // column visibility (Phase 3)
	align?: 'left' | 'center' | 'right';
}

/** All processing state in one bindable object — the seam for controlled
 *  mode and server-side data (Phase 2). */
export interface TableState {
	sort: SortDescriptor | null;
	search: string;
	columnFilters: Record<string, string>;
	page: number; // 1-based
	pageSize: number;
}

/** 'client': the component filters/sorts/paginates rows itself (default).
 *  'server': rows are rendered as-is and the component only emits state
 *  changes (Phase 2). */
export type TableMode = 'client' | 'server';
