import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StepDotsHost from './StepDotsHost.svelte';
import StepDots from '../src/lib/components/StepDots.svelte';
import { activeSteps } from '../src/lib/stores/activeSteps';

// The indicator only reads activeSteps, so driving a real Steps build with Space is
// the honest check that the two meet: the filled dot walks along, and the row is
// marked spent (the cue that Space now pages) once the last Fragment shows.

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
const dots = (root: ParentNode) =>
	Array.from(root.querySelectorAll('.step-dots .dot')) as HTMLElement[];
const states = (root: ParentNode) =>
	dots(root).map((d) =>
		d.classList.contains('current') ? 'current' : d.classList.contains('done') ? 'done' : 'todo'
	);

describe('StepDots', () => {
	it('shows one dot per step, all to come, on arrival', async () => {
		const { container } = render(StepDotsHost);
		await tick();
		expect(states(container)).toEqual(['todo', 'todo', 'todo']);
		const bar = container.querySelector('.step-dots')!;
		expect(bar.getAttribute('aria-label')).toBe('Step 0 of 3');
		expect(bar.classList.contains('no-print')).toBe(true);
	});

	it('walks the filled dot along with Space and back with Shift+Space', async () => {
		const { container } = render(StepDotsHost);
		space();
		await tick();
		expect(states(container)).toEqual(['current', 'todo', 'todo']);
		space();
		await tick();
		expect(states(container)).toEqual(['done', 'current', 'todo']);
		space(true);
		await tick();
		expect(states(container)).toEqual(['current', 'todo', 'todo']);
	});

	it('marks the row spent once the build is done', async () => {
		const { container } = render(StepDotsHost);
		space();
		space();
		space();
		await tick();
		expect(container.querySelector('.step-dots .row')!.classList.contains('spent')).toBe(true);
		expect(container.querySelector('.step-dots')!.getAttribute('aria-label')).toBe('Step 3 of 3');
	});

	it('draws nothing on a slide without a build', async () => {
		const { container } = render(StepDotsHost, { props: { build: false } });
		await tick();
		expect(container.querySelector('.step-dots')).toBeNull();
	});

	it('stands the row up along a side edge and lies it down in a corner', async () => {
		const side = render(StepDotsHost, { props: { position: 'left' } });
		await tick();
		const l = side.container.querySelector('.step-dots')!;
		expect(l.classList.contains('vertical')).toBe(true);
		expect(l.getAttribute('data-position')).toBe('left');
		side.unmount();

		const corner = render(StepDotsHost, { props: { position: 'bottom-left' } });
		await tick();
		const c = corner.container.querySelector('.step-dots')!;
		expect(c.classList.contains('vertical')).toBe(false);
		expect(c.getAttribute('style')).toContain('translate(0, -100%)');
	});
});

// The "your turn" cue, driven straight through the store a build publishes.
describe('StepDots — the cue', () => {
	const owner = {};
	const build = (index: number, busy = false) =>
		activeSteps.set({ owner, hasNext: index < 3, hasPrev: index > 0, next() {}, index, total: 3, busy });
	const tip = (root: ParentNode) => root.querySelector('.cue-tip')?.textContent ?? null;
	const blinking = (root: ParentNode) =>
		Array.from(root.querySelectorAll('.dot')).findIndex((d) => d.classList.contains('next'));

	afterEach(() => {
		vi.useRealTimers();
		activeSteps.set(null);
	});

	it('waits a second after a step, then blinks the next dot and says SPACE', async () => {
		vi.useFakeTimers();
		build(1);
		const { container } = render(StepDots, { props: { cue: true } });
		await tick();
		expect(tip(container)).toBeNull();
		vi.advanceTimersByTime(999);
		await tick();
		expect(tip(container)).toBeNull();
		vi.advanceTimersByTime(1);
		await tick();
		expect(tip(container)).toBe('SPACE for next step');
		expect(blinking(container)).toBe(1); // the dot for step 2
		expect(container.querySelector('.step-dots')!.classList.contains('cueing')).toBe(true);
	});

	it('holds while the step is still playing, and clears on the next step', async () => {
		vi.useFakeTimers();
		build(1, true);
		const { container } = render(StepDots, { props: { cue: true } });
		vi.advanceTimersByTime(5000);
		await tick();
		expect(tip(container)).toBeNull();
		build(1, false); // done playing → the wait starts now
		await tick();
		vi.advanceTimersByTime(1000);
		await tick();
		expect(tip(container)).toBe('SPACE for next step');
		build(2, true); // the next step: gone at once
		await tick();
		expect(tip(container)).toBeNull();
	});

	it('says next SLIDE once spent, and nothing on the last slide', async () => {
		vi.useFakeTimers();
		build(3);
		const spent = render(StepDots, { props: { cue: true } });
		vi.advanceTimersByTime(1000);
		await tick();
		expect(tip(spent.container)).toBe('SPACE for next slide');
		expect(blinking(spent.container)).toBe(-1);
		spent.unmount();

		const last = render(StepDots, { props: { cue: true, hasNextSlide: false } });
		vi.advanceTimersByTime(1000);
		await tick();
		expect(tip(last.container)).toBeNull();
	});

	it('is off unless asked for, and takes its wording from props', async () => {
		vi.useFakeTimers();
		build(1);
		const off = render(StepDots);
		vi.advanceTimersByTime(2000);
		await tick();
		expect(tip(off.container)).toBeNull();
		off.unmount();

		const custom = render(StepDots, { props: { cue: true, cueNext: 'Weiter mit LEERTASTE' } });
		vi.advanceTimersByTime(1000);
		await tick();
		expect(tip(custom.container)).toBe('Weiter mit LEERTASTE');
	});
});
