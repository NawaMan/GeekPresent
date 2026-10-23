// ☰ → HIDE BARS / SHOW BARS — both window-edge bars hidden completely (bare chrome), or back.
//
// The row and Alt+. → B write the same sticky choice as `?bare` / `?bare=off`, so what is
// pinned here is that the row says which way it will flip, that a click and the letter both
// flip it, and that a second flip brings the bars back.
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, describe, expect, it } from 'vitest';
import SlideDeck from '$lib/components/SlideDeck.svelte';
import { bareTucked, chromeBare, setBareChoice } from '$lib/stores/chromeBare';
import { chromeArmed, disarmChrome } from '$lib/stores/chromeArm';
import { BARE_KEY } from '$lib/chrome/chromeBareCore';
import { setPageUrl, resetPageUrl } from './stubs/app-stores';

const pages = [{ path: 'stub.html', title: 'Stub' }];

async function mount() {
	setPageUrl('/slides/stub.html');
	const { container } = render(SlideDeck, { props: { pages, annotate: true } });
	await tick();
	await tick();
	return container;
}

// Match by the label's last word: it reads "HIDE BARS" or "SHOW BARS".
const barsRow = (root: ParentNode) =>
	[...root.querySelectorAll('.annot-tool')].find((b) =>
		b.textContent?.trim().endsWith('BARS')
	) as HTMLElement;

afterEach(() => {
	disarmChrome();
	bareTucked.set(false);
	setBareChoice(false);
	localStorage.removeItem(BARE_KEY);
	resetPageUrl();
});

describe('SlideDeck — ☰ BARS', () => {
	it('offers HIDE BARS, hides both bars on a click, then offers SHOW BARS', async () => {
		const root = await mount();
		expect(get(chromeBare)).toBe(false);
		expect(barsRow(root).textContent?.trim()).toBe('HIDE BARS');

		await fireEvent.click(barsRow(root));
		expect(get(chromeBare)).toBe(true);
		expect(root.querySelector('.annot-tools')?.classList.contains('bare')).toBe(true);
		expect(barsRow(root).textContent?.trim()).toBe('SHOW BARS');

		await fireEvent.click(barsRow(root));
		expect(get(chromeBare)).toBe(false);
		expect(root.querySelector('.annot-tools')?.classList.contains('bare')).toBe(false);
	});

	it('goes at once — the pointer still on the row does not hold the bars up', async () => {
		// A bare bar normally stays while hovered or focused. Just after HIDE BARS the pointer is
		// still ON the row it clicked, so both bars carry `.tucked`, which hides them regardless.
		const root = await mount();
		const row = barsRow(root);
		row.focus();
		await fireEvent.click(row);
		await tick();
		expect(root.querySelector('.annot-tools')?.classList.contains('tucked')).toBe(true);
		expect(root.querySelector('.ctrl-bar')?.classList.contains('tucked')).toBe(true);
		expect(root.querySelector('.annot-tools')?.contains(document.activeElement)).toBe(false);

		// Alt+. is the way back: it raises them, and from then on hover holds a bar as usual.
		await fireEvent.keyDown(window, { key: '.', code: 'Period', altKey: true });
		await tick();
		expect(get(bareTucked)).toBe(false);
		expect(root.querySelector('.annot-tools')?.classList.contains('tucked')).toBe(false);
	});

	it('Alt+. then B flips it from the keyboard, both ways', async () => {
		await mount();

		await fireEvent.keyDown(window, { key: '.', code: 'Period', altKey: true });
		await fireEvent.keyDown(window, { key: 'b', code: 'KeyB' });
		expect(get(chromeBare)).toBe(true);
		// Hiding drops the Alt+. raise too — otherwise the bars would wait out its timer.
		expect(get(chromeArmed)).toBe(false);

		await fireEvent.keyDown(window, { key: '.', code: 'Period', altKey: true });
		await fireEvent.keyDown(window, { key: 'b', code: 'KeyB' });
		expect(get(chromeBare)).toBe(false);
	});
});
