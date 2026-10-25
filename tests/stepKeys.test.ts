import { describe, expect, it } from 'vitest';
import { isSpaceKey, isInteractiveTarget, spaceIntent, pageKeyIntent } from '../src/lib/utils/stepKeys';

// The single decision both Space listeners consult (Steps reveals/peels,
// NavigationBar pages). Testing it here means the handoff is pinned down without
// having to mount NavigationBar, whose navigate() does a real window.location
// assignment that jsdom can't perform.

function key(opts: { key?: string; code?: string; shiftKey?: boolean } = {}) {
	const { key = ' ', code = 'Space', shiftKey = false } = opts;
	return new KeyboardEvent('keydown', { key, code, shiftKey, cancelable: true });
}

const build = (hasNext: boolean, hasPrev: boolean) => ({ hasNext, hasPrev });

describe('isSpaceKey', () => {
	it('accepts both the key and code spellings of the space bar', () => {
		expect(isSpaceKey(key({ key: ' ', code: '' }))).toBe(true);
		expect(isSpaceKey(key({ key: 'Unidentified', code: 'Space' }))).toBe(true);
		expect(isSpaceKey(key({ key: 'ArrowRight', code: 'ArrowRight' }))).toBe(false);
	});
});

describe('isInteractiveTarget', () => {
	it('treats focusable controls and editables as owning the key', () => {
		for (const tag of ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']) {
			expect(isInteractiveTarget(document.createElement(tag))).toBe(true);
		}
		expect(isInteractiveTarget(document.createElement('DIV'))).toBe(false);
		expect(isInteractiveTarget(null)).toBe(false);
	});
});

describe('spaceIntent', () => {
	it('steps the build while steps remain', () => {
		expect(spaceIntent(key(), build(true, false))).toBe('reveal');
		expect(spaceIntent(key({ shiftKey: true }), build(false, true))).toBe('peel');
	});

	it('pages the deck once the build is spent — the requested handoff', () => {
		// all revealed → Space goes to the next slide
		expect(spaceIntent(key(), build(false, true))).toBe('page-next');
		// nothing revealed → Shift+Space goes back a slide
		expect(spaceIntent(key({ shiftKey: true }), build(true, false))).toBe('page-prev');
	});

	it('pages on a slide with no build at all', () => {
		expect(spaceIntent(key(), null)).toBe('page-next');
		expect(spaceIntent(key({ shiftKey: true }), null)).toBe('page-prev');
	});

	it('ignores non-Space keys, handled events, and focused controls', () => {
		expect(spaceIntent(key({ key: 'ArrowRight', code: 'ArrowRight' }), null)).toBe('ignore');

		const handled = key();
		handled.preventDefault();
		expect(spaceIntent(handled, null)).toBe('ignore');

		// A focused button keeps Space to itself (it would activate the button).
		const btn = document.createElement('button');
		const ev = key();
		btn.dispatchEvent(ev); // sets ev.target
		expect(spaceIntent(ev, null)).toBe('ignore');
	});
});

describe('pageKeyIntent', () => {
	const press = (key: string, mods: KeyboardEventInit = {}) =>
		new KeyboardEvent('keydown', { key, cancelable: true, ...mods });

	it('Home / End jump to the first / last slide (Fn+← / Fn+→ on a Mac laptop)', () => {
		expect(pageKeyIntent(press('Home'))).toBe('first');
		expect(pageKeyIntent(press('End'))).toBe('last');
	});

	it('Cmd+↑ / Cmd+↓ are the Mac spelling of the same jump', () => {
		expect(pageKeyIntent(press('ArrowUp', { metaKey: true }))).toBe('first');
		expect(pageKeyIntent(press('ArrowDown', { metaKey: true }))).toBe('last');
	});

	it('PageUp / PageDown — a clicker — step one slide', () => {
		expect(pageKeyIntent(press('PageUp'))).toBe('prev');
		expect(pageKeyIntent(press('PageDown'))).toBe('next');
	});

	it('leaves bare arrows, Space and other chords alone', () => {
		expect(pageKeyIntent(press('ArrowUp'))).toBe('ignore');
		expect(pageKeyIntent(press('ArrowRight'))).toBe('ignore');
		expect(pageKeyIntent(press(' '))).toBe('ignore');
		expect(pageKeyIntent(press('Home', { ctrlKey: true }))).toBe('ignore');
		expect(pageKeyIntent(press('End', { shiftKey: true }))).toBe('ignore');
		expect(pageKeyIntent(press('Home', { metaKey: true }))).toBe('ignore');
		expect(pageKeyIntent(press('ArrowLeft', { metaKey: true }))).toBe('ignore');
	});

	it('yields a key a focused control already claimed (the AnimationBar rail)', () => {
		const e = press('Home');
		e.preventDefault();
		expect(pageKeyIntent(e)).toBe('ignore');
	});
});
