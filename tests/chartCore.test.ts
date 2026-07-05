import { describe, expect, it } from 'vitest';
import {
	bandScale,
	isBlank,
	linePath,
	linearScale,
	nearestIndex,
	niceTicks,
	numericExtent,
	seriesColor,
	stackExtent,
	stackSeries,
	timeTicks,
	toNumber,
	toTime,
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

describe('stackSeries', () => {
	const series = [
		{ key: 'a', value: 'a' },
		{ key: 'b', value: 'b' },
		{ key: 'c', value: 'c' }
	];

	it('accumulates positive segments into running [y0, y1] totals', () => {
		const [row] = stackSeries([{ a: 10, b: 20, c: 5 }], series);
		expect(row).toEqual([
			{ key: 'a', y0: 0, y1: 10, value: 10 },
			{ key: 'b', y0: 10, y1: 30, value: 20 },
			{ key: 'c', y0: 30, y1: 35, value: 5 }
		]);
	});

	it('treats a blank as 0 thickness — the stack above it is undisturbed', () => {
		const [row] = stackSeries([{ a: 10, b: null, c: 5 }], series);
		expect(row[1]).toEqual({ key: 'b', y0: 10, y1: 10, value: 0 }); // zero-thick
		expect(row[2]).toEqual({ key: 'c', y0: 10, y1: 15, value: 5 }); // keeps stacking
	});

	it('stacks negatives on a baseline independent of the positives', () => {
		const [row] = stackSeries([{ a: 10, b: -4, c: -6 }], series);
		expect(row[0]).toEqual({ key: 'a', y0: 0, y1: 10, value: 10 });
		expect(row[1]).toEqual({ key: 'b', y0: 0, y1: -4, value: -4 });
		expect(row[2]).toEqual({ key: 'c', y0: -4, y1: -10, value: -6 });
	});

	it('degenerates to plain [0, value] bars for a single series', () => {
		const stacks = stackSeries([{ a: 7 }, { a: -3 }], [{ key: 'a', value: 'a' }]);
		expect(stacks).toEqual([
			[{ key: 'a', y0: 0, y1: 7, value: 7 }],
			[{ key: 'a', y0: 0, y1: -3, value: -3 }]
		]);
	});

	it('yields one aligned segment array per row', () => {
		const stacks = stackSeries([{ a: 1, b: 2, c: 3 }, { a: 4, b: 5, c: 6 }], series);
		expect(stacks).toHaveLength(2);
		expect(stacks[0]).toHaveLength(3);
	});
});

describe('stackExtent', () => {
	it('spans the tallest stack and always includes 0', () => {
		const stacks = stackSeries([{ a: 10, b: 20, c: 5 }], [
			{ key: 'a', value: 'a' },
			{ key: 'b', value: 'b' },
			{ key: 'c', value: 'c' }
		]);
		expect(stackExtent(stacks)).toEqual([0, 35]);
	});

	it('reaches below zero for a negative stack', () => {
		const stacks = stackSeries([{ a: -4, b: -6 }], [
			{ key: 'a', value: 'a' },
			{ key: 'b', value: 'b' }
		]);
		expect(stackExtent(stacks)).toEqual([-10, 0]);
	});

	it('returns [0, 0] for empty input (still a valid baseline)', () => {
		expect(stackExtent([])).toEqual([0, 0]);
	});
});

describe('nearestIndex', () => {
	const xs = [0, 10, 20, 30, 40];

	it('finds an exact hit', () => {
		expect(nearestIndex(xs, 20)).toBe(2);
	});

	it('snaps to the closer neighbour between ticks', () => {
		expect(nearestIndex(xs, 12)).toBe(1); // closer to 10
		expect(nearestIndex(xs, 17)).toBe(2); // closer to 20
	});

	it('breaks an exact midpoint tie toward the lower index', () => {
		expect(nearestIndex(xs, 15)).toBe(1); // 10 vs 20, tie → 10
	});

	it('clamps out-of-range queries to the ends', () => {
		expect(nearestIndex(xs, -100)).toBe(0);
		expect(nearestIndex(xs, 999)).toBe(4);
	});

	it('handles a single element and an empty array', () => {
		expect(nearestIndex([7], 3)).toBe(0);
		expect(nearestIndex([], 3)).toBe(-1);
	});

	it('agrees with a linear scan on random-ish queries', () => {
		const scan = (arr: number[], p: number) => {
			let best = 0;
			for (let i = 1; i < arr.length; i++) {
				if (Math.abs(arr[i] - p) < Math.abs(arr[best] - p)) best = i;
			}
			return best;
		};
		const arr = [2, 5, 9, 14, 22, 31, 50];
		for (const p of [0, 3, 4, 7, 12, 18, 27, 40, 60]) {
			expect(nearestIndex(arr, p)).toBe(scan(arr, p));
		}
	});
});

describe('seriesColor', () => {
	it('prefers an explicit SeriesDef.color', () => {
		expect(seriesColor('#abc', 3)).toBe('#abc');
	});

	it('falls back to --chart-series-{i+1} with a palette default', () => {
		expect(seriesColor(undefined, 0)).toBe('var(--chart-series-1, #4c78a8)');
		expect(seriesColor(undefined, 1)).toBe('var(--chart-series-2, #f58518)');
	});

	it('wraps the palette default past eight series (var index keeps counting)', () => {
		expect(seriesColor(undefined, 8)).toBe('var(--chart-series-9, #4c78a8)');
	});
});

describe('toTime', () => {
	it('reads a Date, passes a number through, parses an ISO string', () => {
		const d = new Date(2024, 0, 15);
		expect(toTime(d)).toBe(d.getTime());
		expect(toTime(1700000000000)).toBe(1700000000000);
		expect(toTime('2024-01-01')).toBe(new Date('2024-01-01').getTime());
	});

	it('returns NaN for blanks and invalid dates', () => {
		expect(toTime(null)).toBeNaN();
		expect(toTime('')).toBeNaN();
		expect(toTime('not a date')).toBeNaN();
	});
});

describe('timeTicks', () => {
	// Local Date(y, m, d) constructors keep these robust across timezones — the
	// floor/step logic works in local calendar fields.
	const labels = (min: Date, max: Date, count?: number) => {
		const t = timeTicks(min.getTime(), max.getTime(), count);
		return { ticks: t.ticks, labels: t.ticks.map((v) => t.format(v)) };
	};

	it('a ~3-year span yields year ticks (no numeric spam)', () => {
		const { ticks, labels: ls } = labels(new Date(2021, 0, 1), new Date(2024, 0, 1));
		expect(ls.every((l) => /^\d{4}$/.test(l))).toBe(true);
		expect(ticks.length).toBeLessThanOrEqual(7);
		expect(ls).toContain('2022');
	});

	it('a ~6-month span yields month ticks', () => {
		const { labels: ls } = labels(new Date(2024, 0, 1), new Date(2024, 6, 1));
		expect(ls).toContain('Feb 2024');
		expect(ls.every((l) => /^[A-Z][a-z]{2} \d{4}$/.test(l))).toBe(true);
	});

	it('a ~2-week span yields day ticks — no overlapping spam', () => {
		const { ticks, labels: ls } = labels(new Date(2024, 0, 1), new Date(2024, 0, 15));
		expect(ticks.length).toBeLessThanOrEqual(8);
		expect(ls.every((l) => /^[A-Z][a-z]{2} \d{1,2}$/.test(l))).toBe(true);
		expect(ls[0]).toBe('Jan 1');
	});

	it('lands every tick on a local calendar boundary across a DST change', () => {
		// March 2024 contains the US spring-forward; calendar stepping (not fixed
		// ms) must keep each tick at local midnight regardless.
		const { ticks } = labels(new Date(2024, 2, 1), new Date(2024, 2, 31));
		expect(ticks.length).toBeGreaterThan(1);
		for (const t of ticks) {
			const d = new Date(t);
			expect(d.getHours()).toBe(0);
			expect(d.getMinutes()).toBe(0);
		}
	});

	it('keeps ticks ascending and inside [min, max]', () => {
		const min = new Date(2024, 0, 1).getTime();
		const max = new Date(2024, 5, 1).getTime();
		const { ticks } = timeTicks(min, max);
		for (let i = 1; i < ticks.length; i++) expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
		expect(ticks[0]).toBeGreaterThanOrEqual(min);
		expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(max);
	});

	it('degenerates to a single tick when min === max', () => {
		const t = new Date(2024, 3, 10).getTime();
		expect(timeTicks(t, t).ticks).toEqual([t]);
	});

	it('normalises reversed input', () => {
		const a = new Date(2024, 0, 1).getTime();
		const b = new Date(2024, 6, 1).getTime();
		expect(timeTicks(b, a).ticks).toEqual(timeTicks(a, b).ticks);
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
