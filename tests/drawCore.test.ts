import { describe, expect, it } from 'vitest';
import {
	angleAt,
	arcPath,
	arrowHead,
	bendFromApex,
	clampBend,
	curvePath,
	defaultArrowSize,
	finite,
	finitePoint,
	labelPos,
	linePath,
	pointAt,
	polygonPoints,
	polylinePath,
	smoothPath,
	smoothSegments,
	reverseShape,
	round,
	segmentAngle,
	shorten,
	shortenShape,
	snapToAngles
} from '../src/lib/draw/drawCore';
import type { PathShape, Point } from '../src/lib/draw/types';

/** Angles compared on the unit circle, so 3π/2 ≡ -π/2. */
function expectAngle(actual: number, expected: number) {
	expect(Math.cos(actual)).toBeCloseTo(Math.cos(expected), 6);
	expect(Math.sin(actual)).toBeCloseTo(Math.sin(expected), 6);
}

function dist(a: Point, b: Point): number {
	return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

describe('finite / finitePoint / round', () => {
	it('passes finite numbers through', () => {
		expect(finite(42)).toBe(42);
		expect(finite(-0.5)).toBe(-0.5);
	});

	it('coerces NaN and infinities to the fallback', () => {
		expect(finite(NaN)).toBe(0);
		expect(finite(Infinity)).toBe(0);
		expect(finite(-Infinity)).toBe(0);
		expect(finite(NaN, 4)).toBe(4);
	});

	it('finitePoint sanitizes both coordinates', () => {
		expect(finitePoint([NaN, 7])).toEqual([0, 7]);
		expect(finitePoint([3, Infinity])).toEqual([3, 0]);
	});

	it('round keeps 2 decimals and never emits NaN', () => {
		expect(round(1.2345)).toBe(1.23);
		expect(round(-1.005)).toBeCloseTo(-1, 2);
		expect(round(NaN)).toBe(0);
	});
});

describe('segmentAngle', () => {
	it('measures the four cardinal directions', () => {
		expect(segmentAngle([0, 0], [10, 0])).toBe(0);
		expect(segmentAngle([0, 0], [0, 10])).toBeCloseTo(Math.PI / 2); // SVG y grows down
		expect(segmentAngle([0, 0], [-10, 0])).toBeCloseTo(Math.PI);
		expect(segmentAngle([0, 0], [0, -10])).toBeCloseTo(-Math.PI / 2);
	});

	it('handles diagonals and negative coordinates', () => {
		expect(segmentAngle([-10, -10], [0, 0])).toBeCloseTo(Math.PI / 4);
	});

	it('returns 0 (never NaN) for a zero-length segment', () => {
		expect(segmentAngle([5, 5], [5, 5])).toBe(0);
	});

	it('coerces non-finite inputs instead of propagating NaN', () => {
		expect(Number.isNaN(segmentAngle([NaN, 0], [10, 0]))).toBe(false);
	});
});

describe('shorten', () => {
	it('moves the endpoint back along the segment', () => {
		expect(shorten([0, 0], [10, 0], 4)).toEqual([6, 0]);
		expect(shorten([0, 0], [0, 10], 4)).toEqual([0, 6]);
	});

	it('works with negative coordinates', () => {
		expect(shorten([-10, 0], [-2, 0], 3)).toEqual([-5, 0]);
	});

	it('returns `to` unchanged for a zero-length segment', () => {
		expect(shorten([5, 5], [5, 5], 10)).toEqual([5, 5]);
	});

	it('clamps at `from` when `by` exceeds the segment length', () => {
		expect(shorten([2, 3], [12, 3], 999)).toEqual([2, 3]);
	});

	it('extends past `to` for negative `by`', () => {
		expect(shorten([0, 0], [10, 0], -5)).toEqual([15, 0]);
	});

	it('never emits NaN for non-finite inputs', () => {
		const [x, y] = shorten([NaN, 0], [10, Infinity], NaN);
		expect(Number.isFinite(x)).toBe(true);
		expect(Number.isFinite(y)).toBe(true);
	});
});

describe('arrowHead', () => {
	it('puts the tip first, exactly at the given point', () => {
		const [tip] = arrowHead([100, 50], 0, 20);
		expect(tip).toEqual([100, 50]);
	});

	it('builds a rightward 2:1 head: base `size` back, half-size to each side', () => {
		const [tip, a, b] = arrowHead([100, 0], 0, 20);
		expect(tip).toEqual([100, 0]);
		expect(a).toEqual([80, 10]);
		expect(b).toEqual([80, -10]);
	});

	it('rotates with the angle (pointing down)', () => {
		const [tip, a, b] = arrowHead([0, 100], Math.PI / 2, 20);
		expect(tip).toEqual([0, 100]);
		expect(a).toEqual([-10, 80]);
		expect(b).toEqual([10, 80]);
	});

	it('collapses to the tip for size 0', () => {
		expect(arrowHead([5, 5], 1, 0)).toEqual([
			[5, 5],
			[5, 5],
			[5, 5]
		]);
	});

	it('never emits NaN for non-finite inputs', () => {
		for (const [x, y] of arrowHead([NaN, 5], Infinity, NaN)) {
			expect(Number.isFinite(x)).toBe(true);
			expect(Number.isFinite(y)).toBe(true);
		}
	});
});

describe('defaultArrowSize', () => {
	it('scales with thickness', () => {
		expect(defaultArrowSize(6)).toBe(24);
		expect(defaultArrowSize(10)).toBe(40);
	});

	it('has a floor so thin lines still get a visible head', () => {
		expect(defaultArrowSize(1)).toBe(12);
	});

	it('falls back to the default thickness when non-finite', () => {
		expect(defaultArrowSize(NaN)).toBe(16);
	});
});

describe('linePath', () => {
	it('emits a simple M/L d string', () => {
		expect(linePath([100, 200], [900, 540])).toBe('M 100 200 L 900 540');
	});

	it('rounds long decimals', () => {
		expect(linePath([1.2345, 0], [2.9999, 0])).toBe('M 1.23 0 L 3 0');
	});

	it('never contains NaN', () => {
		expect(linePath([NaN, 1], [2, Infinity])).not.toContain('NaN');
	});
});

describe('curvePath', () => {
	it('quadratic with one control point, cubic with two', () => {
		expect(curvePath([0, 0], [100, 0], [50, 100])).toBe('M 0 0 Q 50 100 100 0');
		expect(curvePath([0, 0], [100, 0], [0, 100], [100, 100])).toBe(
			'M 0 0 C 0 100 100 100 100 0'
		);
	});

	it('never contains NaN', () => {
		expect(curvePath([NaN, 0], [1, Infinity], [NaN, NaN])).not.toContain('NaN');
	});
});

describe('arcPath', () => {
	it('bend 0 renders exactly the straight from→to line', () => {
		expect(arcPath([400, 540], [1500, 540], 0)).toBe('M 400 540 L 1500 540');
	});

	it('positive vs negative bend flips only the sweep flag (opposite sides)', () => {
		expect(arcPath([400, 540], [1500, 540], 0.3)).toBe(
			'M 400 540 A 623.33 623.33 0 0 1 1500 540'
		);
		expect(arcPath([400, 540], [1500, 540], -0.3)).toBe(
			'M 400 540 A 623.33 623.33 0 0 0 1500 540'
		);
	});

	it('|bend| > 0.5 sets the large-arc flag; beyond 1 it clamps to 1', () => {
		const atOne = arcPath([0, 0], [100, 0], 1);
		expect(atOne).toBe('M 0 0 A 62.5 62.5 0 1 1 100 0'); // r = L²/(8s) + s/2 = 12.5 + 50
		expect(arcPath([0, 0], [100, 0], 5)).toBe(atOne); // clamped
	});

	it('vertical chord: a semicircle to the (dy, -dx) side', () => {
		expect(arcPath([100, 100], [100, 300], 0.5)).toBe('M 100 100 A 100 100 0 0 1 100 300');
	});

	it('zero-length chord degenerates to a point line, never NaN', () => {
		expect(arcPath([5, 5], [5, 5], 0.4)).toBe('M 5 5 L 5 5');
		expect(arcPath([NaN, 0], [100, Infinity], NaN)).not.toContain('NaN');
	});
});

describe('pointAt / angleAt', () => {
	const line: PathShape = { kind: 'line', from: [0, 0], to: [100, 0] };
	const quad: PathShape = { kind: 'quadratic', from: [0, 0], to: [100, 0], c1: [50, 100] };
	const cubic: PathShape = { kind: 'cubic', from: [0, 0], to: [100, 0], c1: [0, 100], c2: [100, 100] };
	const arc: PathShape = { kind: 'arc', from: [400, 540], to: [1500, 540], bend: 0.3 };

	it('line: endpoints, midpoint, constant angle', () => {
		expect(pointAt(line, 0)).toEqual([0, 0]);
		expect(pointAt(line, 0.5)).toEqual([50, 0]);
		expect(pointAt(line, 1)).toEqual([100, 0]);
		expectAngle(angleAt(line, 0.5), 0);
	});

	it('quadratic: hand-computed point and tangents', () => {
		expect(pointAt(quad, 0)).toEqual([0, 0]);
		expect(pointAt(quad, 0.5)).toEqual([50, 50]); // 0.25·p0 + 0.5·c1 + 0.25·p1
		expect(pointAt(quad, 1)).toEqual([100, 0]);
		expectAngle(angleAt(quad, 0), Math.atan2(100, 50)); // toward c1
		expectAngle(angleAt(quad, 1), Math.atan2(-100, 50)); // away from c1
		expectAngle(angleAt(quad, 0.5), 0); // symmetric apex — horizontal
	});

	it('cubic: hand-computed point and tangents', () => {
		expect(pointAt(cubic, 0.5)).toEqual([50, 75]); // (p0 + 3c1 + 3c2 + p1) / 8
		expectAngle(angleAt(cubic, 0), Math.PI / 2); // straight toward c1 (down in SVG y)
		expectAngle(angleAt(cubic, 1), -Math.PI / 2); // from c2 to the end
		expectAngle(angleAt(cubic, 0.5), 0);
	});

	it('arc: apex at t=0.5, sagitta above the chord for positive bend', () => {
		expect(pointAt(arc, 0)).toEqual([400, 540]);
		expect(pointAt(arc, 1)).toEqual([1500, 540]);
		expect(pointAt(arc, 0.5)).toEqual([950, 210]); // 540 − 0.3·1100 (bulges screen-up)
		expectAngle(angleAt(arc, 0.5), 0); // travelling rightward over the top
	});

	it('arc: negative bend mirrors to the other side of the chord', () => {
		const down: PathShape = { kind: 'arc', from: [400, 540], to: [1500, 540], bend: -0.3 };
		expect(pointAt(down, 0.5)).toEqual([950, 870]); // 540 + 330
		expectAngle(angleAt(down, 0.5), 0);
	});

	it('arc: bend 0.5 is a semicircle', () => {
		const semi: PathShape = { kind: 'arc', from: [0, 0], to: [100, 0], bend: 0.5 };
		expect(pointAt(semi, 0.5)).toEqual([50, -50]); // r = 50, apex straight up
		expectAngle(angleAt(semi, 0), Math.PI / 2 + Math.PI); // leaving straight up... start tangent
	});

	it('arc: vertical chord', () => {
		const vert: PathShape = { kind: 'arc', from: [100, 100], to: [100, 300], bend: 0.5 };
		// chord points down (+y); positive bend bulges toward (dy,−dx)/L = (+1, 0)
		expect(pointAt(vert, 0.5)).toEqual([200, 200]);
	});

	it('arc: bend 0 and zero-length chords degenerate to the straight line', () => {
		const flat: PathShape = { kind: 'arc', from: [0, 0], to: [100, 0], bend: 0 };
		expect(pointAt(flat, 0.5)).toEqual([50, 0]);
		expectAngle(angleAt(flat, 0.5), 0);
		const dot: PathShape = { kind: 'arc', from: [5, 5], to: [5, 5], bend: 0.4 };
		expect(pointAt(dot, 0.5)).toEqual([5, 5]);
		expect(Number.isFinite(angleAt(dot, 0.5))).toBe(true);
	});

	it('t is clamped to [0, 1] and non-finite t is safe', () => {
		expect(pointAt(line, -3)).toEqual([0, 0]);
		expect(pointAt(line, 42)).toEqual([100, 0]);
		expect(pointAt(line, NaN)).toEqual([0, 0]);
	});

	it('degenerate control points never yield NaN angles', () => {
		const degenerate: PathShape = { kind: 'quadratic', from: [0, 0], to: [100, 0], c1: [0, 0] };
		expect(Number.isFinite(angleAt(degenerate, 0))).toBe(true);
		const point: PathShape = { kind: 'cubic', from: [5, 5], to: [5, 5], c1: [5, 5], c2: [5, 5] };
		expect(Number.isFinite(angleAt(point, 0.5))).toBe(true);
	});
});

describe('clampBend', () => {
	it('clamps |bend| to 1 and coerces non-finite to 0', () => {
		expect(clampBend(0.3)).toBe(0.3);
		expect(clampBend(5)).toBe(1);
		expect(clampBend(-5)).toBe(-1);
		expect(clampBend(NaN)).toBe(0);
	});
});

describe('reverseShape', () => {
	it('keeps every shape kind on its original geometry', () => {
		const quad: PathShape = { kind: 'quadratic', from: [0, 0], to: [100, 0], c1: [50, 100] };
		expect(pointAt(reverseShape(quad), 0.25)).toEqual(pointAt(quad, 0.75));
		const cubic: PathShape = { kind: 'cubic', from: [0, 0], to: [100, 0], c1: [0, 100], c2: [100, 100] };
		expect(pointAt(reverseShape(cubic), 0.5)).toEqual(pointAt(cubic, 0.5));
		const arc: PathShape = { kind: 'arc', from: [400, 540], to: [1500, 540], bend: 0.3 };
		expect(pointAt(reverseShape(arc), 0.5)).toEqual(pointAt(arc, 0.5)); // same apex
	});
});

describe('shortenShape', () => {
	it('line: same as shorten()', () => {
		const s = shortenShape({ kind: 'line', from: [0, 0], to: [100, 0] }, 20);
		expect(s).toEqual({ kind: 'line', from: [0, 0], to: [80, 0] });
	});

	it('quadratic/cubic: the new endpoint sits ~by px back, on the original curve', () => {
		const quad: PathShape = { kind: 'quadratic', from: [0, 0], to: [100, 0], c1: [50, 100] };
		const sq = shortenShape(quad, 10);
		expect(sq.kind).toBe('quadratic');
		expect(dist(pointAt(sq, 1), [100, 0])).toBeGreaterThan(7);
		expect(dist(pointAt(sq, 1), [100, 0])).toBeLessThan(13);
		const cubic: PathShape = { kind: 'cubic', from: [0, 0], to: [100, 0], c1: [0, 100], c2: [100, 100] };
		const sc = shortenShape(cubic, 10);
		// the trimmed tail must stay on the source curve (de Casteljau is exact):
		// end speed |3(to − c2)| = 300 px per unit t, so by=10 trims to t = 1 − 10/300
		expect(dist(pointAt(sc, 1), pointAt(cubic, 1 - 10 / 300))).toBeLessThan(0.05);
	});

	it('arc: exact angular trim — the sub-arc stays on the same circle', () => {
		const semi: PathShape = { kind: 'arc', from: [0, 0], to: [100, 0], bend: 0.5 };
		// arc length = π·50 ≈ 157.08; trim half of it → ends at the apex
		const half = shortenShape(semi, (Math.PI * 50) / 2);
		expect(half.kind).toBe('arc');
		expect(pointAt(half, 1)).toEqual([50, -50]);
		// the sub-arc's own midpoint must land on the original quarter point
		expect(dist(pointAt(half, 0.5), pointAt(semi, 0.25))).toBeLessThan(0.05);
	});

	it('by ≤ 0 returns the shape unchanged; huge by collapses to the start', () => {
		const quad: PathShape = { kind: 'quadratic', from: [0, 0], to: [100, 0], c1: [50, 100] };
		expect(shortenShape(quad, 0)).toBe(quad);
		expect(shortenShape(quad, -5)).toBe(quad);
		const collapsed = shortenShape({ kind: 'line', from: [0, 0], to: [100, 0] }, 9999);
		expect(pointAt(collapsed, 1)).toEqual([0, 0]);
	});

	it('never emits NaN for degenerate shapes', () => {
		const dot: PathShape = { kind: 'arc', from: [5, 5], to: [5, 5], bend: 0.3 };
		const s = shortenShape(dot, 10);
		expect(pointAt(s, 1).every(Number.isFinite)).toBe(true);
	});
});

describe('polylinePath', () => {
	it('joins the points with straight segments; close appends Z', () => {
		const pts: Point[] = [
			[100, 900],
			[400, 700],
			[700, 950]
		];
		expect(polylinePath(pts)).toBe('M 100 900 L 400 700 L 700 950');
		expect(polylinePath(pts, true)).toBe('M 100 900 L 400 700 L 700 950 Z');
	});

	it('fewer than 2 points render nothing; non-finite coords never leak', () => {
		expect(polylinePath([])).toBe('');
		expect(polylinePath([[5, 5]])).toBe('');
		expect(polylinePath([[NaN, 0], [1, Infinity]])).not.toContain('NaN');
	});
});

describe('smoothSegments / smoothPath', () => {
	const pts: Point[] = [
		[100, 900],
		[400, 700],
		[700, 950],
		[1100, 600]
	];

	it('passes exactly THROUGH every input point at segment boundaries', () => {
		const segments = smoothSegments(pts);
		expect(segments).toHaveLength(pts.length - 1);
		segments.forEach((seg, i) => {
			expect(pointAt(seg, 0)).toEqual(pts[i]);
			expect(pointAt(seg, 1)).toEqual(pts[i + 1]);
		});
	});

	it('2 points degenerate to a straight line', () => {
		expect(smoothPath([[0, 0], [100, 50]])).toBe('M 0 0 L 100 50');
	});

	it('collinear points stay collinear (control points on the line)', () => {
		const line: Point[] = [
			[0, 0],
			[50, 50],
			[100, 100],
			[150, 150]
		];
		for (const seg of smoothSegments(line)) {
			for (const t of [0.25, 0.5, 0.75]) {
				const [x, y] = pointAt(seg, t);
				expect(y).toBeCloseTo(x, 6); // still on y = x
			}
		}
	});

	it('close wraps the neighbors and appends Z', () => {
		const segments = smoothSegments(pts, true);
		expect(segments).toHaveLength(pts.length); // one extra seam segment
		expect(pointAt(segments[pts.length - 1], 0)).toEqual(pts[pts.length - 1]);
		expect(pointAt(segments[pts.length - 1], 1)).toEqual(pts[0]);
		expect(smoothPath(pts, true).endsWith('Z')).toBe(true);
	});

	it('handles empty/single/non-finite input safely', () => {
		expect(smoothPath([])).toBe('');
		expect(smoothPath([[5, 5]])).toBe('');
		expect(smoothPath([[NaN, 0], [1, 2], [Infinity, 4]])).not.toContain('NaN');
	});
});

describe('bendFromApex', () => {
	it('round-trips with the forward math: pointAt(arc, 0.5) → the same bend', () => {
		for (const bend of [0.3, -0.3, 0.5, 0.75, -0.6]) {
			const arc: PathShape = { kind: 'arc', from: [400, 540], to: [1500, 540], bend };
			expect(bendFromApex([400, 540], [1500, 540], pointAt(arc, 0.5))).toBeCloseTo(bend, 3);
		}
	});

	it('round-trips on a vertical chord too', () => {
		const arc: PathShape = { kind: 'arc', from: [100, 100], to: [100, 300], bend: 0.5 };
		expect(bendFromApex([100, 100], [100, 300], pointAt(arc, 0.5))).toBeCloseTo(0.5, 3);
	});

	it('dragging across the chord flips the sign', () => {
		expect(bendFromApex([0, 0], [100, 0], [50, -30])).toBe(0.3); // above → positive
		expect(bendFromApex([0, 0], [100, 0], [50, 30])).toBe(-0.3); // below → negative
	});

	it('an apex on the chord means bend 0; off-perpendicular drags project', () => {
		expect(bendFromApex([0, 0], [100, 0], [50, 0])).toBe(0);
		expect(bendFromApex([0, 0], [100, 0], [80, -30])).toBe(0.3); // x is ignored
	});

	it('clamps to ±1 and survives degenerate/non-finite input', () => {
		expect(bendFromApex([0, 0], [100, 0], [50, -500])).toBe(1);
		expect(bendFromApex([5, 5], [5, 5], [50, 50])).toBe(0); // zero-length chord
		expect(Number.isFinite(bendFromApex([NaN, 0], [100, 0], [Infinity, -30]))).toBe(true);
	});
});

describe('snapToAngles', () => {
	it('snaps near-horizontal to horizontal (keeps x, pins y to the reference)', () => {
		expect(snapToAngles([100, 10], [0, 0])).toEqual([100, 0]);
		expect(snapToAngles([-100, -8], [0, 0])).toEqual([-100, 0]);
	});

	it('snaps near-vertical to vertical', () => {
		expect(snapToAngles([10, 100], [0, 0])).toEqual([0, 100]);
	});

	it('snaps to the 45° diagonal by projection', () => {
		const [x, y] = snapToAngles([60, 50], [0, 0]);
		expect(x).toBeCloseTo(55, 5);
		expect(y).toBeCloseTo(55, 5);
	});

	it('works relative to a non-origin reference', () => {
		expect(snapToAngles([210, 108], [100, 100])).toEqual([210, 100]);
	});

	it('coincident points and non-finite input are safe', () => {
		expect(snapToAngles([5, 5], [5, 5])).toEqual([5, 5]);
		expect(snapToAngles([NaN, 3], [0, Infinity]).every(Number.isFinite)).toBe(true);
	});
});

describe('labelPos', () => {
	it('line: perpendicular offset, positive is screen-up on a rightward line', () => {
		const line: PathShape = { kind: 'line', from: [0, 0], to: [100, 0] };
		expect(labelPos(line, 0.5, 20)).toEqual([50, -20]);
		expect(labelPos(line, 0.5, -20)).toEqual([50, 20]);
		expect(labelPos(line, 0.25, 10)).toEqual([25, -10]);
	});

	it('arc: labelAt 0.5 sits at the apex, offset outside the bulge', () => {
		const arc: PathShape = { kind: 'arc', from: [400, 540], to: [1500, 540], bend: 0.3 };
		expect(labelPos(arc, 0.5, 20)).toEqual([950, 190]); // apex [950, 210] − 20 further up
	});

	it('defaults to the midpoint with a 20px offset, never NaN', () => {
		const line: PathShape = { kind: 'line', from: [0, 0], to: [100, 0] };
		expect(labelPos(line)).toEqual([50, -20]);
		const dot: PathShape = { kind: 'line', from: [5, 5], to: [5, 5] };
		expect(labelPos(dot, NaN, NaN).every(Number.isFinite)).toBe(true);
	});
});

describe('polygonPoints', () => {
	it('formats a point list for the points attribute', () => {
		const pts: Point[] = [
			[1, 2],
			[3.456, 4]
		];
		expect(polygonPoints(pts)).toBe('1,2 3.46,4');
	});

	it('never contains NaN', () => {
		expect(polygonPoints([[NaN, Infinity]])).toBe('0,0');
	});
});
