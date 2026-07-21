// Pure compiler for <Cursor>'s CHAINED command scripts — warpTo/moveTo/around,
// composed into one flight. No component imports, no DOM, no stores: the
// same discipline cursorCore.ts follows. Cursor.svelte resolves every
// command's `at` (and `around`'s centre) against blockAnchors first
// (Connector's job); this module only ever sees already-resolved points.
//
// WHY THIS ISN'T JUST CSS animation-iteration-count/direction: those apply
// to a WHOLE @keyframes block, not one leg of a chain — there's no way to
// loop just the `moveTo` in the middle and then continue to the `around`.
// So every repeat/bounce/lap is baked directly into the generated stop
// list, which is also why `around` needs no new Draw PathShape: the
// ellipse is sampled into literal points here, same as any other command.
//
// SEMANTICS (pin these — see cursorScriptCore.test.ts):
//   - The FIRST command only estabishes the starting pose (no motion cost).
//     A script of length 1 is a static cursor, exactly like a one-entry
//     `path`.
//   - warpTo(at): an instant cut — two stops ~WARP_SECONDS apart, so the
//     browser has no time to interpolate. Becomes the new "current" point.
//   - moveTo(at, {times, period}): THERE-AND-BACK, `times` full round trips
//     of `period` seconds each. Ends back where it started — "current"
//     is unchanged, so a moveTo is a pure emphasis gesture that never
//     moves the flight's actual position.
//   - around(at, rx, ry, {times, period}): `at` is the ORBIT CENTRE.
//     Entry angle is computed from the CURRENT point relative to the
//     centre (so entering the loop is a natural swoop onto the ring, not
//     an arbitrary snap to angle 0), then `times` full laps of `period`
//     seconds each. Ends back at that same entry angle — "current" becomes
//     the ring point at the entry angle (which may differ slightly from
//     the pre-orbit point if it wasn't already sitting on the ellipse).
//   - `click` on any command flashes a ripple where it lands: once for
//     warpTo's arrival, once per moveTo repetition's outward arrival, once
//     per completed orbit lap.
import { finite } from './drawCore';
import type { CursorAt } from './cursorCore';
import type { CursorRipple } from './cursorCore';
import type { Point, SpriteStop } from './types';

interface CommandCommon {
	/** Flash a click ripple where this command's motion lands. */
	click?: boolean;
}

export interface CursorWarpCommand extends CommandCommon {
	kind: 'warpTo';
	at: CursorAt;
}

export interface CursorMoveCommand extends CommandCommon {
	kind: 'moveTo';
	at: CursorAt;
	/** Round trips to make. Default 1. */
	times?: number;
	/** Seconds per round trip. Default 3. */
	period?: number;
}

export interface CursorAroundCommand extends CommandCommon {
	kind: 'around';
	/** The orbit's CENTRE. */
	at: CursorAt;
	rx: number;
	ry: number;
	/** Full laps to make. Default 1. */
	times?: number;
	/** Seconds per lap. Default 3. */
	period?: number;
}

/** One step of a chained Cursor flight, author-facing (`at`/`around`'s centre
 *  may still be a Block name — Cursor.svelte resolves it before compiling). */
export type CursorCommand = CursorWarpCommand | CursorMoveCommand | CursorAroundCommand;

/** A CursorCommand with every point already resolved to canvas px. What
 *  `compileScript` actually consumes. */
export type ResolvedCursorCommand =
	| { kind: 'warpTo'; at: Point; click: boolean }
	| { kind: 'moveTo'; at: Point; times: number; period: number; click: boolean }
	| { kind: 'around'; at: Point; rx: number; ry: number; times: number; period: number; click: boolean };

export interface CursorScriptResult {
	stops: SpriteStop[];
	ripples: CursorRipple[];
	/** The whole flight's duration in seconds — feed straight to Cursor's
	 *  `animate`. 0 for a single-command (static) script. */
	totalSeconds: number;
}

const WARP_SECONDS = 0.05;
const SAMPLES_PER_LAP = 32;

const safePoint = (p: Point): Point => [finite(p[0]), finite(p[1])];
const posOf = (cmd: ResolvedCursorCommand): Point =>
	cmd.kind === 'around'
		? [finite(cmd.at[0]) + Math.max(0, finite(cmd.rx)), finite(cmd.at[1])]
		: safePoint(cmd.at);

/**
 * Compile a chained command list into Sprite `stops` + ripple checkpoints,
 * exactly like `cursorSpriteStops`/`cursorRipples` do for the simpler
 * waypoint-list `path` prop, just over heterogeneous, possibly-repeating
 * segments. Degenerate-safe: empty input → nothing; a single command → a
 * static pose; every coordinate/timing value coerces finite.
 */
export function compileScript(commands: ResolvedCursorCommand[], size: number): CursorScriptResult {
	if (commands.length === 0) return { stops: [], ripples: [], totalSeconds: 0 };
	const box = Math.max(1, finite(size, 40));

	const frames: { t: number; x: number; y: number }[] = [];
	const ripples: CursorRipple[] = [];

	let pos = posOf(commands[0]);
	frames.push({ t: 0, x: pos[0], y: pos[1] });
	if (commands[0].click) ripples.push({ x: pos[0], y: pos[1], delaySec: 0 });

	let t = 0;
	for (let i = 1; i < commands.length; i++) {
		const cmd = commands[i];
		if (cmd.kind === 'warpTo') {
			const to = safePoint(cmd.at);
			t += WARP_SECONDS;
			frames.push({ t, x: to[0], y: to[1] });
			if (cmd.click) ripples.push({ x: to[0], y: to[1], delaySec: t });
			pos = to;
		} else if (cmd.kind === 'moveTo') {
			const to = safePoint(cmd.at);
			const times = Math.max(1, Math.round(finite(cmd.times, 1)));
			const period = Math.max(0, finite(cmd.period, 3));
			const half = period / 2;
			const home = pos; // a bounce always returns HERE — "current" never moves.
			for (let k = 0; k < times; k++) {
				t += half;
				frames.push({ t, x: to[0], y: to[1] });
				if (cmd.click) ripples.push({ x: to[0], y: to[1], delaySec: t });
				t += half;
				frames.push({ t, x: home[0], y: home[1] });
			}
		} else {
			// around: entry angle from the CURRENT point relative to the centre,
			// so the loop is entered smoothly rather than snapping to angle 0.
			const cx = finite(cmd.at[0]);
			const cy = finite(cmd.at[1]);
			const rx = Math.max(0, finite(cmd.rx));
			const ry = Math.max(0, finite(cmd.ry));
			const times = Math.max(1, Math.round(finite(cmd.times, 1)));
			const period = Math.max(0, finite(cmd.period, 3));
			const dx = pos[0] - cx;
			const dy = pos[1] - cy;
			const entryAngle = dx === 0 && dy === 0 ? 0 : Math.atan2(dy, dx);
			const totalSteps = SAMPLES_PER_LAP * times;
			const stepDt = totalSteps > 0 ? (period * times) / totalSteps : 0;
			for (let k = 1; k <= totalSteps; k++) {
				const angle = entryAngle + (2 * Math.PI * k) / SAMPLES_PER_LAP;
				const x = cx + rx * Math.cos(angle);
				const y = cy + ry * Math.sin(angle);
				t += stepDt;
				frames.push({ t, x, y });
				if (cmd.click && k % SAMPLES_PER_LAP === 0) ripples.push({ x, y, delaySec: t });
			}
			const last = frames[frames.length - 1];
			pos = [last.x, last.y];
		}
	}

	const totalSeconds = frames.length > 1 ? Math.max(frames[frames.length - 1].t, 0) : 0;
	const denom = totalSeconds > 0 ? totalSeconds : 1;
	const stops: SpriteStop[] = frames.map((f) => ({
		pct: frames.length > 1 ? Math.round((f.t / denom) * 10000) / 100 : 0,
		x: Math.round(f.x - box / 2),
		y: Math.round(f.y - box / 2),
		w: box,
		h: box,
		rot: 0
	}));

	return { stops, ripples, totalSeconds };
}

/** Authoring sugar over a plain, serializable `CursorCommand[]` — chaining
 *  reads naturally but nothing here executes anything; `.build()` just
 *  returns the array `compileScript`/`Cursor` consume. */
export interface CursorScriptBuilder {
	warpTo(at: CursorAt, opts?: { click?: boolean }): CursorScriptBuilder;
	moveTo(at: CursorAt, opts?: { times?: number; period?: number; click?: boolean }): CursorScriptBuilder;
	around(
		at: CursorAt,
		rx: number,
		ry: number,
		opts?: { times?: number; period?: number; click?: boolean }
	): CursorScriptBuilder;
	build(): CursorCommand[];
}

export function cursorScript(): CursorScriptBuilder {
	const commands: CursorCommand[] = [];
	const builder: CursorScriptBuilder = {
		warpTo(at, opts) {
			commands.push({ kind: 'warpTo', at, ...opts });
			return builder;
		},
		moveTo(at, opts) {
			commands.push({ kind: 'moveTo', at, ...opts });
			return builder;
		},
		around(at, rx, ry, opts) {
			commands.push({ kind: 'around', at, rx, ry, ...opts });
			return builder;
		},
		build() {
			return commands;
		}
	};
	return builder;
}
