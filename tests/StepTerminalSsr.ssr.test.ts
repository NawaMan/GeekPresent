// @vitest-environment node
//
// True server-side render (svelte/server, no DOM) of a Steps build holding two
// StepTerminals and a Fragment — the house way to prove prerender-safety, since a
// built slide's HTML carries none of the slide (SlideDeck gates it).
//
// Registering with the Steps happens during init, which the server runs too, so it
// must not reach for a window; and the transcript is in the markup from props alone.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import StepTerminalHost from './StepTerminalHost.svelte';

describe('StepTerminal (SSR)', () => {
	it('renders both consoles and the Fragment inside a Steps', () => {
		const { body } = render(StepTerminalHost, { props: { autoplay: true } });
		expect(body).toContain('git push');
		expect(body).toContain('--exit-status');
		expect(body).toContain('uptime');
		expect(body).toContain('between');
		expect(body.match(/class="terminal step-terminal/g)).toHaveLength(2);
	});

	it('renders as a plain Terminal outside a Steps', () => {
		const { body } = render(StepTerminalHost, { props: { inSteps: false } });
		expect(body).toContain('gh run watch');
		expect(body).not.toContain('step-terminal');
	});
});
