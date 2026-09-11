import { describe, expect, it } from 'vitest';
import {
	buildUrl,
	errorMessage,
	httpErrorMessage,
	isAbort,
	mapRows,
	pluck,
	rowsFrom,
	toQuery,
	totalFrom
} from '../src/lib/data/remoteCore';
import type { TableState } from '../src/lib/datatable/types';

const state = (over: Partial<TableState> = {}): TableState => ({
	sort: null,
	search: '',
	columnFilters: {},
	page: 1,
	pageSize: 10,
	...over
});

describe('pluck', () => {
	it('walks object keys and array indices', () => {
		const payload = { result: [{ rows: [{ id: 1 }] }] };
		expect(pluck(payload, 'result.0.rows.0.id')).toBe(1);
	});

	it('returns the payload itself for a blank path', () => {
		const payload = { a: 1 };
		expect(pluck(payload, '')).toBe(payload);
		expect(pluck(payload, '   ')).toBe(payload);
		expect(pluck(payload)).toBe(payload);
	});

	it('is undefined — not a throw — for paths that go nowhere', () => {
		expect(pluck({ a: 1 }, 'a.b.c')).toBeUndefined();
		expect(pluck({ a: null }, 'a.b')).toBeUndefined();
		expect(pluck([1, 2], 'nope')).toBeUndefined();
		expect(pluck([1, 2], '9')).toBeUndefined();
		expect(pluck(null, 'a')).toBeUndefined();
		expect(pluck(undefined, 'a')).toBeUndefined();
	});
});

describe('rowsFrom', () => {
	it('takes a bare top-level array', () => {
		expect(rowsFrom([{ id: 1 }])).toEqual([{ id: 1 }]);
	});

	it('recognises the usual envelopes, data first', () => {
		expect(rowsFrom({ data: [1], items: [2] })).toEqual([1]);
		expect(rowsFrom({ items: [2] })).toEqual([2]);
		expect(rowsFrom({ results: [3] })).toEqual([3]);
		expect(rowsFrom({ records: [4] })).toEqual([4]);
	});

	it('falls back to the first array-valued property', () => {
		expect(rowsFrom({ meta: { n: 1 }, whatever: [7, 8] })).toEqual([7, 8]);
	});

	it('honours an explicit path and nothing else', () => {
		const payload = { data: [1], deep: { rows: [2] } };
		expect(rowsFrom(payload, 'deep.rows')).toEqual([2]);
		// a wrong path does NOT silently fall back to auto-detection
		expect(rowsFrom(payload, 'deep.missing')).toEqual([]);
	});

	it('is [] for anything unrecognisable — never a throw', () => {
		expect(rowsFrom(null)).toEqual([]);
		expect(rowsFrom(undefined)).toEqual([]);
		expect(rowsFrom(42)).toEqual([]);
		expect(rowsFrom('nope')).toEqual([]);
		expect(rowsFrom({ a: 1, b: 'two' })).toEqual([]);
	});
});

describe('totalFrom', () => {
	it('prefers an explicit path', () => {
		expect(totalFrom({ meta: { hits: 812 } }, 'meta.hits', 10)).toBe(812);
	});

	it('auto-detects the usual count keys, including the jQuery protocol', () => {
		expect(totalFrom({ total: 5 }, undefined, 0)).toBe(5);
		expect(totalFrom({ totalCount: 6 }, undefined, 0)).toBe(6);
		expect(totalFrom({ recordsTotal: 7 }, undefined, 0)).toBe(7);
	});

	it('accepts a numeric string but not junk', () => {
		expect(totalFrom({ total: '42' }, undefined, 3)).toBe(42);
		expect(totalFrom({ total: 'many' }, undefined, 3)).toBe(3);
		expect(totalFrom({ total: -1 }, undefined, 3)).toBe(3);
		expect(totalFrom({ total: Number.NaN }, undefined, 3)).toBe(3);
	});

	it('falls back to the row count when the server reports nothing', () => {
		expect(totalFrom({ data: [1, 2, 3] }, undefined, 3)).toBe(3);
		expect(totalFrom(null, undefined, 3)).toBe(3);
		// and a garbage fallback still yields a number, not NaN
		expect(totalFrom(null, undefined, Number.NaN)).toBe(0);
	});
});

describe('buildUrl', () => {
	it('appends params with the right separator', () => {
		expect(buildUrl('/api/fleet', { page: 2 })).toBe('/api/fleet?page=2');
		expect(buildUrl('/api/fleet?v=1', { page: 2 })).toBe('/api/fleet?v=1&page=2');
	});

	it('leaves the URL alone when there is nothing to add', () => {
		expect(buildUrl('/api/fleet')).toBe('/api/fleet');
		expect(buildUrl('/api/fleet', {})).toBe('/api/fleet');
		expect(buildUrl('/api/fleet', { q: '', page: null, size: undefined })).toBe('/api/fleet');
		expect(buildUrl('/api/fleet', { page: Number.NaN })).toBe('/api/fleet');
	});

	it('encodes keys and values', () => {
		expect(buildUrl('/api', { 'filter.region': 'us east' })).toBe('/api?filter.region=us%20east');
		expect(buildUrl('/api', { q: 'a&b=c' })).toBe('/api?q=a%26b%3Dc');
	});

	it('keeps params in front of the hash, and works on relative URLs', () => {
		expect(buildUrl('./feed.json#top', { page: 1 })).toBe('./feed.json?page=1#top');
		expect(buildUrl('../data/feed.json', { page: 1 })).toBe('../data/feed.json?page=1');
	});

	it('is a string for a non-string base', () => {
		expect(buildUrl(undefined as unknown as string, { page: 1 })).toBe('');
	});
});

describe('toQuery', () => {
	it('sends only page and pageSize for an untouched table', () => {
		expect(toQuery(state())).toEqual({ page: 1, pageSize: 10 });
	});

	it('adds search, sort and column filters once they are set', () => {
		const q = toQuery(
			state({
				search: '  node  ',
				sort: { key: 'requests', direction: 'desc' },
				columnFilters: { region: 'us-west', team: '  ', status: '' }
			})
		);
		expect(q).toEqual({
			page: 1,
			pageSize: 10,
			search: 'node',
			sort: 'requests',
			order: 'desc',
			'filter.region': 'us-west'
		});
	});

	it('omits a sort whose direction has cycled back to null', () => {
		const q = toQuery(state({ sort: { key: 'requests', direction: null } }));
		expect(q.sort).toBeUndefined();
		expect(q.order).toBeUndefined();
	});

	it('renames every parameter the backend spells differently', () => {
		const q = toQuery(
			state({ search: 'abc', columnFilters: { region: 'eu' }, page: 3, pageSize: 25 }),
			{ page: 'offset', pageSize: 'limit', search: 'q', filterPrefix: '' }
		);
		expect(q).toEqual({ offset: 3, limit: 25, q: 'abc', region: 'eu' });
	});

	it('is {} for a missing or malformed state — never a throw', () => {
		expect(toQuery(null)).toEqual({});
		expect(toQuery(undefined)).toEqual({});
		expect(toQuery({ page: 'x', pageSize: -3, search: 7 } as unknown as TableState)).toEqual({});
	});
});

describe('mapRows', () => {
	it('passes rows through untouched without a map', () => {
		const rows = [{ id: 1 }];
		expect(mapRows(rows)).toEqual(rows);
	});

	it('drops a record whose map throws instead of failing the whole page', () => {
		const out = mapRows<{ id: number }>([{ id: 1 }, null, { id: 3 }], (raw) => ({
			id: (raw as { id: number }).id
		}));
		expect(out).toEqual([{ id: 1 }, { id: 3 }]);
	});

	it('is [] for a non-array', () => {
		expect(mapRows(null as unknown as unknown[])).toEqual([]);
	});
});

describe('error helpers', () => {
	it('always says something', () => {
		expect(errorMessage(new Error('boom'))).toBe('boom');
		expect(errorMessage('  bad  ')).toBe('bad');
		expect(errorMessage({ message: 'nope' })).toBe('nope');
		expect(errorMessage(new Error(''))).toBe('Request failed');
		expect(errorMessage(undefined)).toBe('Request failed');
		expect(errorMessage(null)).toBe('Request failed');
	});

	it('names the status and the URL, which is how a 404 reads different from CORS', () => {
		expect(httpErrorMessage(404, 'Not Found', '/api/fleet')).toBe(
			'HTTP 404 Not Found for /api/fleet'
		);
		expect(httpErrorMessage(500, '', '')).toBe('HTTP 500');
	});

	it('recognises an abort by name', () => {
		const abort = new Error('aborted');
		abort.name = 'AbortError';
		expect(isAbort(abort)).toBe(true);
		expect(isAbort(new Error('other'))).toBe(false);
		expect(isAbort(null)).toBe(false);
	});
});
