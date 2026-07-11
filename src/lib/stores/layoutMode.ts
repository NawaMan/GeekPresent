import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { readSticky, readLayoutParam, resolveCanLayout } from '$lib/layout/layoutAccessCore';

// LAYOUT mode — an AUTHORING aid, not a viewer feature. When on, <Block> wrappers
// expose drag + resize handles so you can position elements by hand at exact canvas
// pixels, then Copy (or, under `vite dev`, SAVE) the resulting tag back into source.
//
// Three stores:
//   - layoutMode: is the mode currently ON? Persisted, so it survives navigation
//     between slides. Every editor (Block, Draw, Columns) gates on
//     `$canLayout && $layoutMode`, so a stale `true` here is inert wherever the
//     control isn't offered.
//   - canLayout:  is the LAYOUT control OFFERED here? True in `vite dev` always; in
//     a built site it follows the sticky `?layout` flag, and failing that whatever
//     the current SLIDE declares (`layout: true` in its pages.ts entry). Precedence
//     lives in layout/layoutAccessCore.
//   - canSave:    can SAVE actually write back to source here? See below.
//
// The per-slide declaration is the demo switch: a published deck is LAYOUT-free by
// default, but the handful of slides that *teach* LAYOUT can offer the control in the
// BUILD — so a talk demonstrates authoring without the speaker typing a URL flag on
// stage, and without arming the authoring chrome on every other slide.
//
// Offered is not active: the mode itself still starts OFF. The audience sees a normal
// slide until the speaker flips it.

const MODE_KEY = 'layoutMode';
const CAN_KEY = 'canLayout';

// Can SAVE reach a source tree? SAVE POSTs to /__geekpresent/layout-save, an endpoint
// that exists ONLY inside the vite dev server (layout/devSavePlugin), where it rewrites
// the slide's .svelte file. A static host has no source tree to rewrite, so this is a
// genuine boundary — not a lock to pick. The button is shown either way and refuses on
// click (see SlideDeck), which is the honest thing to put in front of an audience.
//
// It is a STORE, not a bare `const x = import.meta.env.DEV`: as a const it read as a
// compile-time branch guard, and Vite dead-code eliminated the refusal path out of every
// build — so a deployed LAYOUT demo had a hole where its payoff should be. Being settable
// is also the only way a test can exercise the built-site case, since `import.meta.env.DEV`
// is true under vitest.
export const canSave = writable<boolean>(import.meta.env.DEV);

// What the current slide declares. Module scope (not context) because the stores it feeds
// are module-level too, and the only writer is the one SlideDeck that owns the chrome.
// Re-set on every slide change — this is per-slide state, not a one-shot deck setting.
let declared = false;

function initialMode(): boolean {
	if (!browser) return false;
	return localStorage.getItem(MODE_KEY) === 'true';
}

function sticky() {
	return browser ? readSticky(localStorage.getItem(CAN_KEY)) : null;
}

function recompute(): void {
	canLayout.set(resolveCanLayout(import.meta.env.DEV, sticky(), declared));
}

export const layoutMode = writable<boolean>(initialMode());
export const canLayout = writable<boolean>(resolveCanLayout(import.meta.env.DEV, sticky(), declared));

if (browser) {
	layoutMode.subscribe((v) => localStorage.setItem(MODE_KEY, String(v)));
}

/** Declare whether the CURRENT slide offers the LAYOUT control — its `layout` flag in
    pages.ts (or, deck-wide, SlideDeck's `layout` prop). SlideDeck calls this on every
    slide change, so paging from a LAYOUT demo onto an ordinary slide takes the control
    away again. A speaker's sticky `?layout=off` still outranks it. */
export function setLayoutOffered(on: boolean): void {
	declared = on === true;
	recompute();
}

/** Opt the LAYOUT control in/out from a slide URL's `?layout` flag, then remember it
    across navigations (the flag is dropped by the nav links, so we persist it).
    `?layout` / `?layout=on` enables; `?layout=off` disables and exits the mode. A URL
    with no flag changes nothing — it just re-resolves, so the current slide's own
    declaration still lands. */
export function applyLayoutParam(url: URL): void {
	if (!browser) return;
	const choice = readLayoutParam(url.searchParams);
	if (choice !== null) {
		localStorage.setItem(CAN_KEY, String(choice));
		if (!choice) layoutMode.set(false);
	}
	recompute();
}
