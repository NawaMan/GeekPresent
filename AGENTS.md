# AGENTS.md — Working on GeekPresent

Guidance for an AI agent (Claude Code or similar) helping a user build a presentation with this
framework. The user will usually ask in plain language ("help me add a YouTube link",
"start me from scratch"); match it to a **playbook** below and follow the steps.

Read the `README.md` first for the user-facing overview. This file is the *operator's manual*.

---

## What this project is (orient yourself in 30 seconds)

- A **SvelteKit static site**. `@sveltejs/adapter-static`, every route prerendered, builds to
  `../docs/`, deploys to **GitHub Pages**. There is **no server** — `+server.js`, `+page.server.js`,
  `load()` and form `actions` will *not* work on GitHub Pages. Don't add them.
- **A presentation is just a route folder.** `slides/` is the *default* presentation's path — the
  name isn't special. A presentation lives at `src/routes/<presentation>/` (e.g. `src/routes/slides/`), and the
  design intent is that you can host **multiple presentations** in one project, each under its own
  folder.
- **One slide = one route.** A slide lives at `src/routes/<presentation>/<name>.html/` and contains:
  - `+page.svelte` — the slide content
  - `+layout.js` — exactly `export const prerender = true; export const trailingSlash = "never";`
- **Slide order** is each presentation's own `pages.ts` (an array of `{ path, title }`), e.g.
  `src/routes/slides/pages.ts`. The presentation's `+layout.svelte` publishes it via
  `setPages(pages)` (from `$lib/presentation`); `TitlePage` / `ContentPage` read it via `getPages()`.
  So navigation and the Table of Contents are **scoped per presentation** — multiple presentations coexist,
  each with its own list. (Nothing imports a single global `pages.ts` anymore.)
- **Templates** (`src/lib/templates/`): `TitlePage` (named slots `title` / `subtitle` / `subsubtitle`)
  and `ContentPage` (`title` + `subtitle` props + default slot). Both auto-insert the nav bar.
- **The slides layout** (`src/routes/slides/+layout.svelte`) auto-adds the Table of Contents, the
  display-mode control, and the Copyright notice, and does all the scaling. Slides are authored on a
  fixed **1920×1080** canvas; FITTED mode transforms it to fit the window, SCALED shows it at an exact
  factor (1:1 and beyond, centered and pannable, with a minimap) and reveals speaker notes below the
  slide when zoomed out. Display mode lives in the `displayMode` store. Text color is `#C0F1FF` on `#181818`.
- **Components** (`src/lib/components/`): `Box`, `Note`, `Hint`, `Label`, `YouTube`,
  `ScrollDiv` (wheel-pannable container, `axis` x/y/both, optional draggable `scrollbar`;
  `WideDiv` is its `axis="x"` alias),
  `Code`, `JavaCode`, `CodeBox`, `JavaCodeBox`, `QuickCode` (small dark monospace box for short
  hand-written snippets; not Monaco), `Terminal` (a fake console — a command types itself out,
  the machine pauses, the output prints; the typing is pure CSS `@keyframes`, so the session
  is seekable: it waits behind a play button, carries a transport with a tick per command, and
  `keys="global"` lets Space run it one command at a time and then page the deck. Don't put an
  `<AnimationBar />` on a Terminal slide — both would drive the same clock; pass
  `controls={false}` if you want the bar to own it),
  `ViewSource` (corner `</> Source` button that shows a page's
  own `?raw` source in a `CodeBox`), `Block` / `ImageBlock` (absolutely-positioned
  wrappers you place at exact canvas pixels — drag/resize them in **LAYOUT mode**,
  see that playbook), `Connector` (an arrow auto-routed between two *named* `Block`s —
  see the diagram playbook), `Video` (a `<video>` with themeable chrome and *time
  bookmarks* — chapter buttons that seek, the current one highlighted; import the
  file as an asset rather than hard-coding a path), `VideoPage` (the same player
  filling the canvas, nav bar included — a complete slide, as `WebPage` is) and
  `Columns` / `Column` (a thin grid for two- and three-column layouts; a media/text
  *split* is the same component with unequal `widths`, not a second one. `resizable`
  lets a viewer drag the gutters, and LAYOUT mode always does — with a `widths` chip
  that copies the dragged ratio back into source, since a drag saves nothing),
  `QRCode` (a scannable link, encoded on the slide — the symbol is computed from the
  text, not fetched, and drawn as SVG so it survives the canvas transform. `value` is
  all it needs; an `http`/`mailto`/`tel` value links itself. Prefer it over committing
  a `-QR.png`, and note `YouTube`'s `qr` prop is now optional for exactly that reason),
  plus framework-internal `Copyright`, `CtrlBtn`,
  `NavigationBar`, `TableOfContent`, `SizeMode`, `Seo` (renders SEO/social metadata
  into `<svelte:head>` — see the SEO note under *Gotchas*).
- Package manager is **pnpm** (`pnpm dev` / `build` / `deploy`). Dev server: `http://localhost:5173`.

## Two kinds of artifact: presentations and texts

Everything above describes **presentations**. There is a second artifact type, the
**Text** — *one long page* (fluid width following the window, capped at **1080px**; height grows with the content)
that you author by hand and scroll, built from the same `$lib` components. It is
the read-at-your-own-pace counterpart to a slide deck.

- Both types publish a **mode** via Svelte context (`$lib/presentation` —
  `setMode('presentation' | 'text')` / `getMode()`, default `'presentation'`).
  Reused components read it to adapt — e.g. in a Text the `NavigationBar` collapses
  to a single **TOP** control that scrolls the page up. This is the seam for
  handling slide-oriented components (overlays, slide-anchored hints) in a Text
  later, one at a time.
- A Text is a route folder with a tiny **`+layout.svelte`** that wraps its `<slot/>`
  in **`$lib/components/TextPage.svelte`** — the shared "Text shell": a
  `100vw × 100vh` scroll container holding a fluid column (follows the window,
  capped at 1080px, centered) and `setMode('text')`. Plus the standard `+layout.js`
  and a `+page.svelte` of content. The shell owns its own scroll so the document
  opens at the top and isn't affected by the slide centering — see
  **`src/routes/text.html/`** as the worked example.
- A Text is **not** listed in any `pages.ts` (it isn't a slide). The shell lives in
  one place (`TextPage`); both Text artifacts (`text.html/` and the `(home)/`
  landing) share it, so each `+layout.svelte` is just the `<TextPage>` wrapper.
  `TextPage` applies no typography — authored `h1/p/a` use bare browser defaults,
  styled per-artifact in the Text's own `+page.svelte`.

### The landing page — `src/routes/(home)/`

The site root `/` is itself a Text artifact: the project's **index/home page**,
linking to the sample Text (`/text.html`) and the two presentations.

- `(home)` is a SvelteKit **route group** — the parentheses mean the folder name is
  *not* part of the URL, so `(home)/+page.svelte` is served at `/` (and prerenders
  to `docs/index.html`).
- The group exists so `/` can have its **own** `+layout.svelte` (wrapping the shared
  `TextPage` shell) *without* that layout wrapping the presentations (`slides/`,
  `demo/`) or the other Text (`text.html/`) — each of those brings its own layout. The top-level
  `src/routes/+layout.svelte` / `+layout.js` (global CSS + prerender) still wrap
  everything; the group's layout nests inside them for `/` only.
- Because `/` renders the landing directly, there is **no root redirect** — the old
  `src/routes/+page.svelte` redirect and `redirect-index.html` (copied over
  `docs/index.html`) were removed, and `package.json`'s `build` no longer does that
  copy. (Per-presentation index redirects like `slides/+page.svelte` → first slide
  are unrelated and still in place.)
- To add another standalone Text, copy `src/routes/text.html/` to a new route (e.g.
  `src/routes/my-text/`); the root stays the landing.

## Rules you must follow

1. **Keep `pages.ts` in sync.** Any time you add, remove, or rename a slide folder, update *that
   presentation's* `pages.ts` (e.g. `src/routes/slides/pages.ts`) to match. A slide folder with no
   `pages.ts` entry is an orphan.
2. **Every slide folder needs both files** — `+page.svelte` *and* `+layout.js` (with the prerender +
   trailingSlash lines). Missing `+layout.js` breaks the static build.
3. **Colocate page assets.** Put a slide's images/media in *its own folder* and `import` them
   (`import img from './pic.png'`). Don't drop page-specific files in `static/`; `static/` is only for
   truly site-wide files (it currently holds just `.nojekyll`).
4. **Reference assets via `import`, not hardcoded paths.** Imported assets are bundled, hashed, and
   respect any base path — hardcoded `/foo.png` breaks under a subpath deploy.
5. **The presentation folder(s) under `src/routes/` are the source of truth** (`slides/` is the
   default one). There is no `example/` folder anymore; don't recreate one.
6. **Verify before declaring done.** Run `pnpm dev` and load the affected slide
   (`/slides/<name>.html`); screenshot if you can. The build is static, so also sanity-check it isn't
   relying on any server feature.

---

## Playbooks

> When a request is ambiguous (where the blog lives, which slides to keep, etc.), **ask 1–2
> clarifying questions first**, then proceed.

### "Start me from scratch — keep only a Title page and a Content page"

1. Confirm with the user (this deletes their slides). Offer to do it on a branch.
2. Delete every folder under `src/routes/slides/` **except** `+layout.svelte`, `+layout.js`,
   `+page.svelte` (the layout/index files) and `title.html/`.
3. Create one content slide: `src/routes/slides/content.html/` with a `+layout.js` (the standard two
   lines) and a `+page.svelte` using `ContentPage`.
4. Reset `src/routes/pages.ts` to just:
   ```ts
   export const pages = [
       { path: "title.html",   title: "Title" },
       { path: "content.html", title: "Content" },
   ];
   ```
5. Remove now-orphaned colocated assets from the deleted folders.
6. Run `pnpm dev` and confirm both slides load and nav works.

### "Add a new slide"

1. `mkdir src/routes/slides/<name>.html/`.
2. Add `+layout.js` (`export const prerender = true; export const trailingSlash = "never";`).
3. Add `+page.svelte` — start from `ContentPage` or `TitlePage`.
4. Insert `{ path: "<name>.html", title: "<Title>" }` into `src/routes/pages.ts` at the right spot.
5. Verify at `/slides/<name>.html`.

### "Add a second presentation (a standalone one in the same project)"

Multi-presentation is wired up: navigation is scoped per presentation via Svelte context
(`$lib/presentation` — `setPages` / `getPages`). To add another presentation, mirror `slides/`:

1. Create `src/routes/<talk2>/` with:
   - `pages.ts` — its own `{ path, title }[]` list.
   - `+layout.svelte` — copy `slides/+layout.svelte` (it already does
     `import { pages } from './pages'` + `setPages(pages)` and adds the scaling / ToC / copyright).
   - `+page.svelte` — the index redirect (copy `slides/+page.svelte`; it's presentation-agnostic, it
     just redirects to `<currentpath>/title.html`).
   - `+layout.js` — the standard `prerender` + `trailingSlash` lines.
2. Add the slide folders (`<name>.html/` each with `+page.svelte` + `+layout.js`) and list them in
   *that* presentation's `pages.ts`.
3. Each presentation navigates within its own list automatically; links *between* presentations are plain `<a href>`s.
4. Verify both independently (`/slides/...` and `/<talk2>/...`).

> The templates read the list from context, so a presentation **must** call `setPages()` in its
> `+layout.svelte` — that's what copying `slides/+layout.svelte` gives you. Without it, that presentation's
> nav/ToC will simply be empty (it won't crash).

### "Add a YouTube link properly"

The `YouTube` component shows a thumbnail with a QR overlay that links to the video, using two
**colocated** images.

1. Make sure the slide folder exists (create it if needed).
2. Generate the assets directly into that folder (needs internet — it downloads the thumbnail):
   ```bash
   cd src/routes/slides/<name>.html
   ../../../../utils/prepare-youtube.sh https://youtu.be/<VIDEO_ID> . <basename>
   ```
   This writes `<basename>-TN.png` (thumbnail) and `<basename>-QR.png` (QR) next to the page.
3. In `+page.svelte`:
   ```svelte
   <script>
     import YouTube   from '$lib/components/YouTube.svelte';
     import thumbnail from './<basename>-TN.png';
     import qr        from './<basename>-QR.png';
   </script>
   <YouTube {thumbnail} {qr} alt="My talk" youtubeId="<VIDEO_ID>" width="600px" />
   ```
4. If there's no internet / the script fails, fall back to any thumbnail PNG the user provides + a QR
   PNG (the script uses `qrencode`).

### "Add animations"

Slides are Svelte components, so use Svelte's animation tools for *within-slide* motion (reveals,
build steps, emphasis):

- Reveal on click / build steps with `{#if}` + transitions:
  ```svelte
  <script>
    import { fade, fly } from 'svelte/transition';
    let step = 0;
  </script>
  <button on:click={() => step++}>Next</button>
  {#if step >= 1}<p transition:fade>First point</p>{/if}
  {#if step >= 2}<p in:fly={{ y: 20 }}>Second point</p>{/if}
  ```
- CSS `@keyframes` / `transition:` in a slide's `<style>` work too.
- The `Box` component is already a worked example of CSS-transition choreography.

**Worth telling the user:** slide-to-slide navigation is a **full page load**
(`NavigationBar` sets `window.location.href`), not client-side routing. Animations live *within* a
slide — and *cross-slide* transitions (animating one slide into the next) **do** work, via the
platform's cross-document **View Transitions API** (`@view-transition { navigation: auto; }`), which
is possible precisely *because* each slide is its own document. See the `transition/` deck for worked
examples (slide, flip, zoom, cross-fade, and shared-element `view-transition-name` morphs). No library,
no client-side router — just a slide-scoped `<style>` opting navigation transitions in.

### "Place an element visually (LAYOUT mode)"

When a slide positions things at exact canvas pixels, you don't have to guess the
numbers. Wrap the element in a **`Block`** (or **`ImageBlock`** for a picture) and
turn on **LAYOUT mode** to drag/resize it in the browser, then copy the resulting
tag — with its final `x`/`y`/`width`/`height` — back into the source by hand.

**LAYOUT mode is an authoring aid, not a viewer feature, and it saves nothing** — it
only helps you *find* coordinates to paste yourself. It is on by default in
`pnpm dev`. On a built/deployed site it is OFF, with a deliberate escape hatch:
append **`?layout`** to any slide URL to enable the control there; **`?layout=off`**
disables it again. (Both are sticky per browser origin — see the Gotcha.)

1. In the slide's `+page.svelte`, wrap the element:
   ```svelte
   <script>
     import Block from '$lib/components/Block.svelte';
   </script>
   <Block name="logo" x={760} y={420} width={400} height={240}>
     <!-- your content -->
   </Block>
   ```
   For an image, use `ImageBlock` instead (the image fills the panel and reshapes
   with the box; aspect is locked by default, Alt to break it):
   ```svelte
   <ImageBlock src={photo} alt="…" x={760} y={560} width={320} height={320} />
   ```
2. Run `pnpm dev` and open the slide. The **SizeMode** control (top-right) now shows
   a LAYOUT toggle — turn it on. A dashed outline appears around each `Block`.
3. **Drag** the body to move, **drag the bottom-right grip** to resize. Snap to a
   grid with the `grid` prop; hold **Alt** to break an aspect lock; **Esc** cancels
   the in-progress gesture. **Ctrl/Cmd+Z** undoes, **Ctrl/Cmd+Shift+Z** / **Ctrl+Y**
   redoes — globally across every `Block` on the page.
4. Click **Copy** on the block to put its current tag (with the live coordinates) on
   the clipboard, then **paste it over the original tag in the source**. `ImageBlock`
   emits a `src={…}` placeholder — keep your real `import`ed `src`.
5. Turn LAYOUT off (or just leave dev) and verify the slide looks right.

> Key props (full list in the component headers): `x`/`y`/`width`/`height` (canvas
> px), `name` (label + snippet comment), `grid` (snap step), `aspect`
> (`true`/number/`false`), `bounds` (`'canvas'` clamps inside, `'none'` lets it
> bleed off-stage), `minSize`. Match `canvasWidth`/`canvasHeight` to the deck if it
> isn't the 1920×1080 default.

### "Draw a diagram / connect these boxes with arrows"

Don't compute arrow coordinates. Give each box a **`name`** and let **`Connector`** route
between them — then a LAYOUT-mode drag moves the box *and* its arrows together.

```svelte
<Block name="api" x={200} y={400} width={280} height={140}>API</Block>
<Block name="db"  x={900} y={400} width={280} height={140}>DB</Block>

<!-- AFTER the Blocks — see the ordering rule below -->
<Connector from="api" to="db" label="query" />
<Connector from="db" to="api" route="curve" fromSide="bottom" toSide="bottom" dash />
```

- **Connectors must come after the Blocks they link.** Names resolve during prerendering,
  and Blocks register in document order — a connector placed first ships an empty diagram.
  An unknown name renders nothing (never a broken arrow), so a missing arrow means either
  a typo in the name or a connector that jumped the queue.
- `route`: `straight` (default), `ortho` (right angles, `radius` rounds the corners), or
  `curve`. Sides auto-pick; override with `fromSide` / `toSide` (`top`/`right`/`bottom`/`left`).
- Either end also takes a raw canvas point (`from={[300, 540]}`) or a literal
  `{ x, y, width, height }` box, for pointing at something that isn't a `Block`.
- `label` is the **visible** text on the shaft (`labelAt` 0–1 along it, `labelOffset` px
  off it); `ariaLabel` is the accessible name, defaulting to `"<from> to <to>"`.
- To build a diagram up arrow by arrow, stagger `drawDelay` across the connectors — they
  share one `AnimationBar` timeline, exactly like the `Draw` shapes' `draw`/`drawDelay`.
- Styling rides the `--draw-*` custom properties (`--draw-stroke`, `--draw-thickness`,
  `--draw-font-size`); `color` / `thickness` / `dash` override per connector.
- Hand-placed shapes and connectors mix: a `Connector` *inside* a `<Draw>` renders into
  that surface's `<svg>` instead of opening its own. Standalone, it is a canvas-spanning
  overlay with `pointer-events: none`, so it never eats a click.

See `src/routes/slides/connector-component.html/` for a five-arrow, zero-coordinate diagram.

### "Host this alongside my existing blog / GitHub Pages site"

This needs facts before code — **ask first**:
- Where does the blog live? Same repo, or a separate repo / `username.github.io`?
- What URL should the presentation sit at? (e.g. `myblog.com/talks/`)

Key levers:
- **Subpath hosting** → set `kit.paths.base` in `svelte.config.js` (e.g. `base: '/talks'`). Because all
  assets here are `import`ed (not hardcoded), they'll pick up the base automatically.
- **Output location** → the build currently writes to `../docs/` and `pnpm deploy` publishes that with
  `gh-pages`. To live beside a blog, either publish into a subfolder of the blog's published output, or
  keep a separate Pages deployment (see next playbook). Coordinate so the presentation doesn't overwrite the
  blog's `index.html`.
- One repo can only have **one** GitHub Pages site. If the blog already occupies this repo's Pages,
  the presentation must go in a *subfolder of the same build* or a *different repo*.

### "Set up a GitHub Action to deploy to GitHub Pages"

Replace the manual `pnpm deploy` with CI. Add `.github/workflows/deploy.yml` that installs pnpm,
builds, and publishes the build output. Two common shapes — pick based on their answer above:
- **Official Pages flow**: `actions/configure-pages` → upload `../docs` as the artifact →
  `actions/deploy-pages`.
- **Branch push**: `peaceiris/actions-gh-pages` pushing `../docs` to the `gh-pages` branch.

Always confirm: the build output dir (`../docs`), the Node/pnpm versions, whether a base path is
needed, and that this won't clobber an existing Pages deployment in the same repo (only one allowed).

### "Change the theme (colors / fonts / background / favicon)"

Theming is **per presentation** — edit that presentation's own `+layout.svelte`. The `slides/` and `demo/`
presentations are themed independently; **`demo/+layout.svelte` is a worked example** of all of the below:

- **Colours / font** — the `.container` / `.content` rules (`color`, `background`, `font-family`).
- **Custom web font** — add a `<link>` in `<svelte:head>` and use it in `font-family`.
- **Background image** — colocate an image in the presentation folder and reference it from the layout CSS as
  `background: url('./bg.png') center / cover` (Vite resolves the relative `url()`).
- **Favicon** — colocate a `favicon.png`, `import` it, and set it with
  `<svelte:head><link rel="icon" href={favicon} /></svelte:head>`.
- **Canvas size** — set per deck via the `width` / `height` props passed to `SlideDeck` in the
  deck's `+layout.svelte` (default **1920×1080**; portrait decks pass `1080×1920`). SlideDeck derives
  `aspectRatio` and all the scaling from them.

Shared base styles are in `src/lib/styles/`. (Note: `src/app.html` still points at a non-existent
`static/favicon.png` as the global default — a per-presentation `<svelte:head>` icon overrides it.)

### "Add a reusable component"

Add it to `src/lib/components/`, import with `$lib/components/<Name>.svelte`. Follow the existing
componentization style. If it wraps Monaco (`Code`/`JavaCode`), remember Monaco loads from a CDN.

---

## Gotchas

- **Monaco needs internet.** `Code` / `JavaCode` / `CodeBox` / `JavaCodeBox` load the editor from a
  CDN at runtime. Note this whenever you use them.
- **SEO metadata is automatic; absolute URLs need a base URL.** `SlideDeck` and `TextPage` already
  render the `Seo` component, so every slide/text gets `<title>`, `description`, OpenGraph/Twitter
  cards, and `canonical` in its prerendered HTML. Set per-deck defaults with the `description` /
  `image` props in a deck's `+layout.svelte`, and per-slide overrides via `description` / `image`
  in `pages.ts`. The absolute-only tags (`og:url`, `og:image`, `twitter:image`, `canonical`) and the
  emitted `sitemap.xml` / `robots.txt` are built from `GEEKPRESENT_SITE_URL` (default: the GitHub
  Pages URL; set it empty to omit those tags). Keep in-page **assets relative** — only metadata URLs
  are absolute. The base URL is injected via Vite `define` (see `vite.config.ts` → `$lib/seo/config.ts`).
  When you add a presentation, its slides are picked up by the sitemap automatically (it reads every
  `pages.ts`); a brand-new standalone Text route must be added to `TEXT_ROUTES` in
  `src/lib/seo/routes.ts`.
- **`name` ending in `.html` is intentional.** Route folders are literally `title.html/`, so the URL is
  `/slides/title.html`. Don't "fix" it.
- **LAYOUT mode's `?layout` opt-in is sticky and global, not per-deck.** Once `?layout`
  is seen on a built site, it's saved to `localStorage` and the LAYOUT control then
  shows on **every deck on that origin** until `?layout=off`; the on/off toggle state
  is one global flag too. So "I enabled it on one slide and now it's everywhere" is
  expected, not a bug. The flag isn't stripped from the URL, so a shared `?layout`
  link also enables it for the recipient (harmless — nothing is ever saved). In
  `pnpm dev` it's always available regardless. See `src/lib/stores/layoutMode.ts`.
- **No `pnpm install` purge in CI sandboxes.** If `pnpm install` wants to wipe `node_modules`, prefer
  `pnpm install --lockfile-only` to just sync the lockfile.
- **Static only.** If a user asks for anything server-side (auth, a database, form handling), explain
  it can't run on GitHub Pages as-is, and offer the client-side alternative (`fetch` an external API
  from the browser) or a hosting change.
