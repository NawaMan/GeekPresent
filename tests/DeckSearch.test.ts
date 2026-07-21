import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TableOfContent from '$lib/components/TableOfContent.svelte';
import { pages as slidesPages } from '../src/routes/slides/pages.ts';
import { setPageUrl, resetPageUrl } from './stubs/app-stores';

// The live half of full-deck search: the filter box grown inside the TOC overlay.
// Docs are INJECTED here (the `docs` prop), so the UI wiring is tested against
// deterministic text rather than the real slide sources — those feed the pure
// searchCore, which is unit-tested in searchCore.test.ts.
const pages = [
	{ path: 'a.html', title: 'Intro' },
	{ path: 'b.html', title: 'Backpressure' },
	{ path: 'c.html', title: 'Wrap Up' }
];
const docs = [
	{ path: 'a.html', title: 'Intro', text: 'we discuss buffers' },
	{ path: 'b.html', title: 'Backpressure', text: 'drops and queues' },
	{ path: 'c.html', title: 'Wrap Up', text: 'thanks — a backpressure recap here' }
];

const openToc = async (root: ParentNode) => {
	(root.querySelector('button') as HTMLButtonElement).click();
	await tick();
};
const box = (root: ParentNode) => root.querySelector('input.search') as HTMLInputElement;
const rowTitles = (root: ParentNode) =>
	[...root.querySelectorAll('.content ol li a')].map((a) => a.textContent?.trim().split('\n')[0]);

afterEach(() => {
	vi.restoreAllMocks();
	resetPageUrl();
});

/** Which row the ↑/↓ cursor is on, by title. */
const selectedTitle = (root: ParentNode) => {
	const row = root.querySelector('.content ol li.selected');
	if (!row) return undefined;
	// A result row carries its snippet inside the same <a>; the plain list does not.
	return (row.querySelector('.hit-title') ?? row).textContent?.trim();
};

describe('TOC full-deck search', () => {
	it('shows the whole list before anything is typed', async () => {
		const { container } = render(TableOfContent, { props: { pages, docs } });
		await openToc(container);
		expect(rowTitles(container)).toEqual(['Intro', 'Backpressure', 'Wrap Up']);
	});

	it('filters to title AND body matches when typing', async () => {
		const { container } = render(TableOfContent, { props: { pages, docs } });
		await openToc(container);
		await fireEvent.input(box(container), { target: { value: 'backpressure' } });

		const titles = [...container.querySelectorAll('.results .hit-title')].map((n) =>
			n.textContent?.trim()
		);
		// 'Backpressure' matches by title; 'Wrap Up' matches only in its body.
		expect(titles).toEqual(['Backpressure', 'Wrap Up']);
		expect(container.querySelector('.results')?.textContent).not.toContain('Intro');
	});

	it('renders a snippet for a body-only hit but not a title hit', async () => {
		const { container } = render(TableOfContent, { props: { pages, docs } });
		await openToc(container);
		await fireEvent.input(box(container), { target: { value: 'backpressure' } });

		const rows = [...container.querySelectorAll('.results li')];
		const titleHit = rows.find((li) => li.textContent?.includes('Backpressure'))!;
		const bodyHit = rows.find((li) => li.textContent?.includes('Wrap Up'))!;
		expect(titleHit.querySelector('.snippet')).toBeNull();
		expect(bodyHit.querySelector('.snippet')?.textContent).toContain('backpressure recap');
	});

	it('links a hit to its slide, relative like the plain list', async () => {
		const { container } = render(TableOfContent, { props: { pages, docs } });
		await openToc(container);
		await fireEvent.input(box(container), { target: { value: 'queues' } });
		const link = container.querySelector('.results li a') as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('./b.html');
	});

	it('says so when nothing matches', async () => {
		const { container } = render(TableOfContent, { props: { pages, docs } });
		await openToc(container);
		await fireEvent.input(box(container), { target: { value: 'zzzznope' } });
		expect(container.querySelector('.results')).toBeNull();
		expect(container.querySelector('.no-matches')?.textContent).toContain('zzzznope');
	});

	it('Escape clears the query first, then closes on a second press', async () => {
		const { container } = render(TableOfContent, { props: { pages, docs } });
		await openToc(container);
		const input = box(container);
		await fireEvent.input(input, { target: { value: 'queues' } });

		await fireEvent.keyDown(input, { key: 'Escape' });
		await tick();
		// Query cleared, menu still open showing the full list again.
		expect(box(container).value).toBe('');
		expect(rowTitles(container)).toEqual(['Intro', 'Backpressure', 'Wrap Up']);

		await fireEvent.keyDown(box(container), { key: 'Escape' });
		await tick();
		expect(container.querySelector('.content')).toBeNull();
	});

	it('searches the REAL build-time index end to end (no injected docs)', async () => {
		// deck='slides' + no `docs` → the TOC pulls text from the ?raw glob index.
		// "watermelon" lives only in the full-deck-search demo's speaker <Note>, so it
		// is the one hit — proving glob → stripToText → searchDocs → UI, and that
		// speaker notes are searchable.
		const { container } = render(TableOfContent, { props: { pages: slidesPages, deck: 'slides' } });
		await openToc(container);
		await fireEvent.input(box(container), { target: { value: 'watermelon' } });
		const hitTitles = [...container.querySelectorAll('.results .hit-title')].map((n) =>
			n.textContent?.trim()
		);
		expect(hitTitles).toEqual(['Full-Deck Search']);
	});

	it('matches the slide file name, not just its title and body', async () => {
		const named = [{ path: 'adjust-styles-guard.html', title: 'Keeping Edits Honest' }];
		const namedDocs = [{ ...named[0], text: 'nothing about it here' }];
		const { container } = render(TableOfContent, {
			props: { pages: named, docs: namedDocs }
		});
		await openToc(container);
		await fireEvent.input(box(container), { target: { value: 'guard' } });

		expect(container.querySelector('.results .hit-title')?.textContent?.trim()).toBe(
			'Keeping Edits Honest'
		);
		// The row says WHY it matched, since the name is not otherwise on screen.
		expect(container.querySelector('.results .snippet')?.textContent).toBe(
			'adjust-styles-guard.html'
		);
	});

	it('walks the results with ↑/↓, wrapping at both ends', async () => {
		const { container } = render(TableOfContent, { props: { pages, docs } });
		await openToc(container);
		await fireEvent.input(box(container), { target: { value: 'backpressure' } });
		// Two hits: Backpressure (title), Wrap Up (body). Nothing selected until a press.
		expect(selectedTitle(container)).toBeUndefined();

		await fireEvent.keyDown(box(container), { key: 'ArrowDown' });
		expect(selectedTitle(container)).toBe('Backpressure');
		await fireEvent.keyDown(box(container), { key: 'ArrowDown' });
		expect(selectedTitle(container)).toBe('Wrap Up');
		await fireEvent.keyDown(box(container), { key: 'ArrowDown' });
		expect(selectedTitle(container)).toBe('Backpressure');
		await fireEvent.keyDown(box(container), { key: 'ArrowUp' });
		expect(selectedTitle(container)).toBe('Wrap Up');
	});

	it('drops the cursor when the query changes, so it never points at a stale row', async () => {
		const { container } = render(TableOfContent, { props: { pages, docs } });
		await openToc(container);
		await fireEvent.input(box(container), { target: { value: 'backpressure' } });
		await fireEvent.keyDown(box(container), { key: 'ArrowDown' });
		expect(selectedTitle(container)).toBe('Backpressure');

		await fireEvent.input(box(container), { target: { value: 'buffers' } });
		expect(selectedTitle(container)).toBeUndefined();
	});

	// In the unfiltered list the cursor starts where you ARE, so ↓ is "the next slide".
	it('starts the cursor at the current slide in the plain list', async () => {
		setPageUrl('/slides/b.html');
		const { container } = render(TableOfContent, { props: { pages, docs } });
		await openToc(container);

		await fireEvent.keyDown(box(container), { key: 'ArrowDown' });
		expect(selectedTitle(container)).toBe('Wrap Up');
		await fireEvent.keyDown(box(container), { key: 'ArrowUp' });
		expect(selectedTitle(container)).toBe('Backpressure');
	});

	it('Enter opens the row under the cursor and closes the menu', async () => {
		const { container } = render(TableOfContent, { props: { pages, docs } });
		await openToc(container);
		await fireEvent.input(box(container), { target: { value: 'backpressure' } });
		await fireEvent.keyDown(box(container), { key: 'ArrowDown' });
		await fireEvent.keyDown(box(container), { key: 'ArrowDown' });

		// Enter navigates by clicking the row's own <a> — same href, same router path as
		// a mouse click. jsdom won't follow it, so catch the click instead.
		const clicked: string[] = [];
		const catcher = (e: Event) => {
			e.preventDefault();
			clicked.push((e.target as HTMLElement).closest('a')?.getAttribute('href') ?? '');
		};
		document.addEventListener('click', catcher, true);
		try {
			await fireEvent.keyDown(box(container), { key: 'Enter' });
		} finally {
			document.removeEventListener('click', catcher, true);
		}
		expect(clicked).toEqual(['./c.html']);
		await tick();
		expect(container.querySelector('.content')).toBeNull();
	});

	// Type, then Enter — without first pressing ↓. The top hit is the obvious intent.
	it('Enter with no cursor takes the top hit', async () => {
		const { container } = render(TableOfContent, { props: { pages, docs } });
		await openToc(container);
		await fireEvent.input(box(container), { target: { value: 'queues' } });

		const clicked: string[] = [];
		const catcher = (e: Event) => {
			e.preventDefault();
			clicked.push((e.target as HTMLElement).closest('a')?.getAttribute('href') ?? '');
		};
		document.addEventListener('click', catcher, true);
		try {
			await fireEvent.keyDown(box(container), { key: 'Enter' });
		} finally {
			document.removeEventListener('click', catcher, true);
		}
		expect(clicked).toEqual(['./b.html']);
	});

	// The deck's own ↑/↓ handlers live on window with no input-focus guard; an OPEN
	// TOC has to claim the keys, and a shut one has to hand them straight back.
	it('claims ↑/↓ only while open', async () => {
		const { container } = render(TableOfContent, { props: { pages, docs } });
		const seen: boolean[] = [];
		const onWindowKey = (e: KeyboardEvent) => seen.push(e.defaultPrevented);
		window.addEventListener('keydown', onWindowKey);
		try {
			await fireEvent.keyDown(window, { key: 'ArrowDown' });
			expect(seen).toEqual([false]);

			await openToc(container);
			await fireEvent.keyDown(window, { key: 'ArrowDown' });
			expect(seen[1]).toBe(true);
			expect(selectedTitle(container)).toBe('Intro');
		} finally {
			window.removeEventListener('keydown', onWindowKey);
		}
	});

	it('keeps typing keys from reaching the deck (arrows page slides unguarded)', async () => {
		const { container } = render(TableOfContent, { props: { pages, docs } });
		await openToc(container);
		const onWindowKey = vi.fn();
		window.addEventListener('keydown', onWindowKey);
		try {
			await fireEvent.keyDown(box(container), { key: 'ArrowLeft' });
			// stopPropagation on the input means the window-level nav never sees it.
			expect(onWindowKey).not.toHaveBeenCalled();
		} finally {
			window.removeEventListener('keydown', onWindowKey);
		}
	});
});
