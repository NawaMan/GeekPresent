// Unit tests for the vendored perfect-freehand outline behind the ANNOTATE pen — pure,
// total, NaN-safe, like the rest of annotateCore: junk in still yields something drawable.
import { describe, expect, it } from 'vitest';
import {
	DEFAULT_FREEHAND,
	freehandD,
	freehandMaxRadius,
	freehandOutline,
	outlineD,
	resolveFreehand
} from '../src/lib/annotate/freehandCore';
import type { Point } from '../src/lib/draw/types';

/** A wavy stroke, sampled 2px-ish apart where the hand went slow and far apart where it flew. */
function wave(): Point[] {
	const pts: Point[] = [];
	for (let i = 0; i <= 60; i++) pts.push([100 + i * (i < 30 ? 2 : 12), 300 + Math.sin(i / 6) * 40]);
	return pts;
}

/** The half-width of the outline at x≈atX: half the vertical span of the polygon's points there. */
function halfWidthNear(outline: Point[], atX: number, tol = 6): number {
	const ys = outline.filter(([x]) => Math.abs(x - atX) < tol).map(([, y]) => y);
	return ys.length < 2 ? 0 : (Math.max(...ys) - Math.min(...ys)) / 2;
}

describe('resolveFreehand', () => {
	it('defaults to the deck pen: size 15, thinning 0.7, streamline 0.6, smoothing 0.5, round caps', () => {
		expect(resolveFreehand()).toEqual({
			size: 15,
			thinning: 0.7,
			streamline: 0.6,
			smoothing: 0.5,
			easing: 'linear',
			start: { taper: 0, cap: true },
			end: { taper: 0, cap: true }
		});
		expect(resolveFreehand()).toEqual(DEFAULT_FREEHAND);
	});

	it('merges a partial over the defaults, end settings included', () => {
		const o = resolveFreehand({ size: 16, end: { taper: 40 } });
		expect(o.size).toBe(16);
		expect(o.thinning).toBe(0.7);
		expect(o.end).toEqual({ taper: 40, cap: true });
		expect(o.start).toEqual({ taper: 0, cap: true });
	});

	it('coerces junk into range instead of letting it reach the maths', () => {
		const o = resolveFreehand({
			size: NaN,
			thinning: 9,
			streamline: -3,
			smoothing: Infinity,
			easing: 'wobbly' as never,
			start: { taper: -5, cap: 'yes' as never }
		});
		expect(o.size).toBe(15);
		expect(o.thinning).toBe(1);
		expect(o.streamline).toBe(0);
		expect(o.smoothing).toBe(0.5);
		expect(o.easing).toBe('linear');
		expect(o.start).toEqual({ taper: 0, cap: true });
		expect(resolveFreehand('nope' as never)).toEqual(DEFAULT_FREEHAND);
	});
});

describe('freehandOutline', () => {
	it('wraps a stroke in a finite polygon', () => {
		const out = freehandOutline(wave());
		expect(out.length).toBeGreaterThan(20);
		for (const [x, y] of out) {
			expect(Number.isFinite(x)).toBe(true);
			expect(Number.isFinite(y)).toBe(true);
		}
	});

	it('never strays further from the line than freehandMaxRadius', () => {
		// A slow stroke along y=300 — slow is where simulated pressure, and so the width, peaks.
		expect(freehandMaxRadius()).toBeCloseTo(12.75, 9);
		const line: Point[] = Array.from({ length: 200 }, (_, i) => [100 + i, 300]);
		const out = freehandOutline(line);
		const reach = Math.max(...out.map(([, y]) => Math.abs(y - 300)));
		expect(reach).toBeLessThanOrEqual(freehandMaxRadius() + 1e-6);
		expect(reach).toBeGreaterThan(7.5); // wider than size/2: slow ink swells
		expect(freehandMaxRadius({ thinning: 0 })).toBe(7.5);
	});

	it('thins where the hand moved fast — the simulated pressure', () => {
		// Slow (2px steps) then fast (25px steps) along a straight line.
		const pts: Point[] = [];
		for (let x = 0; x <= 200; x += 2) pts.push([x, 500]);
		for (let x = 225; x <= 1200; x += 25) pts.push([x, 500]);
		const out = freehandOutline(pts);
		expect(halfWidthNear(out, 900, 14)).toBeLessThan(halfWidthNear(out, 150));
	});

	it('draws constant width with no thinning', () => {
		const pts: Point[] = [];
		for (let x = 0; x <= 200; x += 2) pts.push([x, 500]);
		for (let x = 225; x <= 1200; x += 25) pts.push([x, 500]);
		const out = freehandOutline(pts, { thinning: 0 });
		expect(halfWidthNear(out, 900, 14)).toBeCloseTo(7.5, 1);
		expect(halfWidthNear(out, 150)).toBeCloseTo(7.5, 1);
	});

	it('turns a tap — one point — into a small closed blob around it', () => {
		// Upstream pads a lone point with a 1px neighbour, so a tap is a tiny capped stroke.
		const dot = freehandOutline([[400, 400]]);
		expect(dot.length).toBeGreaterThanOrEqual(12);
		for (const [x, y] of dot)
			expect(Math.hypot(x - 400, y - 400)).toBeLessThan(DEFAULT_FREEHAND.size);
	});

	it('shapes a two-point mark — a Shift-snapped underline', () => {
		const out = freehandOutline([
			[100, 600],
			[700, 600]
		]);
		expect(out.length).toBeGreaterThan(10);
		const xs = out.map(([x]) => x);
		expect(Math.min(...xs)).toBeLessThan(100);
		expect(Math.max(...xs)).toBeGreaterThan(699);
	});

	it('is deterministic — the drawing window and the mirroring window agree', () => {
		expect(freehandOutline(wave())).toEqual(freehandOutline(wave()));
	});

	it('honours the lift point only once the stroke is complete', () => {
		const pts = wave();
		const end = pts[pts.length - 1];
		const reach = (o: Point[]) => Math.max(...o.map(([x]) => x));
		// Complete: the outline reaches the real end (plus the cap). Live: streamline lags behind.
		expect(reach(freehandOutline(pts, null, true))).toBeGreaterThanOrEqual(end[0]);
		expect(reach(freehandOutline(pts, null, false))).toBeLessThan(end[0]);
	});

	it('is total: empty or junk points draw nothing or something finite, never NaN', () => {
		expect(freehandOutline([])).toEqual([]);
		expect(freehandOutline(null as never)).toEqual([]);
		const out = freehandOutline([
			[NaN, 5],
			[Infinity, 9],
			[20, 20],
			[40, 30]
		]);
		for (const [x, y] of out) expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
		// Repeated identical samples (a pen held still) must not divide by zero.
		const still = freehandOutline([
			[50, 50],
			[50, 50],
			[50, 50],
			[60, 50]
		]);
		for (const [x, y] of still) expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
	});
});

describe('outlineD / freehandD', () => {
	it('closes the outline into one filled path of quadratic curves', () => {
		const d = freehandD(wave());
		expect(d).toMatch(/^M-?[\d.]+,-?[\d.]+ Q/);
		expect(d.endsWith('Z')).toBe(true);
		expect(d.match(/M/g)).toHaveLength(1); // one closed sub-path
		expect(d).not.toContain('NaN');
	});

	it('yields nothing for an outline too short to curve', () => {
		expect(outlineD([])).toBe('');
		expect(
			outlineD([
				[0, 0],
				[1, 1],
				[2, 2]
			])
		).toBe('');
	});

	it('draws a dot for a tap', () => {
		expect(freehandD([[10, 10]])).toMatch(/Z$/);
	});
});
