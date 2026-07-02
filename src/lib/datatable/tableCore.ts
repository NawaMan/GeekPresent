// Pure data-processing functions for DataTable. No component imports, no DOM —
// everything here is independently unit-testable (tests/tableCore.test.ts).
//
// The pipeline (each stage its own $derived in DataTable.svelte — never merged):
//   rows → filterRows → sortRows → paginateRows → visible rows

import type { ColumnDef, ResolvedColumnType, SortDescriptor } from './types';

/** Values that always sort last and never match a search: null/undefined/''. */
export function isBlank(value: unknown): boolean {
	return value === null || value === undefined || value === '';
}

function toNumber(value: unknown): number {
	if (typeof value === 'number') return value;
	const s = String(value).trim();
	return s === '' ? NaN : Number(s);
}

function toTime(value: unknown): number {
	if (value instanceof Date) return value.getTime();
	if (typeof value === 'number') return value; // already a timestamp
	return new Date(String(value)).getTime();
}

/** True when a non-blank value cannot be compared under the given type
 *  (NaN for numbers, invalid date for dates). These sort last too. */
function isUncomparable(value: unknown, type: ResolvedColumnType): boolean {
	if (type === 'number') return Number.isNaN(toNumber(value));
	if (type === 'date') return Number.isNaN(toTime(value));
	return false;
}

/** Blank or uncomparable — belongs in the sorts-last bucket regardless of
 *  sort direction. */
export function sortsLast(value: unknown, type: ResolvedColumnType): boolean {
	return isBlank(value) || isUncomparable(value, type);
}

/**
 * Ascending comparator for two cell values of a resolved column type.
 * Blank / NaN / invalid-date values sort last; direction handling lives in
 * sortRows so that "last" stays last even when descending.
 */
export function compareValues(a: unknown, b: unknown, type: ResolvedColumnType): number {
	const aLast = sortsLast(a, type);
	const bLast = sortsLast(b, type);
	if (aLast || bLast) return aLast && bLast ? 0 : aLast ? 1 : -1;

	switch (type) {
		case 'number': {
			const an = toNumber(a);
			const bn = toNumber(b);
			return an < bn ? -1 : an > bn ? 1 : 0;
		}
		case 'date': {
			const at = toTime(a);
			const bt = toTime(b);
			return at < bt ? -1 : at > bt ? 1 : 0;
		}
		default:
			// numeric: true gives natural sort ("item2" before "item10")
			return String(a).localeCompare(String(b), undefined, {
				sensitivity: 'base',
				numeric: true
			});
	}
}

/**
 * Resolve a column's effective type from the data: if every non-blank value
 * coerces cleanly to a number → 'number'; else if every one parses as a date
 * → 'date'; else 'string'. Called once per column (cache the result — never
 * infer per comparison). Empty/all-blank columns fall back to 'string'.
 * When the column has a sortValue accessor, pass it as getValue so the
 * inference looks at the values that will actually be compared.
 */
export function inferColumnType<T>(
	rows: readonly T[],
	key: string,
	getValue?: (row: T) => unknown
): ResolvedColumnType {
	let sampled = false;
	let allNumbers = true;
	let allDates = true;
	for (const row of rows) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const value = getValue ? getValue(row) : (row as any)?.[key];
		if (isBlank(value)) continue;
		sampled = true;
		if (allNumbers && Number.isNaN(toNumber(value))) allNumbers = false;
		if (allDates && !(value instanceof Date) && typeof value !== 'string') allDates = false;
		if (allDates && Number.isNaN(toTime(value))) allDates = false;
		if (!allNumbers && !allDates) break;
	}
	if (!sampled) return 'string';
	if (allNumbers) return 'number';
	if (allDates) return 'date';
	return 'string';
}

/** The raw value a cell holds (row[column.key]) — what cell snippets receive
 *  and what sorting compares (absent a sortValue accessor). */
export function cellValue<T>(row: T, column: ColumnDef<T>): unknown {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (row as any)?.[column.key];
}

/** The text a cell displays (and what global search matches against, even
 *  when a snippet renders the cell): the format() result when present, else
 *  the raw value stringified. */
export function cellText<T>(row: T, column: ColumnDef<T>): string {
	const raw = cellValue(row, column);
	if (column.format) return column.format(raw, row);
	return isBlank(raw) ? '' : String(raw);
}

/**
 * Global search: case-insensitive substring match across all visible columns,
 * against the formatted value when a format fn exists. Empty/whitespace-only
 * search returns all rows.
 */
export function filterRows<T>(
	rows: readonly T[],
	search: string,
	columns: readonly ColumnDef<T>[]
): T[] {
	const needle = search.trim().toLowerCase();
	if (needle === '') return rows.slice();
	const searched = columns.filter((c) => c.visible !== false);
	return rows.filter((row) =>
		searched.some((column) => cellText(row, column).toLowerCase().includes(needle))
	);
}

/**
 * Stable, non-mutating, type-aware sort. `direction: null` (or no descriptor)
 * returns the natural order. Blank/uncomparable values stay last regardless
 * of direction. Ties keep original order via index tagging (guaranteed stable
 * even if the engine's sort weren't). An optional getValue accessor (a
 * column's sortValue) supplies the compared value instead of row[sort.key] —
 * display and sort key stay independent.
 */
export function sortRows<T>(
	rows: readonly T[],
	sort: SortDescriptor | null,
	type: ResolvedColumnType,
	getValue?: (row: T) => unknown
): T[] {
	if (!sort || sort.direction === null) return rows.slice();
	const dir = sort.direction === 'asc' ? 1 : -1;
	return rows
		.map((row, index) => ({ row, index }))
		.sort((a, b) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const av = getValue ? getValue(a.row) : (a.row as any)?.[sort.key];
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const bv = getValue ? getValue(b.row) : (b.row as any)?.[sort.key];
			const aLast = sortsLast(av, type);
			const bLast = sortsLast(bv, type);
			const c =
				aLast || bLast
					? aLast && bLast
						? 0
						: aLast
							? 1
							: -1 // not flipped by dir: last is last in both directions
					: dir * compareValues(av, bv, type);
			return c !== 0 ? c : a.index - b.index;
		})
		.map((tagged) => tagged.row);
}

/** Total pages for a result set — never less than 1, so an empty set still
 *  has a "page 1" to stand on. */
export function pageCount(total: number, pageSize: number): number {
	if (pageSize <= 0) return 1;
	return Math.max(1, Math.ceil(total / pageSize));
}

/** Snap a requested page into [1, pageCount] — e.g. page 9 of 3 → 3. */
export function clampPage(page: number, total: number, pageSize: number): number {
	if (!Number.isFinite(page)) return 1;
	return Math.min(Math.max(1, Math.floor(page)), pageCount(total, pageSize));
}

/** One page of rows. The page is clamped first, so a stale page number after
 *  a filter change still yields a valid (last) page rather than an empty slice. */
export function paginateRows<T>(rows: readonly T[], page: number, pageSize: number): T[] {
	if (pageSize <= 0) return rows.slice();
	const p = clampPage(page, rows.length, pageSize);
	const start = (p - 1) * pageSize;
	return rows.slice(start, start + pageSize);
}

/** 1-based inclusive bounds for the "Showing X–Y of Z entries" readout
 *  ({start: 0, end: 0} when there are no rows). */
export function pageWindow(
	page: number,
	pageSize: number,
	total: number
): { start: number; end: number } {
	if (total === 0) return { start: 0, end: 0 };
	if (pageSize <= 0) return { start: 1, end: total };
	const p = clampPage(page, total, pageSize);
	return { start: (p - 1) * pageSize + 1, end: Math.min(p * pageSize, total) };
}
