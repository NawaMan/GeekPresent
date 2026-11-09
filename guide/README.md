# GeekPresent — authoring guide for AI agents

You are helping someone write presentations (and long-form pages) with **GeekPresent**: slides
written in HTML, CSS and Svelte, each slide a page of a static SvelteKit site. This file is how
the pieces fit; the component files next to it are the reference, one per group.

This guide ships inside the package, at `node_modules/@geekpresent/core/guide/`, so it always
matches the version the project installed. Read this file first, then the group file for any
component you are about to use. When a component's source disagrees with this guide, the source
(`node_modules/@geekpresent/core/src/…`) wins.

## The shape of a site

```
geekpresent.config.ts          site settings: name, description, siteUrl, copyright, textRoutes
src/routes/+layout.svelte       imports the framework's global CSS (keep it)
src/routes/(home)/+page.svelte  the landing page at /, a "Text" (one scrolling page)
src/routes/<deck>/              ONE DECK — a folder per presentation
  +layout.svelte                <SlideDeck> + setPages(pages)
  +layout.js                    prerender = true; trailingSlash = "always"
  +page.svelte                  redirects /<deck>/ to the first slide
  pages.ts                      the slide list — this array IS the deck
  <name>.html/                  ONE SLIDE — a folder per slide
    +page.svelte                the slide
    +layout.js                  prerender = true; trailingSlash = "never"
    picture.png                 the slide's own assets, next to it
src/routes/<page>.html/         ONE PAGE (a Text) — a blog post, an about page
  +layout.svelte                <TextPage> around the slot
  +layout.js                    prerender = true; trailingSlash = "never"
  +page.svelte                  the content
src/routes/_handout, _recorder, _source-edit, robots.txt, sitemap.xml
                                framework stubs copied from the package — leave them alone
```

A site may hold any number of decks and pages, in any mix: a deck alone, a single page, a blog
(an index page and a page per post), or all three. Each deck navigates within its own `pages.ts`.

## Rules that bite

1. **A slide folder needs BOTH files.** `+page.svelte` and a `+layout.js` with exactly
   `export const prerender = true; export const trailingSlash = "never";`. Without it the build
   fails or navigation links 404. The folder name ends in `.html` on purpose (`title.html/`), so
   the URL is `/<deck>/title.html`.
2. **Keep `pages.ts` in sync.** Add, rename or remove a slide folder and change its entry in the
   same edit. A folder with no entry is an orphan nobody can page to.
3. **Assets live next to the slide and are `import`ed.** `import photo from './photo.jpg'`, then
   `src={photo}`. Never a hard-coded `/photo.jpg` — the site is often served below the domain root
   (GitHub Pages at `/<repo>/`), and only imported assets follow that path.
4. **Links between pages are relative** (`./next.html`, `../other-deck/title.html`). Never start
   one with `/`, and never climb above the site root (`../` on a page that already sits at the root
   leaves the site when it is served under `/<repo>/`). Use the `Link` component for links.
5. **Static only.** Every route is prerendered to a file. No `+server` endpoints at runtime, no
   `load` that needs a server, no form actions, no database. Data comes from the source, or is
   `fetch`ed in the browser.
6. **Guard the browser.** Slides are server-rendered at build time, where there is no `window`,
   `document` or `localStorage`. Reach for them inside `onMount`, or behind
   `import { browser } from '$app/environment'`.
7. **Never edit `node_modules/`.** To change the framework, `pnpm patch @geekpresent/core` (a diff
   kept in `patches/`, reapplied on install). Per-site values go in `geekpresent.config.ts`.
8. **Write slides in Svelte's classic syntax, not runes.** The project runs Svelte 5, but every
   slide, deck layout and example in this guide is written the classic way: `export let`, `$:`,
   `on:click`, `<slot />`, `slot="title"`, `let:revealed`. Write yours the same way. Svelte picks
   the mode per file, and one `$state` / `$props` / `$derived` turns the whole file into runes
   mode, where `export let` and `$:` are compile errors and the slot syntax the templates and
   `<Steps let:revealed>` rely on is deprecated. The framework's own components are mixed (charts,
   Draw shapes, `DataTable`, `Toast` and `Connector` are runes components), which changes only one
   thing for you: **how they report events**. A classic component dispatches events you catch
   with `on:close`; a runes component takes a callback prop such as `onclose`. Each component's
   section in its group file says which (an "Event: `on:x`" line, or an `onx` row in the props
   table) — use the form it shows.
9. **The author edits the same files you do.** In the dev server, ADJUST's SAVE, the EDIT source
   window, the presenter console's EDIT NOTE and the OVERVIEW grid's deck editing all write into
   `src/routes` (and the EDIT window into `src/lib`) — see *The author edits too* below. Re-read a
   file before you change it; never overwrite it from a copy you read earlier in the session.

## A deck

```svelte
<!-- src/routes/talk/+layout.svelte -->
<script lang="ts">
	import SlideDeck from '@geekpresent/core/components/SlideDeck.svelte';
	import { setPages } from '@geekpresent/core/presentation';
	import { pages } from './pages';
	setPages(pages);
</script>

<SlideDeck {pages} title="My Talk" description="What it is about." width={1920} height={1080} fill>
	<slot />
</SlideDeck>
```

```ts
// src/routes/talk/pages.ts
export const pages = [
	{ path: 'title.html', title: 'Title' },
	{ path: 'why.html', title: 'Why' },
	{ path: 'detail.html', title: 'Detail', hidden: true } // an appendix: reachable, not in the march
];
```

`<SlideDeck>` owns the canvas, the scaling, navigation, the table of contents, the tool bars,
speaker notes, SEO tags and printing. Its props turn on features (pen, capture, kiosk…) — see
[slide-pages.md](slide-pages.md) and [features.md](features.md).

## A slide

```svelte
<!-- src/routes/talk/why.html/+page.svelte -->
<script>
	import ContentPage from '@geekpresent/core/templates/ContentPage.svelte';
	import Callout from '@geekpresent/core/components/Callout.svelte';
	import Note from '@geekpresent/core/components/Note.svelte';
	import diagram from './diagram.svg';
</script>

<ContentPage title="Why" subtitle="The problem in one picture">
	<img src={diagram} alt="The request path" style="width: 900px" />
	<Callout kind="tip">Most of the time goes to the second hop.</Callout>

	<Note>
		<p>Point at the second hop before moving on.</p>
	</Note>
</ContentPage>
```

- **The canvas is a fixed 1920×1080 px** (a deck may choose another size). Author in canvas
  pixels; the deck scales the whole canvas to the window. Text sizes are canvas-relative too.
- **Templates** give the common shapes: `TitlePage` (named slots `title`/`subtitle`/`subsubtitle`),
  `ContentPage` (`title`, `subtitle`, content in the slot), `EmptyPage`, `AppendixPage`.
- **Anything else is plain Svelte.** A slide is a component: markup, a `<script>`, a scoped
  `<style>`. Use components where they exist instead of rebuilding them.
- **Speaker notes** go in `<Note>`. They show in the presenter console (`?present`), the handout
  and the kiosk, never on the slide.
- **Builds** (reveal one thing per Space press) are `<Steps>` + `<Fragment>`; see
  [content.md](content.md).
- **Exact placement** (diagrams, things at pixel positions) is `<Block>` and friends, which the
  author can drag in ADJUST mode; see [layout.md](layout.md).

## A page

A web page is a **Text**: one long page that scrolls, its column following the window up to
1080px, built from the same components as a slide. It is a route folder like a slide, but it is
in no `pages.ts`; its `+layout.svelte` wraps it in `TextPage` instead of a deck.

```
src/routes/about.html/
  +layout.js          prerender = true; trailingSlash = "never"
  +layout.svelte      <TextPage title=… description=…><slot /></TextPage>
  +page.svelte        the content
  photo.jpg           its assets, next to it
```

```svelte
<!-- src/routes/about.html/+layout.svelte -->
<script lang="ts">
	import TextPage from '@geekpresent/core/components/TextPage.svelte';
</script>

<TextPage title="About" description="Who we are, in under 160 characters.">
	<slot />
</TextPage>
```

- **The site's root page** (`/`) is `src/routes/(home)/+page.svelte`, wrapped by
  `(home)/+layout.svelte`. The `(home)` group keeps that shell off every other route.
- **List every page in `textRoutes`** in `geekpresent.config.ts` (`'/'`, `'/about.html'`). Decks
  are found through their `pages.ts`, but a page is not found at all: left out, it builds and is
  missing from the sitemap.
- **`TextPage` applies no typography.** `h1`, `p` and links have the browser's defaults; style
  them in the page's own `<style>`.
- Link to another page through the base path: `import { base } from '$app/paths'`, then
  `href="{base}/about.html"`. A relative link from `/` breaks when the site is served below a
  path, because the root page has no trailing slash.

## A blog

A blog is pages and nothing else: an index at `/` listing the posts, and each post a page of its
own. There is no post collection, feed or tag system to configure, so there is nothing that can
fall out of step but the index itself.

```
src/routes/(home)/+page.svelte      the index: a list of posts, newest first
src/routes/hello-world.html/        a post: +layout.js, +layout.svelte (TextPage type="article"), +page.svelte
src/routes/2026-06-28.html/         slugs are free-form; a date works
```

```svelte
<!-- src/routes/(home)/+page.svelte -->
<script lang="ts">
	import { base } from '$app/paths';

	const posts = [
		{ path: 'hello-world.html', title: 'Hello, world', date: '2026-11-09', summary: 'The first post.' }
	];
</script>

<h1>My Blog</h1>
<ul>
	{#each posts as post}
		<li>{post.date} <a href="{base}/{post.path}">{post.title}</a> — {post.summary}</li>
	{/each}
</ul>
```

**Adding a post is three edits, in one change:** the post's folder (copy an existing one; its
`+layout.svelte` holds the title and the description the link preview shows), its entry at the top
of `posts`, and its path in `textRoutes`. A post can use every component a slide can — code,
charts, diagrams, video.

## Styling

- **Author-facing components take `style`, `id` and `class`** on their root element (charts and
  the data table do not; size those with a wrapper). `style`
  is applied last, so it wins over the component's own rules. Prefer `style` for a one-off tweak.
- **A slide's `<style>` is scoped** to that slide's own markup. A class you define there does
  not reach inside a child component; use the component's `style` prop, or a `:global(...)` rule.
- **Colours are role tokens** (CSS custom properties such as `--link-fg`, `--textblock-*`,
  `--draw-stroke`), defined in `@geekpresent/core/themes/roles.css`. Set one on a deck's container
  or a slide's element to restyle every component that reads it. Do not hard-code a colour into
  one component instance when a token exists.
- **`.note` is a reserved class name** (it styles speaker notes globally). Do not use it.
- On `Block`-like components the geometry props (`x`, `y`, `width`, `height`) own position and
  size; the same declarations inside `style` are removed.

## Working with the author

- Run the dev server and have the author look at the slide; say the exact URL
  (`/<deck>/<name>.html`).
- Before calling a change done: the slide renders, `pages.ts` lists it, the build passes
  (`pnpm build` — it prerenders every page and fails on a broken link), and the tests pass.
- **Tests**: `tests/*.ssr.test.ts` render a slide through `svelte/server`, exactly as the build
  does — the right way to prove a slide renders. A slide whose template shows the nav bar needs
  SvelteKit's `page` store stubbed in such a test (`vi.mock('$app/stores', …)`). The vitest
  configs need the GeekPresent plugin too — see *Project wiring*.
- The **live examples** of every component are the reference decks of the GeekPresent showcase,
  https://nawaman.github.io/GeekPresent/references/title.html , with their source under `src/routes/references/`
  in https://github.com/NawaMan/GeekPresent (there `$lib/x` is `@geekpresent/core/x` here).

## The author edits too

The dev server (`pnpm dev`, or the project's `scripts/dev.sh`) is also an editor. These write
straight into the project's source while you may be holding a copy of the same file:

| What the author does | What it writes |
| --- | --- |
| ADJUST → drag a Block, Draw shape or column gutter → **SAVE** | the tag's `x`/`y`/`width`/`height` (or `widths`) in the slide's `+page.svelte`, or in the `src/routes` component that holds the tag (a shared scene) |
| ☰ → **EDIT** (a small IDE window) → **SAVE** | any text file under `src/routes` or `src/lib` |
| presenter console (`?present`) → **EDIT NOTE** (key **E**) → **SAVE** | the text between `<Note>` and `</Note>` in the slide |
| **OVERVIEW** (key **O**) → **EDIT** → add, rename, duplicate, remove | slide folders **and** the deck's `pages.ts`; a rename moves the folder and rewrites the links to it under `src/routes`; a remove may delete the folder |

So:

- **Re-read before you edit.** After the author has been working in the browser, the file on disk
  is not the one you read. An edit made from a stale copy silently undoes their drag or their note.
- **After deck editing, re-read `pages.ts` and list the folder** before you add or move slides.
- **Keep geometry literal** (`x={620}`, not `x={left + 20}`) and leave it out of code samples on the
  same slide (`<Block name="api" …>`). SAVE finds a tag by its literal text; an expression, or a
  sample that repeats the real tag, makes it refuse that tag (it reports `1 OF 2`).
- The EDIT window refuses to save a file that changed on disk since it loaded it (**CONFLICT**),
  and EDIT NOTE refuses the same way. If the author reports one, your edit landed in between: they
  reload and redo theirs. ADJUST's SAVE has no such check — it patches whatever is on disk.
- None of this exists in a build. There SAVE answers **NOT ALLOWED**; nothing on a deployed site can
  write.

## Setting up a project

- **A new site:** start from [GeekPresentStarter](https://github.com/NawaMan/GeekPresentStarter)
  (*Use this template*). Everything under *Project wiring* is already done there, plus a
  CodingBooth, a Pages workflow, a sample deck, tests and an `AGENTS.md` that points here.
- **A folder of any other repository** (a Go service, a docs folder, a hand-written site): the
  site is a SvelteKit project of its own in a subfolder, and `adopt-geekpresent.sh --package`
  makes it — the Starter, with the output folder, base path and address set and a deck, a page or
  a blog scaffolded. `START.md` in the GeekPresent repository lists the questions to ask first
  and the flags they become. The site never touches the host project's code.
- **An existing SvelteKit project:** add the dependency and do the steps in the package's own
  `README.md` (`node_modules/@geekpresent/core/README.md`: settings, Vite plugin, route stubs,
  global styles), then check the rest of *Project wiring*. GeekPresent assumes a fully
  prerendered site on `@sveltejs/adapter-static`. If the app needs a server, give the site its
  own SvelteKit project in a subfolder instead (the previous point).
- `adopt-geekpresent.sh --copy` is the older route: it copies the whole framework source into a
  subfolder for the author to own, with no package to upgrade. Prefer the package; copy only when
  the author wants to own and change the framework itself. Its manual is `AGENT.md` in the
  GeekPresent repository.

## Project wiring

What a working project has. Compare against it when setting one up, and when something below
*When something goes wrong* points here.

| File | What it must have |
| --- | --- |
| `package.json` | `"@geekpresent/core": "https://github.com/NawaMan/GeekPresent/releases/download/vX.Y.Z/geekpresent-core-X.Y.Z.tgz"` (the version twice); peers `svelte` 5, `@sveltejs/kit` 2, `vite` 5 |
| `geekpresent.config.ts` | the site settings (`siteUrl`, `siteName`, `siteDescription`, `ogImageAlt`, `copyright`, `textRoutes`); every field optional |
| `vite.config.ts` | `plugins: [geekpresent(site), sveltekit()]` — `geekpresent` from `@geekpresent/core/vite`, **before** `sveltekit()` (it stamps slide sources for SAVE, which must see the `.svelte` file, not compiled JS) |
| `svelte.config.js` | `adapter-static`; `paths: { base: <from GEEKPRESENT_BASE_PATH, '' by default>, relative: false }` |
| `vitest.config.ts`, `vitest.ssr.config.ts` | `plugins: [geekpresentConfig(site), sveltekit()]` — the settings without the dev-server endpoints. Without it any test that renders `<SlideDeck>` (or a template) dies on `ReferenceError: __GEEKPRESENT_CONFIG__ is not defined` |
| `src/routes/+layout.svelte` | imports `@geekpresent/core/styles/global.css` and `@geekpresent/core/styles/tooltip.css`, then `<slot />` |
| `src/routes/+layout.js` | `export const prerender = true;` |
| `src/routes/_handout`, `_recorder`, `_source-edit`, `robots.txt`, `sitemap.xml` | the stubs, copied with `cp -r node_modules/@geekpresent/core/routes/. src/routes/` |
| `src/routes/<deck>/+layout.js` | `prerender = true; trailingSlash = "always"` (the slides inside use `"never"`) |
| `tsconfig.json` | `"extends": "./.svelte-kit/tsconfig.json"` — so run `svelte-kit sync` once in a fresh checkout |

**Served below the domain root** (a GitHub project page at `https://<owner>.github.io/<Repo>/`):
build with `GEEKPRESENT_BASE_PATH=/<Repo>` and end `siteUrl` in the same path. Local builds and
the dev server leave it empty. With it missing, every page loads its scripts from the domain root
and shows blank.

## Upgrading GeekPresent

1. **Read what changed.** Each [release](https://github.com/NawaMan/GeekPresent/releases) lists
   the commits since the one before; read every release between the installed version
   (`node_modules/@geekpresent/core/package.json`) and the new one. Look for renamed or removed
   components and props in what the project uses.
2. **Bump** the version in the `@geekpresent/core` URL in `package.json` — it appears twice, in the
   tag and in the file name — and run `pnpm install` (in a Starter project:
   `scripts/install.sh --no-frozen-lockfile`).
3. **If the install fails on a patch** (`patches/@geekpresent__core.patch`), upstream changed the
   lines the patch touches. Check whether the release already fixes what the patch was for; if
   not, redo the change with `pnpm patch @geekpresent/core` against the new version.
4. **Refresh the route stubs:** `cp -r node_modules/@geekpresent/core/routes/. src/routes/`. They
   belong to the framework, so overwriting them is safe; a stub the new version no longer ships
   stays behind and must be deleted by hand.
5. **Re-read this guide** — it is the new version's — and the group files of the components the
   project uses. Compare *Project wiring* with the project's config files.
6. **Verify:** type-check (`svelte-check`, the Starter's `scripts/check.sh`), the tests, a full
   `pnpm build` (it prerenders every page), and have the author page through the decks in the
   dev server.

## When something goes wrong

| Symptom | Cause | Fix |
| --- | --- | --- |
| Clicking a TOC entry or NEXT gives a 404 on a URL ending in `/` | the slide folder has no `+layout.js` | add it: `prerender = true; trailingSlash = "never"` |
| A slide exists but no arrow or TOC entry reaches it | it is missing from `pages.ts` | add its entry |
| The nav bar and TOC are empty on every slide | the deck's `+layout.svelte` does not call `setPages(pages)` | call it before `<SlideDeck>` |
| `pnpm build` fails with `window is not defined` (or `document`, `localStorage`) | a slide touches the browser while being prerendered | move it into `onMount`, or behind `browser` from `$app/environment` |
| `pnpm build` fails on a 404 during prerender | a link (or `AppendixLink`) to a page that does not exist | point it at a real page, with a relative path |
| The deployed site is unstyled and every slide is blank; local builds are fine | served below the domain root without a base path | build with `GEEKPRESENT_BASE_PATH=/<Repo>` (*Project wiring*) |
| An image works locally but not when deployed | a hard-coded `/x.png` | `import x from './x.png'` next to the slide |
| A test dies on `ReferenceError: __GEEKPRESENT_CONFIG__ is not defined` | the vitest config lacks `geekpresentConfig(site)` | add it (*Project wiring*) |
| A test of a slide fails on SvelteKit's `page` store | outside SvelteKit there is no request | `vi.mock('$app/stores', …)` with a page at the slide's URL |
| `Cannot find module` for `tsconfig.json`, or `$app/…` types are missing, in a fresh checkout | `.svelte-kit/` has not been generated | `pnpm exec svelte-kit sync` (the Starter's scripts do it) |
| `export let` or `$:` is a compile error in one slide | a rune (`$state`, `$props`, `$derived`) put the file in runes mode | write the slide classically (rule 8) |
| A component's event handler never fires | runes components take callback props, not `on:` events | use the form its group file shows (`onclose`, not `on:close`) |
| A `Connector` draws nothing | an unknown `from`/`to` name, or the Connector comes before the Blocks it links | check the names; put Connectors after their Blocks |
| A Monaco code block (`Code`, `CodeBox`, `ViewSource`) is blank after an animated page turn | Monaco does not survive client-side navigation | use the Shiki ones (`QuickCode`, `CssSnippet`, `SourceView`) in View-Transition decks and animated appendices |
| A class from the slide's `<style>` has no effect on a component | slide styles are scoped and do not reach inside components | use the component's `style` prop, or `:global(...)` |
| `left` / `top` / `width` in a Block's `style` is ignored | geometry props own the box; those declarations are removed | use `x` / `y` / `width` / `height` |
| A light-grey box appears behind every second element of something | it has the reserved class `.note` | rename the class |
| Code in a `QuickCode` breaks the slide, or `{…}` in it is evaluated | code was written in the slot | pass it as a template literal, `` code={`…`} `` (see code.md) |
| SAVE answers a tally such as `1 OF 2` | a tag's geometry is an expression, or a code sample on the slide repeats it | literal numbers; elide geometry in samples (*The author edits too*) |
| SAVE answers **NOT ALLOWED** | it was pressed on a build, not the dev server | expected; Copy the tag into source by hand |
| `pnpm install` fails after an upgrade | a `pnpm patch` no longer applies | *Upgrading GeekPresent*, step 3 |

## Imports

Everything under the framework's `src/` is importable by path:

| What | Import |
| --- | --- |
| A component | `import Box from '@geekpresent/core/components/Box.svelte';` |
| A template | `import TitlePage from '@geekpresent/core/templates/TitlePage.svelte';` |
| The Draw family | `import { Draw, Rect, Line } from '@geekpresent/core/draw';` |
| Charts | `import { BarChart } from '@geekpresent/core/chart';` |
| Data table | `import { DataTable } from '@geekpresent/core/datatable';` |
| Remote data | `import { RemoteData } from '@geekpresent/core/data';` |
| Deck context | `import { setPages, getPages, getProgress } from '@geekpresent/core/presentation';` |
| Persisted state | `import { persisted } from '@geekpresent/core/stores/persisted';` |

## Components

One line each; the group file has the props, an example and the traps.

**[slide-pages.md](slide-pages.md) — the deck and its page types**
- `SlideDeck` — the deck shell in a deck's `+layout.svelte`; its props turn features on
- `pages.ts` — slide entries (`hidden`, `adjust`, `image`, `transition`…) and the `deck` surface export
- `setPages` / `getPages` / `getProgress` — the deck context
- `TitlePage`, `ContentPage`, `EmptyPage` — slide templates
- `AppendixPage` / `AppendixLink` — a detour you jump into and return from
- `WebPage` — a live website filling the slide · `VideoPage` — a video filling the slide
- `TextPage` — the shell of a Text: one long scrolling page
- View-Transition decks — animated slide-to-slide transitions

**[layout.md](layout.md) — exact placement and diagrams**
- ADJUST mode — drag things into place in the browser, SAVE writes the source
- `Block` — any content at exact canvas pixels · `ImageBlock` — a picture · `SvgBlock` — inline SVG
- `TextBlock` — a labelled diagram box · `Connector` — an auto-routed arrow between named Blocks
- `Group` — Blocks that move, zoom and pan as one (a camera on a drawing)
- `Columns` / `Column` — two- and three-column layouts · `ScrollDiv` / `WideDiv` — a scrollable area

**[content.md](content.md) — text and building blocks**
- `Callout`, `Quote`, `Box`, `Label`, `Kbd`, `Highlight`, `Hint`, `Toast`
- `Stat` / `StatGroup` — big numbers · `Timeline` / `TimelineItem` — events in order
- `Tabs` / `Tab`, `Carousel` / `CarouselItem` — several panels in one place
- `Steps` / `Fragment` — reveal one thing per Space press
- `Typewriter` — text typing itself out · `Note` — speaker notes
- `Link` — every link on a slide · `QRCode` — a scannable link · `ProgressBar` — how far through the deck

**[code.md](code.md) — showing code**
- `QuickCode` — a short snippet · `CssSnippet` — highlighted code (Shiki) · `CodeDiff` — a diff
- `Code` / `CodeBox` — the Monaco editor (needs internet) · `Terminal` — a console session typing itself
- `StepTerminal` — a console whose commands are steps of a `Steps` build
- `ViewSource` / `SourceView` — show the slide's own source

**[media.md](media.md) — images, video, embeds**
- Images — import the file next to the slide
- `YouTube` — a video thumbnail linking out · `Video` — a video with chapter bookmarks
- `WebSite` — a live website in a box · `WebPage`, `VideoPage` — the full-slide versions

**[data.md](data.md) — charts and tables** (`@geekpresent/core/chart`, `/datatable`, `/data`)
- `BarChart` (incl. stacked), `LineChart` (incl. two axes), `AreaChart`, `ScatterChart`, `ComboChart`,
  `PieChart`, `Waterfall`, `Gantt`, `Histogram`, `Heatmap`, `ChartLegend`
- `DataTable` — sort, search, paginate, select · `ColumnToggle` · `RemoteData` — fetch rows from an API

**[draw.md](draw.md) — drawing and animation** (`@geekpresent/core/draw`)
- `Draw` — the SVG surface · `Rect`, `Ellipse`, `Line`, `Curve`, `Arc`, `Path`, `Polyline` — shapes
- draw-on strokes, keyframes, rough hand-drawn style
- `Sprite` — an element flying along a path · `Cursor` — a fake mouse pointer demoing a UI
- `Canvas` — a 2D canvas on the animation clock · `AnimationBar` — the scrubber for a slide's timeline
- `AnimationScene`, `SpriteStudio` · triggers (`fireTrigger`, `<Note data-trigger>`)

**[features.md](features.md) — things a deck turns on**
- presenter console (`?present`), ANNOTATE pen, Spotlight, live pointer, CAPTURE to PNG, KIOSK auto-advance,
  OVERVIEW grid, search, handout and printing, state (`persisted`), progress, keyboard shortcuts,
  URL flags, chrome bars, onboarding hint, SEO
