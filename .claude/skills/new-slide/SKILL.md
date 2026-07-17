---
name: new-slide
description: Author a slide in a GeekPresent deck — route folder, the mandatory +layout.js, the pages.ts entry, and the right template. Use when the user says "add a slide", "new slide", "add a page to the deck", "start me a deck from scratch", or otherwise wants deck content authored.
---

# Add a slide

A slide is **a route folder, not a file**. Getting that wrong is the single most common way a slide
looks fine in dev and then 404s or vanishes from the deck.

## The shape

`src/routes/<deck>/<name>.html/` — and the `.html` on the folder name **is intentional**, so the URL
reads `/slides/title.html`. Never "fix" it.

Two files, both mandatory:

- **`+page.svelte`** — the content.
- **`+layout.js`** — exactly these two lines. A slide folder without it breaks the static build, and a
  slide without `trailingSlash` 404s on the trailing-slash URL that the TOC and nav actually link to:
  ```js
  export const prerender = true;
  export const trailingSlash = "never";
  ```

Then the third thing, in a **different file** — the deck's own ordering list:

- **`src/routes/<deck>/pages.ts`** — insert `{ path: "<name>.html", title: "<Title>" }` at the right
  position. A slide folder with no entry is an **orphan**: it prerenders, it is reachable by direct
  URL, and it is in no deck. Nav and the Table of Contents are scoped **per deck** (each
  `+layout.svelte` publishes its own list via `setPages`), so there is no global list to fall back on.

Two optional flags on a `pages.ts` entry:

- **`hidden: true`** — an **appendix**: a real, prerendered, linkable slide that is *out* of the linear
  march. →/Space step over it; the TOC omits it. **Contiguous** hidden entries are ONE appendix chapter.
  You arrive via `<AppendixLink to="…">`, which stamps the calling slide as the return address, and you
  leave by paging off the end. `hidden` is optional and does **not** make an appendix — it only decides
  whether the forward march can find one.
- **`adjust: true`** — this slide *offers* the ADJUST control even in the built site. Set it only on
  slides that **teach** layout ("flip ADJUST and drag this box"), so the button exists when the audience
  is told to look for it. Offered is not active. See the `adjust-mode` skill.

## Writing the content

Start from a template in `src/lib/templates/`:

- **`TitlePage`** — named slots `title` / `subtitle` / `subsubtitle`.
- **`ContentPage`** — `title` + `subtitle` props, default slot. `nav={false}` drops the nav bar.
- **`AppendixPage`** — a slide you jump *into* and return *from*.

Both auto-insert the nav bar. Slides are authored on a fixed **1920×1080** canvas (portrait decks pass
1080×1920); `SlideDeck` does all the scaling.

```svelte
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="My Slide" subtitle="What it says">
	<p>Content here.</p>
</ContentPage>
```

## Rules that bite

- **Colocate assets and `import` them.** A slide's images live in *its own folder*
  (`import img from './pic.png'`). A hardcoded `/pic.png` breaks under a base-path deploy; an imported
  one is bundled, hashed and base-aware. `static/` is for site-wide files only.
- **`.note` is a RESERVED class — never use it on a slide.** `src/lib/styles/note.css` is *global* and
  reaches into any `.note` element with `*:nth-child(even) { background-color: #e8e8e8 }` — so
  `<p class="note">` silently paints a grey box behind the *second* child only. Svelte's scoped styles
  do not protect you (scoping adds a hash; it does not stop a global selector matching). Use `.cue`,
  `.caption`, anything else.
- **Monaco cannot survive client-side navigation.** On any slide reached by a `goto` — a
  View-Transition deck, or an appendix with `transition` — use `SourceView` / `QuickCode` /
  `CssSnippet`, never `ViewSource` / `Code` / `CodeBox`. They render blank after the nav.
- **Styling belongs in the component, not the slide.** If a slide needs a visual tweak, tune the
  component's default rather than bolting per-slide CSS onto it.
- **Static only.** No `+page.server.js`, no `load()`, no form actions — there is no server.

## Verify

- **The dev server is usually already up** (the user keeps it running, default port 31173) — assume it
  exists and just ask them to open `http://localhost:31173/<deck>/<name>.html`. If it isn't up you *may*
  start one **via the booth** (`./booth exec --run -- ./dev-run.sh`) and tell them the URL — but never
  kill or restart a server you didn't start, and don't reach for a host `pnpm`. See AGENTS.md Rule 6.
- What you *can* run unprompted:
  ```bash
  npm_config_verify_deps_before_run=false pnpm exec vite build   # static build
  pnpm test                                                       # dom + ssr projects
  ```
- Don't try to screenshot the deck in headless Chrome — it renders blank there (the deck's
  `initialized` flag never flips). Prove render with a test instead; see the `deck-tests` skill.

## Checklist

1. `src/routes/<deck>/<name>.html/+layout.js` — the two lines, verbatim.
2. `src/routes/<deck>/<name>.html/+page.svelte` — from `ContentPage` / `TitlePage`.
3. `src/routes/<deck>/pages.ts` — entry inserted at the right position.
4. Assets colocated and imported; no `.note` class; Monaco-safe if the deck navigates client-side.
5. Build passes; ask the user to eyeball the slide.
