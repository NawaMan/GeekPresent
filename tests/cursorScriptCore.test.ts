// Pure compiler for <Cursor>'s chained warpTo/moveTo/around scripts. No DOM,
// no component — the same contract cursorCore.test.ts / connectorCore.test.ts
// hold: every number that reaches generated CSS is finite, and every
// degenerate input still yields a drawable (or static) result.
import { describe, expect, it } from 'vitest';
import { compileScript, cursorScript, type ResolvedCursorCommand } from '../src/lib/draw/cursorScriptCore';

describe('compileScript — single command (no motion)', () => {
	it('a lone command is a static pose at pct 0, zero duration', () => {
		const r = compileScript([{ kind: 'warpTo', at: [500, 300], click: false }], 40);
		expect(r.totalSeconds).toBe(0);
		expect(r.stops).toEqual([{ pct: 0, x: 480, y: 280, w: 40, h: 40, rot: 0 }]);
		expect(r.ripples).toEqual([]);
	});

	it('a click on the lone command still fires a ripple, at delay 0', () => {
		const r = compileScript([{ kind: 'moveTo', at: [10, 20], times: 1, period: 3, click: true }], 40);
		expect(r.ripples).toEqual([{ x: 10, y: 20, delaySec: 0 }]);
	});

	it('empty input compiles to nothing', () => {
		expect(compileScript([], 40)).toEqual({ stops: [], ripples: [], totalSeconds: 0 });
	});
});

describe('compileScript — warpTo', () => {
	it('is an instant cut: a short, fixed-duration two-stop snap', () => {
		const cmds: ResolvedCursorCommand[] = [
			{ kind: 'warpTo', at: [0, 0], click: false },
			{ kind: 'warpTo', at: [500, 500], click: true }
		];
		const r = compileScript(cmds, 20);
		expect(r.totalSeconds).toBeCloseTo(0.05, 5);
		expect(r.stops).toHaveLength(2);
		expect(r.stops[0]).toMatchObject({ pct: 0, x: -10, y: -10 });
		expect(r.stops[1]).toMatchObject({ pct: 100, x: 490, y: 490 });
		expect(r.ripples).toEqual([{ x: 500, y: 500, delaySec: 0.05 }]);
	});
});

describe('compileScript — moveTo (there-and-back)', () => {
	it('bounces to the target and back, ending where it started', () => {
		const cmds: ResolvedCursorCommand[] = [
			{ kind: 'warpTo', at: [100, 100], click: false },
			{ kind: 'moveTo', at: [300, 100], times: 1, period: 2, click: true }
		];
		const r = compileScript(cmds, 40);
		expect(r.totalSeconds).toBe(2);
		// start (0%) → out (50%, the target) → back (100%, home again).
		expect(r.stops.map((s) => s.pct)).toEqual([0, 50, 100]);
		expect(r.stops[0]).toMatchObject({ x: 80, y: 80 });
		expect(r.stops[1]).toMatchObject({ x: 280, y: 80 });
		expect(r.stops[2]).toMatchObject({ x: 80, y: 80 }); // back home
		expect(r.ripples).toEqual([{ x: 300, y: 100, delaySec: 1 }]);
	});

	it('repeats `times` round trips, one ripple per outward arrival', () => {
		const cmds: ResolvedCursorCommand[] = [
			{ kind: 'warpTo', at: [0, 0], click: false },
			{ kind: 'moveTo', at: [100, 0], times: 3, period: 2, click: true }
		];
		const r = compileScript(cmds, 20);
		expect(r.totalSeconds).toBe(6); // 3 round trips × 2s
		expect(r.ripples).toHaveLength(3);
		expect(r.ripples.map((p) => p.delaySec)).toEqual([1, 3, 5]);
		// A command after the bounce would resume from [0, 0] — "current" never moved.
	});

	it('a subsequent command continues from the pre-bounce position, not the target', () => {
		const cmds: ResolvedCursorCommand[] = [
			{ kind: 'warpTo', at: [0, 0], click: false },
			{ kind: 'moveTo', at: [900, 900], times: 1, period: 1, click: false },
			{ kind: 'warpTo', at: [50, 50], click: false }
		];
		const r = compileScript(cmds, 20);
		// The final warpTo departs from [0,0] (home after the bounce), so its
		// pre-warp pose is still [0,0], not [900,900].
		const secondToLast = r.stops[r.stops.length - 2];
		expect(secondToLast).toMatchObject({ x: -10, y: -10 }); // [0,0] − 20/2
	});
});

describe('compileScript — around (orbit)', () => {
	it('enters at the angle of the current point relative to the centre', () => {
		const cmds: ResolvedCursorCommand[] = [
			{ kind: 'warpTo', at: [600, 300], click: false }, // straight above the centre
			{ kind: 'around', at: [600, 400], rx: 100, ry: 50, times: 1, period: 3.2, click: true }
		];
		const r = compileScript(cmds, 20);
		expect(r.totalSeconds).toBeCloseTo(3.2, 3);
		// One full lap returns to the entry angle — same point it started the loop at.
		const last = r.stops[r.stops.length - 1];
		expect(last.x).toBeCloseTo(600 - 10, 0); // centre.x + rx·cos(entry) − size/2, entry ≈ −90°
		expect(last.y).toBeCloseTo(350 - 10, 0); // centre.y − ry
		expect(r.ripples).toHaveLength(1); // exactly one, at the completed lap
		expect(r.ripples[0].delaySec).toBeCloseTo(3.2, 3);
	});

	it('multiple laps fire one ripple per completed lap, not per sample', () => {
		const cmds: ResolvedCursorCommand[] = [
			{ kind: 'warpTo', at: [700, 300], click: false },
			{ kind: 'around', at: [600, 300], rx: 100, ry: 100, times: 3, period: 1, click: true }
		];
		const r = compileScript(cmds, 20);
		expect(r.ripples).toHaveLength(3);
		expect(r.ripples.map((p) => Math.round(p.delaySec * 100) / 100)).toEqual([1, 2, 3]);
	});

	it('a degenerate rx/ry orbits along a flat line rather than throwing', () => {
		const cmds: ResolvedCursorCommand[] = [
			{ kind: 'warpTo', at: [500, 500], click: false },
			{ kind: 'around', at: [500, 500], rx: 0, ry: 80, times: 1, period: 1, click: false }
		];
		const r = compileScript(cmds, 20);
		for (const s of r.stops) {
			for (const v of [s.x, s.y, s.w, s.h, s.rot]) expect(Number.isFinite(v)).toBe(true);
		}
	});
});

describe('compileScript — NaN safety', () => {
	it('garbage coordinates, radii and timing never produce NaN/Infinity', () => {
		const cmds: ResolvedCursorCommand[] = [
			{ kind: 'warpTo', at: [NaN, Infinity], click: false },
			{
				kind: 'moveTo',
				at: [-Infinity, 10],
				times: NaN as unknown as number,
				period: -5,
				click: true
			},
			{ kind: 'around', at: [10, NaN], rx: NaN, ry: -20, times: 0, period: NaN, click: true }
		];
		const r = compileScript(cmds, NaN);
		for (const s of r.stops) {
			for (const v of [s.pct, s.x, s.y, s.w, s.h, s.rot]) expect(Number.isFinite(v)).toBe(true);
			expect(s.w).toBeGreaterThanOrEqual(1);
			expect(s.h).toBeGreaterThanOrEqual(1);
		}
		for (const p of r.ripples) {
			expect(Number.isFinite(p.x)).toBe(true);
			expect(Number.isFinite(p.y)).toBe(true);
			expect(Number.isFinite(p.delaySec)).toBe(true);
			expect(p.delaySec).toBeGreaterThanOrEqual(0);
		}
		expect(Number.isFinite(r.totalSeconds)).toBe(true);
	});
});

describe('cursorScript builder', () => {
	it('chains into a plain, serializable command array — nothing executes', () => {
		const cmds = cursorScript()
			.warpTo([0, 0])
			.moveTo('save-btn', { times: 2, period: 1 })
			.around('dial', 80, 40, { times: 1, period: 2, click: true })
			.build();
		expect(cmds).toEqual([
			{ kind: 'warpTo', at: [0, 0] },
			{ kind: 'moveTo', at: 'save-btn', times: 2, period: 1 },
			{ kind: 'around', at: 'dial', rx: 80, ry: 40, times: 1, period: 2, click: true }
		]);
	});
});
