import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPageSource } from '../src/lib/stores/sourceSave';

// Client half of source-load — what it GETs, what it refuses,
// and how server errors surface. No Vite server; fetch is mocked.

const originalFetch = globalThis.fetch;
const originalPathname = window.location.pathname;

beforeEach(() => {
	// jsdom's location is not writable, so swap in a stub location shape wholesale.
	Object.defineProperty(window, 'location', {
		configurable: true,
		value: { ...window.location, pathname: '/slides/title.html' }
	});
});

afterEach(() => {
	globalThis.fetch = originalFetch;
	Object.defineProperty(window, 'location', {
		configurable: true,
		value: { ...window.location, pathname: originalPathname }
	});
	vi.restoreAllMocks();
});

describe('loadPageSource (REFRESH)', () => {
	it('GETs the source-load endpoint with the slide route', async () => {
		globalThis.fetch = vi.fn(async () =>
			new Response(
				JSON.stringify({
					file: 'src/routes/slides/title.html/+page.svelte',
					content: '<script></script>\n'
				}),
				{ status: 200, headers: { 'content-type': 'application/json' } }
			)
		) as unknown as typeof fetch;

		const r = await loadPageSource('/slides/title.html');
		expect(r.ok).toBe(true);
		expect(r.content).toContain('<script>');
		expect(globalThis.fetch).toHaveBeenCalledWith(
			'/__geekpresent/source-load?route=%2Fslides%2Ftitle.html',
			expect.objectContaining({ method: 'GET' })
		);
	});

	it('refuses the editor page as a route', async () => {
		const fetchSpy = vi.fn();
		globalThis.fetch = fetchSpy as unknown as typeof fetch;
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: { ...window.location, pathname: '/_source-edit' }
		});
		const r = await loadPageSource();
		expect(r.ok).toBe(false);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('surfaces HTTP errors', async () => {
		globalThis.fetch = vi.fn(async () =>
			new Response(JSON.stringify({ error: 'no +page.svelte for route' }), {
				status: 404,
				headers: { 'content-type': 'application/json' }
			})
		) as unknown as typeof fetch;

		const r = await loadPageSource('/slides/missing.html');
		expect(r.ok).toBe(false);
		expect(r.error).toMatch(/no \+page/);
	});
});
