import { describe, expect, it } from 'vitest';
import {
	DEFAULT_POINTER_SIZE,
	normalizeShape,
	normalizeSize,
	pointerOffset,
	readPointerParam,
	resolveLivePointer
} from '../src/lib/pointer/livePointerCore';

const q = (s: string) => new URLSearchParams(s);

describe('readPointerParam', () => {
	it('is null when the URL says nothing (a nav link must not revoke the choice)', () => {
		expect(readPointerParam(q(''))).toBeNull();
		expect(readPointerParam(null)).toBeNull();
		expect(readPointerParam(undefined)).toBeNull();
	});

	it('reads the on spellings', () => {
		expect(readPointerParam(q('pointer'))).toBe(true);
		expect(readPointerParam(q('pointer=on'))).toBe(true);
		expect(readPointerParam(q('pointer=1'))).toBe(true);
	});

	it('reads the off spellings, any case', () => {
		expect(readPointerParam(q('pointer=off'))).toBe(false);
		expect(readPointerParam(q('pointer=FALSE'))).toBe(false);
		expect(readPointerParam(q('pointer=0'))).toBe(false);
	});
});

describe('resolveLivePointer', () => {
	it('is off by default', () => {
		expect(resolveLivePointer(null, false)).toBe(false);
	});

	it('follows the deck when the speaker has no choice recorded', () => {
		expect(resolveLivePointer(null, true)).toBe(true);
	});

	it('lets the speaker outrank the deck either way', () => {
		expect(resolveLivePointer(false, true)).toBe(false);
		expect(resolveLivePointer(true, false)).toBe(true);
	});
});

describe('normalizeShape / normalizeSize', () => {
	it('keeps a known shape and falls back to arrow', () => {
		expect(normalizeShape('dot')).toBe('dot');
		expect(normalizeShape('ring')).toBe('ring');
		expect(normalizeShape('arrow')).toBe('arrow');
		expect(normalizeShape('hand')).toBe('arrow');
		expect(normalizeShape(undefined)).toBe('arrow');
	});

	it('defaults junk sizes and clamps the rest', () => {
		expect(DEFAULT_POINTER_SIZE).toBe(40);
		expect(normalizeSize(undefined)).toBe(DEFAULT_POINTER_SIZE);
		expect(normalizeSize('abc')).toBe(DEFAULT_POINTER_SIZE);
		expect(normalizeSize(-5)).toBe(DEFAULT_POINTER_SIZE);
		expect(normalizeSize(Infinity)).toBe(DEFAULT_POINTER_SIZE);
		expect(normalizeSize(2)).toBe(8);
		expect(normalizeSize(5000)).toBe(200);
		expect(normalizeSize(40)).toBe(40);
	});
});

describe('pointerOffset', () => {
	it('puts the arrow tip (3,3 of 24) on the mouse', () => {
		expect(pointerOffset('arrow', 24)).toEqual([-3, -3]);
		expect(pointerOffset('arrow', 48)).toEqual([-6, -6]);
	});

	it('centres a dot or a ring on the mouse', () => {
		expect(pointerOffset('dot', 30)).toEqual([-15, -15]);
		expect(pointerOffset('ring', 20)).toEqual([-10, -10]);
	});
});
