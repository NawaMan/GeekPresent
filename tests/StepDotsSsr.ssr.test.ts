// @vitest-environment node
//
// True server-side render (svelte/server). No build registers during prerender — the
// Steps publish is browser-guarded — so the indicator must contribute no markup at all
// to a built slide; it arrives on hydration with the build it describes.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Host from './StepDotsHost.svelte';

describe('StepDots (SSR)', () => {
	it('prerenders nothing, while the build itself still renders', () => {
		const { body } = render(Host);
		expect(body).not.toContain('step-dots');
		expect(body).toContain('one');
	});
});
