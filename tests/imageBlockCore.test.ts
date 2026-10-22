import { describe, expect, it } from 'vitest';
import { inlineSvg, liveAttr } from '../src/lib/utils/imageBlockCore';

const EXPORTED =
	'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 82.87 57.12" width="82.87" height="57.12">' +
	'<image href="data:image/gif;base64,R0lG"/></svg>';

describe('inlineSvg', () => {
	it('swaps the drawing size on the root for 100%, keeping viewBox and the content', () => {
		const out = inlineSvg(EXPORTED);
		expect(out).toContain('viewBox="0 0 82.87 57.12"');
		expect(out).toContain('width="100%" height="100%"');
		expect(out).not.toContain('width="82.87"');
		expect(out).not.toContain('height="57.12"');
		expect(out).toContain('<image href="data:image/gif;base64,R0lG"/></svg>');
	});

	it('maps fit onto preserveAspectRatio, replacing one the file already had', () => {
		const own = '<svg viewBox="0 0 1 1" preserveAspectRatio="xMinYMin meet"></svg>';
		expect(inlineSvg(own)).toContain('preserveAspectRatio="none"');
		expect(inlineSvg(own, 'contain')).toContain('preserveAspectRatio="xMidYMid meet"');
		expect(inlineSvg(own, 'cover')).toContain('preserveAspectRatio="xMidYMid slice"');
		expect(inlineSvg(own, 'cover')).not.toContain('xMinYMin');
	});

	it('only touches the root: a nested element keeps its own width', () => {
		const out = inlineSvg('<svg width="10"><rect width="3" height="4"/></svg>');
		expect(out).toContain('<rect width="3" height="4"/>');
	});

	it('drops an XML prolog and comments before the root', () => {
		const out = inlineSvg('<?xml version="1.0"?>\n<!-- made by hand -->\n<svg width="1"></svg>');
		expect(out.startsWith('<svg')).toBe(true);
	});

	it('handles single-quoted sizing and a self-closed root', () => {
		expect(inlineSvg("<svg width='5' height='6'/>")).toBe(
			'<svg width="100%" height="100%" preserveAspectRatio="none" style="display:block"/>'
		);
	});

	it('is total: no <svg> root, a cut-off tag, or a non-string give ""', () => {
		expect(inlineSvg('')).toBe('');
		expect(inlineSvg('GIF89a')).toBe('');
		expect(inlineSvg('<svgfoo></svgfoo>')).toBe('');
		expect(inlineSvg('<svg width="1"')).toBe('');
		expect(inlineSvg(undefined as unknown as string)).toBe('');
		expect(inlineSvg('<svg></svg>', 'bogus' as never)).toContain('preserveAspectRatio="none"');
	});
});

describe('liveAttr', () => {
	it('spells live for the copied tag', () => {
		expect(liveAttr(false)).toBe('');
		expect(liveAttr(true)).toBe(' live');
		expect(liveAttr('after-transition')).toBe(' live="after-transition"');
	});
});
