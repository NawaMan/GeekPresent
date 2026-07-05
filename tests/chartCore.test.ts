import { describe, expect, it } from 'vitest';
import {
	bandScale,
	isBlank,
	linePath,
	linearScale,
	niceTicks,
	numericExtent,
	toNumber,
	valueOf
} from '../src/lib/chart/chartCore';

describe('isBlank / toNumber', () => {
	it('treats null, undefined and empty string as blank', () => {
		expect(isBlank(null)).toBe(true);
		expect(isBlank(undefined)).toBe(true);
		expect(isBlank('')).toBe(true);
		expect(isBlank(0)).toBe(false);
		expect(isBlank('x')).toBe(false);
		expect(isBlank(false)).toBe(false);
	});

	it('coerces to a finite number or NaN — never silently 0', () => {
		expect(toNumber(42)).toBe(42);
		expect(toNumber('3.5')).toBe(3.5);
		expect(toNumber('  7 ')).toBe(7);
		expect(toNumber(null)).toBeNaN();
		expect(toNumber('')).toBeNaN();
		expect(toNumber('   ')).toBeNaN();
		expect(toNumber('abc')).toBeNaN();
		expect(toNumber(-0)).toBe(-0);
	});
});

describe('valueOf', () => {
	it('resolves a field name or an accessor function', () => {
		const row = { a: 1, b: { c: 2 } };
		expect(valueOf(row, 'a')).toBe(1);
		expect(valueOf(row, (r) => r.b.c)).toBe(2);
	});

	it('is null-safe on missing rows / fields', () => {
		expect(valueOf(null as unknown as { a: number }, 'a')).toBeUndefined();
		expect(valueOf({ a: 1 }, 'missing')).toBeUndefined();
	});
});

describe('numericExtent', () => {
	const rows = [{ v: 3 }, { v: 'N/A' }, { v: null }, { v: 987 }, { v: '' }, { v: 50 }];

	it('returns [min, max] ignoring blanks and non-numbers', () => {
		expect(numericExtent(rows, 'v')).toEqual([3, 987]);
	});

	it('works through an accessor function', () => {
		expect(numericExtent([{ n: '10' }, { n: '2' }], (r) => r.n)).toEqual([2, 10]);
	});

	it('returns [NaN, NaN] when nothing is comparable', () => {
		const [lo, hi] = numericExtent([{ v: null }, { v: 'x' }, { v: '' }], 'v');
		expect(lo).toBeNaN();
		expect(hi).toBeNaN();
	});

	it('handles negative-only and mixed-sign data', () => {
		expect(numericExtent([{ v: -100 }, { v: -3 }], 'v')).toEqual([-100, -3]);
		expect(numericExtent([{ v: -30 }, { v: 70 }, { v: 0 }], 'v')).toEqual([-30, 70]);
	});
});

describe('niceTicks', () => {
	it('covers [3, 987] with round 200-steps 0…1000 (the classic case)', () => {
		expect(niceTicks(3, 987)).toEqual([0, 200, 400, 600, 800, 1000]);
	});

	it('produces a first tick ≤ min and a last tick ≥ max', () => {
		const ticks = niceTicks(17, 63);
		expect(ticks[0]).toBeLessThanOrEqual(17);
		expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(63);
	});

	it('falls back to [0, 1] for all-blank / non-finite input', () => {
		expect(niceTicks(NaN, NaN)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
	});

	it('pads a collapsed span (min === max) toward zero — no NaN, no collapse', () => {
		const ticks = niceTicks(42, 42);
		expect(ticks[0]).toBe(0);
		expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(42);
		expect(ticks.length).toBeGreaterThan(1);
		expect(ticks.some(Number.isNaN)).toBe(false);
	});

	it('pads a negative constant toward zero', () => {
		const ticks = niceTicks(-42, -42);
		expect(ticks[ticks.length - 1]).toBe(0);
		expect(ticks[0]).toBeLessThanOrEqual(-42);
	});

	it('pads a zero constant to a unit axis', () => {
		expect(niceTicks(0, 0)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
	});

	it('handles negative-only domains, including 0 where it falls', () => {
		const ticks = niceTicks(-100, -3);
		expect(ticks[0]).toBeLessThanOrEqual(-100);
		expect(ticks).toContain(0);
	});

	it('handles mixed-sign domains with 0 among the ticks', () => {
		expect(niceTicks(-30, 70)).toContain(0);
	});

	it('normalises reversed input (min > max)', () => {
		expect(niceTicks(987, 3)).toEqual([0, 200, 400, 600, 800, 1000]);
	});

	it('keeps small fractional steps clean (no float fuzz)', () => {
		expect(niceTicks(0, 0.5)).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5]);
	});
});

describe('linearScale', () => {
	it('maps domain endpoints onto the range', () => {
		const s = linearScale([0, 100], [0, 400], { nice: false });
		expect(s.map(0)).toBe(0);
		expect(s.map(100)).toBe(400);
		expect(s.map(50)).toBe(200);
	});

	it('maps a blank/uncoercible value to NaN (not 0)', () => {
		const s = linearScale([0, 100], [0, 400]);
		expect(s.map(null)).toBeNaN();
		expect(s.map('')).toBeNaN();
		expect(s.map('x')).toBeNaN();
	});

	it('nices the domain out to round tick bounds by default', () => {
		const s = linearScale([3, 987], [0, 400]);
		expect(s.domain).toEqual([0, 1000]);
		expect(s.ticks).toEqual([0, 200, 400, 600, 800, 1000]);
		expect(s.map(0)).toBe(0);
		expect(s.map(1000)).toBe(400);
	});

	it('zero:true forces the domain to include 0 even for all-positive data', () => {
		const s = linearScale([500, 900], [0, 400], { zero: true });
		expect(s.domain[0]).toBe(0);
		expect(s.map(0)).toBe(0);
	});

	it('zero:true extends an all-negative domain up to 0', () => {
		const s = linearScale([-90, -10], [0, 400], { zero: true });
		expect(s.domain[1]).toBe(0);
	});

	it('falls back to a [0, 1] domain when the extent is non-finite', () => {
		const s = linearScale([NaN, NaN], [0, 400]);
		expect(s.domain).toEqual([0, 1]);
		expect(s.map(0)).toBe(0);
		expect(s.map(1)).toBe(400);
	});

	it('does not collapse or NaN on a flat domain (min === max)', () => {
		const s = linearScale([42, 42], [0, 400]);
		expect(Number.isNaN(s.map(42))).toBe(false);
		expect(s.domain[0]).not.toBe(s.domain[1]);
	});

	it('inverts the range for a top-down y axis', () => {
		const s = linearScale([0, 100], [400, 0], { nice: false });
		expect(s.map(0)).toBe(400);
		expect(s.map(100)).toBe(0);
	});
});

describe('bandScale', () => {
	it('builds a first-seen-order domain, dropping duplicates', () => {
		const s = bandScale(['b', 'a', 'b', 'c', 'a'], [0, 300]);
		expect(s.domain).toEqual(['b', 'a', 'c']);
	});

	it('spaces bands across the range with a positive bandwidth', () => {
		const s = bandScale(['a', 'b', 'c'], [0, 300]);
		expect(s.bandwidth).toBeGreaterThan(0);
		expect(s.step).toBeGreaterThan(s.bandwidth);
		// bands are ordered left-to-right and fit inside the range
		expect(s.map('a')).toBeLessThan(s.map('b'));
		expect(s.map('b')).toBeLessThan(s.map('c'));
		expect(s.map('a')).toBeGreaterThanOrEqual(0);
		expect(s.map('c') + s.bandwidth).toBeLessThanOrEqual(300 + 1e-9);
	});

	it('maps a value outside the domain to NaN', () => {
		const s = bandScale(['a', 'b'], [0, 300]);
		expect(s.map('z')).toBeNaN();
	});

	it('handles a single category without collapsing', () => {
		const s = bandScale(['only'], [0, 300]);
		expect(s.domain).toEqual(['only']);
		expect(s.bandwidth).toBeGreaterThan(0);
		expect(Number.isNaN(s.map('only'))).toBe(false);
	});

	it('handles an empty input (no bands, NaN map)', () => {
		const s = bandScale([], [0, 300]);
		expect(s.domain).toEqual([]);
		expect(s.bandwidth).toBe(0);
		expect(s.map('anything')).toBeNaN();
	});

	it('treats equal Date values as one band', () => {
		const s = bandScale([new Date('2024-01-01'), new Date('2024-01-01')], [0, 300]);
		expect(s.domain).toHaveLength(1);
		expect(Number.isNaN(s.map(new Date('2024-01-01')))).toBe(false);
	});

	it('respects custom padding', () => {
		const tight = bandScale(['a', 'b', 'c'], [0, 300], { paddingInner: 0, paddingOuter: 0 });
		expect(tight.bandwidth).toBe(tight.step);
		expect(tight.map('a')).toBe(0);
	});
});

describe('linePath', () => {
	it('draws a single connected sub-path for all-finite points', () => {
		const d = linePath([
			{ x: 0, y: 10 },
			{ x: 10, y: 20 },
			{ x: 20, y: 5 }
		]);
		expect(d).toBe('M 0 10 L 10 20 L 20 5');
	});

	it('breaks into two sub-paths across a NaN y — a gap, not a dip to 0', () => {
		const d = linePath([
			{ x: 0, y: 10 },
			{ x: 10, y: NaN },
			{ x: 20, y: 30 }
		]);
		// the blank point is absent entirely — the line never routes through y=0
		expect(d).toBe('M 0 10 M 20 30');
		expect(d).not.toContain('L'); // no segment drawn across the gap
		// exactly two moves = two sub-paths = a visible gap
		expect(d.match(/M/g)).toHaveLength(2);
	});

	it('gaps on a non-finite x too', () => {
		const d = linePath([
			{ x: 0, y: 1 },
			{ x: Infinity, y: 2 },
			{ x: 2, y: 3 }
		]);
		expect(d.match(/M/g)).toHaveLength(2);
	});

	it('starts a fresh sub-path after a leading gap', () => {
		const d = linePath([
			{ x: 0, y: NaN },
			{ x: 10, y: 5 },
			{ x: 20, y: 6 }
		]);
		expect(d).toBe('M 10 5 L 20 6');
	});

	it('rounds coordinates to keep the path short', () => {
		expect(linePath([{ x: 1.23456, y: 7.89123 }])).toBe('M 1.23 7.89');
	});

	it('returns an empty string when there is nothing drawable', () => {
		expect(linePath([])).toBe('');
		expect(linePath([{ x: NaN, y: NaN }])).toBe('');
	});
});
