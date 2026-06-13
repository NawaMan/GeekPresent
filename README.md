<div align="center">

# 📽️ GeekPresent

**Slides for people who'd rather write HTML than wrestle a slide editor.**

Build presentations with HTML, CSS, and Svelte components — each slide is a route,<br/>
the whole presentation is a static site, and it deploys to GitHub Pages.

`SvelteKit` · `Static site` · `1280×720 canvas, auto-scaled` · `Deploys to GitHub Pages`

</div>

---

## Why this project exists

If you do any front-end work you already know HTML + CSS + JS, and you've probably wished you could just *use* that to make slides instead of fighting a WYSIWYG tool. GeekPresent lets you do exactly that — and takes care of the tedious parts:

- **No manual paging or navigation.** List your slides once in `pages.ts`; arrow keys, the on-screen nav bar, and the Table of Contents are wired up for you.
- **Fixed canvas, automatic scaling.** You design on a fixed **1280×720** canvas and position things with normal CSS — including absolute positioning at exact pixels — and the framework scales the whole slide to fit any screen. You think in one size; it handles the rest.
- **Colocation, your choice.** Global CSS/JS/assets work, but each page can also keep its *own* assets (images, etc.) right next to it. Pick whatever keeps cognitive load low.
- **Real componentization.** Svelte is excellent at components, so reusable slide pieces (boxes, code viewers, notes…) are just imports.
- **Navigation built in.** Arrow keys, on-screen buttons, and a Table of Contents — no wiring required.
- **SCALED / FIXED modes.** Present scaled-to-fit, or switch to a fixed 1280×720 view with speaker notes visible below.
- **It's just text.** Slides are Svelte files, so they diff cleanly, version-control nicely, and hot-reload while you edit.

## Quick start

```bash
pnpm install
pnpm dev        # http://localhost:5173/slides/title.html
```

```bash
pnpm build      # static site -> docs/
pnpm preview    # preview the build
pnpm deploy     # publish docs/ to GitHub Pages
```

```bash
./build-static.sh ./dist        # build the static site into any folder you choose
./build-static.sh ./dist demo   # ...or just one presentation/text
```

---

## How to use

### Slides: define the order, then add files

List your slides, in order, in the presentation's `pages.ts` (`src/routes/slides/pages.ts`):

```ts
export const pages = [
    { path: "title.html", title: "Title" },
    { path: "intro.html", title: "Introduction" },
    { path: "demo.html",  title: "Demo" },
];
```

Each entry is a folder under `src/routes/slides/<name>.html/` with two files:

```
src/routes/slides/intro.html/
  +layout.js      # export const prerender = true; export const trailingSlash = "never";
  +page.svelte    # your slide content
```

> **Multiple presentations:** `slides/` is just one presentation — its route folder. To add another, create a
> sibling folder (e.g. `src/routes/talk2/`) with its own `pages.ts`, `+layout.svelte`, and slides.
> Navigation and the Table of Contents are scoped per presentation, and each presentation can have its **own
> theme** (fonts, colours, background image, favicon) in its `+layout.svelte`. See the `demo/` presentation
> (`/demo/title.html`) for a fully independent, differently-themed example.

### Title and content pages

Two templates cover most slides.

**TitlePage** — for title slides and section dividers; three named slots:

```svelte
<script>
  import TitlePage from '$lib/templates/TitlePage.svelte';
</script>

<TitlePage>
  <span slot="title">GeekPresent</span>
  <span slot="subtitle">How to Build Presentations</span>
  <span slot="subsubtitle">Your Name</span>
</TitlePage>
```

**ContentPage** — for everything else; `title` + `subtitle` props and a default slot:

```svelte
<script>
  import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="Introduction" subtitle="What we'll cover">
  <ul>
    <li>First point</li>
    <li>Second point</li>
  </ul>
</ContentPage>
```

Both templates add the navigation bar automatically.

### Positioning & size

Every slide lives on a fixed **1280×720** canvas. Lay out with whatever CSS suits the slide:

- **Normal flow** — `ContentPage` centers your content; just write HTML.
- **Absolute positioning** — when you want pixel-precise placement, position elements absolutely within the 1280×720 canvas. Because the size is fixed, `left: 640px` means the same thing on every screen.

You never write scaling code: in **SCALED** mode the framework transforms the whole canvas to fit the window (keeping the 16:9 ratio); in **FIXED** mode it stays exactly 1280×720.

### Interactivity (it's just Svelte)

Slides are Svelte components, so state and events work as usual — perfect for click-to-reveal, toggles, or anything interactive:

```svelte
<script>
  import Box from '$lib/components/Box.svelte';
  let show = false;
</script>

<button on:click={() => show = true}>Show the answer</button>

<Box bind:expanded={show} width={600} height={400}>
  <img src="answer.png" alt="the answer" />
</Box>
```

### Box — expandable overlay

`Box` pops its content up as a dimmed overlay. It opens when you set `expanded`, and closes on **CLOSE**, a click **outside**, or **Escape** — clicks *inside* are left alone, so the content stays interactive (e.g. selecting text).

```svelte
<Box bind:expanded={show} width={600} height={400}>
  <!-- any HTML or components -->
</Box>
```

Common props: `width`, `height`, `expanded`, `showClose`, `scrollable`, `top` / `left` / `bottom` / `right` (custom position), `shadowOpacity`.

### Code

Read-only code viewers built on the Monaco editor:

```svelte
<script>
  import Code    from '$lib/components/Code.svelte';
  import CodeBox from '$lib/components/CodeBox.svelte';
  let show = false;
</script>

<!-- inline, any language -->
<Code code={src} language="python" width="900px" height="300px" />

<!-- pop-up overlay, with an optional title bar -->
<CodeBox code={src} language="python" title="solution.py" bind:expanded={show} />
```

- `Code` / `CodeBox` — any language (via `language`), using Monaco's built-in folding.
- `JavaCode` / `JavaCodeBox` — Java-specialized, with a custom `import`/brace folding provider.

> Monaco is loaded from a CDN, so the code components need an internet connection.

### Local assets

Keep a page's images next to its `+page.svelte` and `import` them — Vite bundles each one and hands you its URL:

```svelte
<script>
  import diagram from './diagram.png';
</script>

<img src={diagram} alt="diagram" />
```

(`static/` is still there for truly site-wide files.)

There's also a helper that fetches a YouTube thumbnail and generates a QR code straight into a page folder:

```bash
cd src/routes/slides/my-slide.html
../../../../utils/prepare-youtube.sh https://youtu.be/<id> . my-video
```

then feed them to the `YouTube` component (which shows the thumbnail with a QR overlay that links to the video):

```svelte
<script>
  import YouTube   from '$lib/components/YouTube.svelte';
  import thumbnail from './my-video-TN.png';
  import qr        from './my-video-QR.png';
</script>

<YouTube {thumbnail} {qr} alt="My talk" youtubeId="<id>" />
```

### Other components

The presentation under `src/routes/slides/` is itself a working reference — open any slide and read its source. Beyond the above you'll find **Note** (speaker notes), **Hint** (bottom-of-slide cue), **Label** (hoverable inline highlight), **WideDiv** (wheel-scrollable wide container), and **Copyright** (auto-added corner notice).

---

## Display modes & speaker notes

Toggle **SCALED / FIXED** in the top-right corner:

- **SCALED** — the slide scales to fit the window. Use this to present.
- **FIXED** — the slide stays at 1280×720 and **speaker notes** become visible below it.

Add notes with the `Note` component (hidden in SCALED mode and when printing):

```svelte
<script>
  import Note from '$lib/components/Note.svelte';
</script>

<Note><p>Remember to mention X.</p></Note>
```

## Navigation & keyboard shortcuts

The nav bar (FIRST / PREV / NEXT / LAST) and the **Table of Contents** (top-left button) are added to every slide automatically.

| Key         | Action          |
|-------------|-----------------|
| Arrow Left  | Previous slide  |
| Arrow Right | Next slide      |
| Escape      | Close ToC / Box |

## Printing

The presentation is print-friendly — the navigation, Table of Contents, and mode toggle are hidden under `@media print`. Use your browser's print (Ctrl/Cmd-P) to print or export to PDF.

## Text view (long-form)

Alongside slides, GeekPresent builds a second artifact type — a **Text**: *one long page* (fluid width that follows the window, capped at 1080px; height grows with the content) that you author by hand and scroll, reusing the same components. It's the read-at-your-own-pace counterpart to a deck.

- The site's **landing page** (`/`) and the sample at **`/text.html`** are Text artifacts — see `src/routes/(home)/` and `src/routes/text.html/`.
- The Table of Contents' "View as article" link opens `/text.html`.
- A Text renders the same components but in a flowing document; the on-slide navigation bar becomes a single **TOP** button. To start your own, copy the `src/routes/text.html/` route folder.

## Building & deploying to GitHub Pages

It's a fully static site (`@sveltejs/adapter-static`, every route prerendered).

### ⚠️ One-time setup: enable Pages (required before the first deploy)

GitHub Pages is **off by default** on a new repo or fork. Until you turn it on, the
deploy workflow fails at the **Setup Pages** step with
`Get Pages site failed ... Not Found`. Enable it once — pick either path:

- **Web UI:** open **Settings → Pages → Build and deployment**, and set
  **Source** to **GitHub Actions** (not "Deploy from a branch"). It applies
  immediately — there's no Save button.
- **CLI** (needs a token with `repo` scope on a repo you admin):

  ```bash
  gh api --method POST repos/<owner>/<repo>/pages -f build_type=workflow
  ```

Both set the same flag: Pages source = GitHub Actions. You only do this once per repo.

### Automatic deploy

Once Pages is enabled, every push to `main` triggers
[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml), which
builds the site and publishes it to GitHub Pages — no manual step needed. The site
goes live at `https://<owner>.github.io/<repo>/`.

### Manual deploy (optional)

```bash
pnpm build      # outputs the static site to docs/
pnpm deploy     # publishes docs/ to GitHub Pages (via gh-pages)
```

### Notes

The build writes to `docs/`; `static/.nojekyll` ensures GitHub Pages serves SvelteKit's `_app/` directory (files starting with `_`) correctly. The site is served under the repo subpath (e.g. `/GeekPresent/`); adapter-static emits relative asset paths, so no `paths.base` configuration is required.

## Build to a static folder of your choice

GitHub Pages is just *one* consumer of the static build. Because every route is
prerendered with **relative** asset paths, the output is fully portable — you can
drop it on any static host, serve it from any sub-path, or open it straight off
disk. The `build-static.sh` helper builds into a folder you name, without touching
the committed `docs/`:

```bash
./build-static.sh <output-dir> [route]
```

- **`<output-dir>`** (required) — where to write the site. Created if missing; if it
  already exists it must be empty or a previous output of this script (pass
  `--force` to overwrite anything else).
- **`[route]`** (optional) — build only **one** presentation/text instead of the
  whole site. Use the route name as it appears in the URL (`demo`, `geeklight`,
  `slides`, `tall`, `text.html`, …). Omit it to build everything (the home/landing
  page and every presentation).

Flags: `--zip` also packages the result into `<output-dir>.zip`; `--force`
overwrites a non-empty folder; `--precompress` keeps the `.br`/`.gz` copies (see
below); `-h`/`--help` prints full usage.

```bash
./build-static.sh ./dist                 # whole site            -> ./dist
./build-static.sh /tmp/out demo          # just the demo deck    -> /tmp/out
./build-static.sh ./out text.html        # just the text sample  -> ./out
./build-static.sh --force ./dist         # overwrite a non-empty ./dist
./build-static.sh --zip ./dist           # build ./dist and ./dist.zip
```

Either way the result is self-contained. For a single presentation, the script
also writes a root `index.html` that redirects to that deck's first slide, and
includes the shared runtime (`_app/`), fonts, and favicon it needs.

### Preview the output

Serve the folder with any static server (don't open `index.html` over `file://` —
the routing and the CDN-loaded `Code` components expect `http://`):

```bash
npx http-server ./dist -p 8000        # then open http://127.0.0.1:8000/
# or:  python3 -m http.server 8000 --directory ./dist
```

Point the server at the folder you built — if you've already `cd`'d **into** it,
serve `.` (e.g. `npx http-server . -p 8000`) rather than `./dist`. (`pnpm preview`
only serves the adapter's `docs/` dir, not a custom output folder.)

### No precompressed clutter

`build-static.sh` skips the `.br`/`.gz` files by default, so the output stays lean
(e.g. the whole site is ~170 files instead of ~490). Those precompressed copies are
only useful when the host serves them directly (nginx `gzip_static`, Caddy, …); for
opening off disk, a simple static server, or GitHub Pages / Netlify / S3 (which
compress on the fly) they're dead weight. Pass `--precompress` if your server
actually consumes them:

```bash
./build-static.sh --precompress ./dist
```

> Under the hood the script sets `GEEKPRESENT_OUT` and `GEEKPRESENT_PRECOMPRESS`
> (both consumed by `svelte.config.js`). With those unset, `pnpm build` still writes
> to `docs/` with precompression on — exactly as before, so the GitHub Pages flow is
> unchanged.
