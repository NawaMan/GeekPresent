import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import BlockZHost from './BlockZHost.svelte';
import { adjustMode, canAdjust } from '$lib/stores/adjustMode';
import { adjustChanges } from '$lib/stores/adjustChanges';
import { blockAnchors } from '$lib/stores/blockAnchors';
import { selectedBlock } from '$lib/stores/selectedBlock';
import { undo, redo } from '$lib/stores/adjustHistory';

// Delete on a selected Block in ADJUST mode: a PENDING removal — hidden, anchor
// withdrawn, reported `removed` for SAVE, undoable. The source half (cutting the
// element out) is unit-tested in adjustPatch.test.ts.

const blocks = (root: ParentNode) => [...root.querySelectorAll('.movable')] as HTMLElement[];
const select = async (el: HTMLElement) => {
	el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
	await tick();
};
const press = async (key: string, target: EventTarget = document.body) => {
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
	await tick();
};
const entryFor = (name: string) => [...get(adjustChanges).values()].find((e) => e.name === name);

beforeEach(() => {
	selectedBlock.set(null);
	canAdjust.set(true);
	adjustMode.set(true);
});
afterEach(() => adjustMode.set(false));

describe('Block delete (ADJUST mode)', () => {
	it('Delete hides the selected Block, withdraws its anchor and reports it removed', async () => {
		const { container } = render(BlockZHost);
		await tick();
		const [a, b] = blocks(container);
		await select(a);
		await press('Delete');
		expect(a.classList.contains('removed')).toBe(true);
		expect(b.classList.contains('removed')).toBe(false);
		expect(get(selectedBlock)).toBeNull();
		expect(get(blockAnchors).has('a')).toBe(false);
		expect(entryFor('a')).toMatchObject({ dirty: true, removed: true });
		expect(entryFor('b')?.removed).toBe(false);
	});

	it('undo brings it back; redo deletes it again', async () => {
		const { container } = render(BlockZHost);
		await tick();
		const [a] = blocks(container);
		await select(a);
		await press('Backspace');
		undo();
		await tick();
		expect(a.classList.contains('removed')).toBe(false);
		expect(get(blockAnchors).has('a')).toBe(true);
		expect(entryFor('a')).toMatchObject({ dirty: false, removed: false });
		redo();
		await tick();
		expect(a.classList.contains('removed')).toBe(true);
	});

	it('the ✕ button deletes too', async () => {
		const { container } = render(BlockZHost);
		await tick();
		const [, b] = blocks(container);
		(b.querySelector('button[aria-label="Delete block"]') as HTMLButtonElement).click();
		await tick();
		expect(b.classList.contains('removed')).toBe(true);
	});

	it('does nothing with no selection, or while typing in a field', async () => {
		const { container } = render(BlockZHost);
		await tick();
		const [a] = blocks(container);
		await press('Delete');
		expect(a.classList.contains('removed')).toBe(false);
		await select(a);
		const input = document.createElement('input');
		document.body.appendChild(input);
		await press('Delete', input);
		expect(a.classList.contains('removed')).toBe(false);
		input.remove();
	});
});
