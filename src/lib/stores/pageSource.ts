import { derived, get, writable } from 'svelte/store';

// Page-source registry — the bridge between a slide's <ViewSource> / <SourceView>
// and the SOURCE item in the top tool bar's hamburger menu.
//
// A slide still imports its own `?raw` bytes and mounts one of those components
// (the source cannot be auto-derived by the deck shell). What moved is the
// *button*: the corner "</> Source" control now lives as a SOURCE row in the ☰
// menu, next to OVERVIEW / CAPTURE / PRINT. These stores are the seam:
//
//   - pageSourceAvailable — true while any ViewSource/SourceView is mounted
//   - pageSourceOpen      — the open/closed state of the source panel
//
// Identity registration (a Symbol per instance) is robust under the destroy/mount
// overlap of a client-side (View-Transition) slide change — the same bargain as
// localChrome's localNav / hostedAnim.

const owners = writable<Set<symbol>>(new Set());

/** True while at least one <ViewSource> / <SourceView> is mounted on this page. */
export const pageSourceAvailable = derived(owners, (s) => s.size > 0);

/** Whether the source panel is open. Shared so the hamburger and the panel agree. */
export const pageSourceOpen = writable(false);

/** A slide's ViewSource/SourceView joins the registry on mount. */
export function registerPageSource(owner: symbol): void {
	owners.update((s) => {
		const next = new Set(s);
		next.add(owner);
		return next;
	});
}

/** Leaves the registry on destroy. Closes the panel when nobody is left offering. */
export function unregisterPageSource(owner: symbol): void {
	owners.update((s) => {
		if (!s.has(owner)) return s;
		const next = new Set(s);
		next.delete(owner);
		return next;
	});
	if (get(owners).size === 0) {
		pageSourceOpen.set(false);
	}
}

/** Open the mounted source panel (no-op when none is registered). */
export function openPageSource(): void {
	if (get(owners).size === 0) return;
	pageSourceOpen.set(true);
}
