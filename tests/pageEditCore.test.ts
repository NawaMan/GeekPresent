// Pure unit tests for deck structure editing (pages.ts insert/remove, paths, scaffolds).
// The interesting cases are the refusals — same bargain as wire-og / patchSource.
import { describe, expect, it } from 'vitest';
import {
	slugifyStem,
	normalizeSlidePath,
	isValidSlidePath,
	formatPagesEntry,
	listEntryPaths,
	insertPagesEntry,
	removePagesEntry,
	scaffoldPage,
	LAYOUT_JS,
	normalizeTemplate,
	renamePagesEntry,
	duplicatePagesEntry,
	countSlideRefs,
	rewriteSlideRefs
} from '../src/lib/deckEdit/pageEditCore';

const PAGES = `export const pages = [
    { path: "title.html",             title: "Title" },
    { path: "intro.html",             title: "Intro" },
    { path: "outro.html",             title: "Outro" },
];
`;

describe('slugifyStem', () => {
	it('turns a title into a lowercase hyphenated stem', () => {
		expect(slugifyStem('My New Slide')).toBe('my-new-slide');
		expect(slugifyStem('  Hello, World!  ')).toBe('hello-world');
	});

	it('falls back to "slide" for empty / pure punctuation', () => {
		expect(slugifyStem('')).toBe('slide');
		expect(slugifyStem('!!!')).toBe('slide');
		expect(slugifyStem(null as unknown as string)).toBe('slide');
	});
});

describe('normalizeSlidePath', () => {
	it('accepts name.html and adds .html when missing', () => {
		expect(normalizeSlidePath('my-slide.html')).toBe('my-slide.html');
		expect(normalizeSlidePath('My-Slide')).toBe('my-slide.html');
	});

	it('refuses traversal, separators, and bad stems', () => {
		expect(normalizeSlidePath('../x.html')).toBeNull();
		expect(normalizeSlidePath('a/b.html')).toBeNull();
		expect(normalizeSlidePath('-bad.html')).toBeNull();
		expect(normalizeSlidePath('')).toBeNull();
		expect(normalizeSlidePath('has space.html')).toBeNull();
	});
});

describe('isValidSlidePath', () => {
	it('requires the canonical form', () => {
		expect(isValidSlidePath('ok.html')).toBe(true);
		expect(isValidSlidePath('OK.html')).toBe(false); // not normalized
	});
});

describe('listEntryPaths / formatPagesEntry', () => {
	it('lists one-line entries in order', () => {
		expect(listEntryPaths(PAGES)).toEqual(['title.html', 'intro.html', 'outro.html']);
	});

	it('formats a house-style entry line', () => {
		expect(formatPagesEntry('x.html', 'Hello')).toBe('{ path: "x.html", title: "Hello" },');
	});
});

describe('insertPagesEntry', () => {
	it('appends when after is null', () => {
		const r = insertPagesEntry(PAGES, 'new.html', 'New', null);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(listEntryPaths(r.source)).toEqual([
			'title.html',
			'intro.html',
			'outro.html',
			'new.html'
		]);
		expect(r.source).toContain('{ path: "new.html", title: "New" },');
	});

	it('inserts after a named path', () => {
		const r = insertPagesEntry(PAGES, 'mid.html', 'Mid', 'title.html');
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(listEntryPaths(r.source)).toEqual([
			'title.html',
			'mid.html',
			'intro.html',
			'outro.html'
		]);
	});

	it('refuses a duplicate path', () => {
		const r = insertPagesEntry(PAGES, 'intro.html', 'Dup', null);
		expect(r.ok).toBe(false);
		if (r.ok) return;
		expect(r.error).toMatch(/already lists/);
	});

	it('refuses a missing after path', () => {
		const r = insertPagesEntry(PAGES, 'x.html', 'X', 'nope.html');
		expect(r.ok).toBe(false);
		if (r.ok) return;
		expect(r.error).toMatch(/no pages\.ts entry/);
	});

	it('refuses an empty title', () => {
		const r = insertPagesEntry(PAGES, 'x.html', '  ', null);
		expect(r.ok).toBe(false);
	});

	it('inserts into an empty pages array', () => {
		const empty = `export const pages = [\n];\n`;
		const r = insertPagesEntry(empty, 'only.html', 'Only', null);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(listEntryPaths(r.source)).toEqual(['only.html']);
	});
});

describe('removePagesEntry', () => {
	it('drops the matching one-line entry', () => {
		const r = removePagesEntry(PAGES, 'intro.html');
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(listEntryPaths(r.source)).toEqual(['title.html', 'outro.html']);
		expect(r.source).not.toContain('intro.html');
	});

	it('refuses a missing path', () => {
		const r = removePagesEntry(PAGES, 'ghost.html');
		expect(r.ok).toBe(false);
	});

	it('leaves non-entry lines alone', () => {
		const r = removePagesEntry(PAGES, 'title.html');
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.source).toContain('export const pages');
	});
});

describe('scaffoldPage / LAYOUT_JS', () => {
	it('ships the two required layout lines', () => {
		expect(LAYOUT_JS).toContain('export const prerender = true');
		expect(LAYOUT_JS).toContain('export const trailingSlash = "never"');
	});

	it('scaffolds ContentPage by default with ViewSource (so ☰ EDIT works)', () => {
		const s = scaffoldPage('content', 'Hello', { deck: 'slides', path: 'hello.html' });
		expect(s).toContain('ContentPage');
		expect(s).toContain('title="Hello"');
		expect(s).not.toContain('TitlePage');
		expect(s).toContain('ViewSource');
		expect(s).toContain("from './+page.svelte?raw'");
		expect(s).toContain('src/routes/slides/hello.html/+page.svelte');
	});

	it('scaffolds TitlePage when asked, still with ViewSource', () => {
		const s = scaffoldPage('title', 'Deck', { deck: 'slides', path: 'deck.html' });
		expect(s).toContain('TitlePage');
		expect(s).toContain('Deck');
		expect(s).toContain('ViewSource');
	});

	it('normalizeTemplate defaults to content', () => {
		expect(normalizeTemplate('title')).toBe('title');
		expect(normalizeTemplate('nope')).toBe('content');
		expect(normalizeTemplate(null)).toBe('content');
	});
});

describe('renamePagesEntry', () => {
	const RICH = `export const pages = [
    { path: "intro.html",  title: "Intro", adjust: true },
    { path: "gc.html",     title: 'GC "marks"', hidden: true, image: "/og/gc.png" },
    {
        path: "multi.html", title: "Multi"
    },
];
`;
	it('changes the title only, keeping the other fields and spacing', () => {
		const r = renamePagesEntry(RICH, 'intro.html', { title: 'Hello "there"' });
		expect(r.ok && r.source.split('\n')[1]).toBe(
			'    { path: "intro.html",  title: "Hello \\"there\\"", adjust: true },'
		);
	});

	it('changes the path and title together', () => {
		const r = renamePagesEntry(RICH, 'gc.html', { path: 'gc-marks', title: 'GC' });
		expect(r.ok && r.source.split('\n')[2]).toBe(
			'    { path: "gc-marks.html",     title: "GC", hidden: true, image: "/og/gc.png" },'
		);
	});

	it('refuses a path already listed, a bad path, an empty title, a missing or multi-line entry', () => {
		expect(renamePagesEntry(RICH, 'intro.html', { path: 'gc.html' }).ok).toBe(false);
		expect(renamePagesEntry(RICH, 'intro.html', { path: '../x' }).ok).toBe(false);
		expect(renamePagesEntry(RICH, 'intro.html', { title: '  ' }).ok).toBe(false);
		expect(renamePagesEntry(RICH, 'nope.html', { title: 'X' }).ok).toBe(false);
		expect(renamePagesEntry(RICH, 'multi.html', { title: 'X' }).ok).toBe(false);
	});
});

describe('duplicatePagesEntry', () => {
	const SRC = `export const pages = [
    { path: "a.html", title: "A", hidden: true, image: "/og/a.png" },
    { path: "b.html", title: "B" },
];`;
	it('inserts the copy right after the original, dropping image', () => {
		const r = duplicatePagesEntry(SRC, 'a.html', 'a-copy.html', 'A (copy)');
		expect(r.ok && r.source.split('\n').slice(1, 4)).toEqual([
			'    { path: "a.html", title: "A", hidden: true, image: "/og/a.png" },',
			'    { path: "a-copy.html", title: "A (copy)", hidden: true },',
			'    { path: "b.html", title: "B" },'
		]);
	});

	it('refuses an existing target, a bad path, an empty title, a missing source', () => {
		expect(duplicatePagesEntry(SRC, 'a.html', 'b.html', 'X').ok).toBe(false);
		expect(duplicatePagesEntry(SRC, 'a.html', 'x/y', 'X').ok).toBe(false);
		expect(duplicatePagesEntry(SRC, 'a.html', 'c.html', ' ').ok).toBe(false);
		expect(duplicatePagesEntry(SRC, 'z.html', 'c.html', 'X').ok).toBe(false);
	});
});

describe('countSlideRefs / rewriteSlideRefs', () => {
	const SAME = `<AppendixLink to="old.html">a</AppendixLink>
<Link href="./old.html?x">b</Link>
<a href="bold.html">not it</a> <a href="old.html.bak">nor this</a>
const path = 'src/routes/slides/old.html/+page.svelte';`;
	const OTHER = `<a href="../slides/old.html">x</a> <a href="old.html">its own deck's old</a>`;

	it('in the same deck, rewrites bare and qualified references only', () => {
		expect(countSlideRefs(SAME, 'slides', 'old.html', true)).toBe(3);
		const r = rewriteSlideRefs(SAME, 'slides', 'old.html', 'new.html', true);
		expect(r.count).toBe(3);
		expect(r.source).toContain('to="new.html"');
		expect(r.source).toContain('href="./new.html?x"');
		expect(r.source).toContain("'src/routes/slides/new.html/+page.svelte'");
		expect(r.source).toContain('href="bold.html"');
		expect(r.source).toContain('href="old.html.bak"');
	});

	it('from another deck, rewrites only the deck-qualified reference', () => {
		const r = rewriteSlideRefs(OTHER, 'slides', 'old.html', 'new.html', false);
		expect(r.count).toBe(1);
		expect(r.source).toBe(`<a href="../slides/new.html">x</a> <a href="old.html">its own deck's old</a>`);
	});

	it("catches the deck index redirect's pathname + '/name.html'", () => {
		const r = rewriteSlideRefs(`location.pathname + '/old.html'`, 'slides', 'old.html', 'new.html', true);
		expect(r.source).toBe(`location.pathname + '/new.html'`);
	});

	it('does not match a deck whose name merely ends the same way', () => {
		expect(countSlideRefs('href="../myslides/old.html"', 'slides', 'old.html', false)).toBe(0);
	});
});
