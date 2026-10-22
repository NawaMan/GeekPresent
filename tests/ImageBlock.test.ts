import { render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ImageBlock from '../src/lib/components/ImageBlock.svelte';

const SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 50" width="80" height="50">' +
	'<image href="data:image/gif;base64,R0lG"/></svg>';

const box = { x: 0, y: 0, width: 160, height: 100 };

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('ImageBlock live', () => {
	it('swaps the <img> for the inline SVG once fetched', async () => {
		const fetch = vi.fn(async () => new Response(SVG, { status: 200 }));
		vi.stubGlobal('fetch', fetch);
		const { container } = render(ImageBlock, { props: { src: 'stats.svg', live: true, ...box } });

		await waitFor(() => expect(container.querySelector('svg image')).not.toBeNull());
		expect(fetch).toHaveBeenCalledWith('stats.svg');
		expect(container.querySelector('img')).toBeNull();
		const svg = container.querySelector('svg')!;
		expect(svg.getAttribute('width')).toBe('100%');
		expect(svg.getAttribute('preserveAspectRatio')).toBe('none');
		// The drag must still reach the Block through the inline SVG.
		expect((svg.parentElement as HTMLElement).style.pointerEvents).toBe('none');
	});

	it('keeps the <img> when the fetch fails', async () => {
		const fetch = vi.fn(async () => new Response('nope', { status: 404 }));
		vi.stubGlobal('fetch', fetch);
		const { container } = render(ImageBlock, { props: { src: 'gone.svg', live: true, ...box } });

		await waitFor(() => expect(fetch).toHaveBeenCalled());
		await Promise.resolve();
		expect(container.querySelector('img')).not.toBeNull();
		expect(container.querySelector('svg image')).toBeNull();
	});

	it('does not fetch without live', () => {
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);
		const { container } = render(ImageBlock, { props: { src: 'stats.svg', ...box } });
		expect(fetch).not.toHaveBeenCalled();
		expect(container.querySelector('img')).not.toBeNull();
	});
});

describe('ImageBlock live="after-transition"', () => {
	afterEach(() => {
		delete document.documentElement.dataset.vtKind;
	});

	it('inlines at once when no view transition is running', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(SVG, { status: 200 }))
		);
		const { container } = render(ImageBlock, {
			props: { src: 'stats.svg', live: 'after-transition', ...box }
		});
		await waitFor(() => expect(container.querySelector('svg image')).not.toBeNull());
	});

	it('waits while data-vt-kind is set, and inlines once it is removed', async () => {
		const fetch = vi.fn(async () => new Response(SVG, { status: 200 }));
		vi.stubGlobal('fetch', fetch);
		document.documentElement.dataset.vtKind = 'morph';
		const { container } = render(ImageBlock, {
			props: { src: 'stats.svg', live: 'after-transition', ...box }
		});

		await new Promise((r) => setTimeout(r, 20));
		expect(fetch).not.toHaveBeenCalled();
		expect(container.querySelector('img')).not.toBeNull();

		delete document.documentElement.dataset.vtKind;
		await waitFor(() => expect(container.querySelector('svg image')).not.toBeNull());
		expect(fetch).toHaveBeenCalledWith('stats.svg');
	});

	it('stops waiting when unmounted mid-transition', async () => {
		const fetch = vi.fn(async () => new Response(SVG, { status: 200 }));
		vi.stubGlobal('fetch', fetch);
		document.documentElement.dataset.vtKind = 'morph';
		const { unmount } = render(ImageBlock, {
			props: { src: 'stats.svg', live: 'after-transition', ...box }
		});
		unmount();
		delete document.documentElement.dataset.vtKind;
		await new Promise((r) => setTimeout(r, 20));
		expect(fetch).not.toHaveBeenCalled();
	});
});
