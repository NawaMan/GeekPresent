import { describe, expect, it } from 'vitest';
import { inlineSvg, preserveFor } from '$lib/utils/svgCore';

describe('preserveFor', () => {
	it('maps fit to preserveAspectRatio, defaulting to contain', () => {
		expect(preserveFor('contain')).toBe('xMidYMid meet');
		expect(preserveFor('cover')).toBe('xMidYMid slice');
		expect(preserveFor('fill')).toBe('none');
		expect(preserveFor('nonsense')).toBe('xMidYMid meet');
		expect(preserveFor(undefined)).toBe('xMidYMid meet');
	});
});

describe('inlineSvg', () => {
	it('drops the root width/height and keeps the viewBox', () => {
		const out = inlineSvg('<svg width="300" height="100" viewBox="0 0 30 10"><rect /></svg>');
		expect(out).toBe('<svg viewBox="0 0 30 10" preserveAspectRatio="xMidYMid meet"><rect /></svg>');
	});

	it('derives a viewBox from plain-pixel width/height when there is none', () => {
		const out = inlineSvg(`<svg xmlns="http://www.w3.org/2000/svg" width='120px' height="80">x</svg>`);
		expect(out).toContain('viewBox="0 0 120 80"');
		expect(out).not.toMatch(/\swidth=/);
		expect(out).not.toMatch(/\sheight=/);
	});

	it('cannot derive from relative units, and does not invent one', () => {
		const out = inlineSvg('<svg width="50%" height="3em"><g/></svg>');
		expect(out).toBe('<svg preserveAspectRatio="xMidYMid meet"><g/></svg>');
	});

	it('replaces an existing preserveAspectRatio with the fit', () => {
		const out = inlineSvg('<svg viewBox="0 0 1 1" preserveAspectRatio="xMinYMin meet"></svg>', 'fill');
		expect(out).toBe('<svg viewBox="0 0 1 1" preserveAspectRatio="none"></svg>');
	});

	it('strips the XML declaration and leading comments, and only touches the ROOT tag', () => {
		const src = '<?xml version="1.0"?>\n<!-- c -->\n<svg width="10" height="10"><rect width="4" height="4" stroke-width="2"/></svg>';
		const out = inlineSvg(src);
		expect(out.startsWith('<svg viewBox="0 0 10 10"')).toBe(true);
		expect(out).toContain('<rect width="4" height="4" stroke-width="2"/>');
	});

	it('is not fooled by a > inside an attribute value', () => {
		const out = inlineSvg('<svg data-x="a>b" width="2" height="2"></svg>');
		expect(out).toBe('<svg data-x="a>b" viewBox="0 0 2 2" preserveAspectRatio="xMidYMid meet"></svg>');
	});

	it('keeps a self-closing root self-closing', () => {
		expect(inlineSvg('<svg viewBox="0 0 1 1"/>')).toBe('<svg viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet" />');
	});

	it('gives an empty string for anything without an svg root', () => {
		expect(inlineSvg('')).toBe('');
		expect(inlineSvg('<div>no</div>')).toBe('');
		expect(inlineSvg('<svg width="1"')).toBe('');
		expect(inlineSvg(null)).toBe('');
		expect(inlineSvg(42 as unknown as string)).toBe('');
	});
});
