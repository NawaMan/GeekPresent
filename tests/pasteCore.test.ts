import { describe, expect, it } from 'vitest';
import { PASTE_OFFSET, nextCopyName, pasteBox } from '$lib/adjust/pasteCore';

describe('pasteBox', () => {
	const from = { x: 100, y: 200, width: 300, height: 100 };

	it('steps each paste down-right so repeated pastes cascade', () => {
		expect(pasteBox(from, 1, null)).toEqual({ x: 100 + PASTE_OFFSET, y: 200 + PASTE_OFFSET, width: 300, height: 100 });
		expect(pasteBox(from, 3, null).x).toBe(100 + 3 * PASTE_OFFSET);
	});

	it('keeps a canvas-bounded copy inside the canvas', () => {
		const edge = { x: 1600, y: 960, width: 300, height: 100 };
		expect(pasteBox(edge, 2, { width: 1920, height: 1080 })).toEqual({ x: 1620, y: 980, width: 300, height: 100 });
	});

	it('lets an unbounded copy go off-stage', () => {
		const edge = { x: 1600, y: 960, width: 300, height: 100 };
		expect(pasteBox(edge, 2, null)).toEqual({ x: 1640, y: 1000, width: 300, height: 100 });
	});
});

describe('nextCopyName', () => {
	it('numbers from 2, skipping names already taken', () => {
		expect(nextCopyName('api', [])).toBe('api-2');
		expect(nextCopyName('api', ['api', 'api-2', 'api-3'])).toBe('api-4');
	});

	it('leaves an unnamed Block unnamed', () => {
		expect(nextCopyName('', ['x'])).toBe('');
	});
});
