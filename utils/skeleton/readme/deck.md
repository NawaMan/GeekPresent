# __DIR__

Slides, built with [GeekPresent](https://github.com/NawaMan/GeekPresent) — a copy-and-own SvelteKit
deck framework. It is **plain files in your repo now, not a dependency**: edit them, commit them,
change the framework itself if you like. Nothing here phones home or updates behind you.

## Build

```bash
cd __DIR__
__BUILD__
```

The finished static site lands in **`__OUT__/`** — that is what gets published.

## Where things are

| Path | What it is |
| --- | --- |
| `src/routes/__NAME__/` | **your deck.** One folder per slide. |
| `src/routes/__NAME__/pages.ts` | the slide list, in order — a slide missing from it is unreachable |
| `src/routes/(home)/` | the landing page at `/` (delete or rewrite it; it is scaffolding) |
| `src/lib/` | the framework: components, themes, layouts — yours to change |
| `.samples-ref/` | a worked example of every component (see *Reference*) |

## Add a slide

1. **`src/routes/__NAME__/<name>.html/+page.svelte`** — the slide itself.
2. **`src/routes/__NAME__/<name>.html/+layout.js`** — one line:
   ```js
   export const trailingSlash = 'never';
   ```
   **Do not skip this.** Without it, that slide's navigation links 404. (The deck's own
   `+layout.js` says `'always'` — the two differ on purpose: a deck is addressed with a trailing
   slash, each slide without one. It is the thing people get wrong.)
3. Add `{ path: '<name>.html', title: '...' }` to **`pages.ts`**, in the position you want it.

## Reference

- **`AGENTS.md`** — the authoring manual. Point your AI agent at it: slide patterns, the component
  catalogue, and the rules that are easy to get wrong.
- **`.claude/skills/`** — `new-slide`, `new-component`, `layout-mode`, `deck-tests`.
- **`.samples-ref/`** — the sample decks that ship with GeekPresent: one worked example of every
  component. Gitignored, but kept on disk precisely so you and your agent can read them.
- **`.samples-ref/GeekPresent-README.md`** — GeekPresent's own README: what the framework is and
  why, plus the full reference for display modes, keyboard navigation, printing, speaker notes,
  SEO and deployment.
