import { derived, get, writable } from 'svelte/store';

// Page-source registry — the bridge between a slide's <ViewSource> / <SourceView>
// and the SOURCE / EDIT items in the top tool bar's hamburger menu.
//
// A slide still imports its own `?raw` bytes and mounts one of those components
// (the source cannot be auto-derived by the deck shell). What moved is the
// *button*: the corner "</> Source" control now lives as a SOURCE row in the ☰
// menu, next to OVERVIEW / CAPTURE / PRINT. EDIT is a sibling that opens the
// unscaled source-edit popup (see sourceEditWindow.ts).
//
//   - pageSourceAvailable — true while any ViewSource/SourceView is mounted
//   - pageSourceOpen      — the open/closed state of the in-slide source *panel*
//   - openPageSourceEdit  — asks the mounted component to open the edit window
//
// Identity registration (a Symbol per instance) is robust under the destroy/mount
// overlap of a client-side (View-Transition) slide change — the same bargain as
// localChrome's localNav / hostedAnim.

const owners = writable<Set<symbol>>(new Set());

/** Optional per-owner opener for the unscaled EDIT window. */
const editOpeners = new Map<symbol, () => void>();

/** True while at least one <ViewSource> / <SourceView> is mounted on this page. */
export const pageSourceAvailable = derived(owners, (s) => s.size > 0);

/** Whether the in-slide source panel (CodeBox / Box) is open. */
export const pageSourceOpen = writable(false);

/**
 * A slide's ViewSource/SourceView joins the registry on mount.
 * Pass `openEdit` so ☰ → EDIT (and the CodeBox EDIT button) can open the popup.
 */
export function registerPageSource(owner: symbol, openEdit?: () => void): void {
	owners.update((s) => {
		const next = new Set(s);
		next.add(owner);
		return next;
	});
	if (openEdit) editOpeners.set(owner, openEdit);
}

/** Leaves the registry on destroy. Closes the panel when nobody is left offering. */
export function unregisterPageSource(owner: symbol): void {
	editOpeners.delete(owner);
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

/** Open the mounted in-slide source panel (no-op when none is registered). */
export function openPageSource(): void {
	if (get(owners).size === 0) return;
	pageSourceOpen.set(true);
}

/**
 * Open the unscaled source-edit popup via the mounted component's opener.
 * No-op when nothing is registered or no opener was supplied.
 */
export function openPageSourceEdit(): void {
	// Prefer the most recently registered opener (SPA: arriving slide mounts after leaving).
	const openers = [...editOpeners.values()];
	const open = openers[openers.length - 1];
	if (open) open();
}
