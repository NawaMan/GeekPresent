// DOM tests for the ink overlay: it draws, it REMEMBERS (per slide, across reloads), it
// undoes and resets, it offers to clear ink that has gone stale — and it is INERT with the
// pen down, which is what keeps a tool nobody armed from eating clicks on every slide.
import { render, cleanup, fireEvent, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { tick } from 'svelte';
import AnnotateHost from './AnnotateHost.svelte';
import {
	annotationMode,
	canAnnotate,
	annotateTool,
	annotateColor,
	inkBook,
	inkPath,
	strokes,
	staleDismissed,
	inkStaleAfterMs,
	barPos,
	setInkPath,
	resetAllInk
} from '../src/lib/stores/annotation';
import { INK_STALE_AFTER_MS } from '../src/lib/annotate/annotateCore';

const SLIDE = '/slides/intro.html';
const OTHER = '/slides/next.html';

// The overlay is laid out at canvas size and then CSS-scaled; jsdom does no layout, so every
// rect is zero and toCanvasPoint would correctly (but uselessly) fold every stroke onto the
// origin. Stub the one measurement it makes: the surface on screen at half size, so client
// (x, y) maps to canvas (2x, 2y) and the assertions below can say where the ink landed.
function surfaceAt(): SVGSVGElement {
	const svg = document.querySelector('.annot-surface') as SVGSVGElement;
	svg.getBoundingClientRect = () =>
		({ left: 0, top: 0, width: 960, height: 540, right: 960, bottom: 540, x: 0, y: 0 }) as DOMRect;
	return svg;
}

/** A pointer gesture. jsdom has no PointerEvent, but the handlers only read
    clientX/clientY/button/pointerId — all of which a MouseEvent carries. */
function stroke(svg: Element, points: [number, number][]): void {
	const at = (type: string, [clientX, clientY]: [number, number]) =>
		fireEvent(svg, new MouseEvent(type, { clientX, clientY, bubbles: true, button: 0 }));

	at('pointerdown', points[0]);
	for (const p of points.slice(1)) at('pointermove', p);
	at('pointerup', points[points.length - 1]);
}

beforeEach(() => {
	localStorage.clear();
	resetAllInk();
	canAnnotate.set(true);
	annotationMode.set(false);
	annotateTool.set('pen');
	annotateColor.set({ pen: null, highlighter: null });
	inkStaleAfterMs.set(INK_STALE_AFTER_MS);
	barPos.set(null);
	inkPath.set('');
	setInkPath(SLIDE);
	staleDismissed.set(false);
});

afterEach(cleanup);

describe('Annotate — armed', () => {
	beforeEach(() => annotationMode.set(true));

	it('turns a pointer gesture into a smoothed stroke in canvas pixels', () => {
		render(AnnotateHost);
		stroke(surfaceAt(), [[100, 100], [200, 150], [300, 100]]);

		const list = get(strokes);
		expect(list).toHaveLength(1);
		expect(list[0].tool).toBe('pen');
		// Half-size surface → client 100,100 is canvas 200,200.
		expect(list[0].points[0]).toEqual([200, 200]);

		const path = document.querySelector('.annot-stroke');
		expect(path?.getAttribute('d')).toContain('M 200 200');
		expect(path?.getAttribute('stroke-width')).toBe('6');
	});

	it('files the ink under the SLIDE, and survives paging away and back', () => {
		// The reversal: ink used to die on navigation. Now it is a book, and paging just turns
		// the page — the drawing is still there when you come back.
		render(AnnotateHost);
		stroke(surfaceAt(), [[10, 10], [60, 60]]);
		expect(get(strokes)).toHaveLength(1);

		setInkPath(OTHER);
		expect(get(strokes)).toHaveLength(0); // a different slide, a clean canvas

		setInkPath(SLIDE);
		expect(get(strokes)).toHaveLength(1); // …and back again
		expect(get(inkBook)[SLIDE].strokes).toHaveLength(1);
	});

	it('writes the ink to localStorage, which is also how the other window hears it', () => {
		render(AnnotateHost);
		stroke(surfaceAt(), [[10, 10], [60, 60]]);

		const raw = localStorage.getItem('geekpresent:ink');
		expect(raw).toBeTruthy();
		const book = JSON.parse(raw!);
		expect(book[SLIDE].strokes[0].points[0]).toEqual([20, 20]);
		expect(book[SLIDE].ts).toBeGreaterThan(0); // stamped, so it can later go stale
	});

	it('paints the highlighter as a fat band, not a line', () => {
		render(AnnotateHost);
		annotateTool.set('highlighter');
		stroke(surfaceAt(), [[10, 10], [200, 10]]);

		const path = document.querySelector('.annot-stroke');
		expect(path?.classList.contains('highlighter')).toBe(true);
		expect(Number(path?.getAttribute('stroke-width'))).toBe(34);
	});

	it('keeps a highlighter swipe LEVEL, however wobbly the hand was', () => {
		// A highlighter is not a pen: the band belongs on the row you swiped, not sloping along
		// with your wrist. Client y wobbles 50→60→45; canvas y is double that.
		render(AnnotateHost);
		annotateTool.set('highlighter');
		stroke(surfaceAt(), [[10, 50], [100, 60], [200, 45], [300, 50]]);

		const pts = get(strokes)[0].points;
		expect(pts).toHaveLength(2); // reduced to a level segment…
		expect(pts[0][1]).toBe(pts[1][1]); // …dead level…
		expect(document.querySelector('.annot-stroke')?.getAttribute('d')).not.toContain('C ');
	});

	it('does NOT level the pen — freehand stays freehand', () => {
		render(AnnotateHost);
		annotateTool.set('pen');
		stroke(surfaceAt(), [[10, 50], [100, 60], [200, 45], [300, 50]]);

		const pts = get(strokes)[0].points;
		expect(pts.length).toBeGreaterThan(2);
		expect(document.querySelector('.annot-stroke')?.getAttribute('d')).toContain('C ');
	});

	it('renders a lone tap as a dot rather than nothing', () => {
		render(AnnotateHost);
		const svg = surfaceAt();
		fireEvent(svg, new MouseEvent('pointerdown', { clientX: 50, clientY: 50, bubbles: true, button: 0 }));
		fireEvent(svg, new MouseEvent('pointerup', { clientX: 50, clientY: 50, bubbles: true, button: 0 }));

		expect(get(strokes)).toHaveLength(1);
		expect(document.querySelector('.annot-stroke')?.getAttribute('d')).toBe('M 100 100 L 100 100');
	});

	it('takes back one stroke with UNDO and this slide with RESET', async () => {
		render(AnnotateHost);
		const svg = surfaceAt();
		stroke(svg, [[10, 10], [60, 60]]);
		stroke(svg, [[80, 80], [120, 120]]);
		expect(get(strokes)).toHaveLength(2);

		await fireEvent.click(screen.getByText('UNDO'));
		expect(get(strokes)).toHaveLength(1);

		await fireEvent.click(screen.getByText('RESET'));
		expect(get(strokes)).toHaveLength(0);
		expect(document.querySelectorAll('.annot-stroke')).toHaveLength(0);
		// An emptied slide leaves NO entry behind, or the book would accrete a key per slide
		// ever visited and "has this slide got ink?" would stop being answerable by looking.
		expect(get(inkBook)[SLIDE]).toBeUndefined();
	});

	it('RESET ALL wipes every slide, not just this one', async () => {
		render(AnnotateHost);
		stroke(surfaceAt(), [[10, 10], [60, 60]]);
		setInkPath(OTHER);
		stroke(surfaceAt(), [[10, 10], [60, 60]]);
		expect(Object.keys(get(inkBook))).toHaveLength(2);

		await fireEvent.click(screen.getByText('RESET ALL'));
		expect(get(inkBook)).toEqual({});
	});

	it('draws in a picked colour, and the theme swatch means "no colour at all"', async () => {
		render(AnnotateHost, { props: { inkColors: [null, '#E5484D'] } });

		// A picked colour rides on the stroke and lands as an inline style…
		await fireEvent.click(screen.getByLabelText('Colour #E5484D'));
		stroke(surfaceAt(), [[10, 10], [60, 60]]);
		expect(get(strokes)[0].color).toBe('#E5484D');
		expect(document.querySelector('.annot-stroke')?.getAttribute('style')).toContain('#E5484D');

		// …whereas the THEME swatch stores nothing, so the role token paints it and the ink
		// follows a re-theme instead of freezing today's hex.
		await fireEvent.click(screen.getByLabelText('Theme colour'));
		stroke(surfaceAt(), [[200, 10], [260, 60]]);
		const latest = get(strokes)[1];
		expect(latest.color).toBeUndefined();
	});

	it('remembers a colour per tool', async () => {
		render(AnnotateHost, { props: { inkColors: [null, '#E5484D'] } });
		await fireEvent.click(screen.getByLabelText('Colour #E5484D'));
		expect(get(annotateColor).pen).toBe('#E5484D');
		// Switching tools must not drag the pen's colour onto the highlighter.
		annotateTool.set('highlighter');
		expect(get(annotateColor).highlighter).toBe(null);
	});

	it('puts the pen down on DONE, on Escape — and on the toggle itself', async () => {
		render(AnnotateHost);

		await fireEvent.click(screen.getByText('DONE'));
		expect(get(annotationMode)).toBe(false);

		annotationMode.set(true);
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(get(annotationMode)).toBe(false);

		// The bug this fixes: the toggle used to sit UNDER the ink surface, which owns every
		// pointer while armed — so it could arm the pen and never disarm it.
		annotationMode.set(true);
		await tick(); // a bare store.set doesn't flush the DOM; getByText below needs it to
		await fireEvent.click(screen.getByText('✎ ANNOTATE on'));
		expect(get(annotationMode)).toBe(false);
	});

	it('undoes on Ctrl+Z', async () => {
		render(AnnotateHost);
		stroke(surfaceAt(), [[10, 10], [60, 60]]);

		await fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
		expect(get(strokes)).toHaveLength(0);
	});

	it('leaves the paging keys alone', async () => {
		// A speaker who cannot advance is worse off than one who lost a scribble. The overlay
		// eats the POINTER, not the keyboard.
		render(AnnotateHost);
		expect(await fireEvent.keyDown(window, { key: 'ArrowRight' })).toBe(true);
		expect(await fireEvent.keyDown(window, { key: ' ' })).toBe(true);
		expect(get(annotationMode)).toBe(true);
	});

	it('takes the pointer only while armed', () => {
		render(AnnotateHost);
		expect(surfaceAt().style.pointerEvents).toBe('auto');
	});

	it('drags the bar by its grip, remembers where, and sends it home on double-click', async () => {
		render(AnnotateHost);
		surfaceAt(); // stub the surface rect: 960px wide for a 1920 canvas → scale 0.5

		const bar = document.querySelector('.annot-bar') as HTMLElement;
		bar.getBoundingClientRect = () =>
			({ left: 100, top: 400, width: 200, height: 30, right: 300, bottom: 430, x: 100, y: 400 }) as DOMRect;

		const grip = document.querySelector('.annot-grip') as HTMLElement;
		await fireEvent(grip, new MouseEvent('pointerdown', { clientX: 0, clientY: 0, bubbles: true, button: 0 }));
		await fireEvent(window, new MouseEvent('pointermove', { clientX: 50, clientY: 25, bubbles: true }));
		await fireEvent(window, new MouseEvent('pointerup', { bubbles: true }));

		// Bar was at canvas (200, 800); the pointer moved 50/25 screen px = 100/50 canvas px.
		expect(get(barPos)).toEqual({ x: 300, y: 850 });
		// …and it is remembered, so it does not need re-parking on the next slide.
		expect(JSON.parse(localStorage.getItem('annotationBarPos')!)).toEqual({ x: 300, y: 850 });

		// The escape hatch: a bar parked somewhere regrettable would otherwise stay there for good.
		await fireEvent.dblClick(grip);
		expect(get(barPos)).toBe(null);
	});

	it('does not draw a stroke while the grip is being dragged', async () => {
		// The grip sits ON the bar, which sits over the ink surface. Without stopPropagation the
		// same gesture that moves the bar would also scribble a line underneath it.
		render(AnnotateHost);
		surfaceAt();
		const grip = document.querySelector('.annot-grip') as HTMLElement;

		await fireEvent(grip, new MouseEvent('pointerdown', { clientX: 10, clientY: 10, bubbles: true, button: 0 }));
		await fireEvent(window, new MouseEvent('pointermove', { clientX: 60, clientY: 40, bubbles: true }));
		await fireEvent(window, new MouseEvent('pointerup', { bubbles: true }));

		expect(get(strokes)).toHaveLength(0);
	});

	it('clamps a bar dragged past the edge back into the canvas', async () => {
		render(AnnotateHost);
		surfaceAt();
		const bar = document.querySelector('.annot-bar') as HTMLElement;
		bar.getBoundingClientRect = () =>
			({ left: 0, top: 0, width: 200, height: 30, right: 200, bottom: 30, x: 0, y: 0 }) as DOMRect;

		const grip = document.querySelector('.annot-grip') as HTMLElement;
		await fireEvent(grip, new MouseEvent('pointerdown', { clientX: 0, clientY: 0, bubbles: true, button: 0 }));
		await fireEvent(window, new MouseEvent('pointermove', { clientX: -9999, clientY: -9999, bubbles: true }));
		await fireEvent(window, new MouseEvent('pointerup', { bubbles: true }));

		// Dragged off the top-left, it stops at the corner — because a bar off the edge is a bar
		// the speaker cannot get back, and the position is persisted.
		expect(get(barPos)).toEqual({ x: 0, y: 0 });
	});
});

describe('Annotate — the stale-ink notice', () => {
	const DAY = 24 * 60 * 60 * 1000;

	it('offers to clear ink drawn before the threshold', async () => {
		// Ink from a previous sitting is exactly what a persisted pen risks putting on stage.
		inkBook.set({ [SLIDE]: { strokes: [{ id: 'a', tool: 'pen', points: [[0, 0], [9, 9]] }], ts: Date.now() - 3 * DAY } });
		render(AnnotateHost);

		expect(screen.getByText(/3 days ago/)).toBeTruthy();

		await fireEvent.click(screen.getByText('RESET SLIDE'));
		expect(get(strokes)).toHaveLength(0);
	});

	it('says nothing about ink you drew today', () => {
		inkBook.set({ [SLIDE]: { strokes: [{ id: 'a', tool: 'pen', points: [[0, 0], [9, 9]] }], ts: Date.now() - 1000 } });
		render(AnnotateHost);
		expect(screen.queryByText('RESET SLIDE')).toBeNull();
	});

	it('says nothing at all about a slide with no ink', () => {
		render(AnnotateHost);
		expect(screen.queryByText('RESET SLIDE')).toBeNull();
	});

	it('KEEP dismisses it for this visit only, not for good', async () => {
		inkBook.set({ [SLIDE]: { strokes: [{ id: 'a', tool: 'pen', points: [[0, 0], [9, 9]] }], ts: Date.now() - 3 * DAY } });
		render(AnnotateHost);

		await fireEvent.click(screen.getByText('KEEP'));
		expect(screen.queryByText('RESET SLIDE')).toBeNull();
		expect(get(strokes)).toHaveLength(1); // the ink is KEPT, not cleared

		// Leave and come back: "not now" was not "never again".
		setInkPath(OTHER);
		setInkPath(SLIDE);
		expect(get(staleDismissed)).toBe(false);
	});
});

describe('Annotate — disarmed', () => {
	it('renders nothing but the toggle when there is no ink and the pen is down', () => {
		render(AnnotateHost);

		expect(document.querySelector('.annot-surface')).toBeNull();
		expect(screen.queryByText('PEN')).toBeNull();
		// …but the toggle IS there, or the pen could never be armed in the first place.
		expect(screen.getByText('✎ ANNOTATE')).toBeTruthy();
	});

	it('still SHOWS ink it is mirroring, with the pen down and the pointer let through', () => {
		// The audience window: it never arms the pen, but it must draw what the speaker's
		// window wrote — that is how the ink reaches the room.
		inkBook.set({ [SLIDE]: { strokes: [{ id: 'a', tool: 'pen', points: [[0, 0], [100, 100]] }], ts: Date.now() } });
		render(AnnotateHost);

		expect(document.querySelectorAll('.annot-stroke')).toHaveLength(1);
		expect((document.querySelector('.annot-surface') as SVGElement).style.pointerEvents).toBe('none');
		expect(screen.queryByText('PEN')).toBeNull(); // no palette in the audience's window
	});

	it('shows no chrome under ?clean / ?present', () => {
		render(AnnotateHost, { props: { chrome: false } });
		expect(screen.queryByText('✎ ANNOTATE')).toBeNull();
	});

	it('ignores a gesture when the deck never offered the pen', () => {
		// A stale persisted `annotationMode: true` from another deck must stay inert here.
		canAnnotate.set(false);
		annotationMode.set(true);
		inkBook.set({ [SLIDE]: { strokes: [{ id: 'a', tool: 'pen', points: [[0, 0], [10, 10]] }], ts: Date.now() } });
		render(AnnotateHost);

		const svg = surfaceAt();
		expect(svg.style.pointerEvents).toBe('none');
		stroke(svg, [[10, 10], [60, 60]]);
		expect(get(strokes)).toHaveLength(1); // the existing one, and nothing new
	});
});
