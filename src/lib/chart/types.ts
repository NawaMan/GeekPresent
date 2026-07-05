// Public types for the chart component family.
// See specs/CHART-1.md for the full design; this is the target API surface —
// multi-series/legend/tooltip land in Phase 2, pie/aggregation in Phase 3.
//
// The accessor convention is shared *in spirit* with the DataTable (field name
// or function), but chart code never imports from $lib/datatable — the only
// contract is "plain arrays + accessors + pure pipeline".

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Accessor<T = any> = string | ((row: T) => unknown);

/** One plotted series: a line, a set of bars, or (Phase 3) pie slice sizes. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SeriesDef<T = any> {
	key: string; // stable identity (legend toggling, colors)
	label: string; // legend / tooltip text
	value: Accessor<T>; // the y value (or slice size)
	color?: string; // overrides --chart-series-N
	format?: (value: number) => string; // tooltip/axis-adjacent label text
	/** ComboChart only: draw this series as bars or a line. Defaults to 'bar' for
	 *  the first series and 'line' for the rest. Ignored by BarChart/LineChart. */
	mark?: 'bar' | 'line';
	/** ComboChart only: which y-axis this series is scaled against. Defaults to
	 *  'left' for bars and 'right' for lines. */
	axis?: 'left' | 'right';
}

/** The x dimension: which value, how to scale it, how to label its ticks. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AxisDef<T = any> {
	value: Accessor<T>; // the x value
	type?: 'band' | 'linear' | 'time'; // default: band for bars, linear for lines ('time' in Phase 2)
	label?: string;
	format?: (value: unknown) => string; // tick text
	ticks?: number; // tick-count hint (linear/time)
}

/** A point in logical SVG coordinates. A non-finite y (from a blank/NaN value)
 *  breaks a line into a gap rather than plotting 0 — see linePath. */
export interface Point {
	x: number;
	y: number;
}

/** One series' entry in a hover tooltip: its label, raw value, `format`-ed
 *  text, and swatch color. A blank at the hovered x has `value: null` and a
 *  dash for `formatted`. Passed (with the x value) to a `tooltip` snippet. */
export interface TooltipPoint {
	key: string;
	label: string;
	value: number | null;
	formatted: string;
	color: string;
}

/** Options for linearScale. `zero: true` forces the domain to include 0 (bars
 *  always use it; lines don't by default). `nice: true` snaps the domain out
 *  to round tick bounds. `ticks` is a tick-count hint. */
export interface LinearScaleOptions {
	nice?: boolean; // default true
	zero?: boolean; // default false
	ticks?: number; // tick-count hint, default ≈5
}

/** Options for bandScale, mirroring d3's band padding (fractions of a step). */
export interface BandScaleOptions {
	paddingInner?: number; // default 0.15
	paddingOuter?: number; // default 0.1
}

// chartCore.ts — pure factories return plain objects, no classes.
export interface LinearScale {
	map: (value: unknown) => number; // domain → range px (NaN-safe: blanks map to NaN)
	ticks: number[]; // "nice" tick values covering the domain
	domain: [number, number];
}

export interface BandScale {
	map: (value: unknown) => number; // band start px (NaN for values outside the domain)
	bandwidth: number; // width of one band
	step: number; // band + gap (bandwidth / (1 - paddingInner))
	domain: unknown[]; // in first-seen order
}
