import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import StepsHost from './StepsHost.svelte';
import GroupStepsHost from './GroupStepsHost.svelte';
import { navigate } from '../src/lib/utils/deckNav';
import { ARRIVAL_KEY, arrivalMark } from '../src/lib/utils/arrivalCore';

// Paging BACK into a build lands with it spent, so the slide looks as it was
// left. PREV leaves a mark (deckNav), the slide's Steps reads it once.

const frags = (root: ParentNode) => Array.from(root.querySelectorAll('.fragment')) as HTMLElement[];
const hidden = (el: HTMLElement) => el.classList.contains('hidden');
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

/** Pretend PREV just paged to this very page. */
function markHere() {
	sessionStorage.setItem(ARRIVAL_KEY, arrivalMark(window.location.href, window.location.href, Date.now())!);
}
function shiftSpace() {
	const ev = new KeyboardEvent('keydown', { key: ' ', code: 'Space', shiftKey: true, bubbles: true, cancelable: true });
	document.body.dispatchEvent(ev);
	return ev;
}

beforeEach(() => sessionStorage.clear());
afterEach(() => sessionStorage.clear());

describe('Steps — arriving backwards', () => {
	it('no mark: the build starts at step 0, as always', async () => {
		const { container } = render(StepsHost);
		await tick();
		expect(frags(container).every(hidden)).toBe(true);
	});

	it('PREV mark: every Fragment shows from the start, and Shift+Space peels from the end', async () => {
		markHere();
		const { container } = render(StepsHost);
		await tick();
		const f = frags(container);
		expect(f.some(hidden)).toBe(false);
		expect(sessionStorage.getItem(ARRIVAL_KEY)).toBeNull(); // read once

		const ev = shiftSpace();
		await tick();
		expect(ev.defaultPrevented).toBe(true);
		expect(hidden(f[2])).toBe(true);
		expect(hidden(f[1])).toBe(false);
	});

	it('backTo="start" ignores the mark', async () => {
		markHere();
		const { container } = render(StepsHost, { props: { backTo: 'start' } });
		await tick();
		expect(frags(container).every(hidden)).toBe(true);
	});

	it('hands the slide the real last step, and the camera starts there without gliding', async () => {
		markHere();
		const r = render(GroupStepsHost, { props: { glide: 0.5 } });
		await tick();
		expect(r.container.querySelector('.step')?.textContent).toBe('1');
		const b = r.container.querySelectorAll('.movable')[1] as HTMLElement;
		expect(b.style.width).toBe('200px'); // zoomed shot, from the first render
		expect(b.classList.contains('gliding')).toBe(false); // not before the first paint
		await frame();
		await frame();
		await tick();
		expect(b.classList.contains('gliding')).toBe(true); // later changes glide
	});
});

describe('deckNav — who leaves the mark', () => {
	it('arriveAtEnd leaves one for the target; any other navigation clears it', () => {
		navigate('./b.html', { viewTransitions: true, direction: 'back', arriveAtEnd: true });
		const raw = sessionStorage.getItem(ARRIVAL_KEY);
		expect(JSON.parse(raw!).path).toBe(new URL('./b.html', window.location.href).pathname);

		navigate('./c.html', { viewTransitions: true, direction: 'forward' });
		expect(sessionStorage.getItem(ARRIVAL_KEY)).toBeNull();
	});
});
