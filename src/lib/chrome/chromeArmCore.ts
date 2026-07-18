// Pure decisions for chrome keyboard arming (Alt+.) and the short mnemonic
// alphabet that only fires while bars are armed.
//
// Global letters fight typing and deck paging; so the model is:
//   1. Alt+. raises both bars (arm)
//   2. While armed, a/j/d/p/m/t pick a control
//   3. Esc (or timeout) disarms
//
// Total: garbage input → ignore, never throw.

/** Is this key press the user TYPING in a field? Same bargain as overviewPageCore. */
export function isChromeTypingTarget(t: EventTarget | null): boolean {
	const el = t as HTMLElement | null;
	if (!el) return false;
	if (el.isContentEditable) return true;
	return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName ?? '');
}

/**
 * Is this the browser Save chord (Ctrl+S / Cmd+S) that ADJUST should claim for its
 * own SAVE, instead of letting the browser pop its "save this webpage" dialog?
 *
 * True ONLY when the chord is pressed AND ADJUST is currently active — so on a
 * normal slide the answer is false and the browser keeps its shortcut untouched.
 * `adjustActive` is the caller's `$canAdjust && $adjustMode`: offered AND on.
 *
 * Unlike the letter mnemonics, this deliberately does NOT bail while a text field
 * has focus: Ctrl+S means "save my work" everywhere, and popping the browser dialog
 * because the caret sits in an editable Block is the exact misfire we're removing.
 * Plain Ctrl/Cmd+S only — Shift/Alt carry other browser chords (Save As, …) and are
 * left to the browser. `e.code` is a fallback so a non-Latin layout still saves.
 * Total: no throw on garbage, and never true off a real Ctrl/Cmd+S.
 */
export function isAdjustSaveChord(e: KeyboardEvent, adjustActive: boolean): boolean {
	if (!adjustActive) return false;
	if (e.altKey || e.shiftKey) return false;
	if (!(e.ctrlKey || e.metaKey)) return false;
	return e.key === 's' || e.key === 'S' || e.code === 'KeyS';
}

export type ChromeKeyIntent =
	| 'arm'
	| 'disarm'
	| 'annotate'
	| 'adjust'
	| 'display'
	| 'present'
	| 'more'
	| 'toc'
	| 'ignore';

/**
 * What a key means for chrome arming / mnemonics.
 *
 * @param armed  are the bars currently raised for keyboard use?
 */
export function chromeKeyIntent(e: KeyboardEvent, armed: boolean): ChromeKeyIntent {
	if (isChromeTypingTarget(e.target)) return 'ignore';

	// Alt+. (Period) — raise both bars. Prefer e.code so layouts that remap
	// Alt+letter still hit the physical period key.
	if (e.altKey && !e.ctrlKey && !e.metaKey && (e.code === 'Period' || e.key === '.')) {
		return 'arm';
	}

	// Esc closes ☰ / disarms chrome even if bars were only hover-opened (not Alt+.-armed),
	// so Escape always has a way to dismiss the more menu.
	if (
		e.key === 'Escape' &&
		!e.ctrlKey &&
		!e.metaKey &&
		!e.altKey &&
		!e.defaultPrevented
	) {
		return 'disarm';
	}

	// Letter mnemonics only while armed, and never with modifiers (browser chords win).
	if (!armed) return 'ignore';
	if (e.ctrlKey || e.metaKey || e.altKey) return 'ignore';
	if (e.defaultPrevented) return 'ignore';

	switch (e.key.toLowerCase()) {
		case 'a':
			return 'annotate';
		case 'j':
			return 'adjust';
		case 'z':
			// Zoom / display mode.
			return 'display';
		case 'p':
			// PRESENT — console. PRINT in ☰ uses (R) so the two do not share P.
			return 'present';
		case 'm':
			return 'more';
		case 't':
			return 'toc';
		default:
			return 'ignore';
	}
}
