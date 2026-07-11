import { describe, expect, it } from 'vitest';
import { readSticky, readLayoutParam, resolveCanLayout } from '$lib/layout/layoutAccessCore';

// The pure precedence layer behind the LAYOUT control (stores/layoutMode wires it
// to localStorage, the URL, and SlideDeck's `layout` prop). Everything here is
// total: a corrupt localStorage value, a URL with no query, a bare `?layout` with
// no value — each has one defined answer, so the store never has to guess.

const q = (s: string) => new URL(`http://x/slide.html${s}`).searchParams;

describe('readSticky — the recorded choice', () => {
	it('reads the two strings the store writes', () => {
		expect(readSticky('true')).toBe(true);
		expect(readSticky('false')).toBe(false);
	});

	it('treats absent as "no choice", not as false', () => {
		expect(readSticky(null)).toBe(null);
		expect(readSticky(undefined)).toBe(null);
	});

	// The distinction that matters: garbage must fall THROUGH to the deck default,
	// not veto it. Mapping it to false would let one bad byte silently hide a demo
	// deck's LAYOUT button with nothing to point at.
	it('treats garbage as "no choice", so it cannot veto the deck default', () => {
		for (const junk of ['', 'TRUE', 'yes', '1', '{}', 'undefined'])
			expect(readSticky(junk)).toBe(null);
	});
});

describe('readLayoutParam — the URL flag', () => {
	it('enables on a bare ?layout, and on the affirmative spellings', () => {
		expect(readLayoutParam(q('?layout'))).toBe(true);
		expect(readLayoutParam(q('?layout=on'))).toBe(true);
		expect(readLayoutParam(q('?layout=1'))).toBe(true);
	});

	it('disables on off / false / 0, case- and space-insensitively', () => {
		expect(readLayoutParam(q('?layout=off'))).toBe(false);
		expect(readLayoutParam(q('?layout=false'))).toBe(false);
		expect(readLayoutParam(q('?layout=0'))).toBe(false);
		expect(readLayoutParam(q('?layout=OFF'))).toBe(false);
		expect(readLayoutParam(q('?layout=%20off%20'))).toBe(false);
	});

	// A slide reached by clicking NEXT carries no query — that URL says nothing
	// about LAYOUT and must leave the speaker's earlier choice standing.
	it('says nothing when the flag is absent, so it never overwrites a stored choice', () => {
		expect(readLayoutParam(q(''))).toBe(null);
		expect(readLayoutParam(q('?present&clean'))).toBe(null);
		expect(readLayoutParam(null)).toBe(null);
		expect(readLayoutParam(undefined)).toBe(null);
	});
});

describe('resolveCanLayout — precedence', () => {
	it('dev always offers LAYOUT, whatever anyone else says', () => {
		expect(resolveCanLayout(true, false, false)).toBe(true);
		expect(resolveCanLayout(true, null, false)).toBe(true);
	});

	// The headline guarantee: an ordinary slide in a built site is LAYOUT-free. This is
	// the case the DOM tests structurally cannot reach (vitest runs with DEV=true), so
	// it is pinned here or nowhere.
	it('a built, undeclared slide is OFF — a published deck shows no authoring chrome', () => {
		expect(resolveCanLayout(false, null, false)).toBe(false);
	});

	it('a slide that declares layout offers the control in a BUILD (this is the demo flag)', () => {
		expect(resolveCanLayout(false, null, true)).toBe(true);
	});

	// The speaker asked, so the speaker wins — both ways round. `?layout` lights up an
	// ordinary slide; `?layout=off` hushes a demo slide for a straight run-through.
	it("the speaker's sticky choice outranks what the slide declares", () => {
		expect(resolveCanLayout(false, true, false)).toBe(true);
		expect(resolveCanLayout(false, false, true)).toBe(false);
	});
});
