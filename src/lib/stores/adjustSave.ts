import { get } from 'svelte/store';
import { adjustChanges, shapeChanges } from './adjustChanges';

// Client half of the ADJUST "Save" feature (dev only). Gathers the page's dirty
// Block edits from the adjustChanges registry and POSTs them to the dev-server
// endpoint (see $lib/adjust/devSavePlugin.ts), which rewrites the slide's Svelte
// source. On success HMR reloads the slide, so the Blocks re-mount at their new
// source geometry and the registry goes clean on its own — this module doesn't
// mutate the registry itself.

const ENDPOINT = '/__geekpresent/adjust-save';

export interface SaveResult {
	ok: boolean;
	/** How many tags were written. */
	patched: number;
	/** Labels of tags the server couldn't place (paste those by hand). */
	unmatched: string[];
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
		return { ok: true, patched: data.patched ?? 0, unmatched: data.unmatched ?? [] };
	} catch (err) {
		return { ok: false, patched: 0, unmatched: [], error: err instanceof Error ? err.message : String(err) };
	}
}
