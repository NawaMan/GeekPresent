import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import StepDotsHost from './StepDotsHost.svelte';

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
