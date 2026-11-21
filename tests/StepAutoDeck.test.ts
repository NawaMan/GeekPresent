// The auto levels end to end: a real SlideDeck, a real <Steps> build, the shipped hint.
// "Normal" takes the next step after the author's wait and never the page turn; "pause"
// holds; a window that must not move by itself never counts.
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StepAutoDeckHost from './StepAutoDeckHost.svelte';
import { setPageUrl, resetPageUrl } from './stubs/app-stores';
import { activeSteps } from '../src/lib/stores/activeSteps';
import { applyAutoParam, stepBackHold, stepCountdown, stepHold } from '../src/lib/stores/stepAuto';
import { adjustMode } from '../src/lib/stores/adjustMode';
import { bootKioskFromUrl, kioskStatus, startKiosk, stopKiosk } from '../src/lib/stores/kiosk';
import { disarmChrome } from '../src/lib/stores/chromeArm';

// jsdom has neither; the console window and the kiosk runner reach for them.
(globalThis as Record<string, unknown>).ResizeObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
};
(Element.prototype as unknown as Record<string, unknown>).getAnimations ??= () => [];
(document as unknown as Record<string, unknown>).getAnimations ??= () => [];

const pages = [
	{ path: 'stub.html', title: 'Stub' },
	{ path: 'next.html', title: 'Next' }
];

async function settle() {
	for (let i = 0; i < 4; i++) await tick();
}
async function mount(props: Record<string, unknown> = {}, url = '/slides/stub.html') {
	setPageUrl(url);
	const { container } = render(StepAutoDeckHost, { props: { pages, ...props } });
	await settle();
	return container;
}
async function wait(ms: number) {
	await vi.advanceTimersByTimeAsync(ms);
	await settle();
}
const index = () => get(activeSteps)?.index;
function space(shiftKey = false) {
	document.body.dispatchEvent(
		new KeyboardEvent('keydown', {
			key: ' ',
			code: 'Space',
			shiftKey,
			bubbles: true,
			cancelable: true
		})
	);
}

beforeEach(() => {
	vi.useFakeTimers();
	stepHold.set(false);
	stepBackHold.set(false);
	adjustMode.set(false);
	disarmChrome();
});
afterEach(() => {
	cleanup();
	stopKiosk();
	resetPageUrl();
	vi.useRealTimers();
});

describe('with no wait set', () => {
	it('waits for ever, as a deck always has', async () => {
		const root = await mount();
		await wait(60_000);
		expect(index()).toBe(0);
		expect(get(stepCountdown)).toBeNull();
		// the plain hint: not a control, no countdown
		expect(root.querySelector('.cue-tip')).not.toBeNull();
		expect(root.querySelector('.cue-tip.toggle')).toBeNull();
	});
});

describe('normal: the deck gave a wait', () => {
	it('takes each step after the wait, and never the page turn', async () => {
		await mount({ stepTimeoutMs: 5000 });
		expect(index()).toBe(0);
		await wait(4900);
		expect(index()).toBe(0);
		await wait(200);
		expect(index()).toBe(1);
		await wait(5100);
		expect(index()).toBe(2);
		await wait(5100);
		expect(index()).toBe(3);
		// spent: nothing left to count, and nothing happens however long it sits
		expect(get(activeSteps)?.hasNext).toBe(false);
		expect(get(stepCountdown)).toBeNull();
		await wait(60_000);
		expect(index()).toBe(3);
	});

	it('lets Space step sooner, and counts the next wait from there', async () => {
		await mount({ stepTimeoutMs: 5000 });
		await wait(3000);
		space();
		await settle();
		expect(index()).toBe(1);
		await wait(4900);
		expect(index()).toBe(1);
		await wait(200);
		expect(index()).toBe(2);
	});

	it('shows the countdown on the "next step" hint, and only there', async () => {
		const root = await mount({ stepTimeoutMs: 5000 });
		await wait(1100); // the cue's own delay
		const tip = root.querySelector('.cue-tip.toggle') as HTMLElement;
		expect(tip).not.toBeNull();
		expect(tip.textContent).toContain('SPACE for next step');
		expect(tip.querySelector('.count .num')?.textContent).toBe('4');
		await wait(2000);
		expect(root.querySelector('.cue-tip.toggle .num')?.textContent).toBe('2');
		// spent: "next slide" is a plain hint, never a countdown
		for (let i = 0; i < 3; i++) {
			space();
			await settle();
		}
		await wait(1100);
		const spent = root.querySelector('.cue-tip') as HTMLElement;
		expect(spent.textContent).toContain('SPACE for next slide');
		expect(spent.classList.contains('toggle')).toBe(false);
		expect(root.querySelector('.count')).toBeNull();
	});

	it('a step back holds the slide until the next step forward', async () => {
		await mount({ stepTimeoutMs: 5000 });
		// one press per frame, as a hand makes them
		space();
		await settle();
		space();
		await settle();
		space(true);
		await settle();
		expect(index()).toBe(1);
		await wait(60_000);
		expect(index()).toBe(1);
		space();
		await settle();
		expect(index()).toBe(2);
		await wait(5100);
		expect(index()).toBe(3);
	});
});

describe('the three places a wait can be set', () => {
	it('a slide overrides the deck', async () => {
		const own = [{ ...pages[0], stepTimeoutMs: 1000 }, pages[1]];
		await mount({ pages: own, stepTimeoutMs: 5000 });
		await wait(1100);
		expect(index()).toBe(1);
	});

	it('a build overrides both, and 0 opts it out', async () => {
		await mount({ stepTimeoutMs: 5000, timeoutMs: 1000 });
		await wait(1100);
		expect(index()).toBe(1);
		cleanup();
		await mount({ stepTimeoutMs: 5000, timeoutMs: 0 });
		await wait(60_000);
		expect(index()).toBe(0);
	});

	it("a slide can turn the deck's wait off", async () => {
		const own = [{ ...pages[0], stepTimeoutMs: 0 }, pages[1]];
		await mount({ pages: own, stepTimeoutMs: 5000 });
		await wait(60_000);
		expect(index()).toBe(0);
	});
});

describe('pause: the viewer holds it', () => {
	it('a click on the hint holds, and another releases', async () => {
		const root = await mount({ stepTimeoutMs: 5000 });
		await wait(1100);
		await fireEvent.click(root.querySelector('.cue-tip.toggle') as HTMLElement);
		await settle();
		expect(get(stepHold)).toBe(true);
		expect(get(stepCountdown)).toBeNull();
		await wait(60_000);
		expect(index()).toBe(0);
		const held = root.querySelector('.cue-tip.toggle') as HTMLElement;
		expect(held.classList.contains('held')).toBe(true);
		expect(held.querySelector('.num')).toBeNull();

		await fireEvent.click(held);
		await settle();
		expect(get(stepHold)).toBe(false);
		await wait(5100);
		expect(index()).toBe(1);
	});

	it('the pointer resting on the hint freezes the countdown', async () => {
		const root = await mount({ stepTimeoutMs: 5000 });
		await wait(3000);
		const tip = root.querySelector('.cue-tip.toggle') as HTMLElement;
		await fireEvent.mouseEnter(tip);
		await wait(60_000);
		expect(index()).toBe(0);
		await fireEvent.mouseLeave(tip);
		await wait(1900);
		expect(index()).toBe(0);
		await wait(200);
		expect(index()).toBe(1);
	});

	it('Alt+. then H holds and releases', async () => {
		await mount({ stepTimeoutMs: 5000 });
		await fireEvent.keyDown(window, { key: '.', code: 'Period', altKey: true });
		await fireEvent.keyDown(window, { key: 'h', code: 'KeyH' });
		await settle();
		expect(get(stepHold)).toBe(true);
		await fireEvent.keyDown(window, { key: 'h', code: 'KeyH' });
		await settle();
		expect(get(stepHold)).toBe(false);
	});

	it('H does nothing where there is no wait to hold', async () => {
		await mount();
		await fireEvent.keyDown(window, { key: '.', code: 'Period', altKey: true });
		await fireEvent.keyDown(window, { key: 'h', code: 'KeyH' });
		await settle();
		expect(get(stepHold)).toBe(false);
	});

	it('?auto=off holds, ?auto=steps and ?auto=all release, anything else changes nothing', () => {
		const at = (q: string) => applyAutoParam(new URL(`http://localhost/slides/stub.html${q}`));
		at('?auto=off');
		expect(get(stepHold)).toBe(true);
		at('');
		at('?auto=maybe');
		expect(get(stepHold)).toBe(true);
		at('?auto=steps');
		expect(get(stepHold)).toBe(false);
		stepHold.set(true);
		at('?auto=all');
		expect(get(stepHold)).toBe(false);
	});
});

describe('never in a window that must not move by itself', () => {
	it('?shot: a frame-by-frame render keeps its own time', async () => {
		await mount({ stepTimeoutMs: 1000 }, '/slides/stub.html?shot');
		await wait(60_000);
		expect(index()).toBe(0);
		expect(get(stepCountdown)).toBeNull();
	});

	it('the presenter console window', async () => {
		await mount({ stepTimeoutMs: 1000 }, '/slides/stub.html?present');
		await wait(60_000);
		expect(get(stepCountdown)).toBeNull();
	});

	it('while ADJUST is on', async () => {
		await mount({ stepTimeoutMs: 1000 });
		adjustMode.set(true);
		await settle();
		await wait(60_000);
		expect(index()).toBe(0);
	});

	it('a live kiosk has its own pace: the wait does not apply', async () => {
		await mount({ stepTimeoutMs: 1000 });
		startKiosk();
		await settle();
		expect(get(stepCountdown)).toBeNull();
	});
});

describe('?auto and the kiosk', () => {
	const boot = (q: string) => bootKioskFromUrl(new URL(`http://localhost/slides/stub.html${q}`));

	it('?auto=all is the kiosk; ?kiosk still is too', () => {
		boot('?auto=all');
		expect(get(kioskStatus)).toBe('running');
		stopKiosk();
		boot('?kiosk');
		expect(get(kioskStatus)).toBe('running');
		boot('?kiosk=off');
		expect(get(kioskStatus)).toBe('off');
	});

	it('?auto=steps and ?auto=off leave a running kiosk', () => {
		for (const q of ['?auto=steps', '?auto=off']) {
			startKiosk();
			boot(q);
			expect(get(kioskStatus)).toBe('off');
		}
	});
});
