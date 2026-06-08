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
