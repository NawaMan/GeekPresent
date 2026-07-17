# Deck structure editing — Phase 1: Add / remove slides from Overview

> Edit the deck’s **page list** from the Overview grid (press **O**): add a new
> slide (route folder + `pages.ts` entry) or remove one from the march (unlist).
> Dev-only write path; production refuses with **NOT ALLOWED**, same bargain as
> ADJUST SAVE.

## Objective

Authors already know the Overview as “the whole deck at once.” Phase 1 turns that
grid into the place you **grow or shrink the deck**, without hand-editing
`pages.ts` and without inventing a separate admin UI.

## Why this shape (settled — do not revisit)

**1. Overview is the surface; EDIT is a mode.**  
Browse (default) stays a speaker tool: click a tile → jump. **EDIT** is an
authoring overlay (dev only), toggled in the Overview header. Opening Overview
never arms structure editing mid-talk — same “offered is not active” rule as
ADJUST / ANNOTATE.

**2. A slide is still a route folder + a `pages.ts` line.**  
No new runtime model. Add creates:

- `src/routes/<deck>/<name>.html/+layout.js` (prerender + trailingSlash)
- `src/routes/<deck>/<name>.html/+page.svelte` (template scaffold)
- one `{ path, title }` entry in `src/routes/<deck>/pages.ts`

Remove in Phase 1 **unlists only** (deletes the `pages.ts` line). The folder may
remain an orphan on disk — reversible, and already a known concept in this repo.

**3. Dev plugin writes; static hosts refuse.**  
Extend the existing `apply: 'serve'` Vite plugin family
(`/__geekpresent/adjust-save`, `source-save`, …) with `page-add` / `page-remove`.
A built site has no source tree: the EDIT control is still shown and answers
**NOT ALLOWED** on click (do not grey it out and look “broken”).

**4. Pure core owns `pages.ts` surgery.**  
Line-based insert/remove (same discipline as `utils/wire-og.mjs` / ADJUST’s
`patchSource`): one-line entries only; multi-line or unparseable entries are left
alone and reported — never guessed.

**5. Truth comes from HMR, not client inventing `pages`.**  
After a successful write, Vite reloads the layout that `import { pages } from
'./pages'`. The grid does not maintain a parallel optimistic deck list.

## Phase 1 scope

| In | Out (later) |
| --- | --- |
| EDIT toggle in Overview header | Drag reorder |
| **+ Add** at end of grid | Gutter “insert here” (optional polish) |
| Form: title, path (slug from title), template Content/Title, position “after X” / end | Path rename / folder move |
| Scaffold + `pages.ts` insert | Delete files from disk |
| **Remove** = unlist + confirm | Hide/show appendix from grid |
| **NOT ALLOWED** when not in `vite dev` | Duplicate slide |

## Access

| Condition | EDIT offered | Writes work |
| --- | --- | --- |
| `vite dev` | yes | yes |
| Built / static | control present | no → **NOT ALLOWED** |

No deck prop, no sticky `?edit-deck` in Phase 1 (can mirror ADJUST later if a
demo slide needs it). Not a speaker tool: no `annotate`-style deck-wide flag.

## API (dev only)

```
POST /__geekpresent/page-add
{
  "deck": "slides",           // folder under src/routes/
  "path": "my-slide.html",    // route folder name
  "title": "My Slide",
  "template": "content" | "title",
  "after": "intro.html" | null  // null = append
}

POST /__geekpresent/page-remove
{
  "deck": "slides",
  "path": "my-slide.html"
}
```

Safety:

- Deck and path: no `.` / `..` / empty segments; path must match
  `^[a-z0-9][a-z0-9-]*\.html$` (after normalize).
- Add refuses if the folder or a `pages.ts` entry already exists.
- Remove refuses if the entry is missing or not a single-line match.
- Files always stay under `src/routes/<deck>/`.

## UX sketch

```
OVERVIEW PAGE     24 slides          [EDIT]     Esc
click a slide · Esc to close

EDIT DECK         24 slides          [DONE]     Esc
+ Add slide · × removes from deck · click still jumps
```

- **EDIT** / **DONE** in the header; Esc closes a form first, then leaves EDIT,
  then closes Overview (layered, like ToC search → menu).
- **+** dashed tile at the end of the grid opens the add form.
- Each tile shows a small **×** in EDIT; confirm “Remove *Title* from the deck?”
  (unlist only; copy says the files stay on disk).
- Production: EDIT still visible; first write attempt (or EDIT if we gate on
  capability) flashes **NOT ALLOWED**.

## Module layout

```
src/lib/deckEdit/
  pageEditCore.ts      # slugify, validate, pages.ts insert/remove, scaffolds
  routeToDeck.ts       # deck name → pages.ts / slide dir (path-safe)
src/lib/adjust/devSavePlugin.ts   # + page-add / page-remove handlers
src/lib/stores/pageEdit.ts        # canEditDeck, addPage/removePage fetch
src/lib/components/OverviewPage.svelte  # EDIT chrome
```

## Tests

- `tests/pageEditCore.test.ts` — pure: slugify, validate, insert/remove, refuse
  multi-line / missing / duplicate.
- `tests/routeToDeck.test.ts` — path safety.
- Overview DOM: EDIT control, add tile in edit mode, NOT ALLOWED path when
  `canEditDeck` is false (store override, same pattern as SAVE tests).
- SSR: Overview still renders nothing when closed; no authoring chrome baked into
  closed state.

## Phases 2+ (not this PR)

- Drag reorder → rewrite array order in `pages.ts`.
- Optional “also delete files”.
- Insert-between gutter.
- Title rename; path rename; show appendices in edit mode.

## Key decisions

1. **Overview + EDIT mode**, not ToC or a separate admin page.  
2. **Unlist-only remove** in Phase 1.  
3. **Dev plugin + pure core**, matching ADJUST SAVE.  
4. **HMR is source of truth** after writes.  
5. **Refuse, don’t hide** on static hosts.
