import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BlockZHost from './BlockZHost.svelte';
import { adjustMode, canAdjust } from '$lib/stores/adjustMode';
import { adjustChanges } from '$lib/stores/adjustChanges';
import { blockAnchors } from '$lib/stores/blockAnchors';
import { selectedBlock } from '$lib/stores/selectedBlock';
import { clearClip } from '$lib/stores/blockClipboard';
import { undo } from '$lib/stores/adjustHistory';
import { saveAdjust } from '$lib/stores/adjustSave';
import { PASTE_OFFSET } from '$lib/adjust/pasteCore';

// Copy / paste in ADJUST mode: the copy is a second LIVE instance of the source
// Block, pending until SAVE. The source half (duplicating the element) is
// unit-tested in adjustPatch.test.ts.

const blocks = (root: ParentNode) => [...root.querySelectorAll('.movable')] as HTMLElement[];
const select = async (el: HTMLElement) => {
	el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
	await tick();
};
const press = async (key: string, mods: KeyboardEventInit = {}) => {
	document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods }));
	await tick();
};
const copy = () => press('c', { ctrlKey: true });
const paste = () => press('v', { ctrlKey: true });
const entryFor = (name: string) => [...get(adjustChanges).values()].find((e) => e.name === name);

beforeEach(() => {
	clearClip();
	selectedBlock.set(null);
	canAdjust.set(true);
	adjustMode.set(true);
});
afterEach(() => {
	adjustMode.set(false);
	vi.unstubAllGlobals();
});

describe('Block copy / paste (ADJUST mode)', () => {
	it('Ctrl+C then Ctrl+V renders a live, renamed, offset copy — selected, pending SAVE', async () => {
		const { container } = render(BlockZHost);
		await tick();
		await select(blocks(container)[0]);
		await copy();
		await paste();
		const all = blocks(container);
		expect(all).toHaveLength(3);
		const pasted = all.find((b) => b.classList.contains('pasted'))!;
		expect(pasted.textContent).toContain('A'); // the slot came along
		expect(pasted.style.left).toBe(`${100 + PASTE_OFFSET}px`);
		expect(get(blockAnchors).has('a-2')).toBe(true);
		expect(pasted.classList.contains('selected')).toBe(true);
		expect(entryFor('a-2')).toMatchObject({ dirty: true, pasteOf: { name: 'a' } });
	});

	it('pastes again cascade, and a copy of the copy is numbered from the source', async () => {
		const { container } = render(BlockZHost);
		await tick();
		await select(blocks(container)[0]);
		await copy();
		await paste();
		await paste();
		expect(get(blockAnchors).has('a-3')).toBe(true);
		const third = blocks(container).find((b) => b.style.left === `${100 + 2 * PASTE_OFFSET}px`);
		expect(third).toBeTruthy();
		await copy(); // a-3 is selected now
		await paste();
		expect(get(blockAnchors).has('a-4')).toBe(true);
		expect(entryFor('a-4')?.pasteOf?.name).toBe('a');
	});

	it('undo takes the paste away; deleting a copy leaves nothing to save', async () => {
		const { container } = render(BlockZHost);
		await tick();
		await select(blocks(container)[0]);
		await copy();
		await paste();
		undo();
		await tick();
		expect(blocks(container)).toHaveLength(2);
		expect(entryFor('a-2')).toBeUndefined();
		await paste();
		await press('Delete');
		expect(entryFor('a-2')).toMatchObject({ dirty: false });
	});

	it('Ctrl+V with nothing copied does nothing', async () => {
		const { container } = render(BlockZHost);
		await tick();
		await paste();
		expect(blocks(container)).toHaveLength(2);
	});

	it('SAVE sends the paste first, keyed to the original', async () => {
		const fetch = vi.fn(async () => new Response(JSON.stringify({ patched: 2, unmatched: [] })));
		vi.stubGlobal('fetch', fetch);
		const { container } = render(BlockZHost);
		await tick();
		await select(blocks(container)[0]);
		await copy();
		await paste();
		await saveAdjust();
		const body = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
		expect(body.changes[0]).toMatchObject({
			kind: 'Block',
			name: 'a',
			before: { x: 100, y: 100, width: 400, height: 300 },
			paste: { name: 'a-2', after: { x: 100 + PASTE_OFFSET, y: 100 + PASTE_OFFSET } }
		});
	});
});
