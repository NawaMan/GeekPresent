import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Block from '../src/lib/components/Block.svelte';
import { saveAdjust } from '../src/lib/stores/adjustSave';
import { canAdjust, adjustMode } from '../src/lib/stores/adjustMode';
import { selectedBlock } from '../src/lib/stores/selectedBlock';
import { blockAnchors } from '../src/lib/stores/blockAnchors';
import { adjustChanges } from '../src/lib/stores/adjustChanges';
import GroupHost from './GroupHost.svelte';
import GroupStepsHost from './GroupStepsHost.svelte';

// jsdom has no layout, so trackPointer's live scale falls back to 1 (see
// BlockDrag.test.ts): a pointer move of N px is N canvas px.

function pointer(type: string, clientX: number, clientY: number) {
	const ev = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY, detail: 0 });
	Object.defineProperty(ev, 'pointerId', { value: 1 });
	return ev;
}

/** The Block whose content is `label` (A, B or OUT). */
function block(root: ParentNode, label: string): HTMLElement {
	const all = [...root.querySelectorAll('.movable')] as HTMLElement[];
	const found = all.find((el) => el.querySelector('.fill-layer')?.textContent?.trim() === label);
	if (!found) throw new Error(`no block ${label}`);
	return found;
}
const px = (v: string) => Number.parseFloat(v);
const rect = (el: HTMLElement) => ({
	x: px(el.style.left),
	y: px(el.style.top),
	width: px(el.style.width),
	height: px(el.style.height)
});

async function mount(props: Record<string, unknown>) {
	const r = render(GroupHost, { props });
	await tick();
	await tick();
	return r.container;
}

beforeEach(() => {
	selectedBlock.set(null);
});
afterEach(() => {
	adjustMode.set(false);
	canAdjust.set(false);
});

describe('Group — placement', () => {
	it('maps every member through x/y/scale', async () => {
		const c = await mount({ x: 100, y: 50, scale: 2 });
		expect(rect(block(c, 'A'))).toEqual({ x: 300, y: 250, width: 400, height: 200 });
		expect(rect(block(c, 'B'))).toEqual({ x: 900, y: 650, width: 200, height: 100 });
	});

	it('zooms the content with the box: laid out at local size, scaled from the corner', async () => {
		const c = await mount({ scale: 2 });
		const layer = block(c, 'A').querySelector('.fill-layer') as HTMLElement;
		expect(layer.style.width).toBe('200px');
		expect(layer.style.transform).toBe('scale(2)');
	});

	it('an identity group adds no transform at all', async () => {
		const c = await mount({});
		const layer = block(c, 'A').querySelector('.fill-layer') as HTMLElement;
		expect(layer.getAttribute('style')).toBeNull();
		expect(rect(block(c, 'A'))).toEqual({ x: 100, y: 100, width: 200, height: 100 });
	});

	it('a Block outside every group is untouched', async () => {
		const c = await mount({ x: 500, scale: 3 });
		expect(rect(block(c, 'OUT'))).toEqual({ x: 10, y: 20, width: 30, height: 40 });
		expect(block(c, 'OUT').querySelector('.fill-layer')?.getAttribute('style')).toBeNull();
	});
});

describe('Group — cameras by name', () => {
	it('focus centres the named member on the canvas, zoomed', async () => {
		const c = await mount({ focus: 'b', zoom: 2 });
		const b = rect(block(c, 'B'));
		expect(b.width).toBe(200);
		expect(b.x + b.width / 2).toBe(960);
		expect(b.y + b.height / 2).toBe(540);
	});

	it('fit makes the named member fill the canvas', async () => {
		const c = await mount({ fit: 'a' });
		const a = rect(block(c, 'A'));
		expect(a.width).toBe(1920); // 200×100 is wider than 16:9, so width touches
		expect(a.x).toBe(0);
		expect(a.y + a.height / 2).toBe(540);
	});

	it('view fills the canvas with a local rectangle', async () => {
		const c = await mount({ view: { x: 100, y: 100, width: 192, height: 108 } });
		const a = rect(block(c, 'A'));
		expect(a).toEqual({ x: 0, y: 0, width: 2000, height: 1000 });
	});
});

describe('Group — nesting', () => {
	it('composes an inner group into the outer one', async () => {
		const c = await mount({ nested: true, outerX: 1000, scale: 0.5 });
		expect(rect(block(c, 'A'))).toEqual({ x: 1050, y: 50, width: 100, height: 50 });
	});

	it('an outer camera can fit a member of an inner group', async () => {
		const c = await mount({ nested: true, scale: 0.5, outerFit: 'b' });
		// 50×25 in the outer space is wider than 16:9, so its width touches.
		expect(rect(block(c, 'B')).width).toBeCloseTo(1920);
	});

	it('an outer camera can fit a whole named inner group', async () => {
		const c = await mount({ nested: true, scale: 0.5, outerFit: 'inner' });
		const a = rect(block(c, 'A'));
		const b = rect(block(c, 'B'));
		// The members' extent fills the canvas height (it is wider than tall but not 16:9).
		expect(b.y + b.height - a.y).toBeCloseTo(1080);
	});
});

describe('Group — hide and morph', () => {
	it('hides a member by name, keeping its box', async () => {
		const c = await mount({ hide: ['b'] });
		expect(block(c, 'B').classList.contains('concealed')).toBe(true);
		expect(block(c, 'A').classList.contains('concealed')).toBe(false);
		expect(rect(block(c, 'B')).width).toBe(100);
	});

	it('an outer group hides a whole inner group by its name', async () => {
		const c = await mount({ nested: true, outerHide: ['inner'] });
		expect(block(c, 'A').classList.contains('concealed')).toBe(true);
		expect(block(c, 'B').classList.contains('concealed')).toBe(true);
		expect(block(c, 'OUT').classList.contains('concealed')).toBe(false);
	});

	it('names every member for the morph, through nested groups, scoped to the kind', async () => {
		const c = await mount({ nested: true, morph: 'cam', morphOn: 'camera' });
		expect(block(c, 'A').getAttribute('data-gp-morph')).toBe('cam-a');
		expect(block(c, 'B').getAttribute('data-gp-morph')).toBe('cam-b');
		expect(block(c, 'OUT').hasAttribute('data-gp-morph')).toBe(false);
		const css = [...c.querySelectorAll('style')].map((s) => s.textContent).join('\n');
		expect(css).toContain('html[data-vt-kind="camera"] [data-gp-morph="cam-a"] { view-transition-name: cam-a; }');
		expect(css).toContain('[data-gp-morph="cam-b"]');
	});

	it('without morph, members carry no name at all', async () => {
		const c = await mount({});
		expect(block(c, 'A').hasAttribute('data-gp-morph')).toBe(false);
		expect(c.querySelector('style')).toBeNull();
	});
});

describe('Group — glide, driven by a Steps build', () => {
	it('Steps hands the slide its step, and the camera follows it', async () => {
		const r = render(GroupStepsHost, { props: {} });
		await tick();
		expect(r.container.querySelector('.step')?.textContent).toBe('0');
		expect(rect(block(r.container, 'B')).width).toBe(100);

		(r.component as unknown as { next: () => void }).next();
		await tick();
		await tick();
		expect(r.container.querySelector('.step')?.textContent).toBe('1');
		const b = rect(block(r.container, 'B'));
		expect(b.width).toBe(200);
		expect(b.x + b.width / 2).toBe(960);
		expect(block(r.container, 'A').classList.contains('concealed')).toBe(true);
	});

	it('glides: members carry the duration, and keep their zoom layer even at 1×', async () => {
		const r = render(GroupStepsHost, { props: { glide: 0.5 } });
		await tick();
		const a = block(r.container, 'A');
		expect(a.classList.contains('gliding')).toBe(false); // armed after the first paint
		await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
		await tick();
		expect(a.classList.contains('gliding')).toBe(true);
		expect(a.style.getPropertyValue('--gp-glide')).toBe('0.5s');
		// At 1× the layer still wears its transform, so a zoom back DOWN animates.
		expect((a.querySelector('.fill-layer') as HTMLElement).style.transform).toBe('scale(1)');
	});

	it('no glide: nothing changes for an ordinary group', async () => {
		const r = render(GroupStepsHost, { props: { glide: 0 } });
		await tick();
		const a = block(r.container, 'A');
		expect(a.classList.contains('gliding')).toBe(false);
		expect(a.querySelector('.fill-layer')?.getAttribute('style')).toBeNull();
	});

	it('switches off while ADJUST is on, so a drag tracks the pointer', async () => {
		canAdjust.set(true);
		adjustMode.set(true);
		const r = render(GroupStepsHost, { props: { glide: 0.5 } });
		await tick();
		expect(block(r.container, 'A').classList.contains('gliding')).toBe(false);
	});
});

describe('Group — move, per slide, by name', () => {
	it('moves one named member; the others stay where they are drawn', async () => {
		const c = await mount({ move: { a: { x: 480, y: -40 } } });
		expect(rect(block(c, 'A'))).toEqual({ x: 580, y: 60, width: 200, height: 100 });
		expect(rect(block(c, 'B'))).toEqual({ x: 400, y: 300, width: 100, height: 50 });
	});

	it('moves in the drawing\'s units, and scales about the part\'s centre', async () => {
		const c = await mount({ scale: 2, move: { a: { x: 10 } } });
		expect(rect(block(c, 'A'))).toEqual({ x: 220, y: 200, width: 400, height: 200 }); // 2 × (110, 100)
		const d = await mount({ move: { b: { scale: 2 } } });
		expect(rect(block(d, 'B'))).toEqual({ x: 350, y: 275, width: 200, height: 100 });
	});

	it("a nested group's name moves all of it", async () => {
		const c = await mount({ nested: true, outerMove: { inner: { x: 100 } } });
		expect(rect(block(c, 'A')).x).toBe(200);
		expect(rect(block(c, 'B')).x).toBe(500);
	});

	it('a camera and a Connector find the part where it was moved to', async () => {
		const c = await mount({ focus: 'b', zoom: 1, move: { b: { x: 500 } } });
		const b = rect(block(c, 'B'));
		expect(b.x + b.width / 2).toBe(960); // centred at its MOVED spot
		await mount({ move: { a: { x: 50 } } });
		expect(get(blockAnchors).get('a')).toEqual({ x: 150, y: 100, width: 200, height: 100 });
	});

	it('a drag moves where the part is DRAWN — what SAVE writes — with the move still on top', async () => {
		canAdjust.set(true);
		adjustMode.set(true);
		const c = await mount({ move: { a: { x: 480 } } });
		const a = block(c, 'A');
		a.dispatchEvent(pointer('pointerdown', 0, 0));
		window.dispatchEvent(pointer('pointermove', 30, 20));
		window.dispatchEvent(pointer('pointerup', 30, 20));
		await tick();

		expect(rect(a)).toEqual({ x: 610, y: 120, width: 200, height: 100 });
		expect(a.querySelector('.readout')?.textContent).toContain('a · 130,120');
		expect(a.querySelector('.readout')?.textContent).toContain('moved');
		const entry = [...get(adjustChanges).values()].find((e) => e.name === 'a')!;
		expect(entry.after).toMatchObject({ x: 130, y: 120 });
	});

	it('a resize of a scaled part follows the pointer at its dragged edge', async () => {
		canAdjust.set(true);
		adjustMode.set(true);
		const c = await mount({ move: { a: { scale: 3 } } });
		const a = block(c, 'A');
		const right = () => rect(a).x + rect(a).width;
		const before = right();
		const grip = a.querySelector('.handle') as HTMLElement;
		grip.dispatchEvent(pointer('pointerdown', 0, 0));
		window.dispatchEvent(pointer('pointermove', 60, 0));
		window.dispatchEvent(pointer('pointerup', 60, 0));
		await tick();
		expect(right() - before).toBeCloseTo(60, 0);
	});
});

describe('Group — anchors and ADJUST', () => {
	it('publishes canvas boxes, so a Connector outside the group finds them', async () => {
		await mount({ x: 100, y: 50, scale: 2 });
		expect(get(blockAnchors).get('a')).toEqual({ x: 300, y: 250, width: 400, height: 200 });
	});

	it('a drag inside a zoomed group moves the Block in LOCAL units — what SAVE writes', async () => {
		canAdjust.set(true);
		adjustMode.set(true);
		const c = await mount({ scale: 2 });
		const a = block(c, 'A');
		a.dispatchEvent(pointer('pointerdown', 0, 0));
		window.dispatchEvent(pointer('pointermove', 100, 40));
		window.dispatchEvent(pointer('pointerup', 100, 40));
		await tick();

		expect(rect(a)).toEqual({ x: 300, y: 240, width: 400, height: 200 }); // 2 × (150, 120)
		expect(a.querySelector('.readout')?.textContent).toContain('a · 150,120');
		const entry = [...get(adjustChanges).values()].find((e) => e.name === 'a')!;
		expect(entry.after).toMatchObject({ x: 150, y: 120, width: 200, height: 100 });
		expect(entry.before).toMatchObject({ x: 100, y: 100 });
	});

	it('bounds="canvas" clamps to the canvas as seen in local units', async () => {
		canAdjust.set(true);
		adjustMode.set(true);
		const c = await mount({ scale: 2, bounds: 'canvas' });
		const a = block(c, 'A');
		a.dispatchEvent(pointer('pointerdown', 0, 0));
		window.dispatchEvent(pointer('pointermove', 5000, 0));
		window.dispatchEvent(pointer('pointerup', 5000, 0));
		await tick();
		// Local stage is 960 wide at ×2, so a 200-wide Block stops at x = 760.
		expect(rect(a).x + rect(a).width).toBe(1920);
	});

	it("SAVE sends a stamped Block's own file, so a scene component gets patched", async () => {
		canAdjust.set(true);
		adjustMode.set(true);
		// What the dev source-stamp plugin adds to a tag written in a component.
		const { container } = render(Block, {
			props: { name: 'api', x: 100, y: 100, width: 200, height: 100, bounds: 'none', __file: 'src/routes/deck/Scene.svelte' }
		});
		await tick();
		const a = container.querySelector('.movable') as HTMLElement;
		a.dispatchEvent(pointer('pointerdown', 0, 0));
		window.dispatchEvent(pointer('pointermove', 30, 0));
		window.dispatchEvent(pointer('pointerup', 30, 0));
		await tick();

		const fetch = vi.fn(async () => new Response(JSON.stringify({ patched: 1, unmatched: [] })));
		vi.stubGlobal('fetch', fetch);
		await saveAdjust();
		const body = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
		expect(body.changes).toEqual([
			expect.objectContaining({ name: 'api', file: 'src/routes/deck/Scene.svelte', after: expect.objectContaining({ x: 130 }) })
		]);
		vi.unstubAllGlobals();
	});

	it('draws a group outline labelled with the prop in charge', async () => {
		canAdjust.set(true);
		adjustMode.set(true);
		const c = await mount({ focus: 'b', zoom: 2 });
		expect(c.querySelector('.group-label')?.textContent).toContain('focus b · ×2');
	});
});
