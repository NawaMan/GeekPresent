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
src/routes/_handout, _recorder, _source-edit, robots.txt, sitemap.xml
                                framework stubs copied from the package — leave them alone
```

A site may hold any number of decks; each navigates within its own `pages.ts`.

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
  (`/<deck>/<name>.html`). In the dev server ADJUST, EDIT and SAVE write changes straight back
  into the source files, so re-read a file before editing it after the author has been dragging.
- Before calling a change done: the slide renders, `pages.ts` lists it, the build passes
  (`pnpm build` — it prerenders every page and fails on a broken link), and the tests pass.
- **Tests**: `tests/*.ssr.test.ts` render a slide through `svelte/server`, exactly as the build
  does — the right way to prove a slide renders. A slide whose template shows the nav bar needs
  SvelteKit's `page` store stubbed in such a test (`vi.mock('$app/stores', …)`).
- The **live examples** of every component are the reference decks of the GeekPresent showcase,
  https://nawaman.github.io/GeekPresent/references/title.html , with their source under `src/routes/references/`
  in https://github.com/NawaMan/GeekPresent (there `$lib/x` is `@geekpresent/core/x` here).

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
