import { render, screen, cleanup, fireEvent } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import TableOfContent from '$lib/components/TableOfContent.svelte';
import type { Page } from '$lib/utils/navigate';

// The TOC lists the deck's LINEAR ORDER — the same one →/Space walk. So an appendix
// marked `hidden` must not appear in it: a slide the forward march steps over is a
// slide the contents page has no business advertising, or a straight run-through
// would be one click away from wandering into the backup demo after all.
//
// An appendix that is NOT hidden is the opposite case, and it is the reason this is a
// per-slide flag rather than a property of appendices: back matter belongs in the
// table of contents, exactly as it does in a book.

const deck: Array<Page> = [
	{ path: 'title.html',  title: 'Title' },
	{ path: 'gc.html',     title: 'Appendix — GC', hidden: true },
	{ path: 'listed.html', title: 'Appendix — Listed' },
	{ path: 'thanks.html', title: 'Thanks' }
];

afterEach(() => cleanup());

/** The TOC is a popover: nothing is listed until its button is pressed. */
async function open(pages: Array<Page>) {
	render(TableOfContent, { props: { pages } });
	await fireEvent.click(screen.getByRole('button', { name: /Table of Contents/i }));
}

describe('TableOfContent', () => {
	it('lists the deck, and omits a hidden appendix', async () => {
		await open(deck);

		expect(screen.getByText('Title')).toBeTruthy();
		expect(screen.getByText('Thanks')).toBeTruthy();
		expect(screen.queryByText('Appendix — GC')).toBeNull();
	});

	// `hidden` is optional, and this is what that buys: an appendix the audience is
	// allowed to see coming, reachable from the contents like any other slide.
	it('lists an appendix that is not hidden', async () => {
		await open(deck);

		const listed = screen.getByText('Appendix — Listed');
		expect(listed.getAttribute('href')).toBe('./listed.html');
	});

	it('keeps the order of the slides it does list', async () => {
		await open(deck);

		const titles = screen.getAllByRole('link').map((a) => a.textContent);
		expect(titles).toEqual(['Title', 'Appendix — Listed', 'Thanks']);
	});
});
