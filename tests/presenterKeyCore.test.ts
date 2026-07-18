import { describe, expect, it } from 'vitest';
import { presenterKeyIntent } from '../src/lib/chrome/presenterKeyCore';

function key(
	partial: Partial<KeyboardEvent> & { key: string; code?: string }
): KeyboardEvent {
	return {
		key: partial.key,
		code: partial.code ?? '',
		altKey: !!partial.altKey,
		ctrlKey: !!partial.ctrlKey,
		metaKey: !!partial.metaKey,
		shiftKey: !!partial.shiftKey,
		defaultPrevented: !!partial.defaultPrevented,
		target: partial.target ?? null
	} as KeyboardEvent;
}

describe('presenterKeyIntent — the three console mnemonics', () => {
	it('maps T / C to the TOC and reset-checks menus', () => {
		expect(presenterKeyIntent(key({ key: 't' }))).toBe('toc');
		expect(presenterKeyIntent(key({ key: 'c' }))).toBe('checks');
	});

	it('is case-insensitive (Shift or CapsLock still hits)', () => {
		expect(presenterKeyIntent(key({ key: 'T' }))).toBe('toc');
		expect(presenterKeyIntent(key({ key: 'C' }))).toBe('checks');
		expect(presenterKeyIntent(key({ key: 'A' }), true)).toBe('ink');
	});

	it('gates A on the ink control being offered', () => {
		// pen offered → A toggles the reset-ink menu…
		expect(presenterKeyIntent(key({ key: 'a' }), true)).toBe('ink');
		// …but inert when annotation was never offered (default false), so it does
		// not toggle a menu that isn't in the bar.
		expect(presenterKeyIntent(key({ key: 'a' }))).toBe('ignore');
		expect(presenterKeyIntent(key({ key: 'a' }), false)).toBe('ignore');
	});

	it('ignores every other letter', () => {
		for (const k of ['b', 'x', 'z', 's', 'q', '1']) {
			expect(presenterKeyIntent(key({ key: k }), true)).toBe('ignore');
		}
	});
});

describe('presenterKeyIntent — Escape closes menus', () => {
	it('a plain Escape means close', () => {
		expect(presenterKeyIntent(key({ key: 'Escape' }))).toBe('close');
	});

	it('closes even from a typing target — so it dismisses the timer popover', () => {
		expect(
			presenterKeyIntent(key({ key: 'Escape', target: { tagName: 'INPUT' } as EventTarget }))
		).toBe('close');
	});

	it('a modified Escape is left to the browser', () => {
		expect(presenterKeyIntent(key({ key: 'Escape', ctrlKey: true }))).toBe('ignore');
		expect(presenterKeyIntent(key({ key: 'Escape', altKey: true }))).toBe('ignore');
	});
});

describe('presenterKeyIntent — never fires over typing or a chord', () => {
	it('bails while the caret is in a field (the timer input)', () => {
		expect(
			presenterKeyIntent(key({ key: 't', target: { tagName: 'INPUT' } as EventTarget }), true)
		).toBe('ignore');
		expect(
			presenterKeyIntent(
				key({ key: 'c', target: { isContentEditable: true } as unknown as EventTarget }),
				true
			)
		).toBe('ignore');
	});

	it('leaves Ctrl / Cmd / Alt combinations to the browser (Ctrl+A, Cmd+T…)', () => {
		expect(presenterKeyIntent(key({ key: 't', ctrlKey: true }), true)).toBe('ignore');
		expect(presenterKeyIntent(key({ key: 't', metaKey: true }), true)).toBe('ignore');
		expect(presenterKeyIntent(key({ key: 'a', altKey: true }), true)).toBe('ignore');
		expect(presenterKeyIntent(key({ key: 'c', ctrlKey: true }), true)).toBe('ignore');
	});

	it('respects an already-consumed event (defaultPrevented)', () => {
		expect(presenterKeyIntent(key({ key: 't', defaultPrevented: true }), true)).toBe('ignore');
	});
});

describe('presenterKeyIntent — total on garbage', () => {
	it('never throws and answers ignore for junk', () => {
		expect(presenterKeyIntent(key({ key: '' }), true)).toBe('ignore');
		expect(presenterKeyIntent({} as KeyboardEvent, true)).toBe('ignore');
		expect(presenterKeyIntent(key({ key: 'undefined' as unknown as string }))).toBe('ignore');
	});
});
