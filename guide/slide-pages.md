# Slide pages & deck shell

A deck is a route folder whose `+layout.svelte` wraps its slides in `<SlideDeck>` and publishes
the slide list from `pages.ts`. Each slide's `+page.svelte` then picks a template (`TitlePage`,
`ContentPage`, `EmptyPage`, `AppendixPage`) or a full-canvas page (`WebPage`, `VideoPage`). A Text
(one long scrolling page) uses `TextPage` instead of a deck.

## SlideDeck

The deck shell: the fixed-size canvas, FITTED/SCALED display, the top tool bar and bottom control
bar (TOC + pager), speaker notes, presenter console, SEO tags, printing, and the opt-in speaker
tools (pen, capture, kiosk).

```svelte
import SlideDeck from '@geekpresent/core/components/SlideDeck.svelte';
```

```svelte
<!-- src/routes/talk/+layout.svelte -->
<script lang="ts">
	import SlideDeck from '@geekpresent/core/components/SlideDeck.svelte';
	import { setPages } from '@geekpresent/core/presentation';
	import { deck, pages } from './pages';
	setPages(pages);
</script>

<SlideDeck
	{pages}
	title="My Talk"
	description="One sentence about the talk."
	width={deck.width}
	height={deck.height}
	fill
	fadeChrome
	annotate
	capture
>
	<slot />
</SlideDeck>
```

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `pages` | `Page[]` | `[]` | The slide list, for the TOC rendered in the shell. Pass the same array you gave `setPages`. |
| `title` | `string` | site name | Deck name; composed with the slide's `pages.ts` title into the browser-tab `<title>`. |
| `description` | `string` | site description | SEO description for slides that do not set their own. |
| `image` | `string` | site OG image | Social/OG image (absolute URL or site-relative path) for slides without their own. |
| `imageAlt` | `string` | default card alt | Alt text for that image. |
| `width` / `height` | `number` | `1920` / `1080` | Canvas size in px. A portrait deck passes `1080` / `1920`. Fixed per deck, never toggled. |
| `baseFontSize` | `string` | `'1.5em'` | The one text-size lever: every em-sized thing scales from it. Portrait decks want it larger (the portrait example uses `'1.8em'`). |
| `fill` | `boolean` | `false` | Exact fit: the content box IS the canvas (no legacy slack). Every example deck passes it; a portrait deck needs it. |
| `deckClass` | `string` | `''` | Extra classes on the frame; the theme hook, e.g. `'gp-deck theme-light'`. |
| `contentBackground` | `string` | dark surface | CSS background for the content surface (e.g. an imported image `url(...)`). |
| `contentFont` | `string` | Noto Sans | CSS `font-family` for the content surface. |
| `fadeChrome` | `boolean` | `false` | Ghost the deck's controls until pointed at, so the slide is what the audience sees. Disabled on touch devices. |
| `toolBar` | `boolean` | `true` | The top tool bar (PRESENT / ANNOTATE / ADJUST / DISPLAY / ☰). `false` drops it. |
| `controlBar` | `boolean` | `true` | The bottom bar (TOC + FIRST/PREV/NEXT/LAST + hosted AnimationBar). `false` drops it. |
| `hideChrome` | `boolean` | `false` | Hide both window-edge bars on every slide (no peek strip). Alt+. still raises them. |
| `onboardHint` | `boolean` | `true` | First-visit hint about →/Space/← and the bars. `false` opts out. |
| `onboardDelayMs` | `number` | `8000` | Idle ms on the first slide before that hint appears. |
| `preloadNeighbours` | `boolean` | `true` | Ask Chrome to preload the next/previous slide (speculation rules). `false` for very heavy decks. |
| `article` | `boolean` | `false` | Show an extra link in the TOC (article view, back to home). |
| `articleText` | `string` | `'View as article'` | That link's label. |
| `articleHref` | `string` | `'../text.html'` | That link's target, relative to the current slide URL. |
| `annotate` | `boolean` | `false` | Offer the ANNOTATE pen on every slide (offered, not active). |
| `inkStaleAfter` | `number` | `24` | Hours after which a slide's saved ink is flagged stale and offered for clearing. |
| `inkColors` | `(string \| null)[]` | `[null, '#E5484D', '#3FA9F5', '#4BD07A', '#FFFFFF']` | Pen swatches; `null` is the theme's own colour. |
| `levelHighlight` | `boolean` | `true` | Keep highlighter swipes horizontal. |
| `freehand` | `object \| false` | `{}` | perfect-freehand options for the pen (`size`, `thinning`, `streamline`, `smoothing`, …); `false` = constant-width line. |
| `capture` | `boolean` | `false` | Offer ☰ → CAPTURE (download the slide as a PNG at canvas resolution). |
| `captureScale` | `number` | `1` | Multiplier for the captured PNG (`2` → 3840×2160 from 1920×1080). |
| `kiosk` | `boolean` | `false` | Offer ☰ → KIOSK (unattended auto-advance). |
| `kioskStepMs` | `number` | `2000` | Kiosk dwell per build step. |
| `kioskPageMs` | `number` | `6000` | Kiosk dwell per page, after the build finishes. |
| `kioskWpm` | `number` | `150` | Reading speed used when kiosk times pages by speaker notes. |
| `adjust` | `boolean` | `false` | Offer ADJUST on EVERY slide in a build. Rarely wanted; prefer `adjust: true` on single `pages.ts` entries. |

Gotchas:

- **The layout must call `setPages(pages)` itself.** The slotted slides read the layout's
  context, not SlideDeck's; `pages` on SlideDeck only feeds its TOC. Forget `setPages` and the
  slides' navigation is empty (no crash).
- **Slide content is mounted in the browser, not prerendered.** The built HTML of a slide holds
  the shell, `<title>`, SEO tags and favicon, but no slide markup. A screenshot or crawler that
  does not run JS sees a blank canvas. Prove a slide renders with a `tests/*.ssr.test.ts` that
  renders it through `svelte/server`.
- **Every slide must still survive a server render**: the printable handout
  (`/_handout/<deck>.html`) renders all slides on the server. Guard `window`, `localStorage` and
  `$page.url.searchParams` with `browser`.
- **`deckClass` themes need the theme CSS.** Import `@geekpresent/core/themes/themes.css` and
  `@geekpresent/core/themes/roles.css` in the deck's `+layout.svelte`, or the theme class
  matches nothing.
- **`baseFontSize` moves text, not placements.** Block `x`/`y`/`width`/`height`, images and
  Connectors are canvas pixels; shrinking the base font shrinks prose inside a Block while the
  Block stays put.
- **`annotate`, `capture` and `kiosk` are deck-wide only.** There is no per-slide flag. All three
  (and ADJUST) are always offered in the dev server, and a sticky URL flag (`?annotate=off`,
  `?capture`, `?kiosk`, `?adjust=off`) outranks the prop. Offered is not active: each mode
  starts off.
- **URL flags on any slide:** `?present` opens the presenter console window, `?clean` hides all
  chrome, `?shot` renders the canvas at exactly 1:1 for screenshots.

## The `deck` export in pages.ts

A deck that is not a stock 1920×1080 dark canvas declares its surface in `pages.ts`, next to the
slide list, and passes the same values to `<SlideDeck>`.

```ts
// src/routes/short/pages.ts
export const deck = { width: 1080, height: 1920, baseFontSize: '1.8em' };

export const pages = [
	{ path: 'title.html', title: 'Title' },
	{ path: 'hook.html', title: 'The Hook' }
];
```

```ts
// a light, themed deck
import bg from './bg.png';
export const deck = {
	deckClass: 'gp-deck theme-light',
	background: `url(${bg}) center / cover no-repeat, var(--surface-bg)`,
	font: "'Merriweather', Georgia, serif"
};
```

| field | SlideDeck prop it mirrors | default |
| --- | --- | --- |
| `width` / `height` | `width` / `height` | `1920` / `1080` |
| `baseFontSize` | `baseFontSize` | `'1.5em'` |
| `deckClass` | `deckClass` | none |
| `background` | `contentBackground` | dark surface |
| `font` | `contentFont` | default font |

Gotchas:

- **Why it lives in `pages.ts`:** the handout never mounts the deck's `+layout.svelte`, so props
  written only on `<SlideDeck>` are invisible to it. A portrait or light deck without this
  export prints as a 1920×1080 black deck. Write the values once here and read them in the
  layout (`width={deck.width}`, `contentBackground={deck.background}`, …).

## pages.ts entries

`export const pages` is the deck: its order is the paging order and the TOC.

```ts
import heroIcon from './hero/icon.png';

export const pages = [
	{ path: 'title.html', title: 'Title' },
	{ path: 'hero.html', title: 'The Hero', favicon: heroIcon, description: 'One-line summary.' },
	{ path: 'drag-me.html', title: 'Drag me', adjust: true },
	{ path: 'appendix-gc.html', title: 'Appendix — GC', hidden: true },
	{ path: 'appendix-gc-2.html', title: 'Appendix — barriers', hidden: true }
];
```

| field | type | meaning |
| --- | --- | --- |
| `path` | `string` | The slide folder name, e.g. `'title.html'` (folder `title.html/`). |
| `title` | `string` | TOC and nav label; also the page part of the browser-tab title. |
| `hidden` | `boolean` | Out of the linear order and the TOC; still a real, linkable route. Contiguous hidden entries form one appendix chapter. |
| `adjust` | `boolean` | This slide offers ADJUST in a build (shown prominently; available, not active). |
| `description` | `string` | Per-slide SEO description; falls back to the deck's. |
| `image` | `string` | Per-slide social/OG image (absolute URL or site-relative path); falls back to the deck's. |
| `imageAlt` | `string` | Alt text for that image. |
| `favicon` | `string` | Per-slide favicon; `import` the asset. |
| `transition` | `string` | View-Transition decks only: the animation used when paging AWAY from this slide forward. Default `'slide'`. |
| `transitionBack` | `string` | Same, for paging backward (← / PREV). Default `'slide'`. |

Gotchas:

- Every entry needs a folder `<path>/` with `+page.svelte` and `+layout.js`
  (`prerender = true; trailingSlash = "never"`), and every slide folder needs an entry.
- `hidden` does not make an appendix by itself; it only takes the slide out of the forward
  march. →/Space and PREV/NEXT step over it. Reach it with `AppendixLink`.

## setPages / getPages / getProgress

Deck context. `setPages` publishes the list (call in the deck layout); `getPages` reads it;
`getProgress` is a reactive store of where the current slide sits among the VISIBLE slides.

```svelte
import { setPages, getPages, getProgress } from '@geekpresent/core/presentation';
```

```svelte
<script>
	import { getProgress } from '@geekpresent/core/presentation';
	const progress = getProgress();
</script>

{#if $progress.present}
	<p>Slide {$progress.position} of {$progress.total}</p>
{/if}
```

| member | returns | meaning |
| --- | --- | --- |
| `setPages(pages)` | `void` | Publish this deck's slide list. Call during the layout's init. |
| `getPages()` | `Page[]` | The current deck's list (`[]` if none was published). |
| `getProgress()` | `Readable<Progress>` | `{ index, position, total, fraction, present }`. `index` is 0-based (-1 off the list), `position` 1-based (0 off the list), `total` counts visible slides only, `fraction` is 0..1, `present` is false on a hidden or unlisted slide. |
| `setMode(mode)` / `getMode()` | `'presentation' \| 'text'` | Artifact mode; `TextPage` sets `'text'`. Default `'presentation'`. |
| `setViewTransitions(on)` | `void` | Opt the deck into client-side, View-Transition paging (see below). |

Gotchas:

- All of these read or write Svelte context, so call them during component init (top level of
  `<script>`), not in an event handler or `onMount`.
- For a ready-made bar, `ProgressBar` (`@geekpresent/core/components/ProgressBar.svelte`) reads
  `getProgress()` and needs no props. Place it in the deck layout after `setPages`, with
  `class="gp-chrome no-print"` so captures and printouts leave it out.

## TitlePage

The cover slide: three centred named slots.

```svelte
import TitlePage from '@geekpresent/core/templates/TitlePage.svelte';
```

```svelte
<TitlePage>
	<span slot="title">Talk Title</span>
	<span slot="subtitle">One-line promise</span>
	<span slot="subsubtitle">You · Event · Year</span>
</TitlePage>
```

| prop / slot | type | default | meaning |
| --- | --- | --- | --- |
| slot `title` | markup | — | Large heading (`--page-title-fg`). |
| slot `subtitle` | markup | — | Second line. |
| slot `subsubtitle` | markup | — | Third, smaller line. |
| `style` / `id` / `class` | `string` | `''` | On the page root; `style` wins. |

Gotchas:

- There is no `nav` prop (older docs mention one). The pager lives in SlideDeck's bottom
  ControlBar; to drop it, use `controlBar={false}` on `<SlideDeck>`.

## ContentPage

The template behind most slides: a header (title, subtitle, rule) then the content slot.

```svelte
import ContentPage from '@geekpresent/core/templates/ContentPage.svelte';
```

```svelte
<ContentPage title="Why it is slow" subtitle="Two hops, one cache miss">
	<ul>
		<li>The first hop is cheap.</li>
		<li>The second hop misses the cache.</li>
	</ul>
</ContentPage>
```

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `title` | `string` | `''` | Heading; `''` drops the `<h1>`. |
| `subtitle` | `string` | `''` | Line under the title; `''` drops it and pulls the rule up. |
| `rule` | `boolean` | `true` | The line under the header. With no title, subtitle or rule there is no header and content starts at the top. |
| `align` | `'left' \| 'center'` | `'left'` | Header alignment only; the content keeps its own (justified) styling. |
| `style` / `id` / `class` | `string` | `''` | On the page root; `style` wins. |

Theme tokens: `--page-title-fg`, `--page-title-size`, `--page-subtitle-fg`,
`--page-subtitle-size`, `--page-title-gap`, `--page-rule-gap`, `--page-rule-weight`,
`--subtitle-rule`, `--page-content-gap`.

Gotchas:

- No `nav` prop; the pager is SlideDeck's (see TitlePage).
- `class` does not reach a class defined in the slide's own scoped `<style>`; use global CSS or
  `style`.
- The content area is justified text at `1.28em`; override inline with `style` on your own
  elements if a slide needs left-aligned prose.

## EmptyPage

A full-canvas slide with no header: the slot is the whole stage. Use it when Blocks, a Draw
diagram or free layout IS the slide.

```svelte
import EmptyPage from '@geekpresent/core/templates/EmptyPage.svelte';
```

```svelte
<script>
	import EmptyPage from '@geekpresent/core/templates/EmptyPage.svelte';
	import Block from '@geekpresent/core/components/Block.svelte';
</script>

<EmptyPage>
	<Block name="hero" x={200} y={300} width={600} height={200}>The whole point</Block>
</EmptyPage>
```

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `style` / `id` / `class` | `string` | `''` | On the root (`position: relative`, 100% × 100%). |

## AppendixPage

A slide you jump INTO and return FROM: a ContentPage whose navigation leads back to the calling
slide. Contiguous `hidden` entries in `pages.ts` form one appendix chapter.

```svelte
import AppendixPage from '@geekpresent/core/templates/AppendixPage.svelte';
```

```svelte
<!-- src/routes/talk/appendix-gc.html/+page.svelte -->
<script>
	import AppendixPage from '@geekpresent/core/templates/AppendixPage.svelte';
</script>

<AppendixPage title="How the GC actually marks">
	<p>The long version, for when someone asks.</p>
</AppendixPage>
```

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `title` / `subtitle` / `rule` / `align` | as ContentPage | as ContentPage | Passed through to ContentPage. |
| `returnText` | `string` | `'RETURN'` | Label of the way-out control when a caller is known. |
| `deckText` | `string` | `'DECK'` | Label when there is no caller (it then goes to the deck's first slide). |
| `transition` | `boolean` | `false` | Animate the detour (travel back UP on the way out). Set it on the `AppendixLink` too. |
| `style` / `id` / `class` | `string` | `''` | Passed to the ContentPage root. |

Navigation:

- Inside a hidden run, PREV/NEXT page through the chapter; FIRST/LAST are the run's ends. NEXT
  (→, Space) off the last slide, or PREV off the first, returns to the caller.
- RETURN, ↑ and Backspace leave from anywhere in the appendix.
- Without `hidden`, the same page is ordinary back matter: listed in the TOC, paged into
  normally, and still shows RETURN when a slide jumped into it.

Gotchas:

- The caller rides in the URL as `?return=<slide>.html`, stamped by `AppendixLink`. It is
  validated; a direct link, bookmark or refused value falls back to DECK (the first slide).
- `transition` needs client-side navigation, and Monaco cannot survive that: on animated
  appendices use `SourceView` / `QuickCode`, never `ViewSource` / `Code` / `CodeBox`.
- On an in-flow (not hidden) appendix, `transition` animates only the way out.

## AppendixLink

The call into an appendix. Renders a real `<a>` to the appendix with the current slide stamped
as the return address, so the author never types one. Trailing glyph: ↩.

```svelte
import AppendixLink from '@geekpresent/core/components/AppendixLink.svelte';
```

```svelte
<p>
	The heap is compacted on the way out —
	<AppendixLink to="appendix-gc.html">how the GC actually marks</AppendixLink>.
</p>

<AppendixLink to="backup-demo.html" button text="BACKUP DEMO" />
```

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `to` | `string` | required | Appendix slide file name in this deck, e.g. `'appendix-gc.html'`. |
| `button` | `boolean` | `false` | Render as a control-bar style button instead of inline text. |
| `text` | `string` | `'APPENDIX'` | Button label (only with `button`; the slot is ignored then). |
| `transition` | `boolean` | `false` | Animate the jump (travel DOWN). Set it on the `AppendixPage` too. |

Gotchas:

- Same Monaco rule as AppendixPage when `transition` is on.
- Colour is `--appendix-link-fg`, which defaults to `--link-fg`; do not hand-set a link colour.
- AppendixLink does not take `style` / `id` / `class`.

## WebPage

A live website filling the whole canvas: the full-bleed sibling of `WebSite`. This is a complete
slide; the deck's pager stays above it.

```svelte
import WebPage from '@geekpresent/core/components/WebPage.svelte';
```

```svelte
<!-- src/routes/talk/svelte-site.html/+page.svelte -->
<script>
	import WebPage from '@geekpresent/core/components/WebPage.svelte';
</script>

<WebPage src="https://svelte.dev" title="svelte.dev" zoom={0.75} />
```

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `src` | `string` | `''` | URL to embed. |
| `title` | `string \| null` | `null` | Bar label and iframe accessible name; `null` uses the URL's host. |
| `zoom` | `number` | `1` | Render scale; `0.5` shows a 2×-wide desktop layout at half size. |
| `zoomLevels` | `number[]` | WebSite's ladder | Stops for the bar's − / + buttons. |
| `chrome` | `boolean` | `true` | Fake browser bar (URL + "Open ↗"). |
| `controls` | `boolean` | `true` | Zoom and reload controls in that bar (needs `chrome`). |
| `interactive` | `boolean` | `false` | Start without the click shield; the frame takes input immediately. |
| `lazy` | `boolean` | `true` | Mount the iframe only when it scrolls into view. |
| `sandbox` | `string \| false` | `'allow-scripts allow-same-origin allow-popups allow-forms'` | Sandbox tokens; `''` locks down, `false` drops the attribute. |
| `allow` | `string` | `''` | Iframe permission policy, e.g. `'fullscreen; clipboard-write'`. |
| `height` | `string` | `'640px'` | Text mode only (no canvas there). |
| `style` / `id` / `class` | `string` | `''` | On the root. |

Gotchas:

- Many sites refuse to be framed; "Open ↗" in the bar is the escape hatch.
- The site is behind a shield until clicked, so paging keys keep working; release it to page again.
- CAPTURE refuses a slide with an iframe (it cannot read cross-origin pixels).
- Use `WebSite` (in a Block) when the site is one element among others on a slide.

## VideoPage

A video filling the whole canvas: the full-bleed sibling of `Video`, with the same chrome and
chapter bookmarks. A complete slide.

```svelte
import VideoPage from '@geekpresent/core/components/VideoPage.svelte';
```

```svelte
<script>
	import VideoPage from '@geekpresent/core/components/VideoPage.svelte';
	import demo from './demo.mp4';
</script>

<VideoPage
	src={demo}
	keys="global"
	bookmarks={[
		{ at: '0:03', tag: 'HOST', label: 'No toolchain on the host.' },
		{ at: '1:14', tag: 'BUILD', label: 'It builds.' }
	]}
/>
```

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `src` | `string` | `''` | Video URL; `import` the file. |
| `poster` | `string` | `''` | Still frame before playback. |
| `bookmarks` | `{ at, label?, tag? }[]` | `[]` | Chapter markers; `at` is seconds or a clock string. |
| `chapters` | `boolean` | `true` | Show the chapter list under the bar. |
| `controls` | `boolean` | `true` | Themed player bar. |
| `native` | `boolean` | `false` | Use the browser's own controls instead. |
| `keys` | `'global' \| 'off'` | `'off'` | `'global'`: Space / Shift+Space step bookmarks, then page the deck. |
| `continueKey` | `boolean` | `true` | Also step on the presenter console's CONTINUE (needs `keys`). |
| `start` | `number \| string \| null` | `null` | Seek here once metadata loads. |
| `autoplay` | `true \| false \| 'kiosk'` | `false` | `'kiosk'` autoplays only while kiosk mode runs. |
| `kioskHold` | `boolean` | `true` | Kiosk waits for the clip to end before paging. |
| `loop` | `boolean` | `false` | Restart on end. |
| `muted` | `boolean \| undefined` | `undefined` | Undefined → muted when autoplaying. |
| `playsinline` | `boolean` | `true` | Play inline on iOS. |
| `preload` | `'none' \| 'metadata' \| 'auto'` | `'metadata'` | How much to fetch up front. |
| `height` | `string` | `'640px'` | Text mode only. |
| `style` / `id` / `class` | `string` | `''` | On the root. |

Gotchas:

- Import the video as an asset (`import clip from './demo.mp4'`); a hard-coded path breaks under
  a base path.
- Use `Video` (in a Block or a column) when the video is one element among others.

## TextPage

The shell for a Text artifact: one long scrolling page (fluid width, capped at 1080px) built from
the same components. It sets `setMode('text')`, so shared components adapt (the nav bar becomes a
single TOP control; WebPage/VideoPage flow at `height`).

```svelte
import TextPage from '@geekpresent/core/components/TextPage.svelte';
```

```svelte
<!-- src/routes/guide.html/+layout.svelte -->
<script lang="ts">
	import TextPage from '@geekpresent/core/components/TextPage.svelte';
</script>

<TextPage title="Guide — My Site" description="A long-form write-up." type="article">
	<slot />
</TextPage>
```

The route also needs `+layout.js` (`prerender = true; trailingSlash = "never"`) and a
`+page.svelte` with the content.

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `title` | `string` | `siteTitle` | Browser-tab title. |
| `description` | `string` | site description | SEO description. |
| `image` | `string` | site OG image | Social image (absolute URL or site-relative path). |
| `imageAlt` | `string` | default card alt | Alt text for it. |
| `type` | `'website' \| 'article'` | `'website'` | OpenGraph type. |
| `noindex` | `boolean` | `false` | Emit `<meta name="robots" content="noindex">` — for a draft: leave the route out of `textRoutes` and every link list too. |
| `style` / `id` / `class` | `string` | `''` | On the flowing column. |

Gotchas:

- A Text is not a slide: never list it in a deck's `pages.ts`. Link to it from a slide instead.
- Add a new Text route to `textRoutes` in `geekpresent.config.ts`, or the sitemap misses it.
- TextPage applies no typography: `h1`, `p`, `a` use browser defaults. Style them in the Text's
  own `+page.svelte`.
- The site landing page `/` is a Text too: `src/routes/(home)/+layout.svelte` wraps `TextPage`.

## View-Transition decks

By default paging is a full page load. A deck can instead page client-side and animate between
slides with the View Transitions API.

```svelte
<!-- the deck's +layout.svelte -->
<script lang="ts">
	import SlideDeck from '@geekpresent/core/components/SlideDeck.svelte';
	import { setPages, setViewTransitions } from '@geekpresent/core/presentation';
	import { pages } from './pages';
	import './view-transitions.css'; // the deck's own keyframes
	setPages(pages);
	setViewTransitions(true);
</script>

<SlideDeck {pages} fill><slot /></SlideDeck>
```

```css
/* src/routes/talk/view-transitions.css — global, not a Svelte <style> */
html[data-vt]::view-transition-old(root),
html[data-vt]::view-transition-new(root) { animation-duration: 700ms; animation-fill-mode: both; }
html[data-vt-kind="slide"][data-vt="forward"]::view-transition-old(root) { animation-name: exit-left; }
html[data-vt-kind="slide"][data-vt="forward"]::view-transition-new(root) { animation-name: enter-right; }
@keyframes exit-left   { to   { transform: translateX(-100%); } }
@keyframes enter-right { from { transform: translateX(100%); } }
```

- While a transition runs the deck sets `data-vt-kind` (the LEAVING slide's `transition` /
  `transitionBack` from `pages.ts`, default `'slide'`) and `data-vt` (`forward` / `back`) on
  `<html>`. Your stylesheet keys its animations off those; the keyframes are yours to write.
- Shared-element morphs: give matching elements the same `view-transition-name` on both slides.
- Put the keyframes in a plain imported `.css` file. A Svelte component `<style>` scopes and
  mangles `::view-transition-*` selectors.
- **Monaco breaks after client-side navigation.** `Code`, `CodeBox` and `ViewSource` render
  blank in such a deck; use `SourceView` / `QuickCode`.
- A View-Transition deck does not preload neighbours (`preloadNeighbours` has no effect).
- Browsers without the API simply page without animation.
