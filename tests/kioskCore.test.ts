import { describe, expect, it } from 'vitest';
import {
	DEFAULT_PAGE_MS,
	DEFAULT_STEP_MS,
	DEFAULT_WPM,
	MIN_PACE_MS,
	clampPaceMs,
	dwellProgress,
	kioskAction,
	msToSeconds,
	noteDwellMs,
	noteTextFrom,
	pageDwellMs,
	readKioskParam,
	resolveCanKiosk,
	secondsToMs,
	wordsIn
} from '../src/lib/kiosk/kioskCore';

describe('readKioskParam', () => {
	it('treats bare ?kiosk and on/1 as enable', () => {
		expect(readKioskParam(new URLSearchParams('kiosk'))).toBe(true);
		expect(readKioskParam(new URLSearchParams('kiosk=on'))).toBe(true);
		expect(readKioskParam(new URLSearchParams('kiosk=1'))).toBe(true);
	});

	it('treats off/false/0 as disable', () => {
		expect(readKioskParam(new URLSearchParams('kiosk=off'))).toBe(false);
		expect(readKioskParam(new URLSearchParams('kiosk=false'))).toBe(false);
		expect(readKioskParam(new URLSearchParams('kiosk=0'))).toBe(false);
	});

	it('is null when absent — does not revoke sticky', () => {
		expect(readKioskParam(new URLSearchParams(''))).toBe(null);
		expect(readKioskParam(null)).toBe(null);
		expect(readKioskParam(undefined)).toBe(null);
	});
});

describe('resolveCanKiosk', () => {
	it('dev always offers', () => {
		expect(resolveCanKiosk(true, false, false)).toBe(true);
	});

	it('sticky outranks the deck', () => {
		expect(resolveCanKiosk(false, true, false)).toBe(true);
		expect(resolveCanKiosk(false, false, true)).toBe(false);
	});

	it('deck prop is the production offer', () => {
		expect(resolveCanKiosk(false, null, true)).toBe(true);
		expect(resolveCanKiosk(false, null, false)).toBe(false);
	});
});

describe('clampPaceMs / seconds', () => {
	it('floors, caps, and rejects junk', () => {
		expect(clampPaceMs(100, DEFAULT_STEP_MS)).toBe(MIN_PACE_MS);
		expect(clampPaceMs(999_999, DEFAULT_STEP_MS)).toBe(120_000);
		expect(clampPaceMs(NaN, 3000)).toBe(3000);
		expect(clampPaceMs('nope', DEFAULT_PAGE_MS)).toBe(DEFAULT_PAGE_MS);
	});

	it('round-trips seconds for the dialog', () => {
		expect(msToSeconds(2000)).toBe(2);
		expect(msToSeconds(2500)).toBe(2.5);
		expect(secondsToMs(2, DEFAULT_STEP_MS)).toBe(2000);
		expect(secondsToMs('6', DEFAULT_PAGE_MS)).toBe(6000);
		expect(secondsToMs(-1, DEFAULT_PAGE_MS)).toBe(DEFAULT_PAGE_MS);
	});
});

describe('wordsIn / note dwell', () => {
	it('counts words and estimates ms at wpm', () => {
		expect(wordsIn('')).toBe(0);
		expect(wordsIn('  one   two three ')).toBe(3);
		// 150 words at 150 wpm → 60_000 ms
		const text = Array.from({ length: 150 }, () => 'word').join(' ');
		expect(noteDwellMs(text, DEFAULT_WPM)).toBe(60_000);
		expect(noteDwellMs('', DEFAULT_WPM)).toBe(0);
	});

	it('pageDwellMs uses max(pageMs, note) when notes are on', () => {
		expect(pageDwellMs({ pageMs: 6000, useNotes: false, noteText: 'a b c d e f' })).toBe(6000);
		// 6 words at 150 wpm = 2.4s → floor 6s wins
		expect(pageDwellMs({ pageMs: 6000, useNotes: true, noteText: 'a b c d e f' })).toBe(6000);
		// 300 words → 2 minutes > 6s
		const long = Array.from({ length: 300 }, () => 'w').join(' ');
		expect(pageDwellMs({ pageMs: 6000, useNotes: true, noteText: long })).toBe(120_000);
	});
});

describe('kioskAction — Space semantics + anim gate', () => {
	it('waits while animations are busy', () => {
		expect(kioskAction({ animBusy: true, hasNextStep: true })).toBe('wait');
		expect(kioskAction({ animBusy: true, hasNextStep: false })).toBe('wait');
	});

	it('reveals while a build has steps, else pages', () => {
		expect(kioskAction({ animBusy: false, hasNextStep: true })).toBe('reveal');
		expect(kioskAction({ animBusy: false, hasNextStep: false })).toBe('page');
	});
});

describe('noteTextFrom / dwellProgress', () => {
	it('reads .note text and is total for junk', () => {
		const root = document.createElement('div');
		root.innerHTML = '<div class="note"><p>Hello   world</p></div>';
		expect(noteTextFrom(root)).toBe('Hello world');
		expect(noteTextFrom(null)).toBe('');
		expect(noteTextFrom(document.createElement('div'))).toBe('');
	});

	it('clamps progress 0..1', () => {
		expect(dwellProgress(0, 1000)).toBe(0);
		expect(dwellProgress(500, 1000)).toBe(0.5);
		expect(dwellProgress(2000, 1000)).toBe(1);
		expect(dwellProgress(10, 0)).toBe(0);
		expect(dwellProgress(NaN, 1000)).toBe(0);
	});
});
