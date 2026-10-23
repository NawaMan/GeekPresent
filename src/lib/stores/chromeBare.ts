import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import { consoleLive } from './presenter';
import { recordingLook } from '$lib/record/recordBus';
import { BARE_KEY, readBareParam, readSticky, resolveChromeBare, type Choice } from '$lib/chrome/chromeBareCore';

// Bare chrome — both window-edge bars hidden completely (see chrome/chromeBareCore).
//
// Three inputs: the sticky `?bare` choice, whether a presenter console is live (this
// window is then the audience's), and the deck's `hideChrome` prop. SlideToolbar and
// ControlBar read `chromeBare`; SlideDeck feeds the URL and the prop.

function loadSticky(): Choice {
	if (!browser) return null;
	try {
		return readSticky(localStorage.getItem(BARE_KEY));
	} catch {
		return null;
	}
}

const sticky = writable<Choice>(loadSticky());
const deckWide = writable(false);

/** True when both bars are hidden completely, PIN included. Alt+. still raises them.
    A VOD recording in progress outranks every choice: the video is the slide alone. */
export const chromeBare = derived(
	[sticky, consoleLive, deckWide, recordingLook],
	([$sticky, $live, $deck, $rec]) => $rec || resolveChromeBare($sticky, $live, $deck)
);

/** What the AUDIENCE window shows while this console is live — for the presenter console's
    BARS toggle. The console's own `consoleLive` is false (it is the console), so it asks the
    question as the audience would. */
export const audienceBare = derived([sticky, deckWide], ([$sticky, $deck]) =>
	resolveChromeBare($sticky, true, $deck)
);

/** Record the speaker's choice — what `?bare` / `?bare=off` record, and what the console's
    BARS toggle writes. The other deck windows pick it up through the `storage` event. */
export function setBareChoice(choice: boolean): void {
	try {
		localStorage.setItem(BARE_KEY, String(choice));
	} catch {
		// private mode / full quota: the choice still holds for this window
	}
	sticky.set(choice);
}

// Follow a choice made in ANOTHER window (the console's BARS toggle, or `?bare` in a second
// tab), so the audience's bars hide or return at once rather than on the next page turn.
// `storage` never fires in the window that wrote, which is why setBareChoice sets `sticky`.
if (browser) {
	window.addEventListener('storage', (e) => {
		if (e.key === BARE_KEY || e.key === null) sticky.set(loadSticky());
	});
}

/** Declare whether the DECK is always shown bare (SlideDeck's `hideChrome` prop). */
export function setChromeBareDeck(on: boolean): void {
	deckWide.set(on === true);
}

/** Opt in/out from a slide URL's `?bare` flag and remember it across navigations (the nav
    links drop the flag). A URL with no flag changes nothing. */
export function applyBareParam(url: URL): void {
	if (!browser) return;
	const choice = readBareParam(url.searchParams);
	if (choice !== null) setBareChoice(choice);
}
