# The skeleton

The **clean slate** a new project begins from, instead of deleting sixty demo slides.
`adopt-geekpresent.sh --mode skeleton` moves every sample deck out to `.samples-ref/` and copies
one of these in its place. `--kind` picks which:

| `--kind` | Template | What lands in `src/routes/` |
| --- | --- | --- |
| `deck` *(default)* | `deck/` | an empty slide deck — one title slide |
| `text` | `text/` | a long-form Text page — one page that scrolls |
| `none` | — | nothing; the landing page carries the recipe instead |

`home/<kind>/+page.svelte` is the landing page that ships with each: a **getting-started page, not
a stub**. The script substitutes `__NAME__` for the deck/page name on the way in. The adopt script
prints the same guidance to the terminal, but that scrolls away — this is the copy still there a
week later, and it is a page the adopter deletes anyway once they write their own. There is one per
kind because the advice has to match what was actually scaffolded: `none` has no deck to link to
and must instead name the files to write.

## `deck/` — the smallest thing that still builds and navigates

```
+layout.js               prerender + trailingSlash "always"   (deck-level)
+layout.svelte           the <SlideDeck> shell + setPages()
+page.svelte             /<deck>/ redirects to the first slide
pages.ts                 the slide list — one entry
title.html/+layout.js    prerender + trailingSlash "never"    (slide-level)
title.html/+page.svelte  a <TitlePage>
```

Those two `trailingSlash` values differ on purpose and are the thing people get wrong: the deck is
addressed with a trailing slash, each slide without one.

## `text/` — the other artifact

A Text is one hand-authored page that scrolls, wrapped in `<TextPage>`. The catch worth knowing:
a deck is **discovered** by the sitemap (it globs `pages.ts`), but a Text is **not** — it reaches
the sitemap only by being listed in `TEXT_ROUTES` in `src/lib/seo/routes.ts`. The script adds that
line; if you add a second Text by hand, you must too, or it builds and is never indexed.

## Why these are real files

They are **source, not strings in the shell script** — so they are type-checked and formatted like
anything else, and — the point — *renderable*: `tests/SkeletonSsr.ssr.test.ts` puts them through
`svelte/server`, and `tests/adoptSkeleton.test.ts` runs the real script over a fixture tree. Nothing
in `src/` imports these files, so a rename in `$lib/templates` would otherwise rot them silently and
surface only in someone else's fresh project. A skeleton that ships broken is worse than none.
