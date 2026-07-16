import { writable } from 'svelte/store';

// Chrome that a SLIDE can own for itself, published for the deck-level ControlBar.
//
// The ControlBar (SlideDeck's bottom-centre bar) provides the deck's ONE pager. But
// some slides bring their own: an AppendixPage renders its own NavigationBar (with a
// RETURN control and appendix paging), and a bespoke test route may too. This module
// is the bridge — the same trick `activeSteps` uses — so the ControlBar can YIELD to a
// slide-local pager instead of doubling up with it.
//
// Identity, not a count: each registering instance holds a Symbol, so a bar only
// leaves the registry on destroy if it is still the one that joined — robust under
// the destroy/mount overlap of a client-side (View-Transition) slide change.

// --- NAV: slides that render their OWN pager (AppendixPage, bespoke test routes) ---
// The deck-level NavigationBar reads this and goes dormant while it is non-empty, so
// two pagers never fight over the arrow keys.
export const localNav = writable<Set<symbol>>(new Set());

export function registerNav(owner: symbol): void {
	localNav.update((s) => {
		const next = new Set(s);
		next.add(owner);
		return next;
	});
}
export function unregisterNav(owner: symbol): void {
	localNav.update((s) => {
		if (!s.has(owner)) return s;
		const next = new Set(s);
		next.delete(owner);
		return next;
	});
}
