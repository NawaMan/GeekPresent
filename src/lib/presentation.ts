// Multi-presentation support.
//
// `slides/` is just one presentation; a project can hold several, each in its
// own route folder with its own `pages.ts`. A presentation's +layout.svelte
// publishes its slide list with setPages(), and the templates (TitlePage /
// ContentPage) read it with getPages() — so navigation and the Table of
// Contents are scoped to whichever presentation the slide belongs to.
import { getContext, setContext } from 'svelte';
import type { Page } from '$lib/utils/navigate';

const PAGES_KEY = Symbol('nawapresent.pages');

/** Publish this presentation's slide list. Call from its +layout.svelte. */
export function setPages(pages: Array<Page>): void {
	setContext(PAGES_KEY, pages);
}

/** Read the current presentation's slide list (empty if none was published). */
export function getPages(): Array<Page> {
	return getContext<Array<Page>>(PAGES_KEY) ?? [];
}

// Artifact mode.
//
// There are two kinds of artifact, both built from the same components:
//   - 'presentation' — many discrete 1280x720 slide pages (the default).
//   - 'text'         — one long page, 1280 wide, height grows with content.
// A reused component reads this to decide how to render in each context (e.g.
// hide the slide nav bar, anchor to the document instead of the slide). An
// artifact's +layout.svelte publishes its mode with setMode(); anything that
// doesn't is treated as a presentation.
export type Mode = 'presentation' | 'text';

const MODE_KEY = Symbol('nawapresent.mode');

/** Publish this artifact's mode. Call from its +layout.svelte. */
export function setMode(mode: Mode): void {
	setContext(MODE_KEY, mode);
}

/** Read the current artifact's mode ('presentation' if none was published). */
export function getMode(): Mode {
	return getContext<Mode>(MODE_KEY) ?? 'presentation';
}
