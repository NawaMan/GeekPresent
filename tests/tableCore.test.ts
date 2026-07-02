import { describe, expect, it } from 'vitest';
import {
	cellText,
	clampPage,
	compareValues,
	filterRows,
	inferColumnType,
	isBlank,
	pageCount,
	pageWindow,
	paginateRows,
	sortRows,
	sortsLast
} from '../src/lib/datatable/tableCore';
import type { ColumnDef } from '../src/lib/datatable/types';

describe('isBlank / sortsLast', () => {
	it('treats null, undefined and empty string as blank', () => {
		expect(isBlank(null)).toBe(true);
		expect(isBlank(undefined)).toBe(true);
		expect(isBlank('')).toBe(true);
		expect(isBlank(0)).toBe(false);
		expect(isBlank('x')).toBe(false);
		expect(isBlank(false)).toBe(false);
	});

	it('sends NaN and invalid dates to the sorts-last bucket', () => {
		expect(sortsLast(NaN, 'number')).toBe(true);
		expect(sortsLast('abc', 'number')).toBe(true);
		expect(sortsLast('not a date', 'date')).toBe(true);
		expect(sortsLast(new Date('nope'), 'date')).toBe(true);
		expect(sortsLast(42, 'number')).toBe(false);
		expect(sortsLast('2024-01-01', 'date')).toBe(false);
		expect(sortsLast('anything', 'string')).toBe(false);
	});
});

describe('compareValues', () => {
	it('compares numbers numerically, including numeric strings', () => {
		expect(compareValues(2, 10, 'number')).toBeLessThan(0);
		expect(compareValues(100, 10, 'number')).toBeGreaterThan(0);
		expect(compareValues(5, 5, 'number')).toBe(0);
		expect(compareValues('2', '10', 'number')).toBeLessThan(0);
	});

	it('sorts NaN last among numbers', () => {
		expect(compareValues(NaN, 1, 'number')).toBeGreaterThan(0);
		expect(compareValues(1, NaN, 'number')).toBeLessThan(0);
		expect(compareValues(NaN, NaN, 'number')).toBe(0);
	});

	it('compares dates chronologically (strings and Date objects)', () => {
		expect(compareValues('2024-01-02', '2024-01-10', 'date')).toBeLessThan(0);
		expect(compareValues(new Date('2025-06-01'), new Date('2024-06-01'), 'date')).toBeGreaterThan(
			0
		);
		expect(compareValues('2024-03-05', new Date('2024-03-05T00:00:00Z'), 'date')).toBe(0);
	});

	it('sorts invalid dates last', () => {
		expect(compareValues('garbage', '2024-01-01', 'date')).toBeGreaterThan(0);
		expect(compareValues('2024-01-01', 'garbage', 'date')).toBeLessThan(0);
		expect(compareValues('garbage', 'more garbage', 'date')).toBe(0);
	});

	it('uses natural string sort ("item2" before "item10") and ignores case', () => {
		expect(compareValues('item2', 'item10', 'string')).toBeLessThan(0);
		expect(compareValues('Item10', 'item2', 'string')).toBeGreaterThan(0);
		expect(compareValues('ALPHA', 'alpha', 'string')).toBe(0);
		expect(compareValues('apple', 'banana', 'string')).toBeLessThan(0);
	});

	it('sorts blank values last for every type', () => {
		const valid = { string: 'a', number: 1, date: '2024-01-01' } as const;
		for (const type of ['string', 'number', 'date'] as const) {
			expect(compareValues(null, valid[type], type)).toBeGreaterThan(0);
			expect(compareValues(valid[type], undefined, type)).toBeLessThan(0);
			expect(compareValues('', null, type)).toBe(0);
		}
	});
});

describe('inferColumnType', () => {
	it('infers number when all non-blank values coerce to numbers', () => {
		const rows = [{ v: 1 }, { v: '2' }, { v: null }, { v: '' }, { v: 3.5 }];
		expect(inferColumnType(rows, 'v')).toBe('number');
	});

	it('infers date when values parse as dates but not numbers', () => {
		const rows = [{ v: '2024-01-01' }, { v: new Date() }, { v: null }];
		expect(inferColumnType(rows, 'v')).toBe('date');
	});

	it('falls back to string for mixed or textual values', () => {
		expect(inferColumnType([{ v: 'apple' }, { v: '2' }], 'v')).toBe('string');
		expect(inferColumnType([{ v: 'apple' }, { v: 'banana' }], 'v')).toBe('string');
	});

	it('falls back to string when the column is empty or all blank', () => {
		expect(inferColumnType([], 'v')).toBe('string');
		expect(inferColumnType([{ v: null }, { v: '' }], 'v')).toBe('string');
	});

	it('does not mistake whitespace-only strings for the number 0', () => {
		expect(inferColumnType([{ v: '  ' }, { v: 'abc' }], 'v')).toBe('string');
	});

	it('infers from the sortValue accessor when given one', () => {
		const rows = [{ v: '2024-01-01' }, { v: 'pending' }];
		expect(inferColumnType(rows, 'v')).toBe('string'); // 'pending' breaks date inference
		expect(inferColumnType(rows, 'v', (r) => (r.v === 'pending' ? '9999-12-31' : r.v))).toBe(
			'date'
		);
	});
});

type Row = { id: number; name: string | null; amount: number | string | null; when: string | null };

const rows: Row[] = [
	{ id: 1, name: 'item10', amount: 100, when: '2024-05-01' },
	{ id: 2, name: 'item2', amount: 2, when: null },
	{ id: 3, name: null, amount: 10, when: '2023-01-15' },
	{ id: 4, name: 'Apple', amount: null, when: '2024-05-01' },
	{ id: 5, name: 'apple', amount: 'oops', when: 'garbage' }
];

const ids = (r: Row[]) => r.map((x) => x.id);

describe('sortRows', () => {
	it('sorts numbers 2 < 10 < 100, with NaN then blank last', () => {
		const asc = sortRows(rows, { key: 'amount', direction: 'asc' }, 'number');
		expect(ids(asc)).toEqual([2, 3, 1, 4, 5]);
	});

	it('keeps blank/uncomparable values last when descending', () => {
		const desc = sortRows(rows, { key: 'amount', direction: 'desc' }, 'number');
		expect(ids(desc)).toEqual([1, 3, 2, 4, 5]);
	});

	it('sorts dates chronologically with invalid/blank last', () => {
		const asc = sortRows(rows, { key: 'when', direction: 'asc' }, 'date');
		expect(ids(asc)).toEqual([3, 1, 4, 2, 5]);
	});

	it('natural-sorts strings (item2 before item10)', () => {
		const asc = sortRows(rows, { key: 'name', direction: 'asc' }, 'string');
		expect(ids(asc)).toEqual([4, 5, 2, 1, 3]);
	});

	it('is stable: equal keys keep original relative order', () => {
		const dup = [
			{ id: 1, g: 'b' },
			{ id: 2, g: 'a' },
			{ id: 3, g: 'b' },
			{ id: 4, g: 'a' },
			{ id: 5, g: 'b' }
		];
		const asc = sortRows(dup, { key: 'g', direction: 'asc' }, 'string');
		expect(asc.map((r) => r.id)).toEqual([2, 4, 1, 3, 5]);
		// ties among blanks keep original order too
		const blanks = sortRows(rows, { key: 'when', direction: 'desc' }, 'date');
		expect(ids(blanks).slice(-2)).toEqual([2, 5]);
	});

	it('sorts by a custom sortValue accessor instead of the raw cell value', () => {
		const deploys = [
			{ id: 1, when: '2024-05-01' },
			{ id: 2, when: 'pending' },
			{ id: 3, when: '2025-10-28' },
			{ id: 4, when: null }
		];
		// orthogonal data: 'pending' sorts as far-future, display untouched
		const asFuture = (r: { when: string | null }) => (r.when === 'pending' ? '9999-12-31' : r.when);

		const asc = sortRows(deploys, { key: 'when', direction: 'asc' }, 'date', asFuture);
		expect(asc.map((r) => r.id)).toEqual([1, 3, 2, 4]); // pending after real dates, null still last

		const desc = sortRows(deploys, { key: 'when', direction: 'desc' }, 'date', asFuture);
		expect(desc.map((r) => r.id)).toEqual([2, 3, 1, 4]); // newest-first: pending leads, null still last

		// without the accessor, 'pending' is just an invalid date → sorts last
		const plain = sortRows(deploys, { key: 'when', direction: 'desc' }, 'date');
		expect(plain.map((r) => r.id)).toEqual([3, 1, 2, 4]);
	});

	it('does not mutate the input and returns natural order for null sort/direction', () => {
		const input = [...rows];
		const sorted = sortRows(input, { key: 'amount', direction: 'asc' }, 'number');
		expect(ids(input)).toEqual([1, 2, 3, 4, 5]);
		expect(sorted).not.toBe(input);
		expect(ids(sortRows(input, null, 'number'))).toEqual([1, 2, 3, 4, 5]);
		expect(ids(sortRows(input, { key: 'amount', direction: null }, 'number'))).toEqual([
			1, 2, 3, 4, 5
		]);
	});
});

describe('filterRows / cellText', () => {
	const columns: ColumnDef<Row>[] = [
		{ key: 'name', label: 'Name' },
		{ key: 'amount', label: 'Amount', format: (v) => (v === null ? '—' : `$${v}`) },
		{ key: 'when', label: 'When' }
	];

	it('matches case-insensitively across all columns', () => {
		expect(ids(filterRows(rows, 'ITEM', columns))).toEqual([1, 2]);
		expect(ids(filterRows(rows, 'apple', columns))).toEqual([4, 5]);
	});

	it('matches against the formatted value when a format fn exists', () => {
		expect(ids(filterRows(rows, '$100', columns))).toEqual([1]);
		expect(ids(filterRows(rows, '—', columns))).toEqual([4]);
	});

	it('returns all rows for empty or whitespace-only search, as a copy', () => {
		const all = filterRows(rows, '   ', columns);
		expect(ids(all)).toEqual([1, 2, 3, 4, 5]);
		expect(all).not.toBe(rows);
	});

	it('skips columns hidden via visible: false', () => {
		const hidden: ColumnDef<Row>[] = [{ key: 'name', label: 'Name', visible: false }];
		expect(filterRows(rows, 'item', hidden)).toEqual([]);
	});

	it('cellText stringifies raw values and renders blanks as empty', () => {
		expect(cellText(rows[0], columns[0])).toBe('item10');
		expect(cellText(rows[2], columns[0])).toBe('');
		expect(cellText(rows[3], columns[1])).toBe('—');
	});
});

describe('pagination', () => {
	const items = Array.from({ length: 45 }, (_, i) => i + 1);

	it('slices the requested 1-based page', () => {
		expect(paginateRows(items, 1, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		expect(paginateRows(items, 2, 10)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
	});

	it('handles the single partial last page', () => {
		expect(paginateRows(items, 5, 10)).toEqual([41, 42, 43, 44, 45]);
	});

	it('handles an exact multiple of pageSize (no phantom extra page)', () => {
		const exact = items.slice(0, 40);
		expect(pageCount(40, 10)).toBe(4);
		expect(paginateRows(exact, 4, 10)).toEqual([31, 32, 33, 34, 35, 36, 37, 38, 39, 40]);
		expect(paginateRows(exact, 5, 10)).toEqual([31, 32, 33, 34, 35, 36, 37, 38, 39, 40]); // clamped
	});

	it('handles the empty set', () => {
		expect(paginateRows([], 3, 10)).toEqual([]);
		expect(pageCount(0, 10)).toBe(1);
		expect(clampPage(7, 0, 10)).toBe(1);
		expect(pageWindow(1, 10, 0)).toEqual({ start: 0, end: 0 });
	});

	it('clamps out-of-range and non-finite pages', () => {
		expect(clampPage(9, 25, 10)).toBe(3); // page 9 of 3 → snap to 3
		expect(clampPage(0, 25, 10)).toBe(1);
		expect(clampPage(-5, 25, 10)).toBe(1);
		expect(clampPage(2.7, 25, 10)).toBe(2);
		expect(clampPage(NaN, 25, 10)).toBe(1);
		expect(paginateRows(items, 99, 10)).toEqual([41, 42, 43, 44, 45]);
	});

	it('tolerates a non-positive pageSize by showing everything', () => {
		expect(paginateRows(items.slice(0, 3), 1, 0)).toEqual([1, 2, 3]);
		expect(pageCount(45, 0)).toBe(1);
		expect(pageWindow(1, 0, 3)).toEqual({ start: 1, end: 3 });
	});

	it('computes the "Showing X–Y of Z" window', () => {
		expect(pageWindow(1, 10, 45)).toEqual({ start: 1, end: 10 });
		expect(pageWindow(5, 10, 45)).toEqual({ start: 41, end: 45 });
		expect(pageWindow(9, 10, 25)).toEqual({ start: 21, end: 25 }); // stale page clamped
	});
});
