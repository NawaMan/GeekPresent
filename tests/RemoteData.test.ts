import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RemoteDataHost from './RemoteDataHost.svelte';
import RemoteData from '../src/lib/data/RemoteData.svelte';

// The DOM half: everything a server render cannot see — the request itself,
// the four states it moves through, abort-on-supersede, and the values written
// back through bind:. The payload-shape decisions are remoteCore's, and are
// tested there; here we only care that the wiring reaches them.

type Fetcher = ReturnType<typeof vi.fn>;
let fetchMock: Fetcher;

/** A Response-alike good enough for fetchRows (ok / status / json). */
function jsonResponse(
	body: unknown,
	init: { ok?: boolean; status?: number; statusText?: string } = {}
) {
	return {
		ok: init.ok ?? true,
		status: init.status ?? 200,
		statusText: init.statusText ?? 'OK',
		json: async () => body
	};
}

/** A request that never settles until you resolve it — for abort/ordering tests. */
function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

beforeEach(() => {
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('RemoteData', () => {
	it('shows the pending snippet first, then the rows the endpoint returned', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse({ data: [{ name: 'alpha' }, { name: 'beta' }], total: 17 })
		);

		render(RemoteDataHost, { rowsPath: 'data' });

		// The very first paint is the pending state — the same one a prerender emits.
		expect(screen.getByTestId('pending')).toBeTruthy();

		await waitFor(() => expect(screen.getByTestId('rows')).toBeTruthy());
		expect(screen.getByTestId('rows').textContent).toContain('alpha');
		expect(screen.getByTestId('rows').textContent).toContain('beta');
		// totalCount comes from the payload, not from rows.length
		expect(screen.getByTestId('meta').textContent).toBe('17 total');
		expect(screen.queryByTestId('pending')).toBeNull();
	});

	it('writes rows / total / loading / error back through bind:', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ data: [{ name: 'alpha' }], total: 9 }));

		render(RemoteDataHost, { rowsPath: 'data' });
		expect(screen.getByTestId('bound').textContent?.trim()).toBe('loading');

		await waitFor(() => expect(screen.getByTestId('bound').textContent?.trim()).toBe('ok:1/9'));
	});

	it('requests the url with the params appended', async () => {
		fetchMock.mockResolvedValue(jsonResponse([]));

		render(RemoteDataHost, { url: '/api/fleet', params: { page: 2, search: 'node' } });

		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		const [target, init] = fetchMock.mock.calls[0];
		expect(target).toBe('/api/fleet?page=2&search=node');
		expect(init.method).toBe('GET');
		expect(init.headers.Accept).toBe('application/json');
	});

	it('re-fetches when params change, but not when an equal object is rebuilt', async () => {
		fetchMock.mockResolvedValue(jsonResponse([{ name: 'alpha' }]));

		const { rerender } = render(RemoteDataHost, { url: '/api', params: { page: 1 } });
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

		// same contents, new object — the serialised key must keep this quiet,
		// or a $derived toQuery() would refetch on every keystroke.
		await rerender({ url: '/api', params: { page: 1 } });
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await rerender({ url: '/api', params: { page: 2 } });
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
		expect(fetchMock.mock.calls[1][0]).toBe('/api?page=2');
	});

	it('shows the failed snippet on a non-2xx, naming the status, and retries on demand', async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse(null, { ok: false, status: 503, statusText: 'Service Unavailable' })
		);

		render(RemoteDataHost, { url: '/api/fleet' });

		await waitFor(() => expect(screen.getByTestId('failed')).toBeTruthy());
		expect(screen.getByTestId('failed').textContent).toContain('HTTP 503');
		expect(screen.getByTestId('failed').textContent).toContain('/api/fleet');
		expect(screen.getByTestId('bound').textContent?.trim()).toContain('error:');

		fetchMock.mockResolvedValueOnce(jsonResponse({ data: [{ name: 'alpha' }] }));
		await fireEvent.click(screen.getByTestId('retry'));

		await waitFor(() => expect(screen.getByTestId('rows')).toBeTruthy());
		expect(screen.queryByTestId('failed')).toBeNull();
	});

	it('reports a body that is not JSON as a failure rather than an empty table', async () => {
		fetchMock.mockResolvedValue({
			ok: true,
			status: 200,
			statusText: 'OK',
			json: async () => {
				throw new SyntaxError('Unexpected token <');
			}
		});

		render(RemoteDataHost, {});
		await waitFor(() => expect(screen.getByTestId('failed')).toBeTruthy());
		expect(screen.getByTestId('failed').textContent).toContain('not JSON');
	});

	it('shows the empty snippet when the request succeeds with no rows', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ data: [], total: 0 }));

		render(RemoteDataHost, { rowsPath: 'data' });
		await waitFor(() => expect(screen.getByTestId('empty')).toBeTruthy());
		expect(screen.queryByTestId('failed')).toBeNull();
	});

	it('aborts the in-flight request when params supersede it, and ignores its result', async () => {
		const first = deferred<ReturnType<typeof jsonResponse>>();
		fetchMock.mockReturnValueOnce(first.promise);
		fetchMock.mockResolvedValueOnce(jsonResponse([{ name: 'second' }]));

		const { rerender } = render(RemoteDataHost, { url: '/api', params: { page: 1 } });
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const firstSignal: AbortSignal = fetchMock.mock.calls[0][1].signal;
		expect(firstSignal.aborted).toBe(false);

		await rerender({ url: '/api', params: { page: 2 } });
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
		expect(firstSignal.aborted).toBe(true);

		await waitFor(() => expect(screen.getByTestId('rows').textContent).toContain('second'));

		// the superseded response landing late must not overwrite the newer page
		first.resolve(jsonResponse([{ name: 'first' }]));
		await Promise.resolve();
		expect(screen.getByTestId('rows').textContent).toContain('second');
		expect(screen.getByTestId('rows').textContent).not.toContain('first');
	});

	it('keeps the rows on screen when a refresh fails', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse([{ name: 'alpha' }]));
		render(RemoteDataHost, {});
		await waitFor(() => expect(screen.getByTestId('rows')).toBeTruthy());

		fetchMock.mockResolvedValueOnce(jsonResponse(null, { ok: false, status: 500 }));
		await fireEvent.click(screen.getByTestId('reload'));

		// the error is readable through bind:error, but a chart mid-talk is NOT blanked
		await waitFor(() => expect(screen.getByTestId('bound').textContent).toContain('error:'));
		expect(screen.getByTestId('rows').textContent).toContain('alpha');
		expect(screen.queryByTestId('failed')).toBeNull();
	});

	it('polls on an interval, and stops when unmounted', async () => {
		fetchMock.mockResolvedValue(jsonResponse([{ name: 'alpha' }]));

		const { unmount } = render(RemoteDataHost, { poll: 250 });
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2), {
			timeout: 2000
		});

		unmount();
		const after = fetchMock.mock.calls.length;
		await new Promise((r) => setTimeout(r, 600));
		expect(fetchMock.mock.calls.length).toBe(after);
	});

	it('falls back to built-in states when no snippets are given', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(null, { ok: false, status: 404, statusText: 'Not Found' })
		);

		const { container } = render(RemoteData, { url: '/api/gone' });
		expect(container.querySelector('.remote-pending')).not.toBeNull();

		await waitFor(() => expect(container.querySelector('.remote-failed')).not.toBeNull());
		expect(container.querySelector('.remote-failed')?.textContent).toContain('HTTP 404');
		expect(container.querySelector('.remote-retry')).not.toBeNull();
	});

	it('forwards style, id and class to the root element', () => {
		fetchMock.mockResolvedValue(jsonResponse([]));

		const { container } = render(RemoteData, {
			url: '/api',
			id: 'feed',
			class: 'wide',
			style: 'opacity: 0.5;'
		});
		const root = container.querySelector('.remote-data') as HTMLElement;
		expect(root.id).toBe('feed');
		expect(root.classList.contains('wide')).toBe(true);
		expect(root.getAttribute('style')).toContain('opacity: 0.5');
	});
});
