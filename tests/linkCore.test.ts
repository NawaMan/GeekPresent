import { describe, expect, it } from 'vitest';
import {
	classifyLink,
	resolveKind,
	opensNewWindow,
	linkTarget,
	linkRel,
	linkTone,
	linkGlyph
} from '$lib/utils/linkCore';

// linkCore — the promise a link makes about where the reader ends up. The
// interesting cases are the ones an author gets wrong by hand: a protocol-relative
// URL that looks relative, a `mailto:` that has no host, an internal page opened in
// a new tab (which is "leaving" even though the URL is ours), and junk hrefs, which
// must degrade to the SAFE answer rather than a surprise new tab.

describe('classifyLink — relative hrefs keep you here', () => {
	it('treats every relative form as internal', () => {
		for (const href of ['./x.html', '../', '../slides/title.html', 'x.html', '', '   ']) {
			expect(classifyLink(href)).toBe('internal');
		}
	});

	// A fragment or a bare query never leaves the page it is on, whatever the deck
	// around it is doing.
	it('treats in-page anchors and bare queries as internal', () => {
		expect(classifyLink('#emitted')).toBe('internal');
		expect(classifyLink('?name=Ada')).toBe('internal');
	});

	it('treats a root-relative path as internal', () => {
		expect(classifyLink('/_handout/slides.html')).toBe('internal');
	});
});

describe('classifyLink — schemes hand you off', () => {
	it('calls absolute http(s) external when no origin says otherwise', () => {
		expect(classifyLink('https://codingbooth.io/')).toBe('external');
		expect(classifyLink('http://example.com/a')).toBe('external');
	});

	// These hand the reader to another APP entirely, which is as external as it gets.
	it('calls non-web schemes external', () => {
		expect(classifyLink('mailto:hi@example.com')).toBe('external');
		expect(classifyLink('tel:+15551234')).toBe('external');
		expect(classifyLink('ftp://files.example.com/x')).toBe('external');
	});

	it('is case-insensitive about the scheme', () => {
		expect(classifyLink('HTTPS://example.com')).toBe('external');
		expect(classifyLink('MailTo:hi@example.com')).toBe('external');
	});

	// The ordering trap: `//host` is absolute with no scheme, and sits one character
	// away from `/path`, which is not.
	it('separates protocol-relative //host from root-relative /path', () => {
		expect(classifyLink('//cdn.example.com/x.png')).toBe('external');
		expect(classifyLink('/x.png')).toBe('internal');
	});

	it('ignores surrounding whitespace', () => {
		expect(classifyLink('  https://example.com  ')).toBe('external');
	});
});

describe('classifyLink — the origin hint', () => {
	it('calls a same-origin absolute URL internal', () => {
		expect(classifyLink('https://geek.example/slides/a.html', 'https://geek.example')).toBe('internal');
	});

	it('still calls a different origin external', () => {
		expect(classifyLink('https://other.example/a', 'https://geek.example')).toBe('external');
	});

	// Port and scheme are part of an origin, so neither may be waved through.
	it('counts port and scheme as part of the origin', () => {
		expect(classifyLink('https://geek.example:8080/a', 'https://geek.example')).toBe('external');
		expect(classifyLink('http://geek.example/a', 'https://geek.example')).toBe('external');
	});

	it('resolves a protocol-relative URL against the hint', () => {
		expect(classifyLink('//geek.example/a', 'https://geek.example')).toBe('internal');
	});

	// An origin we cannot parse cannot vouch for anything — fall back to external
	// rather than quietly promising the link stays home.
	it('ignores an unparseable origin', () => {
		expect(classifyLink('https://geek.example/a', 'not a url')).toBe('external');
	});
});

describe('classifyLink — junk is safe, never a throw', () => {
	it('answers internal for anything that is not a usable string', () => {
		for (const href of [undefined, null, 42, {}, [], true]) {
			expect(classifyLink(href as unknown)).toBe('internal');
		}
	});
});

describe('resolveKind — the author overrides the URL', () => {
	it('honours an explicit kind over what the href looks like', () => {
		expect(resolveKind('internal', 'https://docs.example.com')).toBe('internal');
		expect(resolveKind('external', './x.html')).toBe('external');
	});

	it('classifies for auto, and for anything unrecognised', () => {
		expect(resolveKind('auto', 'https://example.com')).toBe('external');
		expect(resolveKind(undefined, 'https://example.com')).toBe('external');
		expect(resolveKind('sideways', './x.html')).toBe('internal');
	});
});

describe('newTab / target / rel', () => {
	it('opens external links away and internal ones in place, by default', () => {
		expect(opensNewWindow('external')).toBe(true);
		expect(opensNewWindow('internal')).toBe(false);
	});

	it('lets an explicit newTab win in both directions', () => {
		expect(opensNewWindow('internal', true)).toBe(true);
		expect(opensNewWindow('external', false)).toBe(false);
	});

	it('treats null/undefined as "follow the kind", not as false', () => {
		expect(opensNewWindow('external', null)).toBe(true);
		expect(opensNewWindow('external', undefined)).toBe(true);
	});

	it('omits target entirely when the link stays in this window', () => {
		expect(linkTarget('internal')).toBeUndefined();
		expect(linkTarget('external', false)).toBeUndefined();
		expect(linkTarget('external')).toBe('_blank');
		expect(linkTarget('internal', true)).toBe('_blank');
	});

	// noopener is about the WINDOW (no live handle back to ours); noreferrer is about
	// the DESTINATION (a site off ours is not told which slide sent the reader). So an
	// external link forced to stay in this tab still earns both.
	it('gives an external link both guards, in either window', () => {
		expect(linkRel('external')).toBe('noopener noreferrer');
		expect(linkRel('external', false)).toBe('noopener noreferrer');
	});

	it('gives an internal link opened away only noopener, and otherwise nothing', () => {
		expect(linkRel('internal', true)).toBe('noopener');
		expect(linkRel('internal')).toBeUndefined();
	});
});

describe('linkTone — the journey follows where you END UP', () => {
	it('reports leaving for an external destination', () => {
		expect(linkTone('external')).toBe('external');
	});

	// The whole reason tone is not just kind: this page is ours, but the reader is
	// still being handed to another window, and the glyph must not lie about it.
	it('reports leaving for an internal page forced into a new window', () => {
		expect(linkTone('internal', true)).toBe('external');
	});

	// Pinning an external link to this window changes the WINDOW, not the destination:
	// the reader still ends up off the site, so the glyph must still say so.
	it('keeps leaving for an external link pinned to this window', () => {
		expect(linkTone('external', false)).toBe('external');
	});
});

// Every link shares one colour and one dashed underline, so the glyph is the ENTIRE
// distinction between the kinds — not decoration on top of a colour that already
// said it.
describe('linkGlyph — the glyph IS the distinction', () => {
	it('marks leaving with ↗ and a returning detour with ↩', () => {
		expect(linkGlyph('external')).toBe('↗');
		expect(linkGlyph('appendix')).toBe('↩');
	});

	// The common case is left bare: a glyph on every internal link would litter prose
	// without telling the reader anything they did not assume.
	it('leaves an ordinary internal move unmarked', () => {
		expect(linkGlyph('internal')).toBe('');
	});

	it('answers unmarked for a tone it does not know, rather than throwing', () => {
		for (const tone of [undefined, null, 'sideways', 42, {}]) {
			expect(linkGlyph(tone)).toBe('');
		}
	});
});
