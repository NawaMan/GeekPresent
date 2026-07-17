import { get } from 'svelte/store';
import { adjustChanges, shapeChanges } from './adjustChanges';

// Client half of the ADJUST "Save" feature (dev only). Gathers the page's dirty
// Block edits from the adjustChanges registry and POSTs them to the dev-server
// endpoint (see $lib/adjust/devSavePlugin.ts), which rewrites the slide's Svelte
// source. On success HMR reloads the slide, so the Blocks re-mount at their new
// source geometry and the registry goes clean on its own — this module doesn't
// mutate the registry itself.

const ENDPOINT = '/__geekpresent/adjust-save';

/** A tag the server couldn't place, and WHY (see patchSource.UnmatchReason):
    'not-found' — the tag isn't in the source in its literal/canonical form;
    'ambiguous' — several tags tie for the match and it is never guessed at. */
export interface UnmatchedTag {
	label: string;
	reason: 'not-found' | 'ambiguous';
}

export interface SaveResult {
	ok: boolean;
	/** How many tags were written. */
	patched: number;
	/** Tags the server couldn't place (paste those by hand), with the cause. */
	unmatched: UnmatchedTag[];
	error?: string;
}

/** Write every dirty Block AND Draw shape on the current slide back to source. */
export async function saveAdjust(): Promise<SaveResult> {
	// Blocks patch by geometry (robust to formatting); Draw shapes patch by a
	// literal old→new tag swap (a Curve has no box to patch numerically).
	const blockChanges = [...get(adjustChanges).values()]
		.filter((e) => e.dirty)
		.map((e) => ({ kind: e.kind, name: e.name || undefined, before: e.before, after: e.after }));
	const drawChanges = [...get(shapeChanges).values()]
		.filter((e) => e.dirty)
		.map((e) => ({ kind: e.kind, name: e.name || undefined, oldTag: e.oldTag, newTag: e.newTag }));
	const changes = [...blockChanges, ...drawChanges];
	if (!changes.length) return { ok: true, patched: 0, unmatched: [] };

	try {
		const res = await fetch(ENDPOINT, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ route: location.pathname, changes })
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) {
			return { ok: false, patched: 0, unmatched: [], error: data.error || `HTTP ${res.status}` };
		}
		// Tolerate the pre-reason payload shape (plain label strings) from a stale
		// dev server, defaulting to the commoner cause.
		const unmatched: UnmatchedTag[] = (data.unmatched ?? []).map((u: unknown) =>
			typeof u === 'string' ? { label: u, reason: 'not-found' as const } : (u as UnmatchedTag)
		);
		return { ok: true, patched: data.patched ?? 0, unmatched };
	} catch (err) {
		return { ok: false, patched: 0, unmatched: [], error: err instanceof Error ? err.message : String(err) };
	}
}
