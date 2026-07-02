import { writable } from 'svelte/store';

// A page-wide registry of LAYOUT-editable opening tags and their edit state,
// so Draw's "Copy changed" patch can include plain <Block>s (and wrappers
// like ImageBlock) that live OUTSIDE any <Draw> — they are siblings of the
// surface, not children, so context can't reach them. Global for the same
// reason layoutHistory is: the author edits one page, not one component
// tree. Nothing here persists — like every LAYOUT edit, entries reset on
// reload and Copy → paste is the only way changes reach the source.

export interface ChangedTagEntry {
	id: number;
	/** Emitted tag name — 'Block', 'ImageBlock', … */
	kind: string;
	name: string;
	/** Current opening tag differs from the mount-time one. */
	dirty: boolean;
	/** The opening tag as mounted (the source form). */
	oldTag: string;
	/** The opening tag with live geometry. */
	newTag: string;
}

const entries = writable<Map<number, ChangedTagEntry>>(new Map());

/** Readable view; Map iteration order is registration (mount) order. */
export const layoutChanges = { subscribe: entries.subscribe };

let nextId = 1;
export function nextChangeId(): number {
	return nextId++;
}

/** Upsert an entry (Blocks re-report on every geometry change). */
export function reportChange(entry: ChangedTagEntry): void {
	entries.update((m) => {
		const next = new Map(m);
		next.set(entry.id, entry);
		return next;
	});
}

export function withdrawChange(id: number): void {
	entries.update((m) => {
		if (!m.has(id)) return m;
		const next = new Map(m);
		next.delete(id);
		return next;
	});
}
