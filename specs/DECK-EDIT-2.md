# Deck structure editing — Phase 2: rename, duplicate, delete

> Builds on [DECK-EDIT-1](./DECK-EDIT-1.md). In the Overview's **EDIT** mode every
> tile carries **✎ rename**, **⧉ duplicate** and **× remove**. Same bargains as
> Phase 1: dev-only writes, **NOT ALLOWED** on a static host, a pure core that
> refuses rather than guesses, and HMR as the source of truth after a write.

## What each control does

| Control | Writes | Notes |
| --- | --- | --- |
| **✎ rename** | the entry's `title` and/or `path`; on a path change the folder moves | Links to the slide are rewritten (below) and listed in the status line. Editing the title never moves the folder unless the path field is edited too. Standing on the renamed slide follows it to the new URL. |
| **⧉ duplicate** | a copy of the folder (assets included) + a copy of the entry right after the original | Default title `X (copy)`, path slugged from it. The copy keeps `hidden` / `adjust` / `transition`, but not `image` — that card is a picture of the original. Its ViewSource `path` literal is retargeted. |
| **× remove** | dialog: **Unlist** / **Delete files** / Cancel | Unlist is Phase 1's behaviour (folder kept). Delete also removes the folder. The dialog first lists route files that still link to the slide. Deleting the slide you stand on steps to a neighbour. |

## Links on a path rename

A slide `<deck>/<name>.html` is referenced two ways under `src/routes`
(`deckEdit/pageEditCore.ts` → `countSlideRefs` / `rewriteSlideRefs`):

- **Deck-qualified, from any route file:** `slides/old.html`, `../slides/old.html`,
  `/slides/old.html`, and ViewSource's `src/routes/slides/old.html/+page.svelte`.
- **Bare, only from files inside the same deck:** `"old.html"`, `'./old.html'`,
  `to="old.html?x"`, and `'/old.html'` (the deck index redirect appends it to its
  pathname). A bare name in another deck is that deck's own slide and is left alone.

Matches are whole names ending at a quote, `?`, `#`, `/` or backtick, so
`bold.html` and `old.html.bak` never match. Code samples that spell a path out in
quotes are rewritten too — they describe this deck. Prose without quotes is not.

The deck's own `pages.ts` is not scanned: its entry is edited on purpose, and
its comments are prose.

## API (dev only)

```
POST /__geekpresent/page-rename     { deck, path, newPath, title }
POST /__geekpresent/page-duplicate  { deck, path, newPath, title }
POST /__geekpresent/page-remove     { deck, path, deleteFiles? }   // Phase 1 + flag
GET  /__geekpresent/page-refs?deck=&path=   → { refs: [{ file, count }] }
```

Refusals (nothing written): unknown deck, bad path, missing source folder, an
existing target folder, a target already listed, a multi-line / commented entry,
an empty title. A rename reads every link before it moves anything, and writes
`pages.ts` last so the reload finds the folder at its new name.

## Not in this phase

- Drag reorder.
- Carrying presenter ticks / annotations across a rename (both are keyed by URL).
- Renaming a deck folder.
- Rewriting links outside `src/routes` (`$lib`, other repos).
