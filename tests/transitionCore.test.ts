import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	BUILT_IN_REVERSE,
	DEFAULT_KIND,
	reverseKind,
	slideOfHref,
	turnKind
} from '../src/lib/utils/transitionCore';
import { pages as showcase } from '../src/routes/transition/pages';

const pages = [
	{ path: 'a.html', transition: 'rise' },
	{ path: 'b.html', transition: 'left' },
	{ path: 'c.html', transition: 'morph' },
	{ path: 'd.html' },
	{ path: 'e.html', transition: 'swipe-up', transitionBack: 'fade' },
	{ path: 'f.html' }
];

describe('reverseKind', () => {
	it('pairs the built-in directional kinds', () => {
		expect(reverseKind('left')).toBe('right');
		expect(reverseKind('right')).toBe('left');
		expect(reverseKind('rise')).toBe('fall');
		expect(reverseKind('fall')).toBe('rise');
	});

	it('leaves a kind with no direction as it is', () => {
		expect(reverseKind('slide')).toBe('slide');
		expect(reverseKind('morph')).toBe('morph');
		expect(reverseKind('toString')).toBe('toString');
	});

	it("reads the deck's own pairs first", () => {
		expect(reverseKind('swipe-up', { 'swipe-up': 'swipe-down' })).toBe('swipe-down');
		expect(reverseKind('left', { left: 'spin' })).toBe('spin');
		expect(reverseKind('left', { left: '' })).toBe('right');
		expect(reverseKind('left', null)).toBe('right');
	});

	it('has every built-in pair in both directions', () => {
		for (const [kind, back] of Object.entries(BUILT_IN_REVERSE)) {
			expect(BUILT_IN_REVERSE[back]).toBe(kind);
		}
	});
});

describe('slideOfHref', () => {
	it('takes the slide name off an href', () => {
		expect(slideOfHref('./a.html?present')).toBe('a.html');
		expect(slideOfHref('/deck/a.html/')).toBe('a.html');
		expect(slideOfHref('a.html#x')).toBe('a.html');
		expect(slideOfHref('./a.html?return=/deck/b.html')).toBe('a.html');
		expect(slideOfHref(undefined)).toBe('');
	});
});

describe('turnKind', () => {
	it("forward: the leaving slide's transition, else the default", () => {
		expect(turnKind(pages, 'a.html', 'b.html', 'forward')).toBe('rise');
		expect(turnKind(pages, 'd.html', 'e.html', 'forward')).toBe(DEFAULT_KIND);
		expect(turnKind(pages, 'nowhere.html', 'b.html', 'forward')).toBe(DEFAULT_KIND);
	});

	it('back: the reverse of the kind that leads forward from the target', () => {
		expect(turnKind(pages, 'b.html', './a.html', 'back')).toBe('fall');
		expect(turnKind(pages, 'c.html', './b.html?present', 'back')).toBe('right');
	});

	it('back: a kind with no direction is used as it is', () => {
		expect(turnKind(pages, 'd.html', 'c.html', 'back')).toBe('morph');
		expect(turnKind(pages, 'e.html', 'd.html', 'back')).toBe('fade'); // explicit, below
		expect(turnKind(pages, 'f.html', 'd.html', 'back')).toBe(DEFAULT_KIND);
	});

	it('back: an explicit transitionBack wins', () => {
		expect(turnKind(pages, 'e.html', 'a.html', 'back')).toBe('fade');
	});

	it("back: the deck's own pairs apply", () => {
		const reverses = { 'swipe-up': 'swipe-down' };
		expect(turnKind(pages, 'f.html', 'e.html', 'back', reverses)).toBe('swipe-down');
		expect(turnKind(pages, 'f.html', 'e.html', 'back')).toBe('swipe-up');
	});

	it('back: a jump (FIRST) reads the slide it lands on, not the one before', () => {
		expect(turnKind(pages, 'f.html', 'a.html', 'back')).toBe('fall');
	});

	it('back: an unknown target falls back to the default', () => {
		expect(turnKind(pages, 'b.html', '', 'back')).toBe(DEFAULT_KIND);
		expect(turnKind(pages, 'b.html', null, 'back')).toBe(DEFAULT_KIND);
		expect(turnKind([], 'b.html', 'a.html', 'back')).toBe(DEFAULT_KIND);
	});
});

describe('the showcase deck', () => {
	it('needs no transitionBack: each effect replays on the way back', () => {
		expect(showcase.some((p) => 'transitionBack' in p)).toBe(false);
		const back = (from: string, to: string) => turnKind(showcase, from, to, 'back');
		expect(back('cross-fade-to.html', 'cross-fade-from.html')).toBe('fade');
		expect(back('push-left.html', 'push-rise.html')).toBe('fall');
		expect(back('push-to.html', 'push-left.html')).toBe('right');
		expect(back('camera-out.html', 'camera-pan.html')).toBe('camera');
		expect(back('zoom-from.html', 'push-to.html')).toBe('slide');
	});
});

describe('styles/push-transitions.css', () => {
	const css = readFileSync('src/lib/styles/push-transitions.css', 'utf8').replace(
		/\/\*[\s\S]*?\*\//g,
		''
	);

	it('has a rule for the old and the new slide of every built-in kind', () => {
		for (const kind of Object.keys(BUILT_IN_REVERSE)) {
			expect(css).toContain(`:where(html[data-vt-kind='${kind}'])::view-transition-old(root)`);
			expect(css).toContain(`:where(html[data-vt-kind='${kind}'])::view-transition-new(root)`);
		}
	});

	it('wraps every selector in :where(), so a deck rule for the same kind wins', () => {
		const selectors = css.match(/^[^@{}\n]*data-vt-kind[^{]*\{/gm) ?? [];
		expect(selectors.length).toBe(8);
		for (const s of selectors) expect(s.trim().startsWith(':where(')).toBe(true);
	});

	it('prefixes every keyframes name, and uses only its own', () => {
		const defined = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
		expect(defined.length).toBe(8);
		for (const name of defined) expect(name.startsWith('gp-vt-')).toBe(true);
		const used = [...css.matchAll(/animation:\s*([\w-]+)/g)].map((m) => m[1]);
		expect(used.sort()).toEqual([...defined].sort());
	});

	it('a kind and its reverse move opposite ways', () => {
		const frames = (name: string) =>
			(css.match(new RegExp(`@keyframes ${name}\\s*\\{([^@]*)`)) ?? ['', ''])[1].replace(
				/\s+/g,
				''
			);
		expect(frames('gp-vt-out-up')).toContain('translateY(-100%)');
		expect(frames('gp-vt-in-up')).toContain('translateY(100%)');
		expect(frames('gp-vt-out-left')).toContain('translateX(-100%)');
		expect(frames('gp-vt-in-left')).toContain('translateX(100%)');
		expect(frames('gp-vt-out-down')).toBe(frames('gp-vt-in-up').replace('from', 'to'));
		expect(frames('gp-vt-out-right')).toBe(frames('gp-vt-in-left').replace('from', 'to'));
	});

	it('leaves reduced motion to the browser', () => {
		expect(css).toContain('@media (prefers-reduced-motion: no-preference)');
	});
});
