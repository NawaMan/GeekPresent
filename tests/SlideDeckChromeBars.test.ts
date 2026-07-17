// SlideDeck's window-edge chrome bars are ON by default and opt-out via props —
// `toolBar={false}` / `controlBar={false}`. The top bar holds more authoring/dev
// rows (SOURCE/EDIT, ADJUST SAVE, …); the bottom bar is navigation (TOC + pager).
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import SlideDeck from '$lib/components/SlideDeck.svelte';
import { setPageUrl, resetPageUrl } from './stubs/app-stores';

const pages = [{ path: 'stub.html', title: 'Stub' }];

async function mount(props: Record<string, unknown> = {}) {
	setPageUrl('/slides/stub.html');
	const { container } = render(SlideDeck, { props: { pages, ...props } });
	await tick();
	await tick(); // onMount → initialized → overlay chrome
	return container;
}

afterEach(() => {
	cleanup();
	resetPageUrl();
});

describe('SlideDeck chrome bars — opt-out', () => {
	it('shows both bars by default', async () => {
		const root = await mount();
		expect(root.querySelector('.annot-tools')).not.toBeNull();
		expect(root.querySelector('.ctrl-bar')).not.toBeNull();
	});

	it('hides the ControlBar when controlBar={false}', async () => {
		const root = await mount({ controlBar: false });
		expect(root.querySelector('.ctrl-bar')).toBeNull();
		// Tool bar remains.
		expect(root.querySelector('.annot-tools')).not.toBeNull();
	});

	it('hides the tool bar when toolBar={false}', async () => {
		const root = await mount({ toolBar: false });
		expect(root.querySelector('.annot-tools')).toBeNull();
		// Control bar remains.
		expect(root.querySelector('.ctrl-bar')).not.toBeNull();
	});

	it('hides both when both are off (no empty overlay shell with only bars)', async () => {
		const root = await mount({ toolBar: false, controlBar: false });
		expect(root.querySelector('.annot-tools')).toBeNull();
		expect(root.querySelector('.ctrl-bar')).toBeNull();
		// Overlay itself is gated when neither bar is wanted.
		expect(root.querySelector('.overlay')).toBeNull();
	});
});
