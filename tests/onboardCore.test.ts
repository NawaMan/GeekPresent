// Pure rules of the first-visit hint (onboard/onboardCore.ts): who is new, where the
// hint may appear, and what one key press says about the viewer.
import { describe, expect, it } from 'vitest';
import {
	DEFAULT_ONBOARD_DELAY_MS,
	classifyKey,
	isBeyondFirst,
	isFirstSlide,
	onboardDelayMs,
	shouldWatch
} from '../src/lib/onboard/onboardCore';

const deck = [
	{ path: 'title.html', title: 'Title' },
	{ path: 'appendix.html', title: 'Appendix', hidden: true },
	{ path: 'intro.html', title: 'Intro' },
	{ path: 'end.html', title: 'End' }
];

describe('onboardDelayMs', () => {
	it('keeps a finite, non-negative delay', () => {
		expect(onboardDelayMs(3000)).toBe(3000);
		expect(onboardDelayMs(0)).toBe(0);
	});

	it('falls back to the default for junk — never setTimeout(NaN)', () => {
		for (const junk of [NaN, -1, Infinity, '5000', undefined, null]) {
			expect(onboardDelayMs(junk)).toBe(DEFAULT_ONBOARD_DELAY_MS);
		}
	});
});

describe('isFirstSlide / isBeyondFirst', () => {
	it('the first VISIBLE slide is first', () => {
		expect(isFirstSlide(deck, 'title.html')).toBe(true);
		expect(isBeyondFirst(deck, 'title.html')).toBe(false);
	});

	it('any later visible slide is beyond the first', () => {
		expect(isFirstSlide(deck, 'intro.html')).toBe(false);
		expect(isBeyondFirst(deck, 'intro.html')).toBe(true);
		expect(isBeyondFirst(deck, 'end.html')).toBe(true);
	});

	it('a hidden appendix (or an unknown slide) is neither', () => {
		expect(isFirstSlide(deck, 'appendix.html')).toBe(false);
		expect(isBeyondFirst(deck, 'appendix.html')).toBe(false);
		expect(isFirstSlide(deck, 'nope.html')).toBe(false);
		expect(isBeyondFirst(deck, 'nope.html')).toBe(false);
	});

	it('a one-slide deck has nowhere to go, so nothing to teach', () => {
		expect(isFirstSlide([{ path: 'only.html', title: 'Only' }], 'only.html')).toBe(false);
	});

	it('a hidden FIRST entry does not make the second one "beyond"', () => {
		const pages = [
			{ path: 'secret.html', title: 'Secret', hidden: true },
			{ path: 'title.html', title: 'Title' },
			{ path: 'next.html', title: 'Next' }
		];
		expect(isFirstSlide(pages, 'title.html')).toBe(true);
		expect(isBeyondFirst(pages, 'title.html')).toBe(false);
	});
});

describe('shouldWatch', () => {
	const base = { offered: true, done: false, firstSlide: true, suppressed: false };

	it('watches a new viewer on the first slide', () => {
		expect(shouldWatch(base)).toBe(true);
	});

	it('any one gate turns it off', () => {
		expect(shouldWatch({ ...base, offered: false })).toBe(false);
		expect(shouldWatch({ ...base, done: true })).toBe(false);
		expect(shouldWatch({ ...base, firstSlide: false })).toBe(false);
		expect(shouldWatch({ ...base, suppressed: true })).toBe(false);
	});

	it('force (?onboard) overrides every gate but suppressed', () => {
		const forced = {
			offered: false,
			done: true,
			firstSlide: false,
			suppressed: false,
			force: true
		};
		expect(shouldWatch(forced)).toBe(true);
		expect(shouldWatch({ ...forced, suppressed: true })).toBe(false);
	});
});

describe('classifyKey', () => {
	it('paging keys mean the viewer knows the way', () => {
		for (const k of [' ', 'Spacebar', 'ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp']) {
			expect(classifyKey(k)).toBe('explore');
		}
	});

	it('what a stuck viewer tries is stray', () => {
		for (const k of ['Enter', 'ArrowDown', 'ArrowUp']) expect(classifyKey(k)).toBe('stray');
	});

	it('anything else, and any chord, says nothing', () => {
		expect(classifyKey('a')).toBe('none');
		expect(classifyKey('Escape')).toBe('none');
		expect(classifyKey('ArrowRight', { alt: true })).toBe('none');
		expect(classifyKey('Enter', { ctrl: true })).toBe('none');
		expect(classifyKey(' ', { meta: true })).toBe('none');
	});
});
