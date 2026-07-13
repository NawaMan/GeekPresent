# __DIR__

A long-form page, built with [GeekPresent](https://github.com/NawaMan/GeekPresent) — a copy-and-own
SvelteKit site framework. It is **plain files in your repo now, not a dependency**: edit them, commit
them, change the framework itself if you like. Nothing here phones home or updates behind you.

## Build

```bash
cd __DIR__
__BUILD__
```

The finished static site lands in **`__OUT__/`** — that is what gets published.

## Where things are

| Path | What it is |
| --- | --- |
| `src/routes/__NAME__/` | **your page.** One long page that scrolls. |
| `src/routes/(home)/` | the landing page at `/` (delete or rewrite it; it is scaffolding) |
| `src/lib/seo/routes.ts` | `TEXT_ROUTES` — the sitemap's list of standalone pages |
| `src/lib/` | the framework: components, themes, layouts — yours to change |
| `.samples-ref/` | a worked example of every component (see *Reference*) |

## Add another page

Copy `src/routes/__NAME__/` to `src/routes/<name>.html/` and edit it. The name **is** the URL, so it
ends in `.html`.

Then — and this is the one that bites — **add `'/<name>.html'` to `TEXT_ROUTES` in
`src/lib/seo/routes.ts`.** A deck is *discovered* by the sitemap (it globs for `pages.ts`); a Text
page is **not**. Miss that line and the page builds perfectly, is served perfectly, and is never
indexed by anything.

## Reference

- **`AGENTS.md`** — the authoring manual. Point your AI agent at it: page patterns, the component
  catalogue, and the rules that are easy to get wrong.
- **`.claude/skills/`** — `new-slide`, `new-component`, `layout-mode`, `deck-tests`.
- **`.samples-ref/`** — the samples that ship with GeekPresent: one worked example of every
  component. Gitignored, but kept on disk precisely so you and your agent can read them.
- **`.samples-ref/GeekPresent-README.md`** — GeekPresent's own README: what the framework is and
  why, plus the full reference for display modes, printing, SEO and deployment.
