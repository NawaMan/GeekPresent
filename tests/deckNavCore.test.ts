// The EDIT window's FIRST / PREV / NEXT / LAST: where am I, where does each go.
import { describe, expect, it } from 'vitest';
import {
	navTarget,
	positionOfFile,
	positionOfRoute,
	slideFile,
	stripBase,
	type EditDeck
} from '../src/lib/source/deckNavCore';
import { EDIT_DECKS } from '../src/lib/source/editDecks';

const slides: EditDeck = {
	fsPath: 'slides',
	urlPath: 'slides',
	slides: [
		{ path: 'title.html', title: 'Title' },
		{ path: 'two.html', title: 'Two' },
		{ path: 'three.html', title: 'Three' }
	]
};
const grouped: EditDeck = {
	fsPath: 'references/(hub)',
	urlPath: 'references',
	slides: [{ path: 'index.html', title: 'Hub' }]
};
const decks = [slides, grouped];

describe('positionOf…', () => {
	it('finds a slide by its page file, route groups and all', () => {
		expect(positionOfFile(decks, 'src/routes/slides/two.html/+page.svelte')).toEqual({
			deck: slides,
			index: 1
		});
		expect(slideFile(grouped, 0)).toBe('src/routes/references/(hub)/index.html/+page.svelte');
		expect(positionOfFile(decks, slideFile(grouped, 0))?.deck).toBe(grouped);
	});

	it('finds a slide by its route, tolerating a query or trailing slash', () => {
		expect(positionOfRoute(decks, '/slides/three.html')?.index).toBe(2);
		expect(positionOfRoute(decks, '/slides/three.html/?adjust')?.index).toBe(2);
		expect(positionOfRoute(decks, '/references/index.html')?.deck).toBe(grouped);
	});

	it('is null for files and routes that are not deck slides', () => {
		expect(positionOfFile(decks, 'src/lib/components/Block.svelte')).toBeNull();
		expect(positionOfFile(decks, null)).toBeNull();
		expect(positionOfRoute(decks, '/slides/appendix.html')).toBeNull();
		expect(positionOfRoute(decks, '')).toBeNull();
	});
});

describe('navTarget', () => {
	const at = (index: number) => ({ deck: slides, index });

	it('goes to the ends and the neighbours', () => {
		expect(navTarget(at(1), 'first')).toEqual({
			file: 'src/routes/slides/title.html/+page.svelte',
			route: '/slides/title.html',
			title: 'Title',
			index: 0
		});
		expect(navTarget(at(1), 'prev')?.index).toBe(0);
		expect(navTarget(at(1), 'next')?.index).toBe(2);
		expect(navTarget(at(1), 'last')?.route).toBe('/slides/three.html');
	});

	it('has nowhere to go past an end, or to where it already is', () => {
		expect(navTarget(at(0), 'first')).toBeNull();
		expect(navTarget(at(0), 'prev')).toBeNull();
		expect(navTarget(at(2), 'next')).toBeNull();
		expect(navTarget(at(2), 'last')).toBeNull();
		expect(navTarget(null, 'next')).toBeNull();
	});
});

describe('stripBase', () => {
	it('drops the site base only when it is a whole prefix', () => {
		expect(stripBase('/Repo/slides/a.html', '/Repo')).toBe('/slides/a.html');
		expect(stripBase('/Repository/a.html', '/Repo')).toBe('/Repository/a.html');
		expect(stripBase('/slides/a.html', '')).toBe('/slides/a.html');
	});
});

describe('EDIT_DECKS (the real tree)', () => {
	it('lists the main deck in its →/Space order, appendices left out', () => {
		const main = EDIT_DECKS.find((d) => d.urlPath === 'slides');
		expect(main?.slides[0].path).toBe('title.html');
		expect(main?.slides.some((s) => s.path === 'appendix-detail.html')).toBe(false);
	});
});
