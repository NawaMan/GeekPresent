// @vitest-environment node
//
// TextBlock through svelte/server: the box and its label must be in the
// prerendered HTML (built deck HTML never shows slide markup, so this is the
// honest surface — see the deck-tests skill).
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import TextBlockHost from './TextBlockHost.svelte';

describe('TextBlock (SSR)', () => {
	it('prerenders the positioned box with its label in a .node', () => {
		const { body } = render(TextBlockHost, { props: {} });
		expect(body).toContain('left:100px');
		expect(body).toMatch(/class="node[^"]*"[^>]*>(<!--[^>]*-->)*API/);
	});

	it('prerenders a non-zero z as the z-index', () => {
		const { body } = render(TextBlockHost, { props: { z: 2 } });
		expect(body).toContain('z-index:2');
	});
});
