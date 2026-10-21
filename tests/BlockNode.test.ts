import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import BlockNodeHost from './BlockNodeHost.svelte';
import { adjustMode, canAdjust } from '$lib/stores/adjustMode';
import { adjustChanges } from '$lib/stores/adjustChanges';
import { blockAnchors } from '$lib/stores/blockAnchors';
import { selectedBlock } from '$lib/stores/selectedBlock';
import { clearClip } from '$lib/stores/blockClipboard';

// BlockNode is a Block wearing the diagram-box look. What must hold: the label
// lands in the box, the name publishes an anchor (Connector / Spotlight), and
// ADJUST sees it as `<BlockNode …>` — so SAVE, delete and copy/paste find the
// tag the author actually wrote.

const entryFor = (name: string) => [...get(adjustChanges).values()].find((e) => e.name === name);

beforeEach(() => {
	clearClip();
	selectedBlock.set(null);
	canAdjust.set(true);
	adjustMode.set(false);
});
afterEach(() => adjustMode.set(false));

describe('BlockNode', () => {
	it('renders its label inside a .node box at the Block geometry', () => {
		const { container } = render(BlockNodeHost);
		const movable = container.querySelector('.movable') as HTMLElement;
		expect(movable.style.left).toBe('100px');
		expect(movable.querySelector('.node')?.textContent).toBe('API');
	});

	it('publishes its name as an anchor', () => {
		render(BlockNodeHost);
		expect(get(blockAnchors).get('api')).toMatchObject({ x: 100, y: 200, width: 240, height: 110 });
	});

	it('reports its ADJUST tag as BlockNode, not Block', () => {
		render(BlockNodeHost);
		const e = entryFor('api')!;
		expect(e.kind).toBe('BlockNode');
		expect(e.oldTag.startsWith('<BlockNode name="api"')).toBe(true);
	});

	it('pastes as a BlockNode copy with the box look', async () => {
		adjustMode.set(true);
		const { container } = render(BlockNodeHost);
		await tick();
		const node = container.querySelector('.movable') as HTMLElement;
		node.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
		await tick();
		document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));
		document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true }));
		await tick();
		const pasted = container.querySelector('.movable.pasted') as HTMLElement;
		expect(pasted.querySelector('.node')?.textContent).toBe('API');
		expect(entryFor('api-2')).toMatchObject({ kind: 'BlockNode', pasteOf: { name: 'api' } });
	});

	it('forwards z — and so does ImageBlock now', () => {
		const { container } = render(BlockNodeHost, { props: { z: 3, imageZ: 4 } });
		const [node, image] = [...container.querySelectorAll('.movable')] as HTMLElement[];
		expect(node.style.zIndex).toBe('3');
		expect(image.style.zIndex).toBe('4');
	});
});
