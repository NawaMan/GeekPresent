// @vitest-environment node
//
// True server-side render of LivePointer (svelte/server, no DOM). The pointer is one
// viewer's mouse, which a prerender — built once, served to everyone — has never seen.
// So the prerendered slide ships nothing of it, and the render must not touch `window`.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import LivePointer from '../src/lib/components/LivePointer.svelte';

describe('LivePointer (SSR)', () => {
	it('renders nothing', () => {
		const { body } = render(LivePointer, { props: { shape: 'dot', size: 40 } });
		expect(body).not.toContain('live-pointer');
		expect(body).not.toContain('live-glyph');
	});
});
