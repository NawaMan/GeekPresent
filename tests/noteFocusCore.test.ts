import { describe, expect, it } from 'vitest';
import { afterNoteCheck, noteUncheckTarget, stepNoteFocus } from '../src/lib/note/noteFocusCore';

describe('stepNoteFocus', () => {
	it('has no cursor on a note with no lines', () => {
		expect(stepNoteFocus(null, [], 1)).toBeNull();
		expect(stepNoteFocus(0, null, 1)).toBeNull();
		expect(stepNoteFocus(2, undefined, -1)).toBeNull();
	});

	it('the first ↓ lands on the first line not yet checked', () => {
		expect(stepNoteFocus(null, [false, false, false], 1)).toBe(0);
		expect(stepNoteFocus(null, [true, true, false, false], 1)).toBe(2);
		expect(stepNoteFocus(undefined, [true, false], 1)).toBe(1);
	});

	it('with every line checked, the first ↓ lands on the last', () => {
		expect(stepNoteFocus(null, [true, true, true], 1)).toBe(2);
	});

	it('the first ↑ lands on the last line', () => {
		expect(stepNoteFocus(null, [false, false, false], -1)).toBe(2);
	});

	it('moves one line and stops at either end', () => {
		const lines = [false, false, false];
		expect(stepNoteFocus(0, lines, 1)).toBe(1);
		expect(stepNoteFocus(2, lines, 1)).toBe(2);
		expect(stepNoteFocus(1, lines, -1)).toBe(0);
		expect(stepNoteFocus(0, lines, -1)).toBe(0);
	});

	it('treats a junk cursor as none', () => {
		const lines = [true, false, false];
		for (const junk of [9, -1, 1.5, NaN]) expect(stepNoteFocus(junk, lines, 1)).toBe(1);
	});
});

describe('afterNoteCheck', () => {
	it('moves on to the next line, and stays on the last', () => {
		expect(afterNoteCheck(0, 3)).toBe(1);
		expect(afterNoteCheck(2, 3)).toBe(2);
	});

	it('has nowhere to go without a cursor', () => {
		expect(afterNoteCheck(null, 3)).toBeNull();
		expect(afterNoteCheck(5, 3)).toBeNull();
		expect(afterNoteCheck(0, 0)).toBeNull();
	});
});

describe('noteUncheckTarget', () => {
	it('unchecks the line under the cursor when it is checked', () => {
		expect(noteUncheckTarget(1, [true, true, false])).toBe(1);
	});

	it('else steps up to the one above: Space then Shift+Space is a round trip', () => {
		// Space on line 0 checked it and moved to line 1; Shift+Space takes line 0 back.
		expect(noteUncheckTarget(1, [true, false, false])).toBe(0);
	});

	it('has nothing to take back on an unchecked first line, or with no cursor', () => {
		expect(noteUncheckTarget(0, [false, false])).toBeNull();
		expect(noteUncheckTarget(null, [true])).toBeNull();
		expect(noteUncheckTarget(4, [true])).toBeNull();
		expect(noteUncheckTarget(0, [])).toBeNull();
	});
});
