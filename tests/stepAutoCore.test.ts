import { describe, expect, it } from 'vitest';
import {
	backHoldAfter,
	readAutoParam,
	resolveStepWait,
	secondsLeft,
	stepAutoLevel,
	stepTimerArmed
} from '../src/lib/auto/stepAutoCore';

const q = (s: string) => new URLSearchParams(s);

describe('readAutoParam', () => {
	it('reads the three levels', () => {
		expect(readAutoParam(q('auto=all'))).toBe('all');
		expect(readAutoParam(q('auto=steps'))).toBe('steps');
		expect(readAutoParam(q('auto=off'))).toBe('off');
		expect(readAutoParam(q('auto=%20OFF%20'))).toBe('off');
	});

	it('says nothing when absent, bare or unknown', () => {
		expect(readAutoParam(q(''))).toBeNull();
		expect(readAutoParam(q('auto'))).toBeNull();
		expect(readAutoParam(q('auto=yes'))).toBeNull();
		expect(readAutoParam(null)).toBeNull();
		expect(readAutoParam(undefined)).toBeNull();
	});
});

describe('resolveStepWait', () => {
	it('is 0 (wait for ever) when nobody set one', () => {
		expect(resolveStepWait({})).toBe(0);
		expect(resolveStepWait({ deck: undefined, slide: undefined, build: undefined })).toBe(0);
	});

	it('lets the narrowest level win', () => {
		expect(resolveStepWait({ deck: 5000 })).toBe(5000);
		expect(resolveStepWait({ deck: 5000, slide: 3000 })).toBe(3000);
		expect(resolveStepWait({ deck: 5000, slide: 3000, build: 1000 })).toBe(1000);
	});

	it('lets 0 opt a slide or a build out of a wider wait', () => {
		expect(resolveStepWait({ deck: 5000, slide: 0 })).toBe(0);
		expect(resolveStepWait({ deck: 5000, build: 0 })).toBe(0);
		expect(resolveStepWait({ deck: 5000, slide: 0, build: 2000 })).toBe(2000);
	});

	it('treats a number that is not a wait as off, and a non-number as unset', () => {
		expect(resolveStepWait({ deck: 5000, build: -1 })).toBe(0);
		expect(resolveStepWait({ deck: 5000, build: NaN })).toBe(0);
		expect(resolveStepWait({ deck: 5000, build: Infinity })).toBe(0);
		expect(resolveStepWait({ deck: 5000, build: '100', slide: null })).toBe(5000);
		expect(resolveStepWait(null as never)).toBe(0);
	});
});

describe('stepAutoLevel', () => {
	it('is manual where the author gave no wait: nothing to count or toggle', () => {
		expect(stepAutoLevel({})).toBe('manual');
		expect(stepAutoLevel({ waitMs: 0, held: true })).toBe('manual');
		expect(stepAutoLevel({ waitMs: NaN })).toBe('manual');
	});

	it('is normal with a wait, pause when the viewer holds it', () => {
		expect(stepAutoLevel({ waitMs: 5000 })).toBe('normal');
		expect(stepAutoLevel({ waitMs: 5000, held: true })).toBe('pause');
	});

	it('is kiosk while a kiosk is live, whatever else', () => {
		expect(stepAutoLevel({ kiosk: true })).toBe('kiosk');
		expect(stepAutoLevel({ kiosk: true, waitMs: 5000, held: true, forced: true })).toBe('kiosk');
	});

	it('is forced off in a window that must not move by itself', () => {
		expect(stepAutoLevel({ waitMs: 5000, forced: true })).toBe('manual');
		expect(stepAutoLevel({ waitMs: 5000, forced: true, held: true })).toBe('manual');
	});
});

describe('stepTimerArmed', () => {
	it('only in normal, with a step left, once the last one has settled', () => {
		expect(stepTimerArmed('normal', { hasNext: true, busy: false })).toBe(true);
		expect(stepTimerArmed('normal', { hasNext: true })).toBe(true);
		expect(stepTimerArmed('normal', { hasNext: true, busy: true })).toBe(false);
	});

	it('never on a spent build, so never the page turn', () => {
		expect(stepTimerArmed('normal', { hasNext: false, busy: false })).toBe(false);
		expect(stepTimerArmed('normal', null)).toBe(false);
		expect(stepTimerArmed('normal', undefined)).toBe(false);
	});

	it('never in pause, manual or kiosk', () => {
		for (const level of ['pause', 'manual', 'kiosk'] as const)
			expect(stepTimerArmed(level, { hasNext: true, busy: false })).toBe(false);
	});
});

describe('backHoldAfter', () => {
	it('holds after a step back and releases on a step forward', () => {
		expect(backHoldAfter(2, 1)).toBe(true);
		expect(backHoldAfter(1, 2)).toBe(false);
	});

	it('has no opinion on first sight or no movement', () => {
		expect(backHoldAfter(undefined, 0)).toBeUndefined();
		expect(backHoldAfter(1, 1)).toBeUndefined();
		expect(backHoldAfter(1, undefined)).toBeUndefined();
	});
});

describe('secondsLeft', () => {
	it('rounds up, so the last second reads 1 and never 0 while time remains', () => {
		expect(secondsLeft(5000)).toBe(5);
		expect(secondsLeft(4200)).toBe(5);
		expect(secondsLeft(1)).toBe(1);
		expect(secondsLeft(0)).toBe(0);
		expect(secondsLeft(-5)).toBe(0);
		expect(secondsLeft(NaN)).toBe(0);
	});
});
