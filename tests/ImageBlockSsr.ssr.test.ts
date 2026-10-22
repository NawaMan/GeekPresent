// @vitest-environment node
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ImageBlock from '../src/lib/components/ImageBlock.svelte';

describe('ImageBlock (SSR)', () => {
	it('prerenders the plain <img> even when live — the SVG is inlined in the browser', () => {
		const { body } = render(ImageBlock, {
			props: { src: 'stats.svg', alt: 'Stats', live: true, x: 0, y: 0, width: 10, height: 10 }
		});
		expect(body).toContain('<img');
		expect(body).toContain('src="stats.svg"');
		expect(body).toContain('alt="Stats"');
		expect(body).not.toContain('<svg');
	});
});

describe('ImageBlock (SSR) after-transition', () => {
	it('prerenders the plain <img> for live="after-transition" too', () => {
		const { body } = render(ImageBlock, {
			props: { src: 'stats.svg', live: 'after-transition', x: 0, y: 0, width: 10, height: 10 }
		});
		expect(body).toContain('<img');
		expect(body).not.toContain('<svg');
	});
});
