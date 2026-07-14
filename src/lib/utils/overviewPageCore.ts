// The pure half of the deck overview — the all-slides grid ("press O").
//
// The component owns the DOM: the iframes, the scroll container and the observer
// that mounts a tile as it comes into view. This module owns the arithmetic and
// the decisions, so both can be tested without a browser.
//
// Total, like the other *Core modules: an unmeasured box yields a scale of 0
// rather than NaN (a `transform: scale(NaN)` would blank the tile), a garbage
// pages array yields no tiles rather than throwing, and an unknown current path
// simply means no tile is marked current.
import { visiblePages, type Page } from '$lib/utils/navigate';

export interface OverviewTile {
	/** 1-based position in the deck's linear order — what the tile's label shows.
	    Counted over the LISTED pages, so it matches the number a viewer would get
	    by paging from the start, not the index in the raw array. */
	number: number;
	path: string;
	title: string;
	/** The preview URL. `?clean` is the deck's own "no chrome" render (SlideDeck
	    reads it), so a tile shows the slide and not a nav bar, a TOC and another
	    OVERVIEW button. Relative to the current slide document, so it resolves
	    whatever prefix the deck is served under — the same trick the presenter
	    console's previews use. */
	src: string;
	isCurrent: boolean;
}

/** Finite or the fallback — the NaN gate every measurement passes through. */
function finite(n: number, fallback = 0): number {
	return Number.isFinite(n) ? n : fallback;
}

/**
 * Fit a native-size slide into a measured box: the smaller of the two ratios, so
 * the whole slide is visible rather than cropped. The same exact-fit math the
 * presenter console's previews and the deck's FITTED mode use.
 *
 * Returns 0 while the box is still unmeasured — `clientWidth` is 0 before layout,
 * and a tile rendered at zero size is recoverable on the next tick, whereas one
 * rendered at NaN is not.
 */
export function tileScale(boxW: number, boxH: number, canvasW: number, canvasH: number): number {
	const bw = finite(boxW);
	const bh = finite(boxH);
	const cw = finite(canvasW);
	const ch = finite(canvasH);
	if (bw <= 0 || bh <= 0 || cw <= 0 || ch <= 0) return 0;
	return Math.min(bw / cw, bh / ch);
}

/**
 * The deck as tiles, in linear order.
 *
 * `hidden` appendices are dropped. The grid shows the deck's forward march — the
 * same list the Table of Contents lists and →/Space walk. An appendix is reached
 * from the slide that calls it, by name; it is deliberately not something you
 * stumble into while browsing, and the grid is browsing.
 */
export function overviewPageTiles(pages: Array<Page>, currentPath: string): OverviewTile[] {
	const listed = visiblePages(Array.isArray(pages) ? pages : []);
	return listed.map((p, i) => ({
		number: i + 1,
		path: p.path,
		title: p.title,
		src: `./${p.path}?clean`,
		isCurrent: p.path === currentPath
	}));
}

/**
 * Is this key press the user TYPING?
 *
 * Deliberately NARROWER than stepKeys' `isInteractiveTarget`, and the difference
 * is the point. That guard also counts BUTTON and A as interactive, which is
 * right for Space (Space activates a focused button — the deck must not page
 * instead). It is wrong for a letter key and for Escape: with the grid open the
 * focus IS on a tile button, so borrowing that guard would make Escape unable to
 * close the very overlay it opened.
 *
 * What must be protected is a text field — the presenter's timer box, a
 * DataTable's search — where `o` is a letter the user meant to type.
 */
export function isTypingTarget(t: EventTarget | null): boolean {
	const el = t as HTMLElement | null;
	if (!el) return false;
	if (el.isContentEditable) return true;
	return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName ?? '');
}

export type OverviewIntent = 'open' | 'close' | 'ignore';

/**
 * What a key press means to the grid: `o` toggles it, Escape closes it.
 *
 * A modified press belongs to the browser, not to us — Ctrl/Cmd+O is "open
 * file", and stealing it would be a hostile thing for a slide deck to do.
 *
 * Escape only ever CLOSES, and only when the grid is open, so it stays available
 * to the other Escape listeners on the deck (the TOC, SizeMode, Annotate) when
 * the grid is not the thing on screen.
 */
export function overviewPageKeyIntent(e: KeyboardEvent, isOpen: boolean): OverviewIntent {
	if (e.ctrlKey || e.metaKey || e.altKey) return 'ignore';
	if (isTypingTarget(e.target)) return 'ignore';

	// Escape is judged on OUR OWN state, and deliberately NOT on defaultPrevented.
	//
	// Several listeners on the deck answer Escape (the ToC, Box, SizeMode, Annotate),
	// all of them on `window`, and which one the browser calls first is just mount
	// order. If the grid deferred to an already-handled Escape it would be unable to
	// close itself whenever one of those happened to be mounted earlier — which is
	// exactly the bug the ToC caused by preventDefault-ing every Escape, open or shut.
	//
	// So: order-independence, the same discipline spaceIntent gives Steps and
	// NavigationBar. Each listener acts only on the intent that belongs to it, judged
	// against its own state, and no listener can swallow the key out from under
	// another. An open grid is the topmost thing on the canvas; Escape closes it.
	if (e.key === 'Escape') return isOpen ? 'close' : 'ignore';

	// The letter, by contrast, DOES defer: if something else has already acted on
	// this `o`, it is not ours to reinterpret.
	if (e.defaultPrevented) return 'ignore';
	if (e.key === 'o' || e.key === 'O') return isOpen ? 'close' : 'open';
	return 'ignore';
}

/**
 * Which tiles should hold a live iframe?
 *
 * A tile is mounted once it has been seen near the viewport, and STAYS mounted —
 * mounting is one-way. Unmounting on scroll-out would make a tile reload (and
 * re-boot its slide) every time it drifted past, which is both slow and visibly
 * flickery; keeping it costs one already-parsed document.
 *
 * The current slide is always mounted, so the grid opens with the tile you are
 * standing on already showing rather than as a card that fills in a beat later.
 */
export function mountedTiles(seen: ReadonlySet<number>, currentNumber: number): Set<number> {
	const next = new Set<number>();
	for (const n of seen) if (Number.isFinite(n)) next.add(n);
	if (Number.isFinite(currentNumber) && currentNumber > 0) next.add(currentNumber);
	return next;
}
