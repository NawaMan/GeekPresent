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
	AggregateOptions,
	AggregateRow,
	BandScale,
	BandScaleOptions,
	LinearScale,
	LinearScaleOptions,
	Point,
	Reducer,
	RowGroup
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

/** Canonical string for a key/category value so equal primitives, dates, and
 *  objects collapse regardless of reference identity — the shared keying used
 *  by band domains, grouping, pie slices, and selection highlighting. Lets a
 *  `highlighted` list of row keys match a mark's key by value, not by ===. */
export function keyString(value: unknown): string {
	if (value instanceof Date) return 'd:' + value.getTime();
	if (value !== null && typeof value === 'object') return 'o:' + JSON.stringify(value);
	return 't:' + String(value);
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

// ── Aggregation (Phase 3) ────────────────────────────────────────────────────
// Turn *table-shaped* rows (one per server) into *chart-shaped* rows (one per
// group) — the same pure pipeline the DataTable runs, reused outside it. A
// chart sits downstream of groupRows/aggregate exactly as it sits downstream of
// filterRows/sortRows: plain arrays in, plain arrays out.

/** Stable string key so equal group values (and equal dates) collapse to one
 *  bucket regardless of object identity — the same keying bandScale uses. */
function groupKey(value: unknown): string {
	if (value instanceof Date) return 'd:' + value.getTime();
	if (value !== null && typeof value === 'object') return 'o:' + JSON.stringify(value);
	return 't:' + String(value);
}

/**
 * Bucket rows by an accessor value, in FIRST-SEEN order (the caller controls
 * order by sorting rows first — same philosophy as the table's pipeline).
 * Returns one RowGroup per distinct value, each carrying its rows in their
 * original order. Blank group values are kept as their own bucket (a missing
 * region is still a group); it's the *reducers* that skip blank measures.
 */
export function groupRows<T>(rows: readonly T[], by: Accessor<T>): RowGroup<T>[] {
	const groups: RowGroup<T>[] = [];
	const index = new Map<string, RowGroup<T>>();
	for (const row of rows) {
		const group = valueOf(row, by);
		const key = groupKey(group);
		let bucket = index.get(key);
		if (!bucket) {
			bucket = { group, rows: [] };
			index.set(key, bucket);
			groups.push(bucket);
		}
		bucket.rows.push(row);
	}
	return groups;
}

/**
 * Group rows and reduce each group to a chart-shaped `{group, value, count}`
 * row, in first-seen group order. `count` is the number of rows in the group;
 * `value` is `options.value(groupRows)` — a reducer from sumOf/avgOf/countOf.
 * Blank measures are skipped by those reducers (not zeroed), so a blank
 * `requests` neither inflates a count nor drags an average down. Ready to chart
 * with `x={{ value: 'group' }}` + `series=[{ value: 'value', … }]`.
 */
export function aggregate<T>(
	rows: readonly T[],
	by: Accessor<T>,
	options: AggregateOptions<T>
): AggregateRow[] {
	return groupRows(rows, by).map((g) => ({
		group: g.group,
		value: options.value(g.rows),
		count: g.rows.length
	}));
}

/** Reducer: sum of the accessor's finite numeric values across a group, blanks
 *  skipped. An all-blank group sums to 0 (nothing to add), not NaN. */
export function sumOf<T>(accessor: Accessor<T>): Reducer<T> {
	return (rows) => {
		let sum = 0;
		for (const row of rows) {
			const n = toNumber(valueOf(row, accessor));
			if (!Number.isNaN(n)) sum += n;
		}
		return sum;
	};
}

/** Reducer: mean of the accessor's finite numeric values, blanks EXCLUDED from
 *  both the sum and the divisor — a missing value doesn't pull the average
 *  toward 0. An all-blank group (no comparable numbers) averages to 0. */
export function avgOf<T>(accessor: Accessor<T>): Reducer<T> {
	return (rows) => {
		let sum = 0;
		let n = 0;
		for (const row of rows) {
			const v = toNumber(valueOf(row, accessor));
			if (!Number.isNaN(v)) {
				sum += v;
				n += 1;
			}
		}
		return n === 0 ? 0 : sum / n;
	};
}

/** Reducer: the number of rows in a group. With no accessor it counts every
 *  row; with one it counts only rows whose value is non-blank (an "N of M have
 *  a value" measure). */
export function countOf<T>(accessor?: Accessor<T>): Reducer<T> {
	return (rows) => {
		if (!accessor) return rows.length;
		let n = 0;
		for (const row of rows) {
			if (!Number.isNaN(toNumber(valueOf(row, accessor)))) n += 1;
		}
		return n;
	};
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
 * Index of the point in `points` nearest (by squared Euclidean distance) to the
 * pixel `(px, py)` — a scatter plot's 2D hover snap, the counterpart to the 1D
 * `nearestIndex` a line/bar uses. Points with a non-finite x or y (a blanked
 * coordinate) are skipped, never matched. Returns -1 when nothing is comparable.
 * Ties go to the earlier index. O(n): a scatter re-runs this per pointer move.
 */
export function nearestPoint(points: readonly Point[], px: number, py: number): number {
	let best = -1;
	let bestDist = Infinity;
	for (let i = 0; i < points.length; i++) {
		const p = points[i];
		if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
		const dx = p.x - px;
		const dy = p.y - py;
		const dist = dx * dx + dy * dy;
		if (dist < bestDist) {
			bestDist = dist;
			best = i;
		}
	}
	return best;
}

/**
 * Radius for a bubble whose magnitude is `value`, mapped so a point's AREA (not
 * its radius) is proportional to the value — the honest way to size a bubble, so
 * a value twice as large reads as twice the ink rather than four times. Blanks
 * and a non-finite value fall back to the smallest radius (`range[0]`). A flat
 * domain (every size equal) gives the midpoint radius. Values clamp to the range.
 */
export function bubbleRadius(
	value: unknown,
	domain: [number, number],
	range: [number, number]
): number {
	const [r0, r1] = range;
	const v = toNumber(value);
	if (Number.isNaN(v)) return r0;
	let [d0, d1] = domain;
	if (!Number.isFinite(d0) || !Number.isFinite(d1) || d0 === d1) return (r0 + r1) / 2;
	if (d0 > d1) [d0, d1] = [d1, d0];
	const t = Math.min(1, Math.max(0, (v - d0) / (d1 - d0)));
	// Interpolate on r² so equal value-steps add equal AREA, not equal radius.
	return Math.sqrt(r0 * r0 + t * (r1 * r1 - r0 * r0));
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

/**
 * Sample a continuous function `y = f(x)` into evenly-spaced `{x, y}` points
 * over `[x0, x1]` — the one missing seam between a math formula and the existing
 * data-driven charts. Feed the result to LineChart as its `data` with
 * `x={{ value: 'x', type: 'linear' }}` and a series reading `y`; every scale,
 * tick, and path already works unchanged.
 *
 * `samples` is the number of POINTS (default 200), so there are `samples - 1`
 * intervals and the endpoints x0/x1 are hit exactly. A non-finite result — an
 * asymptote, a domain error, or a thrown exception (caught → NaN) — is kept as a
 * non-finite `y`, so `linePath` BREAKS the curve into a gap there instead of
 * plotting a spurious 0 or a vertical spike (e.g. tan x, 1/x). Callers wanting a
 * clamped view (tan blowing up the y-scale) map |y| over a cutoff to NaN before
 * charting. A non-finite domain yields []; a zero-width domain yields the single
 * endpoint. Pure — no DOM, unit-tested alongside the rest of chartCore.
 */
export function sampleFunction(
	fn: (x: number) => number,
	domain: [number, number],
	samples = 200
): Point[] {
	let [x0, x1] = domain;
	if (!Number.isFinite(x0) || !Number.isFinite(x1)) return [];
	if (x0 > x1) [x0, x1] = [x1, x0];

	const at = (x: number): Point => {
		let y: number;
		try {
			y = fn(x);
		} catch {
			y = NaN; // a thrown domain error is a gap, not a crash
		}
		return { x, y: typeof y === 'number' ? y : NaN };
	};

	if (x0 === x1) return [at(x0)];

	const n = Math.max(2, Math.floor(samples)); // at least the two endpoints
	const step = (x1 - x0) / (n - 1);
	const points: Point[] = [];
	for (let i = 0; i < n; i++) {
		points.push(at(i === n - 1 ? x1 : x0 + i * step)); // land exactly on x1
	}
	return points;
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

/** A point on a circle at angle `a` measured CLOCKWISE from 12 o'clock (the pie
 *  convention): angle 0 is straight up, π/2 is 3 o'clock. */
function polar(cx: number, cy: number, radius: number, a: number): [number, number] {
	return [cx + radius * Math.sin(a), cy - radius * Math.cos(a)];
}

/**
 * SVG path for a pie/donut slice from `startAngle` to `endAngle` (radians,
 * clockwise from 12 o'clock). `innerR > 0` cuts a donut hole (the slice becomes
 * a ring segment); `innerR === 0` draws a solid wedge to the centre. The
 * FULL-CIRCLE case (a lone slice spanning ≥ 2π) can't be one `A` command — a
 * start point equal to the end is a degenerate no-op arc — so it's drawn as TWO
 * half-circle arcs (a ring, or a disc when solid). A non-positive or non-finite
 * span returns '' (nothing to draw). Pure geometry: PieChart maps values →
 * angles and feeds them here.
 */
export function arcPath(
	cx: number,
	cy: number,
	r: number,
	innerR: number,
	startAngle: number,
	endAngle: number
): string {
	const TAU = Math.PI * 2;
	const span = endAngle - startAngle;
	if (!Number.isFinite(span) || span <= 0 || !(r > 0)) return '';

	const hole = innerR > 0;
	const p = (radius: number, a: number): string => {
		const [x, y] = polar(cx, cy, radius, a);
		return `${coord(x)} ${coord(y)}`;
	};

	// Full circle: two semicircle arcs (one A can't close a 360° path).
	if (span >= TAU - 1e-9) {
		const mid = startAngle + Math.PI;
		const outer = `M ${p(r, startAngle)} A ${coord(r)} ${coord(r)} 0 1 1 ${p(r, mid)} A ${coord(r)} ${coord(r)} 0 1 1 ${p(r, startAngle)} Z`;
		if (!hole) return outer;
		// Inner ring boundary wound the opposite way, so the hole subtracts.
		const inner = `M ${p(innerR, startAngle)} A ${coord(innerR)} ${coord(innerR)} 0 1 0 ${p(innerR, mid)} A ${coord(innerR)} ${coord(innerR)} 0 1 0 ${p(innerR, startAngle)} Z`;
		return `${outer} ${inner}`;
	}

	const large = span > Math.PI ? 1 : 0;
	if (hole) {
		// ring segment: out along the start radius edge, sweep the outer arc CW,
		// in along the end radius edge, sweep the inner arc back CCW.
		return (
			`M ${p(r, startAngle)}` +
			` A ${coord(r)} ${coord(r)} 0 ${large} 1 ${p(r, endAngle)}` +
			` L ${p(innerR, endAngle)}` +
			` A ${coord(innerR)} ${coord(innerR)} 0 ${large} 0 ${p(innerR, startAngle)}` +
			` Z`
		);
	}
	// solid wedge: centre → start edge → outer arc → back to centre.
	return (
		`M ${coord(cx)} ${coord(cy)}` +
		` L ${p(r, startAngle)}` +
		` A ${coord(r)} ${coord(r)} 0 ${large} 1 ${p(r, endAngle)}` +
		` Z`
	);
}
