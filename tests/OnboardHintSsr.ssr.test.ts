// @vitest-environment node
//
// True server-side render of OnboardHint (svelte/server, no DOM). The hint is about ONE
// viewer's history, which a prerender — built once, served to everyone — cannot know. So
// the prerendered slide must ship nothing of it, whatever the props say.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import OnboardHint from '../src/lib/components/OnboardHint.svelte';

describe('OnboardHint (SSR)', () => {
	it('renders nothing, even on a first slide with no delay', () => {
		const { body } = render(OnboardHint, {
			props: { offered: true, firstSlide: true, suppressed: false, delayMs: 0 }
		});
		expect(body).not.toContain('onboard-hint');
		expect(body).not.toContain('edge');
	});
});
