// @vitest-environment node
//
// SvgBlock through svelte/server: both forms must be in the prerendered HTML as
// real inline SVG (built deck HTML never shows slide markup, so this is the
// honest surface — see the deck-tests skill).
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import SvgBlockHost from './SvgBlockHost.svelte';

describe('SvgBlock (SSR)', () => {
	it('prerenders the file form inline, without the XML declaration or its own size', () => {
		const { body } = render(SvgBlockHost, { props: {} });
		expect(body).toContain('viewBox="0 0 120 60"');
		expect(body).not.toContain('<?xml');
		expect(body).not.toContain('width="120"');
	});

	it('prerenders the slot form inside its own svg', () => {
		const { body } = render(SvgBlockHost, { props: {} });
		expect(body).toMatch(/<svg[^>]*viewBox="0 0 100 100"[^>]*>[\s\S]*<circle/);
	});
});
