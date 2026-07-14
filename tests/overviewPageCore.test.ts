import { describe, expect, it } from 'vitest';
import {
	isTypingTarget,
	mountedTiles,
	overviewPageKeyIntent,
	overviewPageTiles,
	tileScale
} from '$lib/utils/overviewPageCore';
import type { Page } from '$lib/utils/navigate';

// The pure layer behind the all-slides grid. Three decisions live here and each
// one has a way of going quietly wrong in the browser: a scale that can turn into
// NaN (a tile rendered at `scale(NaN)` is simply blank), a tile list that must
// agree with the deck's own idea of its linear order, and a key press that must
// not fire while the speaker is typing into the presenter's timer box.

const deck: Array<Page> = [
	{ path: 'title.html', title: 'Title' },
	{ path: 'intro.html', title: 'Intro' },
	{ path: 'appendix-gc.html', title: 'Appendix — GC', hidden: true },
	{ path: 'outro.html', title: 'Outro' }
];

// A KeyboardEvent is all overviewPageKeyIntent reads, so build the shape it reads
// rather than dispatching into a DOM.
function key(init: Partial<KeyboardEvent> & { key: string }): KeyboardEvent {
	return {
		defaultPrevented: false,
		ctrlKey: false,
		metaKey: false,
		altKey: false,
		target: null,
		...init
	} as KeyboardEvent;
}

const el = (tagName: string, isContentEditable = false) =>
	({ tagName, isContentEditable }) as unknown as EventTarget;

describe('tileScale — fit a slide into its box, or render nothing', () => {
	it('fits by the binding axis (the smaller ratio), so the slide is never cropped', () => {
		// A 480x270 box is exactly 1/4 of the canvas on both axes.
		expect(tileScale(480, 270, 1920, 1080)).toBe(0.25);
		// A box that is wide for its height binds on HEIGHT.
		expect(tileScale(1920, 270, 1920, 1080)).toBe(0.25);
		// ...and one that is tall for its width binds on WIDTH.
		expect(tileScale(480, 1080, 1920, 1080)).toBe(0.25);
	});

	it('returns 0 for an unmeasured box rather than a scale', () => {
		// clientWidth/clientHeight are 0 until layout runs — the tile is briefly
		// zero-sized, which the next tick fixes. That is recoverable; NaN is not.
		expect(tileScale(0, 0, 1920, 1080)).toBe(0);
		expect(tileScale(480, 0, 1920, 1080)).toBe(0);
	});

	it('is total — junk in, a drawable number out (never NaN)', () => {
		const junk = [NaN, Infinity, -Infinity, -10];
		for (const n of junk) {
			expect(tileScale(n, 270, 1920, 1080)).not.toBeNaN();
			expect(tileScale(480, n, 1920, 1080)).not.toBeNaN();
			// A zero-size canvas would otherwise divide by zero.
			expect(tileScale(480, 270, n, 1080)).not.toBeNaN();
			expect(tileScale(480, 270, 1920, n)).not.toBeNaN();
		}
		expect(tileScale(NaN, NaN, NaN, NaN)).toBe(0);
	});
});

describe('overviewPageTiles — the deck as a grid', () => {
	it('drops hidden appendices and numbers what remains 1..n', () => {
		const tiles = overviewPageTiles(deck, 'intro.html');
		// The appendix is a real slide but not part of the forward march, so the
		// grid — which IS browsing — does not offer it. Same list the ToC lists.
		expect(tiles.map((t) => t.path)).toEqual(['title.html', 'intro.html', 'outro.html']);
		// Numbering counts the LISTED pages, so it matches what paging from the
		// start would give you — the appendix does not consume a number.
		expect(tiles.map((t) => t.number)).toEqual([1, 2, 3]);
		expect(tiles.map((t) => t.title)).toEqual(['Title', 'Intro', 'Outro']);
	});

	it('previews each slide with ?clean, relative to the current document', () => {
		const tiles = overviewPageTiles(deck, '');
		// `?clean` is the deck's own no-chrome render, so a tile shows the slide and
		// not a nav bar and another OVERVIEW button. Relative, so it resolves under
		// whatever prefix the deck is served from.
		expect(tiles[0].src).toBe('./title.html?clean');
		expect(tiles[2].src).toBe('./outro.html?clean');
	});

	it('marks exactly the slide we are standing on', () => {
		const tiles = overviewPageTiles(deck, 'outro.html');
		expect(tiles.filter((t) => t.isCurrent).map((t) => t.path)).toEqual(['outro.html']);
	});

	it('marks nothing when the current path is unknown, rather than guessing', () => {
		// Standing on a hidden appendix, or on a path that is not in this deck.
		expect(overviewPageTiles(deck, 'appendix-gc.html').some((t) => t.isCurrent)).toBe(false);
		expect(overviewPageTiles(deck, 'nowhere.html').some((t) => t.isCurrent)).toBe(false);
	});

	it('is total — a junk pages array yields no tiles rather than throwing', () => {
		expect(overviewPageTiles([], 'x.html')).toEqual([]);
		expect(overviewPageTiles(null as unknown as Array<Page>, 'x.html')).toEqual([]);
		expect(overviewPageTiles(undefined as unknown as Array<Page>, '')).toEqual([]);
	});
});

describe('isTypingTarget — narrower than stepKeys, deliberately', () => {
	it('counts text fields, where `o` is a letter the user meant', () => {
		expect(isTypingTarget(el('INPUT'))).toBe(true);
		expect(isTypingTarget(el('TEXTAREA'))).toBe(true);
		expect(isTypingTarget(el('SELECT'))).toBe(true);
		expect(isTypingTarget(el('DIV', true))).toBe(true); // contentEditable
	});

	it('does NOT count buttons and links — the difference that makes Escape work', () => {
		// stepKeys.isInteractiveTarget DOES count these, and rightly so: Space must
		// activate a focused button instead of paging. Borrowing that guard here
		// would be a bug — with the grid open the focus is ON a tile button, so
		// Escape would be unable to close the overlay it just opened.
		expect(isTypingTarget(el('BUTTON'))).toBe(false);
		expect(isTypingTarget(el('A'))).toBe(false);
		expect(isTypingTarget(null)).toBe(false);
	});
});

describe('overviewPageKeyIntent — what a key press means to the grid', () => {
	it('`o` opens it and closes it again', () => {
		expect(overviewPageKeyIntent(key({ key: 'o' }), false)).toBe('open');
		expect(overviewPageKeyIntent(key({ key: 'o' }), true)).toBe('close');
		expect(overviewPageKeyIntent(key({ key: 'O' }), false)).toBe('open'); // caps lock
	});

	it('Escape only ever closes, and only when the grid is open', () => {
		expect(overviewPageKeyIntent(key({ key: 'Escape' }), true)).toBe('close');
		// Left alone when the grid is shut, so the deck's OTHER Escape listeners
		// (the ToC, SizeMode, Annotate) still get their key.
		expect(overviewPageKeyIntent(key({ key: 'Escape' }), false)).toBe('ignore');
	});

	it('keeps its hands off the browser’s own chords', () => {
		// Ctrl/Cmd+O is "open file". A slide deck stealing it would be hostile.
		expect(overviewPageKeyIntent(key({ key: 'o', ctrlKey: true }), false)).toBe('ignore');
		expect(overviewPageKeyIntent(key({ key: 'o', metaKey: true }), false)).toBe('ignore');
		expect(overviewPageKeyIntent(key({ key: 'o', altKey: true }), false)).toBe('ignore');
	});

	it('stays out of the way while the speaker is typing', () => {
		// The presenter console's timer box, a DataTable's search field.
		expect(overviewPageKeyIntent(key({ key: 'o', target: el('INPUT') }), false)).toBe('ignore');
		expect(overviewPageKeyIntent(key({ key: 'Escape', target: el('INPUT') }), true)).toBe('ignore');
	});

	it('closes on Escape even when another listener already handled it', () => {
		// Order-independence, and the bug that made it necessary: the ToC used to
		// preventDefault EVERY Escape (open or shut), and it listens first, so a grid
		// that deferred to an already-handled Escape could never close itself.
		// Escape is judged on OUR state alone — like spaceIntent, whichever listener
		// the browser calls first, each acts only on the intent that is its own.
		expect(overviewPageKeyIntent(key({ key: 'Escape', defaultPrevented: true }), true)).toBe(
			'close'
		);
		// Still not ours when the grid is shut, handled or not.
		expect(overviewPageKeyIntent(key({ key: 'Escape', defaultPrevented: true }), false)).toBe(
			'ignore'
		);
	});

	it('ignores a LETTER someone else has already handled, and every other key', () => {
		// The letter does defer: if something else acted on this `o`, it is not ours
		// to reinterpret. (Escape is the deliberate exception, above.)
		expect(overviewPageKeyIntent(key({ key: 'o', defaultPrevented: true }), false)).toBe('ignore');
		expect(overviewPageKeyIntent(key({ key: 'ArrowRight' }), false)).toBe('ignore');
		expect(overviewPageKeyIntent(key({ key: ' ' }), false)).toBe('ignore');
	});
});

describe('mountedTiles — which tiles hold a live document', () => {
	it('always mounts the current slide, so the grid opens already showing it', () => {
		expect([...mountedTiles(new Set(), 3)]).toEqual([3]);
	});

	it('keeps every tile that has been seen — mounting is one-way', () => {
		// Unmounting on scroll-out would reload (and re-boot) a slide every time it
		// drifted past. Keeping it costs one already-parsed document.
		const seen = new Set([1, 2, 5]);
		expect([...mountedTiles(seen, 2)].sort((a, b) => a - b)).toEqual([1, 2, 5]);
	});

	it('does not mutate the set it is given', () => {
		const seen = new Set([1]);
		mountedTiles(seen, 9);
		expect([...seen]).toEqual([1]);
	});

	it('is total — no current slide (0) and junk numbers add nothing', () => {
		expect([...mountedTiles(new Set([1]), 0)]).toEqual([1]);
		expect([...mountedTiles(new Set([NaN]), NaN)]).toEqual([]);
	});
});
