// Pure geometry & data functions for the chart family. No component imports,
// no DOM — everything here is independently unit-testable (tests/chartCore.test.ts),
// exactly as tableCore.ts is for the DataTable. This is where the bugs live
// (scales, ticks, paths), so it is the most thoroughly tested module.
//
// The pipeline (each stage its own $derived in the chart components, never merged):
//   data → per-series values → scales → geometry (paths/rects) → SVG
//
// Blank semantics mirror the DataTable's: null / undefined / '' are blanks, as
// are values that don't coerce to a finite number. Blanks are excluded from
// extents and break a line into a gap; they never plot as 0.

import type {
	Accessor,
	BandScale,
	BandScaleOptions,
	LinearScale,
	LinearScaleOptions,
	Point
} from './types';

/** null / undefined / '' — the same blank set as the DataTable. */
export function isBlank(value: unknown): boolean {
	return value === null || value === undefined || value === '';
}

/** Resolve a value out of a row via a field name or accessor function — the
 *  shared accessor convention (mirrors the DataTable's rowKey/sortValue). */
export function valueOf<T>(row: T, accessor: Accessor<T>): unknown {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return typeof accessor === 'function' ? accessor(row) : (row as any)?.[accessor];
}

/** Coerce to a number, returning NaN for anything that isn't a finite value —
 *  blanks, whitespace, and un-parseable strings all become NaN (never 0). */
export function toNumber(value: unknown): number {
	if (typeof value === 'number') return value;
	if (isBlank(value)) return NaN;
	const s = String(value).trim();
	return s === '' ? NaN : Number(s);
}

/**
 * [min, max] over the rows' accessor values, ignoring blanks and NaN. Returns
 * [NaN, NaN] when no comparable numbers are present — callers (linearScale)
 * fall back to a [0, 1] domain in that case.
 */
export function numericExtent<T>(rows: readonly T[], accessor: Accessor<T>): [number, number] {
	let min = Infinity;
	let max = -Infinity;
	for (const row of rows) {
		const n = toNumber(valueOf(row, accessor));
		if (Number.isNaN(n)) continue;
		if (n < min) min = n;
		if (n > max) max = n;
	}
	if (min === Infinity) return [NaN, NaN];
	return [min, max];
}

/** Round a raw step up to the nearest 1/2/5×10ⁿ — the "nice number" the axis
 *  will actually step by. */
function niceStep(rawStep: number): number {
	if (!(rawStep > 0)) return 1;
	const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
	const norm = rawStep / mag; // in [1, 10)
	const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
	return niceNorm * mag;
}

/** Decimal places implied by a step, so 0.1 + 0.2 doesn't surface as
 *  0.30000000000000004 in a tick label. */
function stepDecimals(step: number): number {
	if (!Number.isFinite(step) || step <= 0) return 0;
	const d = Math.ceil(-Math.log10(step));
	return d > 0 ? d : 0;
}

/** Kill -0 and floating-point fuzz on a tick value at the step's precision. */
function cleanTick(value: number, decimals: number): number {
	const rounded = Number(value.toFixed(decimals));
	return rounded === 0 ? 0 : rounded; // normalise -0 → 0
}

/**
 * "Nice" tick values covering [min, max]: round 1/2/5×10ⁿ steps where the first
 * tick ≤ min and the last ≥ max — e.g. [3, 987] → [0, 200, 400, 600, 800, 1000].
 * Handles the degenerate cases: non-finite input (all-blank data) falls back to
 * [0, 1]; min === max pads toward 0 so a constant series still gets a real axis;
 * negative-only and mixed-sign domains include 0 where it falls naturally.
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
	// All-blank / empty data: give a usable unit axis instead of NaN.
	if (!Number.isFinite(min) || !Number.isFinite(max)) {
		min = 0;
		max = 1;
	}
	if (min > max) [min, max] = [max, min];

	// A collapsed span (every value identical) can't be niced directly — pad it
	// toward zero so the single value sits at one edge of a sensible axis.
	if (min === max) {
		if (min === 0) max = 1;
		else if (min > 0) min = 0;
		else max = 0;
	}

	const step = niceStep((max - min) / Math.max(1, count));
	if (!(step > 0)) return [min, max];

	const decimals = stepDecimals(step);
	const niceMin = Math.floor(min / step) * step;
	const niceMax = Math.ceil(max / step) * step;

	const ticks: number[] = [];
	// The 1e-9 slack absorbs float error so the closing tick isn't dropped.
	for (let v = niceMin; v <= niceMax + step * 1e-9; v += step) {
		ticks.push(cleanTick(v, decimals));
		if (ticks.length > 1000) break; // paranoia guard against a runaway loop
	}
	return ticks;
}

/**
 * Linear scale factory: maps a numeric domain onto a pixel range and carries
 * its own nice tick values. NaN-safe — a blank/uncoercible value maps to NaN so
 * the caller can skip or gap it. `zero: true` extends the domain to include 0
 * (bars always pass it); `nice: true` (default) snaps the domain to the tick
 * bounds. A non-finite domain falls back to [0, 1].
 */
export function linearScale(
	domain: [number, number],
	range: [number, number],
	options: LinearScaleOptions = {}
): LinearScale {
	const { nice = true, zero = false, ticks: count = 5 } = options;

	let [d0, d1] = domain;
	if (!Number.isFinite(d0) || !Number.isFinite(d1)) {
		d0 = 0;
		d1 = 1;
	}
	if (zero) {
		d0 = Math.min(0, d0);
		d1 = Math.max(0, d1);
	}

	const allTicks = niceTicks(d0, d1, count);
	const domainMin = nice ? allTicks[0] : d0;
	const domainMax = nice ? allTicks[allTicks.length - 1] : d1;

	// When the domain isn't niced, some tick values may fall outside it — keep
	// only the ones the axis can actually place.
	const eps = 1e-9;
	const visibleTicks = nice
		? allTicks
		: allTicks.filter((t) => t >= domainMin - eps && t <= domainMax + eps);

	const [r0, r1] = range;
	const span = domainMax - domainMin || 1; // avoid divide-by-zero on a flat domain

	const map = (value: unknown): number => {
		const n = toNumber(value);
		if (Number.isNaN(n)) return NaN;
		return r0 + ((n - domainMin) / span) * (r1 - r0);
	};

	return { map, ticks: visibleTicks, domain: [domainMin, domainMax] };
}

/** Stable string key for a band-domain value so equal categories (and equal
 *  dates) collapse to one band regardless of object identity. */
function bandKey(value: unknown): string {
	if (value instanceof Date) return 'd:' + value.getTime();
	if (value !== null && typeof value === 'object') return 'o:' + JSON.stringify(value);
	return 't:' + String(value);
}

/**
 * Band scale factory for categorical x (bars): the domain is the distinct
 * accessor values in first-seen order (the caller controls order by sorting
 * rows — same philosophy as the table's pipeline). `map` returns a band's start
 * pixel; `bandwidth` its width; `step` the band-plus-gap pitch. A value outside
 * the domain maps to NaN. Padding fractions mirror d3's band scale.
 */
export function bandScale(
	values: Iterable<unknown>,
	range: [number, number],
	options: BandScaleOptions = {}
): BandScale {
	const { paddingInner = 0.15, paddingOuter = 0.1 } = options;

	const domain: unknown[] = [];
	const index = new Map<string, number>();
	for (const v of values) {
		const key = bandKey(v);
		if (!index.has(key)) {
			index.set(key, domain.length);
			domain.push(v);
		}
	}

	const [r0, r1] = range;
	const n = domain.length;
	// d3's step formula: total range spread across n bands and their gaps.
	const denom = n - paddingInner + paddingOuter * 2;
	const step = n > 0 && denom > 0 ? (r1 - r0) / denom : 0;
	const bandwidth = step * (1 - paddingInner);
	const start = r0 + step * paddingOuter;

	const map = (value: unknown): number => {
		const i = index.get(bandKey(value));
		return i === undefined ? NaN : start + i * step;
	};

	return { map, bandwidth, step, domain };
}

/** Round a coordinate to 2dp so path strings stay short and stable. */
function coord(n: number): number {
	return Math.round(n * 100) / 100;
}

/**
 * Build an SVG path `d` from points in order. A point with a non-finite x or y
 * (a blank/NaN value) breaks the line: the pen lifts and a new `M` sub-path
 * starts at the next finite point — a gap, never a dip through 0. Returns '' for
 * no drawable points.
 */
export function linePath(points: readonly Point[]): string {
	let d = '';
	let penDown = false;
	for (const p of points) {
		if (p == null || !Number.isFinite(p.x) || !Number.isFinite(p.y)) {
			penDown = false; // a gap — lift the pen
			continue;
		}
		if (!penDown) {
			d += `${d ? ' ' : ''}M ${coord(p.x)} ${coord(p.y)}`;
			penDown = true;
		} else {
			d += ` L ${coord(p.x)} ${coord(p.y)}`;
		}
	}
	return d;
}
