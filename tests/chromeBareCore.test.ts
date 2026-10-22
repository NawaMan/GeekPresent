import { describe, expect, it } from 'vitest';
import { readBareParam, resolveChromeBare } from '../src/lib/chrome/chromeBareCore';

/*
  Bare chrome — both bars hidden completely. The speaker's sticky ?bare outranks a live
  presenter console, which outranks the deck's hideChrome prop.
*/

const q = (s: string) => new URLSearchParams(s);

describe('readBareParam', () => {
	it('reads an absent flag as no choice, so the next slide keeps the last one', () => {
		expect(readBareParam(q(''))).toBeNull();
		expect(readBareParam(q('clean'))).toBeNull();
		expect(readBareParam(null)).toBeNull();
		expect(readBareParam(undefined)).toBeNull();
	});

	it('reads a bare flag and its on spellings as on', () => {
		expect(readBareParam(q('bare'))).toBe(true);
		expect(readBareParam(q('bare=on'))).toBe(true);
		expect(readBareParam(q('bare=1'))).toBe(true);
		expect(readBareParam(q('bare=yes'))).toBe(true);
	});

	it('reads off / false / 0 as off, ignoring case and spaces', () => {
		expect(readBareParam(q('bare=off'))).toBe(false);
		expect(readBareParam(q('bare=FALSE'))).toBe(false);
		expect(readBareParam(q('bare=%200%20'))).toBe(false);
	});
});

describe('resolveChromeBare', () => {
	it('is off by default', () => {
		expect(resolveChromeBare(null, false, false)).toBe(false);
	});

	it('goes bare while a presenter console is live', () => {
		expect(resolveChromeBare(null, true, false)).toBe(true);
	});

	it('goes bare when the deck asks for it', () => {
		expect(resolveChromeBare(null, false, true)).toBe(true);
	});

	it('lets a sticky ?bare=off keep the bars, even with a console live and the deck prop set', () => {
		expect(resolveChromeBare(false, true, true)).toBe(false);
	});

	it('lets a sticky ?bare hide the bars with no console and no deck prop', () => {
		expect(resolveChromeBare(true, false, false)).toBe(true);
	});

	it('treats junk inputs as not set', () => {
		// @ts-expect-error — a corrupt value must fall through, not throw or arm
		expect(resolveChromeBare('yes', 'no', 1)).toBe(false);
	});
});
