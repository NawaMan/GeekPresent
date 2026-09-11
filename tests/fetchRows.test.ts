import { describe, expect, it, vi } from 'vitest';
import { fetchRows } from '../src/lib/data/fetchRows';

// fetchRows on its own, through the fetchImpl seam — the part <RemoteData>
// doesn't exercise: the contract about what THROWS (a failed request) versus
// what degrades quietly (a payload shaped differently than you expected).

function ok(body: unknown) {
	return { ok: true, status: 200, statusText: 'OK', json: async () => body };
}

describe('fetchRows', () => {
	it('returns rows, the reported total, and the untouched payload', async () => {
		const payload = { data: [{ id: 1 }, { id: 2 }], total: 412 };
		const fetchImpl = vi.fn().mockResolvedValue(ok(payload));

		const result = await fetchRows('/api/fleet', { rowsPath: 'data', fetchImpl });

		expect(result.rows).toEqual([{ id: 1 }, { id: 2 }]);
		expect(result.total).toBe(412);
		expect(result.payload).toBe(payload);
	});

	it('falls back to the row count when the server reports no total', async () => {
		const fetchImpl = vi.fn().mockResolvedValue(ok([{ id: 1 }, { id: 2 }, { id: 3 }]));
		expect((await fetchRows('/api', { fetchImpl })).total).toBe(3);
	});

	it('applies map, and drops only the records that throw', async () => {
		const fetchImpl = vi.fn().mockResolvedValue(ok([{ n: '1' }, null, { n: '3' }]));

		const { rows } = await fetchRows<{ n: number }>('/api', {
			fetchImpl,
			map: (raw) => ({ n: Number(raw.n) })
		});

		expect(rows).toEqual([{ n: 1 }, { n: 3 }]);
	});

	it('degrades a surprising payload shape to [] rather than throwing', async () => {
		const fetchImpl = vi.fn().mockResolvedValue(ok({ nothing: 'useful' }));
		await expect(fetchRows('/api', { fetchImpl })).resolves.toMatchObject({ rows: [], total: 0 });

		const wrongPath = vi.fn().mockResolvedValue(ok({ data: [{ id: 1 }] }));
		await expect(
			fetchRows('/api', { rowsPath: 'items', fetchImpl: wrongPath })
		).resolves.toMatchObject({ rows: [] });
	});

	it('throws on a failed REQUEST, naming the status and the URL', async () => {
		const fetchImpl = vi
			.fn()
			.mockResolvedValue({
				ok: false,
				status: 404,
				statusText: 'Not Found',
				json: async () => null
			});

		await expect(fetchRows('/api/gone', { fetchImpl })).rejects.toThrow(
			'HTTP 404 Not Found for /api/gone'
		);
	});

	it('throws a readable message when the body is not JSON (the HTML-error-page case)', async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			statusText: 'OK',
			json: async () => {
				throw new SyntaxError('Unexpected token <');
			}
		});

		await expect(fetchRows('/api', { fetchImpl })).rejects.toThrow(/not JSON/);
	});

	it('appends params, asks for JSON, and sends no credentials', async () => {
		const fetchImpl = vi.fn().mockResolvedValue(ok([]));

		await fetchRows('/api/fleet?v=1', {
			fetchImpl,
			params: { page: 2, search: '', missing: null },
			headers: { 'X-Demo': 'yes' }
		});

		const [url, init] = fetchImpl.mock.calls[0];
		expect(url).toBe('/api/fleet?v=1&page=2');
		expect(init.headers).toMatchObject({ Accept: 'application/json', 'X-Demo': 'yes' });
		expect(init.credentials).toBe('omit');
	});

	it('refuses an empty URL rather than fetching the current page', async () => {
		const fetchImpl = vi.fn();
		await expect(fetchRows('', { fetchImpl })).rejects.toThrow('No URL given');
		expect(fetchImpl).not.toHaveBeenCalled();
	});
});
