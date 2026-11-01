import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, describe, expect, it } from 'vitest';
import StepTerminalHost from './StepTerminalHost.svelte';
import { activeSteps } from '../src/lib/stores/activeSteps';

// jsdom has no Web Animations, so the consoles never find a clock and nothing types.
// What is checked here is the part that does not need one: how many steps each console
// claims, in what order, and that the Steps — not the console — owns the controls.

function space() {
	document.body.dispatchEvent(
		new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true })
	);
}

afterEach(() => cleanup());

describe('StepTerminal inside Steps', () => {
	it('claims one step per LOGICAL command, in document order with the Fragment', async () => {
		render(StepTerminalHost);
		await tick();
		// first: 2 commands (the `cont` line folds into the one above) + 1 Fragment + second: 2.
		expect(get(activeSteps)?.total).toBe(5);
	});

	it('with autoplay, the first command rides along and claims no step', async () => {
		render(StepTerminalHost, { props: { autoplay: true } });
		await tick();
		expect(get(activeSteps)?.total).toBe(4);
	});

	it('takes its turns: the Fragment shows only after the first console’s steps', async () => {
		const { container } = render(StepTerminalHost);
		await tick();
		const between = container.querySelector('p.fragment')!;
		space();
		space();
		await tick();
		expect(between.classList.contains('hidden')).toBe(true);
		space();
		await tick();
		expect(between.classList.contains('hidden')).toBe(false);
		expect(get(activeSteps)?.index).toBe(3);
	});

	it('hides the console’s own transport: the Steps is the control', async () => {
		const { container } = render(StepTerminalHost);
		await tick();
		expect(container.querySelectorAll('.terminal.step-terminal')).toHaveLength(2);
		expect(container.querySelector('.terminal .transport')).toBeNull();
		expect(container.querySelector('.terminal .overlay')).toBeNull();
	});

	it('reports the build not busy when nothing is playing', async () => {
		render(StepTerminalHost);
		await tick();
		space();
		await tick();
		expect(get(activeSteps)?.busy).toBe(false);
	});
});

describe('StepTerminal outside Steps', () => {
	it('is an ordinary Terminal, claiming nothing', async () => {
		const { container } = render(StepTerminalHost, { props: { inSteps: false } });
		await tick();
		expect(container.querySelector('.terminal')).not.toBeNull();
		expect(container.querySelector('.terminal.step-terminal')).toBeNull();
		expect(get(activeSteps)).toBeNull();
	});
});
