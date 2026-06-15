export interface Page {
    path: string;
    /** The slide's name. Drives the Table of Contents and nav labels, AND the
        page segment of the browser-tab <title> (composed with the deck name —
        see documentTitle). So a page sets its tab title the same way it sets its
        favicon: from its pages.ts entry. */
    title: string;
    /** Optional page-level favicon (import a colocated asset so Vite bundles it).
        Overrides the presentation/site favicon for just this slide; emitted by the
        deck shell's <svelte:head>. See SlideDeck.svelte / slides/+layout.svelte. */
    favicon?: string;
}

/** Site-wide default document title — the deck/site name used when neither a
    presentation nor a page sets one. The <title> counterpart to the site favicon
    in app.html (which is the global default in the favicon cascade). */
export const SITE_TITLE = 'GeekPresent';

/** Compose the browser-tab <title> from the cascade

        page title — presentation title

    each level falling back to the next: page → presentation → site default.
    `pageTitle` is the current slide's own `title` (the same string the Table of
    Contents shows); `presentationTitle` is the deck name a +layout.svelte
    declares (omit it to fall back to SITE_TITLE).

    Unlike the favicon — where the browser uses the LAST <link rel="icon">, so it
    can stack across app.html → layout → page — the browser uses the FIRST
    <title>. So the whole cascade is resolved here and emitted as ONE <title> by
    the shell, rather than layered across files. */
export function documentTitle(pageTitle?: string, presentationTitle?: string): string {
    const deck = presentationTitle ?? SITE_TITLE;
    return pageTitle ? `${pageTitle} — ${deck}` : deck;
}
export interface PageNavigation {
    first: string | undefined;
    last:  string | undefined;
    prev:  string | undefined;
    next:  string | undefined;
}

export function getPageNavigation(pages: Array<Page>, currentPath: string, prefix: string = ""): PageNavigation {
    const index = pages.findIndex((page) => page.path === currentPath);
    function addPrefix(path: string | null): string | undefined { return path ? prefix + path : undefined; }

    return {
        first: addPrefix(pages[0]?.path),
        last:  addPrefix(pages[pages.length - 1]?.path),
        prev:  addPrefix(index > 0                ? pages[index - 1]?.path : null),
        next:  addPrefix(index < pages.length - 1 ? pages[index + 1]?.path : null),
    };
}
