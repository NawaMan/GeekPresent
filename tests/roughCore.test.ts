import { describe, expect, it } from 'vitest';
import {
	boxCorners,
	catmullCommands,
	ellipsePoints,
	fillPolygon,
	hachurePath,
	hachureSegments,
	hashSeed,
	makeRandom,
	perturb,
	roughArrowHead,
	roughEllipse,
	roughRect,
	roughShape,
	roughShapes,
	seedOf,
	shapeIdentity
} from '$lib/draw/roughCore';
import type { PathShape, Point } from '$lib/draw/types';

const LINE: PathShape = { kind: 'line', from: [0, 0], to: [400, 0] };
const CURVE: PathShape = { kind: 'quadratic', from: [0, 0], to: [400, 0], c1: [200, 200] };
const ARC: PathShape = { kind: 'arc', from: [0, 0], to: [400, 0], bend: 0.4 };
const POLY: PathShape = {
	kind: 'polyline',
	points: [
		[0, 0],
		[100, 100],
		[200, 0]
	]
};

/** Every number in a `d` string, for structural comparisons. */
const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
/** Every path command letter in a `d` string — the "command structure". */
const cmds = (d: string) => (d.match(/[MLCAQZ]/g) ?? []).join('');

describe('makeRandom', () => {
	it('is deterministic for a given seed', () => {
		const a = makeRandom(42);
		const b = makeRandom(42);
		const seqA = [a(), a(), a(), a(), a()];
		const seqB = [b(), b(), b(), b(), b()];
		expect(seqA).toEqual(seqB);
	});

	it('gives different sequences for different seeds', () => {
		const a = makeRandom(1);
		const b = makeRandom(2);
		expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
	});

	it('stays in [0, 1)', () => {
		const r = makeRandom(7);
		for (let i = 0; i < 500; i++) {
			const v = r();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});

	it('never collapses on a zero or non-finite seed', () => {
		for (const seed of [0, NaN, Infinity, -Infinity]) {
			const r = makeRandom(seed as number);
			const vals = [r(), r(), r()];
			expect(vals.every((v) => Number.isFinite(v))).toBe(true);
			expect(new Set(vals).size).toBe(3);
		}
	});
});

describe('hashSeed / seedOf', () => {
	it('is stable for the same string', () => {
		expect(hashSeed('Line|0,0,400,0')).toBe(hashSeed('Line|0,0,400,0'));
	});

	it('separates different strings', () => {
		expect(hashSeed('a')).not.toBe(hashSeed('b'));
	});

	it('never returns 0', () => {
		// Whatever collides to a zero hash must still come back non-zero.
		for (let i = 0; i < 200; i++) expect(hashSeed(`s${i}`)).not.toBe(0);
	});

	it('prefers an explicit seed over the identity hash', () => {
		expect(seedOf(99, 'anything')).toBe(99);
		expect(seedOf(undefined, 'anything')).toBe(hashSeed('anything'));
	});

	it('falls back to the hash for a non-finite seed', () => {
		expect(seedOf(NaN, 'x')).toBe(hashSeed('x'));
	});
});

describe('shapeIdentity', () => {
	it('is stable and geometry-sensitive', () => {
		expect(shapeIdentity('l', 0, 0, 400, 0)).toBe(shapeIdentity('l', 0, 0, 400, 0));
		expect(shapeIdentity('l', 0, 0, 400, 0)).not.toBe(shapeIdentity('l', 0, 0, 401, 0));
	});

	it('separates same geometry under different names', () => {
		expect(shapeIdentity('a', 1, 2)).not.toBe(shapeIdentity('b', 1, 2));
	});

	it('coerces undefined and non-finite numbers', () => {
		expect(shapeIdentity('x', undefined, NaN)).toBe(shapeIdentity('x', 0, 0));
	});
});

describe('catmullCommands', () => {
	it('emits exactly one cubic per gap', () => {
		const pts: Point[] = [
			[0, 0],
			[10, 10],
			[20, 0],
			[30, 10]
		];
		expect(cmds(catmullCommands(pts))).toBe('CCC');
	});

	it('ends on the last point', () => {
		const pts: Point[] = [
			[0, 0],
			[10, 10],
			[20, 5]
		];
		const n = nums(catmullCommands(pts));
		expect([n[n.length - 2], n[n.length - 1]]).toEqual([20, 5]);
	});

	it('keeps collinear points collinear', () => {
		const pts: Point[] = [
			[0, 0],
			[10, 0],
			[20, 0],
			[30, 0]
		];
		// Every control point of a straight run must sit on y = 0.
		const n = nums(catmullCommands(pts));
		for (let i = 1; i < n.length; i += 2) expect(n[i]).toBe(0);
	});

	it('returns empty for degenerate input', () => {
		expect(catmullCommands([])).toBe('');
		expect(catmullCommands([[1, 1]])).toBe('');
	});
});

describe('perturb', () => {
	it('moves points but keeps the count', () => {
		const pts: Point[] = [
			[0, 0],
			[100, 0],
			[200, 0]
		];
		const out = perturb(pts, makeRandom(3), 5, 2, false);
		expect(out).toHaveLength(3);
		expect(out).not.toEqual(pts);
	});

	it('is deterministic for the same seed', () => {
		const pts: Point[] = [
			[0, 0],
			[100, 0],
			[200, 0]
		];
		expect(perturb(pts, makeRandom(3), 5, 2)).toEqual(perturb(pts, makeRandom(3), 5, 2));
	});

	it('tapers open ends more than the middle', () => {
		// With bow disabled and a fixed seed, the end offsets are windowed to
		// 0.35 while the midpoint gets the full amplitude.
		const pts: Point[] = [
			[0, 0],
			[100, 0],
			[200, 0]
		];
		const out = perturb(pts, makeRandom(11), 20, 0, false);
		const endOff = Math.abs(out[0][1]);
		const midOff = Math.abs(out[1][1]);
		expect(endOff).toBeLessThan(20 * 0.35 + 1e-6);
		expect(midOff).toBeLessThanOrEqual(20 + 1e-6);
	});

	it('closes a closed run exactly', () => {
		const pts: Point[] = [
			[0, 0],
			[100, 0],
			[100, 100],
			[0, 100],
			[0, 0]
		];
		const out = perturb(pts, makeRandom(5), 6, 2, true);
		expect(out[out.length - 1]).toEqual(out[0]);
	});

	it('never produces NaN, even on doubled points', () => {
		const pts: Point[] = [
			[10, 10],
			[10, 10],
			[10, 10]
		];
		const out = perturb(pts, makeRandom(9), 5, 3, false);
		expect(out.flat().every((v) => Number.isFinite(v))).toBe(true);
	});

	it('passes a single point straight through', () => {
		expect(perturb([[4, 4]], makeRandom(1), 5, 2)).toEqual([[4, 4]]);
	});
});

describe('roughShape', () => {
	it('returns one d per pass', () => {
		expect(roughShape(LINE, { passes: 1 }, 'id')).toHaveLength(1);
		expect(roughShape(LINE, { passes: 2 }, 'id')).toHaveLength(2);
		expect(roughShape(LINE, { passes: 3 }, 'id')).toHaveLength(3);
	});

	it('is deterministic — the SSR/hydration contract', () => {
		expect(roughShape(CURVE, {}, 'id')).toEqual(roughShape(CURVE, {}, 'id'));
		expect(roughShape(ARC, { seed: 5 }, '')).toEqual(roughShape(ARC, { seed: 5 }, ''));
	});

	it('gives different shapes different wobble', () => {
		expect(roughShape(LINE, {}, 'a')).not.toEqual(roughShape(LINE, {}, 'b'));
	});

	it('the two passes differ from each other', () => {
		const [p1, p2] = roughShape(LINE, { passes: 2 }, 'id');
		expect(p1).not.toBe(p2);
		expect(p1).not.toEqual(p2);
	});

	it('renders nothing at roughness 0', () => {
		expect(roughShape(LINE, { roughness: 0 }, 'id')).toEqual([]);
	});

	it('holds command structure constant across geometry — the morph contract', () => {
		// The whole reason sample counts are fixed: two different poses of the
		// same shape must produce identical command sequences so `d: path()`
		// can interpolate between them.
		const a = roughShape({ kind: 'line', from: [0, 0], to: [400, 0] }, {}, 'id')[0];
		const b = roughShape({ kind: 'line', from: [10, 90], to: [1200, 400] }, {}, 'id')[0];
		expect(cmds(a)).toBe(cmds(b));
		expect(nums(a)).toHaveLength(nums(b).length);
	});

	it('holds command structure constant across shape KINDS of one segment', () => {
		const line = roughShape(LINE, {}, 'id')[0];
		const curve = roughShape(CURVE, {}, 'id')[0];
		const arc = roughShape(ARC, {}, 'id')[0];
		expect(cmds(line)).toBe(cmds(curve));
		expect(cmds(curve)).toBe(cmds(arc));
	});

	it('starts with a move and then only cubics', () => {
		expect(cmds(roughShape(CURVE, {}, 'id')[0])).toMatch(/^MC+$/);
	});

	it('keeps a polyline corner sharp by splitting it into runs', () => {
		// Two segments ⇒ an L bridge between them, not one smoothed sweep.
		expect(cmds(roughShape(POLY, {}, 'id')[0])).toMatch(/^MC+LC+$/);
	});

	it('emits only finite numbers for degenerate geometry', () => {
		const zero: PathShape = { kind: 'line', from: [50, 50], to: [50, 50] };
		for (const d of roughShape(zero, {}, 'id')) {
			expect(d).not.toMatch(/NaN|Infinity/);
			expect(nums(d).every(Number.isFinite)).toBe(true);
		}
	});

	it('survives non-finite props without emitting NaN', () => {
		const bad: PathShape = { kind: 'line', from: [NaN, 0], to: [400, Infinity] };
		for (const d of roughShape(bad, {}, 'id')) expect(d).not.toMatch(/NaN|Infinity/);
	});

	it('wobbles further at higher roughness', () => {
		const spread = (d: string) => {
			const ys = nums(d).filter((_, i) => i % 2 === 1);
			return Math.max(...ys) - Math.min(...ys);
		};
		const gentle = spread(roughShape(LINE, { roughness: 0.5 }, 'id')[0]);
		const wild = spread(roughShape(LINE, { roughness: 3 }, 'id')[0]);
		expect(wild).toBeGreaterThan(gentle);
	});

	it('stays near the true shape — wobble is bounded, not a scribble', () => {
		// A roughened horizontal line must not wander off the canvas.
		const ys = nums(roughShape(LINE, { roughness: 1 }, 'id')[0]).filter((_, i) => i % 2 === 1);
		expect(Math.max(...ys.map(Math.abs))).toBeLessThan(30);
	});

	it('clamps absurd options rather than exploding', () => {
		const d = roughShape(LINE, { roughness: 999, passes: 99, samples: 9999 }, 'id');
		expect(d.length).toBeLessThanOrEqual(4);
		expect(d[0]).not.toMatch(/NaN/);
	});
});

describe('roughShapes (chained Path)', () => {
	it('joins segments into one subpath per pass', () => {
		const chain: PathShape[] = [
			{ kind: 'line', from: [0, 0], to: [100, 0] },
			{ kind: 'quadratic', from: [100, 0], to: [200, 100], c1: [150, 0] }
		];
		const d = roughShapes(chain, {}, 'id')[0];
		expect(cmds(d)).toMatch(/^MC+LC+$/);
		expect((d.match(/M/g) ?? [])).toHaveLength(1);
	});

	it('is deterministic', () => {
		const chain: PathShape[] = [{ kind: 'line', from: [0, 0], to: [100, 0] }];
		expect(roughShapes(chain, {}, 'id')).toEqual(roughShapes(chain, {}, 'id'));
	});

	it('returns nothing for an empty chain', () => {
		expect(roughShapes([], {}, 'id')).toEqual([]);
	});
});

describe('roughRect', () => {
	it('draws four independent edges per pass', () => {
		const d = roughRect(0, 0, 200, 100, {}, 'id')[0];
		expect((d.match(/M/g) ?? [])).toHaveLength(4);
	});

	it('overshoots its corners — the signature of a drawn box', () => {
		// Some emitted point must fall outside the true box, or it is a
		// computer's rectangle however much it wobbles.
		const xs = nums(roughRect(0, 0, 200, 100, { roughness: 1 }, 'id')[0]).filter(
			(_, i) => i % 2 === 0
		);
		expect(Math.min(...xs) < 0 || Math.max(...xs) > 200).toBe(true);
	});

	it('is deterministic and pass-distinct', () => {
		expect(roughRect(0, 0, 200, 100, {}, 'id')).toEqual(roughRect(0, 0, 200, 100, {}, 'id'));
		const [a, b] = roughRect(0, 0, 200, 100, { passes: 2 }, 'id');
		expect(a).not.toEqual(b);
	});

	it('handles a zero-size box without NaN', () => {
		for (const d of roughRect(10, 10, 0, 0, {}, 'id')) expect(d).not.toMatch(/NaN/);
	});

	it('renders nothing at roughness 0', () => {
		expect(roughRect(0, 0, 200, 100, { roughness: 0 }, 'id')).toEqual([]);
	});
});

describe('roughEllipse', () => {
	it('produces a closed loop per pass', () => {
		const ds = roughEllipse(0, 0, 200, 100, { passes: 2 }, 'id');
		expect(ds).toHaveLength(2);
		for (const d of ds) expect(cmds(d)).toMatch(/^MC+$/);
	});

	it('is deterministic', () => {
		expect(roughEllipse(0, 0, 200, 100, {}, 'id')).toEqual(
			roughEllipse(0, 0, 200, 100, {}, 'id')
		);
	});

	it('stays near the true ellipse', () => {
		const d = roughEllipse(0, 0, 200, 200, { roughness: 1 }, 'id')[0];
		const n = nums(d);
		for (let i = 0; i + 1 < n.length; i += 2) {
			const r = Math.hypot(n[i] - 100, n[i + 1] - 100);
			expect(r).toBeGreaterThan(60);
			expect(r).toBeLessThan(140);
		}
	});

	it('handles a zero-size box without NaN', () => {
		for (const d of roughEllipse(5, 5, 0, 0, {}, 'id')) expect(d).not.toMatch(/NaN/);
	});
});

describe('ellipsePoints / boxCorners / fillPolygon', () => {
	it('boxCorners walks the box clockwise from top-left', () => {
		expect(boxCorners(10, 20, 100, 50)).toEqual([
			[10, 20],
			[110, 20],
			[110, 70],
			[10, 70]
		]);
	});

	it('boxCorners coerces non-finite input', () => {
		expect(boxCorners(NaN, 0, 10, 10)[0]).toEqual([0, 0]);
	});

	it('ellipsePoints closes and sits on the ellipse', () => {
		const pts = ellipsePoints(0, 0, 200, 100, 16);
		expect(pts).toHaveLength(17);
		expect(pts[16]).toEqual(pts[0]);
		for (const [x, y] of pts) {
			const v = ((x - 100) / 100) ** 2 + ((y - 50) / 50) ** 2;
			expect(v).toBeCloseTo(1, 6);
		}
	});

	it('fillPolygon gives an open polygon for both kinds', () => {
		expect(fillPolygon('rect', 0, 0, 10, 10)).toHaveLength(4);
		const ell = fillPolygon('ellipse', 0, 0, 10, 10);
		expect(ell.length).toBeGreaterThan(8);
		expect(ell[ell.length - 1]).not.toEqual(ell[0]);
	});
});

describe('hachureSegments', () => {
	it('fills a convex box with one segment per line', () => {
		const segs = hachureSegments(boxCorners(0, 0, 100, 100), 0, 10);
		expect(segs.length).toBeGreaterThan(5);
		for (const [a, b] of segs) expect(a[1]).toBeCloseTo(b[1], 6);
	});

	it('spans the full width at 0°', () => {
		const [a, b] = hachureSegments(boxCorners(0, 0, 100, 100), 0, 20)[0];
		expect(Math.min(a[0], b[0])).toBeCloseTo(0, 6);
		expect(Math.max(a[0], b[0])).toBeCloseTo(100, 6);
	});

	it('respects the gap — a wider gap gives fewer lines', () => {
		const tight = hachureSegments(boxCorners(0, 0, 100, 100), 0, 5);
		const loose = hachureSegments(boxCorners(0, 0, 100, 100), 0, 25);
		expect(tight.length).toBeGreaterThan(loose.length);
	});

	it('produces two segments per line across a concave polygon', () => {
		// A U shape: a horizontal scan through the arms crosses four edges.
		const u: Point[] = [
			[0, 0],
			[30, 0],
			[30, 70],
			[70, 70],
			[70, 0],
			[100, 0],
			[100, 100],
			[0, 100]
		];
		const segs = hachureSegments(u, 0, 10);
		const inArms = segs.filter(([a]) => a[1] < 60);
		expect(inArms.length).toBeGreaterThan(2);
	});

	it('stays inside the shape it fills', () => {
		for (const [a, b] of hachureSegments(boxCorners(0, 0, 100, 100), -45, 8)) {
			for (const p of [a, b]) {
				expect(p[0]).toBeGreaterThanOrEqual(-0.001);
				expect(p[0]).toBeLessThanOrEqual(100.001);
				expect(p[1]).toBeGreaterThanOrEqual(-0.001);
				expect(p[1]).toBeLessThanOrEqual(100.001);
			}
		}
	});

	it('returns none for a degenerate polygon rather than looping forever', () => {
		expect(hachureSegments([], 0, 10)).toEqual([]);
		expect(hachureSegments([[0, 0]], 0, 10)).toEqual([]);
		expect(
			hachureSegments(
				[
					[0, 0],
					[10, 0],
					[20, 0]
				],
				0,
				10
			)
		).toEqual([]);
	});

	it('survives a zero or non-finite gap', () => {
		expect(hachureSegments(boxCorners(0, 0, 50, 50), 0, 0).length).toBeGreaterThan(0);
		expect(hachureSegments(boxCorners(0, 0, 50, 50), 0, NaN).length).toBeGreaterThan(0);
	});

	it('drops non-finite vertices instead of emitting NaN', () => {
		const segs = hachureSegments(
			[
				[0, 0],
				[100, 0],
				[NaN, 50],
				[100, 100],
				[0, 100]
			],
			0,
			20
		);
		expect(segs.flat(2).every(Number.isFinite)).toBe(true);
	});
});

describe('hachurePath', () => {
	it('emits one move per fill line', () => {
		const d = hachurePath(boxCorners(0, 0, 100, 100), { gap: 20 }, 'id');
		expect((d.match(/M/g) ?? []).length).toBeGreaterThan(2);
	});

	it('cross-hatch lays down more ink than hachure', () => {
		const one = hachurePath(boxCorners(0, 0, 100, 100), { gap: 15 }, 'id', 'hachure');
		const two = hachurePath(boxCorners(0, 0, 100, 100), { gap: 15 }, 'id', 'cross-hatch');
		expect((two.match(/M/g) ?? []).length).toBeGreaterThan((one.match(/M/g) ?? []).length);
	});

	it('is deterministic', () => {
		const poly = boxCorners(0, 0, 100, 100);
		expect(hachurePath(poly, { gap: 12 }, 'id')).toBe(hachurePath(poly, { gap: 12 }, 'id'));
	});

	it('never emits NaN', () => {
		expect(hachurePath(boxCorners(0, 0, 0, 0), {}, 'id')).not.toMatch(/NaN/);
	});

	it('is empty for a degenerate polygon', () => {
		expect(hachurePath([], {}, 'id')).toBe('');
	});
});

describe('roughArrowHead', () => {
	it('draws two open barbs', () => {
		const d = roughArrowHead([100, 100], 0, 20, {}, 'id');
		expect((d.match(/M/g) ?? [])).toHaveLength(2);
		expect(d).not.toMatch(/Z/);
	});

	it('is deterministic', () => {
		expect(roughArrowHead([100, 100], 1, 20, {}, 'id')).toBe(
			roughArrowHead([100, 100], 1, 20, {}, 'id')
		);
	});

	it('puts both barbs behind the tip', () => {
		// Pointing along +x, every barb point must sit at or left of the tip.
		const xs = nums(roughArrowHead([100, 0], 0, 20, { roughness: 0.5 }, 'id')).filter(
			(_, i) => i % 2 === 0
		);
		expect(Math.max(...xs)).toBeLessThanOrEqual(101);
	});

	it('survives a non-finite tip or angle', () => {
		expect(roughArrowHead([NaN, 0], NaN, 20, {}, 'id')).not.toMatch(/NaN/);
	});
});
