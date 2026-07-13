# __DIR__

A static site, built with [GeekPresent](https://github.com/NawaMan/GeekPresent) — a copy-and-own
SvelteKit framework. It is **plain files in your repo now, not a dependency**: edit them, commit
them, change the framework itself if you like. Nothing here phones home or updates behind you.

Nothing has been scaffolded — you asked for the framework and an empty tree. Right now the site is
just its landing page. Below is exactly what to write.

## Build

```bash
cd __DIR__
__BUILD__
```

The finished static site lands in **`__OUT__/`** — that is what gets published.

## Write a deck

A deck is a folder under `src/routes/` containing a `pages.ts`. That is the whole definition — it is
what the sitemap globs for.

```
src/routes/slides/
  +layout.js               export const prerender = true;
                           export const trailingSlash = 'always';   <- the DECK
  +layout.svelte           the <SlideDeck> shell; calls setPages(pages)
  +page.svelte             redirect to the first slide
  pages.ts                 export const pages = [{ path: 'title.html', title: 'Title' }];
  title.html/
    +layout.js             export const trailingSlash = 'never';    <- each SLIDE
    +page.svelte           the slide
```

Those two `trailingSlash` values differ **on purpose**, and getting them wrong is the classic
mistake: a deck is addressed with a trailing slash, a slide without one. Omit a slide's
`+layout.js` entirely and its navigation links 404.

## Or write a Text

A Text is one long page that scrolls — docs, an essay, a README site. `src/routes/guide.html/`
with a `+layout.svelte` wrapping `<TextPage>`, a `+page.svelte` of prose, and a `+layout.js` with
`trailingSlash = 'never'`. No `pages.ts` — it is not a deck.

Then **add `'/guide.html'` to `TEXT_ROUTES` in `src/lib/seo/routes.ts`.** A deck is *discovered* by
the sitemap; a Text is **not**. Miss that line and the page builds fine and is never indexed.

## Reference

- **`AGENTS.md`** — the authoring manual. Point your AI agent at it: the component catalogue and the
  rules that are easy to get wrong.
- **`.claude/skills/`** — `new-slide`, `new-component`, `layout-mode`, `deck-tests`.
- **`.samples-ref/`** — the sample decks that ship with GeekPresent: one worked example of every
  component, and a real deck to copy the shape of. Gitignored, kept on disk for exactly this.
- **`.samples-ref/GeekPresent-README.md`** — GeekPresent's own README: what the framework is and
  why, plus the full reference for display modes, printing, SEO and deployment.
