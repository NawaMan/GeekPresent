// Sprite — the KeyframeStudio flying element folded into the Draw family. The
// moving element renders in a <foreignObject> and animates as pure generated
// CSS @keyframes; ADJUST-mode ghosts get move/resize/rotate handles and the
// shared keyframe panel (pct + easing, no drawn — a Sprite has no reveal).
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { redo, undo } from '../src/lib/stores/adjustHistory';
import { canAdjust, adjustMode } from '../src/lib/stores/adjustMode';
import DrawSpriteHost from './DrawSpriteHost.svelte';
import DrawSpriteShiftHost from './DrawSpriteShiftHost.svelte';

const moveTo = (clientX: number, clientY: number, init: MouseEventInit = {}) =>
	window.dispatchEvent(new MouseEvent('pointermove', { clientX, clientY, ...init }));
const release = () => window.dispatchEvent(new MouseEvent('pointerup'));

async function grab(el: Element, clientX = 0, clientY = 0) {
	const ev = new MouseEvent('pointerdown', { clientX, clientY, bubbles: true });
	Object.defineProperty(ev, 'pointerId', { value: 1 });
	el.dispatchEvent(ev);
	await tick();
}

const spriteEl = (c: HTMLElement) => c.querySelector('.sprite-el') as HTMLElement;
const keyframeStyle = (c: HTMLElement) =>
	Array.from(c.querySelectorAll('style'))
		.map((s) => s.textContent ?? '')
		.find((t) => t.includes('@keyframes draw-sprite-')) ?? '';

describe('Sprite rendering', () => {
	beforeEach(() => {
		canAdjust.set(false);
		adjustMode.set(false);
	});

	it('renders the moving element in a foreignObject at the 0% base pose', () => {
		const { container } = render(DrawSpriteHost);
		const fo = container.querySelector('foreignObject')!;
		expect(fo).not.toBeNull();
		expect(fo.getAttribute('width')).toBe('1920');
		// The surface must never eat input.
		expect(fo.style.pointerEvents).toBe('none');
		const el = spriteEl(container);
		expect(el.style.left).toBe('100px');
		expect(el.style.top).toBe('800px');
		expect(el.style.width).toBe('56px');
		expect(el.textContent?.trim()).toBe('ROCKET');
	});

	it('generates pure-CSS @keyframes with rotation, per-stop easing and font-size', () => {
		const { container } = render(DrawSpriteHost);
		const css = keyframeStyle(container);
		expect(css).toContain('left:100px; top:800px;');
		expect(css).toContain('transform:rotate(20deg);');
		expect(css).toContain('font-size:47px;'); // 56 * 0.84 rounded
		expect(css).toContain('animation-timing-function:ease-in;'); // 0% stop
		expect(css).toContain('animation-timing-function:ease-out;'); // 100% stop
		// The moving element runs it as an ordinary CSS animation (scrubbable).
		expect(spriteEl(container).style.animation).toContain('draw-sprite-');
		expect(css).not.toContain('NaN');
	});

	it('paused freezes the flight at its base pose via animation-play-state', () => {
		const { container } = render(DrawSpriteHost);
		const frozen = container.querySelectorAll('.sprite-el')[2] as HTMLElement;
		expect(frozen.textContent?.trim()).toBe('FROZEN');
		expect(frozen.style.left).toBe('200px'); // still the base (0%) pose
		expect(frozen.style.animation).toContain('draw-sprite-'); // keyframes still generated
		expect(frozen.style.animationPlayState).toBe('paused');
	});

	it('shows no editing chrome outside ADJUST mode, but the element still flies', () => {
		const { container } = render(DrawSpriteHost);
		expect(container.querySelector('.sprite-hit')).toBeNull();
		expect(container.querySelector('.draw-handle')).toBeNull();
		expect(spriteEl(container)).not.toBeNull();
	});
});

describe('Sprite editing (ADJUST mode)', () => {
	beforeEach(() => {
		canAdjust.set(true);
		adjustMode.set(true);
	});
	afterEach(() => {
		canAdjust.set(false);
		adjustMode.set(false);
	});

	it('renders one ghost box per stop; selecting reveals move/resize/rotate handles', async () => {
		const { container } = render(DrawSpriteHost);
		const hits = container.querySelectorAll('.sprite-hit');
		expect(hits).toHaveLength(3); // one per (unlocked) stop — the locked sprite adds none
		// No handles until selected.
		expect(container.querySelector('.draw-handle')).toBeNull();
		await grab(hits[0]);
		// 3 handles (move/resize/rotate) × 3 stops.
		expect(container.querySelectorAll('.draw-handle')).toHaveLength(9);
	});

	it('shows a keyframe panel with an easing picker per stop and no drawn field', async () => {
		const { container } = render(DrawSpriteHost);
		await grab(container.querySelector('.sprite-hit')!);
		const panel = container.querySelector('.tb-keyframes')!;
		expect(panel).not.toBeNull();
		expect(panel.querySelectorAll('.tb-kfrow')).toHaveLength(3);
		expect(panel.querySelectorAll('.tb-ease').length).toBe(3);
		// A Sprite has no reveal track — no "drawn" column.
		expect(panel.querySelector('.tb-drawnlabel')).toBeNull();
	});

	it('dragging the 0% move handle repositions that stop; undo/redo walk it', async () => {
		const { container } = render(DrawSpriteHost);
		await grab(container.querySelector('.sprite-hit')!);
		// The first handle of the first stop is its MOVE handle, at the box center
		// (100+28, 800+28) = (128, 828).
		const move = container.querySelectorAll('.draw-handle')[0];
		await grab(move, 0, 0);
		moveTo(300, 200); // +300x, +200y at scale 1
		release();
		await tick();
		// Base pose (= sorted 0% stop) followed the drag: x 100 → 400, y 800 → 1000.
		expect(spriteEl(container).style.left).toBe('400px');
		expect(spriteEl(container).style.top).toBe('1000px');
		// …and it shows up in the generated keyframes too.
		expect(keyframeStyle(container)).toContain('left:400px; top:1000px;');

		undo();
		await tick();
		expect(spriteEl(container).style.left).toBe('100px');
		redo();
		await tick();
		expect(spriteEl(container).style.left).toBe('400px');
	});

	it('a locked sprite still flies but grows zero ADJUST chrome', () => {
		const { container } = render(DrawSpriteHost);
		// Both sprites render and animate…
		const els = container.querySelectorAll('.sprite-el');
		expect(els).toHaveLength(3);
		expect((els[1] as HTMLElement).style.animation).toContain('draw-sprite-');
		// …but only the unlocked one has ghost boxes: 3 stops, not 3 + 2.
		expect(container.querySelectorAll('.sprite-hit')).toHaveLength(3);
		expect(container.querySelectorAll('.sprite-box')).toHaveLength(3);
	});

	it('"+ keyframe" adds an interpolated stop; remove floors at 2; % retimes', async () => {
		const { container } = render(DrawSpriteHost);
		await grab(container.querySelector('.sprite-hit')!);
		(container.querySelector('.tb-keyframes .tb-add') as HTMLButtonElement).click();
		await tick();
		expect(container.querySelectorAll('.tb-keyframes .tb-kfrow')).toHaveLength(4);

		// Remove down to the floor of 2.
		const dels = () =>
			Array.from(container.querySelectorAll('.tb-keyframes .tb-del')) as HTMLButtonElement[];
		dels()[0].click();
		await tick();
		dels()[0].click();
		await tick();
		expect(container.querySelectorAll('.tb-keyframes .tb-kfrow')).toHaveLength(2);
		// The remaining delete buttons are disabled at the floor.
		expect(dels().every((b) => b.disabled)).toBe(true);
	});
});

// What Shift does on a stop's handles, i.e. Sprite's `shiftSnap` overrides.
// DrawHandle's default locks to H/V from the GRAB point; a keyframe stop wants
// its LEG aligned against the stop before it, and its rotate grip wants round
// angles. Each case below asserts a value the default cannot produce.
describe('Sprite editing — Shift on a stop handle (ADJUST mode)', () => {
	beforeEach(() => {
		canAdjust.set(true);
		adjustMode.set(true);
	});
	afterEach(() => {
		canAdjust.set(false);
		adjustMode.set(false);
	});

	// Handles come out in markup order, three per stop: move, resize, rotate.
	// Stops are 100×100 at (100,100) / (600,500) / (1200,900), so the centers
	// are (150,150) / (650,550) / (1250,950) and equal `top` == aligned leg.
	const handles = (c: HTMLElement) => c.querySelectorAll('.draw-handle');
	async function select(c: HTMLElement) {
		await grab(c.querySelector('.sprite-hit')!);
	}

	it('Shift on a move handle aligns the leg with the PREVIOUS stop', async () => {
		const { container } = render(DrawSpriteShiftHost);
		await select(container);
		await grab(handles(container)[3], 0, 0); // 50% stop, move handle at (650,550)
		moveTo(60, -20, { shiftKey: true }); // candidate (710,530)
		release();
		await tick();
		// Snapped against the 0% center (150,150): |Δx| 560 > |Δy| 380, so the leg
		// goes horizontal and y follows the 0% stop — top 500 → 100, matching it.
		// The default (H/V from the grab point) would have held y at 550 → top 500.
		expect(keyframeStyle(container)).toContain('50% { left:660px; top:100px;');
		undo();
	});

	it('the FIRST stop has no predecessor, so it aligns against its successor', async () => {
		const { container } = render(DrawSpriteShiftHost);
		await select(container);
		await grab(handles(container)[0], 0, 0); // 0% stop, move handle at (150,150)
		moveTo(40, 300, { shiftKey: true }); // candidate (190,450)
		release();
		await tick();
		// Against the 50% center (650,550): |Δx| 460 > |Δy| 100 → horizontal leg,
		// so top lands on 500. The default would have gone vertical → top 400.
		expect(keyframeStyle(container)).toContain('0% { left:140px; top:500px;');
		undo();
	});

	it('Shift on a rotate grip snaps the angle to 15° detents', async () => {
		const { container } = render(DrawSpriteShiftHost);
		await select(container);
		await grab(handles(container)[5], 0, 0); // 50% stop, grip at (650,460)
		moveTo(100, 100, { shiftKey: true }); // candidate (750,560)
		release();
		await tick();
		// Around the center (650,550) that candidate sits at 5.71°, which rounds to
		// the 0° detent → rot 90. Unsnapped it would be 96; the default rule (90°
		// off the grab point) would give 180. Every other stop is at rot 0, so a
		// 90deg frame can only have come from the detent.
		expect(keyframeStyle(container)).toContain('rotate(90deg)');
		undo();
	});

	it('the resize handle keeps the default Shift: one axis, not aspect ratio', async () => {
		const { container } = render(DrawSpriteShiftHost);
		await select(container);
		await grab(handles(container)[4], 0, 0); // 50% stop, corner at (700,600)
		moveTo(200, 40, { shiftKey: true }); // candidate (900,640) → H lock → (900,600)
		release();
		await tick();
		// Width grows, height is untouched. Deliberate: locking one dimension is a
		// coherent thing for Shift to mean on a corner, so it keeps the default.
		expect(keyframeStyle(container)).toContain('width:300px; height:100px;');
		undo();
	});
});
