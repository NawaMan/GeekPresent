import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Handout from '../src/routes/_handout/[deck].html/+page.svelte';
import { setPageUrl, resetPageUrl } from './stubs/app-stores';

// The half of the handout that only exists in a browser: the notes toggle and the paper size
// it changes. (The prerendered half — that the slides are IN the document at all — is
// HandoutSsr.ssr.test.ts, and it has to be, since jsdom would render them either way.)
//
// The `portrait` deck is the one under test because it is three slides rather than sixty-five,
// and because it is the deck whose canvas is not 1920x1080 — so it also proves the printed page
// takes its shape from the deck.
const mount = () => render(Handout, { props: { data: { deck: 'portrait' } } });

/** The @page rule the document is currently telling the printer. It lives in <head>, because
    @page takes no class and so cannot be selected for. */
const pageRuleInHead = (): string =>
	Array.from(document.head.querySelectorAll('style'))
		.map((s) => s.textContent ?? '')
		.find((css) => css.includes('@page')) ?? '';

describe('Handout (DOM)', () => {
	it('lays the deck out as one sheet per slide', () => {
		const { container } = mount();
		expect(container.querySelectorAll('.sheet')).toHaveLength(3);
		// Each sheet holds the slide's own canvas, at the deck's authored size, scaled to paper.
		// The size arrives as the SAME custom properties SlideDeck sets — the canvas is a copy of
		// its `.content`, and derives its box from them — not as an inline width/height.
		const canvas = container.querySelector<HTMLElement>('.canvas');
		expect(canvas?.style.getPropertyValue('--canvas-w')).toBe('1080px');
		expect(canvas?.style.getPropertyValue('--canvas-h')).toBe('1920px');
		expect(canvas?.style.getPropertyValue('--base-font')).toBe('1.8em');
		expect(canvas?.style.transform).toContain('scale(');
		expect(canvas?.style.transform).not.toContain('NaN');
	});

	it('starts with the notes off, and the paper the size of the slide', () => {
		const { container } = mount();
		expect(container.querySelector('.handout')?.classList.contains('with-notes')).toBe(false);
		expect(pageRuleInHead()).toBe('@page { size: 7.937in 13.333in; margin: 0.5in; }');
	});

	it('grows the PAPER when the reader asks for speaker notes', async () => {
		// The toggle is the whole notes feature: the notes are already in the DOM (so the page
		// hydrates cleanly), and turning them on is a class — plus three more inches of paper to
		// print them on. 13.333 + 3.
		const { container } = mount();
		await fireEvent.click(screen.getByLabelText('Speaker notes'));
		expect(container.querySelector('.handout')?.classList.contains('with-notes')).toBe(true);
		expect(pageRuleInHead()).toBe('@page { size: 7.937in 16.333in; margin: 0.5in; }');
	});

	it('offers the one control a document needs, and no deck chrome', () => {
		const { container } = mount();
		expect(screen.getByRole('button', { name: /Print/ })).toBeTruthy();
		// The bar is the handout's own chrome and never prints; the deck's chrome is not here
		// at all (NavigationBar renders nothing in a handout).
		expect(container.querySelector('.bar')?.classList.contains('no-print')).toBe(true);
		expect(container.querySelector('.nav')).toBeNull();
	});

	it('counts the slides it is about to print', () => {
		mount();
		expect(screen.getByText(/3 slides/)).toBeTruthy();
	});

	it('names a live embed that appears AFTER the document has mounted', async () => {
		// The regression this exists for. <WebSite> mounts its iframe lazily, on
		// IntersectionObserver — so when the handout mounts there is no embed in the document to
		// find, and a scan that ran only once would call the deck printable and then print a
		// hollow rectangle out of the middle of it. The warning has to track the document, not a
		// moment in it.
		const { container } = mount();
		expect(container.querySelector('.refusal')).toBeNull();

		const sheet = container.querySelector<HTMLElement>('.sheet[data-path="hook.html"]');
		const frame = document.createElement('iframe');
		frame.setAttribute('title', 'example.com');
		sheet?.querySelector('.canvas')?.appendChild(frame);

		// MutationObserver delivers on a microtask; one tick of the queue is enough.
		await new Promise((r) => setTimeout(r, 0));

		expect(sheet?.classList.contains('blocked')).toBe(true);
		expect(screen.getByText(/example\.com is a live embed/)).toBeTruthy();
		// …and the document says so up front, before the reader scrolls down to find out.
		expect(screen.getByText(/1 slide has a live embed that will not print: The Hook/)).toBeTruthy();
	});
});

describe('Handout — the overview layouts', () => {
	afterEach(() => resetPageUrl());

	it('?grid switches to the thumbnail grid, on a landscape page', async () => {
		// The layout is read at onMount (not init), so it starts as `pages` — matching prerender —
		// then flips. After a tick the grid is up: one tile per slide, and the paper turned
		// landscape.
		setPageUrl('/_handout/portrait.html?grid');
		const { container } = mount();
		await tick();
		expect(container.querySelectorAll('.gtile')).toHaveLength(3);
		expect(container.querySelector('.sheet')).toBeNull();
		expect(pageRuleInHead()).toBe('@page { size: 11in 8.5in; margin: 0.5in; }');
	});

	it('?grid&notes switches to the notes grid, on a portrait page', async () => {
		setPageUrl('/_handout/portrait.html?grid&notes');
		const { container } = mount();
		await tick();
		expect(container.querySelectorAll('.nrow')).toHaveLength(3);
		// Each row renders the slide twice — a thumbnail and a note-only pass (see HandoutFrame).
		expect(container.querySelectorAll('.nrow-thumb')).toHaveLength(3);
		expect(pageRuleInHead()).toBe('@page { size: 8.5in 11in; margin: 0.5in; }');
	});
});
