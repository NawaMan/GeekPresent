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

/**
 * One row's stacked segments, one entry per series in the given order. `y0` is
 * the running base the segment sits on; `y1` its top (`y0 + value`). A blank /
 * uncoercible value contributes **0** — the segment has zero thickness and
 * everything above it keeps stacking uninterrupted. This is the deliberate
 * contrast with lines, where a blank breaks the line into a gap: a stacked bar
 * is a running total, so a missing part is "nothing added here", not "the total
 * is unknown". Positive and negative segments stack on independent baselines so
 * a negative value hangs below zero without eating into the positive stack.
 */
export interface StackSegment {
	key: string; // the series' key
	y0: number; // base value this segment starts at
	y1: number; // top value (y0 + the series value, 0 for a blank)
	value: number; // the raw series value (0 for a blank)
}

/**
 * Stack each row's series values into cumulative [y0, y1] segments (pure — the
 * caller maps them through a linearScale to pixels). Positive and negative
 * values accumulate on separate baselines from 0. Blanks contribute 0 (see
 * StackSegment). Returns one StackSegment[] per row, aligned to `rows`.
 */
export function stackSeries<T>(
	rows: readonly T[],
	series: readonly { key: string; value: Accessor<T> }[]
): StackSegment[][] {
	return rows.map((row) => {
		let posBase = 0;
		let negBase = 0;
		const segments: StackSegment[] = [];
		for (const s of series) {
			const raw = toNumber(valueOf(row, s.value));
			const value = Number.isFinite(raw) ? raw : 0; // blank → 0, keeps stacking
			if (value < 0) {
				const y0 = negBase;
				negBase += value;
				segments.push({ key: s.key, y0, y1: negBase, value });
			} else {
				const y0 = posBase;
				posBase += value;
				segments.push({ key: s.key, y0, y1: posBase, value });
			}
		}
		return segments;
	});
}

/**
 * The total vertical extent of a set of stacks — [min, max] across every
 * segment's y0/y1, always including 0 (a stacked/grouped bar chart has a zero
 * baseline). Feeds the y linearScale so the axis covers the tallest stack.
 */
export function stackExtent(stacks: readonly StackSegment[][]): [number, number] {
	let min = 0;
	let max = 0;
	for (const row of stacks) {
		for (const seg of row) {
			if (seg.y0 < min) min = seg.y0;
			if (seg.y1 < min) min = seg.y1;
			if (seg.y0 > max) max = seg.y0;
			if (seg.y1 > max) max = seg.y1;
		}
	}
	return [min, max];
}

/** Fallback hex palette behind the --chart-series-N custom properties, so a
 *  series still has a distinct color if the deck sets no theme vars. Mirrors the
 *  eight-swatch palette named in CHART-1's theming section. */
const SERIES_PALETTE = [
	'#4c78a8',
	'#f58518',
	'#54a24b',
	'#e45756',
	'#72b7b2',
	'#eeca3b',
	'#b279a2',
	'#ff9da6'
];

/**
 * The stroke/fill for series index `i`: an explicit `SeriesDef.color` wins;
 * otherwise `--chart-series-{i+1}` with the built-in palette as the fallback, so
 * colors are stable per series index and overridable both per-series and via
 * theme vars. `i` wraps around the eight-swatch palette.
 */
export function seriesColor(color: string | undefined, i: number): string {
	if (color) return color;
	const n = ((i % SERIES_PALETTE.length) + SERIES_PALETTE.length) % SERIES_PALETTE.length;
	return `var(--chart-series-${i + 1}, ${SERIES_PALETTE[n]})`;
}

/**
 * Index of the value in an ASCENDING-sorted `xs` nearest to `px` — the pointer's
 * x snapped to the closest data x. O(log n) binary search. Ties (px exactly
 * midway) go to the lower index. Out-of-range `px` clamps to the first/last
 * index. Returns -1 for an empty array. The caller passes finite, sorted pixel
 * positions (blanks filtered out) and maps the result back to its row.
 */
export function nearestIndex(xs: readonly number[], px: number): number {
	const n = xs.length;
	if (n === 0) return -1;
	if (px <= xs[0]) return 0;
	if (px >= xs[n - 1]) return n - 1;

	// First index with xs[lo] >= px.
	let lo = 0;
	let hi = n - 1;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (xs[mid] < px) lo = mid + 1;
		else hi = mid;
	}
	// Nearest is either that index or the one below it.
	const below = lo - 1;
	return px - xs[below] <= xs[lo] - px ? below : lo;
}

/**
 * Coerce a value to a millisecond timestamp, mirroring the DataTable's date
 * sorting: a Date → its time, a number → itself (already a timestamp), an ISO /
 * parseable string → Date.parse. Blanks and invalid dates return NaN (a blank on
 * a time axis, exactly as on a numeric one).
 */
export function toTime(value: unknown): number {
	if (value instanceof Date) return value.getTime();
	if (typeof value === 'number') return value;
	if (isBlank(value)) return NaN;
	return new Date(String(value)).getTime();
}

const DAY_MS = 86400000;
const MONTH_NAMES = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];

type TimeUnit = 'day' | 'week' | 'month' | 'quarter' | 'year';
interface TimeInterval {
	unit: TimeUnit;
	mult: number;
	approx: number; // approximate ms length, for choosing the interval
}

/** Calendar interval ladder, smallest → largest, up to a quarter. Beyond that
 *  the step becomes a nice number of years (computed in timeTicks). */
const TIME_LADDER: TimeInterval[] = [
	{ unit: 'day', mult: 1, approx: DAY_MS },
	{ unit: 'day', mult: 2, approx: 2 * DAY_MS },
	{ unit: 'day', mult: 3, approx: 3 * DAY_MS },
	{ unit: 'week', mult: 1, approx: 7 * DAY_MS },
	{ unit: 'week', mult: 2, approx: 14 * DAY_MS },
	{ unit: 'month', mult: 1, approx: 30.4 * DAY_MS },
	{ unit: 'quarter', mult: 1, approx: 91.3 * DAY_MS }
];

/** Snap a Date down to the start of its interval unit (local time, so DST is
 *  absorbed): midnight for day/week (week → Sunday), the 1st for month, the
 *  quarter's first month, or Jan 1 for year. */
function floorToUnit(ms: number, unit: TimeUnit): Date {
	const d = new Date(ms);
	d.setHours(0, 0, 0, 0);
	if (unit === 'week') d.setDate(d.getDate() - d.getDay());
	else if (unit === 'month') d.setDate(1);
	else if (unit === 'quarter') {
		d.setDate(1);
		d.setMonth(Math.floor(d.getMonth() / 3) * 3);
	} else if (unit === 'year') {
		d.setMonth(0, 1);
	}
	return d;
}

/** Advance a Date by one interval step, incrementing the relevant calendar
 *  field (never a fixed ms count) so month lengths and DST stay correct. */
function stepUnit(d: Date, { unit, mult }: TimeInterval): Date {
	const n = new Date(d.getTime());
	if (unit === 'day') n.setDate(n.getDate() + mult);
	else if (unit === 'week') n.setDate(n.getDate() + 7 * mult);
	else if (unit === 'month') n.setMonth(n.getMonth() + mult);
	else if (unit === 'quarter') n.setMonth(n.getMonth() + 3 * mult);
	else n.setFullYear(n.getFullYear() + mult);
	return n;
}

/** The default tick label for a unit: 'Jan 5' (day/week), 'Jan 2024' (month),
 *  'Q1 2024' (quarter), '2024' (year). */
function timeLabeler(unit: TimeUnit): (value: number | Date) => string {
	return (value) => {
		const d = value instanceof Date ? value : new Date(value);
		const mon = MONTH_NAMES[d.getMonth()];
		if (unit === 'year') return String(d.getFullYear());
		if (unit === 'quarter') return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
		if (unit === 'month') return `${mon} ${d.getFullYear()}`;
		return `${mon} ${d.getDate()}`; // day / week
	};
}

export interface TimeTicks {
	ticks: number[]; // tick timestamps covering [min, max]
	format: (value: number | Date) => string; // matching default label formatter
}

/**
 * Calendar-aware ticks for a time axis spanning [min, max] (ms). Picks a step
 * (day / week / month / quarter / year, with a sensible multiple) targeting
 * ~`count` ticks, generates them on real calendar boundaries, and returns a
 * matching default label formatter (overridable via AxisDef.format). A span of
 * ~3 years yields year ticks; ~2 weeks yields day ticks — never unlabelled or
 * overlapping spam. Non-finite input or min===max degenerates to a single day
 * tick.
 */
export function timeTicks(min: number, max: number, count = 6): TimeTicks {
	if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
		const at = Number.isFinite(min) ? min : Number.isFinite(max) ? max : Date.parse('1970-01-01');
		return { ticks: [at], format: timeLabeler('day') };
	}
	if (min > max) [min, max] = [max, min];

	const target = (max - min) / Math.max(1, count);
	let chosen = TIME_LADDER.find((c) => c.approx >= target);
	if (!chosen) {
		// Large span → a nice number of years (1/2/5×10ⁿ).
		const yearMs = 365.25 * DAY_MS;
		const yStep = Math.max(1, Math.round(niceStep(target / yearMs)));
		chosen = { unit: 'year', mult: yStep, approx: yStep * yearMs };
	}

	const ticks: number[] = [];
	let cur = floorToUnit(min, chosen.unit);
	while (cur.getTime() < min) cur = stepUnit(cur, chosen);
	while (cur.getTime() <= max) {
		ticks.push(cur.getTime());
		cur = stepUnit(cur, chosen);
		if (ticks.length > 500) break; // paranoia guard
	}
	if (ticks.length === 0) ticks.push(floorToUnit(min, chosen.unit).getTime());

	return { ticks, format: timeLabeler(chosen.unit) };
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
