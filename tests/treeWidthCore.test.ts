// The EDIT window's draggable tree/editor divider: how wide the tree may be.
import { describe, expect, it } from 'vitest';
import {
	EDITOR_MIN_WIDTH,
	TREE_DEFAULT_WIDTH,
	TREE_MIN_WIDTH,
	clampTreeWidth
} from '../src/lib/source/treeWidthCore';

describe('clampTreeWidth', () => {
	it('keeps a width that fits', () => {
		expect(clampTreeWidth(320, 1400)).toBe(320);
	});

	it('never goes below the tree minimum', () => {
		expect(clampTreeWidth(20, 1400)).toBe(TREE_MIN_WIDTH);
	});

	it('leaves the editor its minimum', () => {
		expect(clampTreeWidth(1300, 1400)).toBe(1400 - EDITOR_MIN_WIDTH);
	});

	it('gives the tree its minimum when the window is too narrow for both', () => {
		expect(clampTreeWidth(300, 350)).toBe(TREE_MIN_WIDTH);
	});

	it('reads junk as the default', () => {
		expect(clampTreeWidth(NaN, 1400)).toBe(TREE_DEFAULT_WIDTH);
		expect(clampTreeWidth(Infinity, 1400)).toBe(TREE_DEFAULT_WIDTH);
	});

	it('ignores an unknown window width', () => {
		expect(clampTreeWidth(900, NaN)).toBe(900);
	});

	it('rounds to whole pixels', () => {
		expect(clampTreeWidth(250.6, 1400)).toBe(251);
	});
});
