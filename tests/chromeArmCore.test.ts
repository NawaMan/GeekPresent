import { describe, expect, it } from 'vitest';
import {
	chromeKeyIntent,
	isAdjustSaveChord,
	isChromeTypingTarget
} from '../src/lib/chrome/chromeArmCore';

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

describe('isChromeTypingTarget', () => {
	it('protects fields, not buttons', () => {
		expect(isChromeTypingTarget({ tagName: 'INPUT' } as unknown as EventTarget)).toBe(true);
		expect(isChromeTypingTarget({ tagName: 'BUTTON' } as unknown as EventTarget)).toBe(false);
		expect(isChromeTypingTarget(null)).toBe(false);
	});
});

describe('chromeKeyIntent', () => {
	it('Alt+. arms (by code or key)', () => {
		expect(chromeKeyIntent(key({ key: '.', code: 'Period', altKey: true }), false)).toBe('arm');
		expect(chromeKeyIntent(key({ key: 'Dead', code: 'Period', altKey: true }), false)).toBe(
			'arm'
		);
	});

	it('does not arm with Ctrl/Meta+Alt+.', () => {
		expect(
			chromeKeyIntent(key({ key: '.', code: 'Period', altKey: true, ctrlKey: true }), false)
		).toBe('ignore');
	});

	it('ignores letter mnemonics until armed', () => {
		expect(chromeKeyIntent(key({ key: 'a' }), false)).toBe('ignore');
		expect(chromeKeyIntent(key({ key: 't' }), false)).toBe('ignore');
	});

	it('maps the armed alphabet', () => {
		expect(chromeKeyIntent(key({ key: 'a' }), true)).toBe('annotate');
		expect(chromeKeyIntent(key({ key: 'A' }), true)).toBe('annotate');
		expect(chromeKeyIntent(key({ key: 'j' }), true)).toBe('adjust');
		expect(chromeKeyIntent(key({ key: 'z' }), true)).toBe('display');
		expect(chromeKeyIntent(key({ key: 'p' }), true)).toBe('present');
		// R is PRINT's ☰ mnemonic — not a chrome-arm letter.
		expect(chromeKeyIntent(key({ key: 'r' }), true)).toBe('ignore');
		expect(chromeKeyIntent(key({ key: 'd' }), true)).toBe('ignore');
		expect(chromeKeyIntent(key({ key: 'm' }), true)).toBe('more');
		expect(chromeKeyIntent(key({ key: 't' }), true)).toBe('toc');
	});

	it('Escape disarms / closes ☰ whether or not bars are Alt+.-armed', () => {
		expect(chromeKeyIntent(key({ key: 'Escape' }), true)).toBe('disarm');
		expect(chromeKeyIntent(key({ key: 'Escape' }), false)).toBe('disarm');
	});

	it('ignores mnemonics while typing even when armed', () => {
		const input = { tagName: 'INPUT' } as unknown as EventTarget;
		expect(chromeKeyIntent(key({ key: 'a', target: input }), true)).toBe('ignore');
	});
});

describe('isAdjustSaveChord', () => {
	it('claims Ctrl+S and Cmd+S while ADJUST is active', () => {
		expect(isAdjustSaveChord(key({ key: 's', ctrlKey: true }), true)).toBe(true);
		expect(isAdjustSaveChord(key({ key: 's', metaKey: true }), true)).toBe(true);
		// Capital S (Shift-lock, not Shift held) and non-Latin layouts via e.code.
		expect(isAdjustSaveChord(key({ key: 'S', ctrlKey: true }), true)).toBe(true);
		expect(isAdjustSaveChord(key({ key: 'ы', code: 'KeyS', ctrlKey: true }), true)).toBe(true);
	});

	it('stays inert when ADJUST is not active — the browser keeps Ctrl+S', () => {
		expect(isAdjustSaveChord(key({ key: 's', ctrlKey: true }), false)).toBe(false);
		expect(isAdjustSaveChord(key({ key: 's', metaKey: true }), false)).toBe(false);
	});

	it('leaves other chords to the browser', () => {
		// Bare S types a letter; Shift/Alt carry Save As and friends.
		expect(isAdjustSaveChord(key({ key: 's' }), true)).toBe(false);
		expect(isAdjustSaveChord(key({ key: 's', ctrlKey: true, shiftKey: true }), true)).toBe(false);
		expect(isAdjustSaveChord(key({ key: 's', ctrlKey: true, altKey: true }), true)).toBe(false);
		// A different letter under Ctrl is not ours.
		expect(isAdjustSaveChord(key({ key: 'a', ctrlKey: true }), true)).toBe(false);
	});

	it('fires even with the caret in a field — Ctrl+S means save, not the dialog', () => {
		const input = { tagName: 'INPUT' } as unknown as EventTarget;
		expect(isAdjustSaveChord(key({ key: 's', ctrlKey: true, target: input }), true)).toBe(true);
	});
});
