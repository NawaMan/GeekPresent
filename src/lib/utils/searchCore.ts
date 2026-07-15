// Full-deck search — the pure, total core.
//
// The deck has no search: "which slide mentioned backpressure?" is answered by
// paging. This module is the arithmetic behind a filter box in the Table of
// Contents. It is pure and total in the drawCore/connectorCore discipline —
// junk input (a non-string source, a null doc, an empty query) yields a defined,
// drawable answer, never a throw and never `undefined` leaking into the UI.
//
// The index is built at BUILD time from the slide *sources* (a `?raw` glob, the
// same drift-proof trick ViewSource uses — a raw import of the real file cannot
// drift from what is on screen). searchIndex.ts owns the glob; everything here is
// a string function you can unit-test with hand-written input.

/** One searchable slide: its route `path` (as in pages.ts), its `title` (the
    same string the TOC shows), and `text` — the visible prose of its source with
    tags and script blocks stripped out. */
export interface SearchDoc {
	path: string;
	title: string;
	text: string;
}

/** A match. `where` says whether the query hit the slide's title or its body;
    `snippet` is a short window of body text around the first body hit (empty for
    a title-only match, since the title is already shown). */
export interface SearchHit {
	path: string;
	title: string;
	snippet: string;
	where: 'title' | 'body';
}

const SCRIPT_OR_STYLE = /<(script|style)\b[\s\S]*?<\/\1>/gi;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const MUSTACHE = /\{[^{}]*\}/g; // Svelte {#each}/{expr} — logic, not prose
const TAG = /<[^>]+>/g;
const WHITESPACE = /\s+/g;

const ENTITIES: Record<string, string> = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': "'",
	'&nbsp;': ' '
};

/** Reduce a slide's raw `.svelte` source to the words a reader would see. Removes
    `<script>`/`<style>` blocks (so imports and component names are not searched),
    HTML comments, Svelte mustaches, and every remaining tag; decodes the handful
    of entities prose actually uses; collapses whitespace. Total: a non-string in
    is an empty string out. */
export function stripToText(src: unknown): string {
	if (typeof src !== 'string') return '';
	let text = src
		.replace(SCRIPT_OR_STYLE, ' ')
		.replace(HTML_COMMENT, ' ')
		.replace(MUSTACHE, ' ')
		.replace(TAG, ' ');
	for (const [entity, char] of Object.entries(ENTITIES)) {
		text = text.split(entity).join(char);
	}
	return text.replace(WHITESPACE, ' ').trim();
}

/** Build a deck→path→text index from a `?raw` glob's module map. Keys look like
    `/src/routes/<deck>/<slide-path>/+page.svelte`; the last two directory
    segments are the deck and the slide path (which equals its pages.ts `path`).
    Pure — searchIndex.ts feeds it the real glob, tests feed it a literal. */
export function buildDeckIndex(
	modules: Record<string, unknown>
): Record<string, Record<string, string>> {
	const byDeck: Record<string, Record<string, string>> = {};
	for (const [file, src] of Object.entries(modules ?? {})) {
		const parts = file.split('/');
		const path = parts[parts.length - 2];
		const deck = parts[parts.length - 3];
		if (!deck || !path) continue;
		(byDeck[deck] ??= {})[path] = stripToText(src);
	}
	return byDeck;
}

/** A window of `text` around the first case-insensitive occurrence of `needle`,
    with `…` where it was clipped. Empty if `needle` is absent. `radius` chars of
    context sit on each side of the match. */
export function snippetAround(text: string, needle: string, radius = 48): string {
	if (typeof text !== 'string' || !needle) return '';
	const at = text.toLowerCase().indexOf(needle.toLowerCase());
	if (at < 0) return '';
	const start = Math.max(0, at - radius);
	const end = Math.min(text.length, at + needle.length + radius);
	const lead = start > 0 ? '…' : '';
	const tail = end < text.length ? '…' : '';
	return `${lead}${text.slice(start, end).trim()}${tail}`;
}

/** Filter `docs` to those matching `query` (a case-insensitive substring of the
    title or the body), in deck order. A title hit comes back with an empty
    snippet; a body-only hit carries a snippet around the match. An empty or
    whitespace query returns no hits — the caller shows the full list instead, so
    an untouched search box leaves the TOC exactly as it was. Total: a doc with a
    missing title/text is treated as empty rather than throwing. */
export function searchDocs(docs: SearchDoc[], query: string): SearchHit[] {
	const q = (typeof query === 'string' ? query : '').trim().toLowerCase();
	if (!q) return [];
	const hits: SearchHit[] = [];
	for (const doc of docs ?? []) {
		if (!doc) continue;
		const title = typeof doc.title === 'string' ? doc.title : '';
		const text = typeof doc.text === 'string' ? doc.text : '';
		if (title.toLowerCase().includes(q)) {
			hits.push({ path: doc.path, title, snippet: '', where: 'title' });
		} else if (text.toLowerCase().includes(q)) {
			hits.push({ path: doc.path, title, snippet: snippetAround(text, q), where: 'body' });
		}
	}
	return hits;
}
