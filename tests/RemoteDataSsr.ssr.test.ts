// @vitest-environment node
import { render } from 'svelte/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RemoteData from '../src/lib/data/RemoteData.svelte';
import RemoteDataHost from './RemoteDataHost.svelte';

// The static half. A slide that fetches its data still has to PRERENDER, and
// built deck HTML never contains slide markup — so the only way to see what a
// prerender emits is to render through svelte/server here.
//
// Two things are being pinned, and the second matters as much as the first:
// the pending state is what lands in the static build, and NO REQUEST is made
// while landing it. The fetch lives in an $effect, which does not run on the
// server; if it ever migrates to module scope or a bare call in <script>, the
// build would start hitting the network once per page and this test fails.

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('RemoteData (SSR)', () => {
	it('renders the pending state, with its dark role-token fallbacks', () => {
		const { body } = render(RemoteData, { props: { url: '/api/fleet' } });

		expect(body).toContain('remote-pending');
		expect(body).toContain('role="status"');
		expect(body).toContain('Loading…');
		// the var(--token, #fallback) pair: the role AND the unthemed dark default
		expect(body).toContain('var(--remote-muted, #b8c2cc)');
		expect(body).toContain('var(--remote-accent, #4aa3df)');
	});

	it('makes no request during prerender', () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		render(RemoteData, { props: { url: '/api/fleet' } });

		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('prefers the author’s pending snippet over the built-in line', () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		const { body } = render(RemoteDataHost, { props: { url: '/api/fleet', rowsPath: 'data' } });

		expect(body).toContain('fetching'); // the host's pending snippet
		expect(body).not.toContain('Loading…'); // …instead of the fallback
		expect(body).not.toContain('data-testid="rows"');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('forwards style, id and class onto the prerendered root', () => {
		const { body } = render(RemoteData, {
			props: { url: '/api', id: 'feed', class: 'wide', style: 'opacity: 0.5;' }
		});

		expect(body).toContain('id="feed"');
		expect(body).toContain('remote-data wide');
		expect(body).toContain('opacity: 0.5;');
	});
});
