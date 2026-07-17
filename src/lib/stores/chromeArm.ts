// Temporary "chrome is up for keyboard" state — not a pin preference.
//
// Alt+. arms both window-edge bars for a few seconds so letter mnemonics
// (a/j/d/p/m/t) can reach controls without global letter shortcuts fighting
// typing and paging. Esc or the timer disarms. Distinct from toolBarPinned /
// controlBarPinned, which are sticky user latches.

import { get, writable } from 'svelte/store';

/** Bars are fully seated for keyboard use (CSS class `armed`, same seat as pin). */
export const chromeArmed = writable(false);

/**
 * Force-close the ☰ drop even if the pointer is still over it (Esc).
 * Cleared on the next mouseenter of the menu so hover works again.
 */
export const moreMenuHeldClosed = writable(false);

/**
 * Bump to ask TableOfContent to open (TOC state is local to the component;
 * this is the one-way request channel for the t mnemonic).
 */
export const tocOpenRequest = writable(0);

let armTimer: ReturnType<typeof setTimeout> | undefined;

/** How long bars stay raised after Alt+. or a mnemonic that re-arms (ms). */
export const CHROME_ARM_MS = 5000;

/** Raise both bars and (re)start the auto-disarm timer. */
export function armChrome(ms: number = CHROME_ARM_MS): void {
	chromeArmed.set(true);
	if (armTimer) clearTimeout(armTimer);
	armTimer = setTimeout(() => {
		chromeArmed.set(false);
		armTimer = undefined;
	}, ms);
}

/** Drop the temporary raise immediately. Does not change pin preferences. */
export function disarmChrome(): void {
	chromeArmed.set(false);
	if (armTimer) {
		clearTimeout(armTimer);
		armTimer = undefined;
	}
}

/** Esc: shut the ☰ panel even under an active hover. */
export function holdMoreMenuClosed(): void {
	moreMenuHeldClosed.set(true);
}

/** Hover returned to the ☰ — allow the drop to open again. */
export function releaseMoreMenuHold(): void {
	moreMenuHeldClosed.set(false);
}

/** If already armed, refresh the timer so a chain of mnemonics does not expire mid-use. */
export function keepChromeArmed(ms: number = CHROME_ARM_MS): void {
	if (get(chromeArmed)) armChrome(ms);
}

/** Ask the TOC to open (and keep chrome raised). */
export function requestTocOpen(): void {
	tocOpenRequest.update((n) => n + 1);
	armChrome();
}
