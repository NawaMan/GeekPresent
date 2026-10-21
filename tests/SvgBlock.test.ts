import { render } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';
import SvgBlockHost from './SvgBlockHost.svelte';
import { adjustMode, canAdjust } from '$lib/stores/adjustMode';
import { adjustChanges } from '$lib/stores/adjustChanges';
import { blockAnchors } from '$lib/stores/blockAnchors';

// SvgBlock in the DOM: the drawing is INLINE (real SVG elements, in the SVG
// namespace — the whole point over an <img>), fills its box, and is a Block to
// ADJUST under its own tag. The markup surgery is unit-tested in svgCore.test.ts.

const SVG_NS = 'http://www.w3.org/2000/svg';
const entryFor = (name: string) => [...get(adjustChanges).values()].find((e) => e.name === name);

beforeEach(() => {
	canAdjust.set(true);
	adjustMode.set(false);
});

describe('SvgBlock', () => {
	it('(a) inlines a file, sized by the box rather than its own width/height', () => {
		const { container } = render(SvgBlockHost);
		const [file] = [...container.querySelectorAll('.movable')] as HTMLElement[];
		const svg = file.querySelector('svg')!;
		expect(svg.getAttribute('width')).toBeNull();
		expect(svg.getAttribute('viewBox')).toBe('0 0 120 60');
		expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
		expect(file.querySelector('rect')?.namespaceURI).toBe(SVG_NS);
		expect(file.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('From a file');
	});

	it('(b) draws slot shapes into its own svg, in the SVG namespace', () => {
		const { container } = render(SvgBlockHost);
		const [, inline] = [...container.querySelectorAll('.movable')] as HTMLElement[];
		const svg = inline.querySelector('svg')!;
		expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
		expect(svg.getAttribute('aria-hidden')).toBe('true'); // no title → decorative
		const circle = inline.querySelector('circle')!;
		expect(circle.namespaceURI).toBe(SVG_NS);
	});

	it('maps fit to preserveAspectRatio', () => {
		const { container } = render(SvgBlockHost, { props: { fit: 'cover' } });
		expect(container.querySelector('svg')?.getAttribute('preserveAspectRatio')).toBe('xMidYMid slice');
	});

	it('is a Block to ADJUST, under its own tag — self-closing only for the file form', () => {
		render(SvgBlockHost);
		expect(get(blockAnchors).has('file')).toBe(true);
		expect(entryFor('file')).toMatchObject({ kind: 'SvgBlock' });
		expect(entryFor('file')!.newTag).toMatch(/^<SvgBlock name="file" svg=\{…\} title="From a file" x=\{10\}.* \/>$/);
		expect(entryFor('inline')!.newTag).toMatch(/^<SvgBlock name="inline" viewBox="0 0 100 100" x=\{400\}.*>$/);
		expect(entryFor('inline')!.newTag.endsWith('/>')).toBe(false);
	});
});
