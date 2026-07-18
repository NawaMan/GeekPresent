// Pure decisions for the presenter CONSOLE's keyboard mnemonics — the twin of
// chromeArmCore, but for the ?present window rather than the audience deck.
//
// On stage the speaker drives from the keyboard; the console's TOC / reset-checks /
// reset-ink controls were pointer-only, so reaching for the mouse to open the jump
// menu or clear last run's ink is exactly the fumble the console exists to spare.
// Each of the three gets a letter:
//
//   T — table of contents (jump menu)
//   C — reset check-offs   (opens the menu; the destructive step stays a click)
//   A — reset annotations  (ink; opens the menu — same softness)
//
// A key TOGGLES its menu open, it never resets on its own: opening the menu is the
// soft confirm the RESET menus already lean on, so no key destroys with one press.
// Esc closes whatever is open — even from the timer field, so it always has an out.
//
// Total: garbage input → 'ignore', never throws.

import { isChromeTypingTarget } from './chromeArmCore';

export type PresenterKeyIntent = 'toc' | 'checks' | 'ink' | 'close' | 'ignore';

/**
 * What a key means in the presenter console window.
 *
 * @param inkOffered  is the ink-reset control shown at all? (`$canAnnotate` in the
 *   view) — when the pen was never offered, A is inert rather than toggling a menu
 *   that isn't there.
 */
export function presenterKeyIntent(
	e: KeyboardEvent,
	inkOffered: boolean = false
): PresenterKeyIntent {
	const k = (e?.key ?? '').toLowerCase();

	// Escape closes any open menu FIRST — before the typing guard — so it still
	// dismisses the timer popover while the caret sits in its input.
	if (k === 'escape' && !e.ctrlKey && !e.metaKey && !e.altKey) return 'close';

	// The letters must never fire while the speaker is typing (the timer field).
	if (isChromeTypingTarget(e?.target)) return 'ignore';

	// A modifier means a browser/OS chord (Ctrl+A, Cmd+T…) — leave those alone.
	if (e.ctrlKey || e.metaKey || e.altKey) return 'ignore';
	if (e.defaultPrevented) return 'ignore';

	switch (k) {
		case 't':
			return 'toc';
		case 'c':
			return 'checks';
		case 'a':
			// Inert unless the pen (and so the reset-ink control) is actually offered.
			return inkOffered ? 'ink' : 'ignore';
		default:
			return 'ignore';
	}
}
