# Deck features

Things a deck turns on, or a speaker uses while presenting. Most of them are NOT placed on a
slide: `SlideDeck` mounts them once, and the deck offers them with a prop on `<SlideDeck>` in the
deck's `+layout.svelte`, or the speaker offers them with a URL flag. In this guide, every import
uses the package path: `$lib/x` in the framework repo is `@geekpresent/core/x` in your project.

The common access rule for ANNOTATE, CAPTURE, KIOSK and ADJUST: **offered is not active.** The
prop (or flag) makes the control available; the mode still starts off until the speaker turns it
on. In `vite dev` every one of them is offered regardless of props.

```svelte
<!-- src/routes/<deck>/+layout.svelte -->
<script lang="ts">
	import SlideDeck from '@geekpresent/core/components/SlideDeck.svelte';
	import { setPages } from '@geekpresent/core/presentation';
	import { pages } from './pages';
	setPages(pages);
</script>

<SlideDeck {pages} title="My talk" annotate capture kiosk>
	<slot />
</SlideDeck>
```

## Presenter console

A second window onto the same deck, for the speaker. It shows the current slide's `<Note>` as a
notes panel, live previews of the current and next slide, a clock and an elapsed timer, and a
bottom bar with PREV/NEXT/FIRST/LAST, OVERVIEW, a searchable TOC and an ANIMATE control. The
audience window follows every page turn the console makes (and the reverse).

- **Open it:** the **PRESENT** button in the top tool bar (or Alt+. then **p**), or open any slide
  with `?present` appended.
- **While a console is live** the audience window hides both chrome bars and its below-slide
  notes (see *Chrome bars* below).
- **Keys in the console:** → / ← page; **Space** sends CONTINUE to the audience (advances a build,
  never pages); **Shift+Space** walks back; Home/End/PageUp/PageDown as in the deck; **T** TOC
  menu (↑/↓/Enter walk it); **C** reset note checks; **A** reset ink (only when ANNOTATE is
  offered); **B** hide/show the audience's bars; **E** EDIT NOTE; **R** open the recorder;
  **Esc** closes menus.
- **Note lines are checkboxes.** Each child element of a `<Note>` gets a checkbox in the console
  (click it, or double-click the line; Shift = check this line and every line above). Checks
  persist per slide.
- **Note-line hooks:** a line with `data-highlight="<block name>"` spotlights that Block while the
  speaker's pointer is over the line (see *Spotlight*). A line with `data-trigger="<name>"` fires
  that trigger when its checkbox is checked (used by `Cursor startOn="<name>"` and
  `Typewriter startOn="<name>"`).

```svelte
<script>
	import Note from '@geekpresent/core/components/Note.svelte';
</script>

<Note>
	<p>Open with the outage story.</p>
	<p data-highlight="db">Point at the database.</p>
	<p data-trigger="demo-cursor">Run the cursor demo.</p>
</Note>
```

- **EDIT NOTE** (key **E**) edits the source between `<Note>` and `</Note>` in place over the
  notes panel. SAVE only works under `vite dev` (it writes the slide file through a dev-only
  endpoint); on a static host it answers **NOT ALLOWED**. It refuses rather than guesses when the
  slide has no note, has two notes, changed since load, or the edit would not parse.
- **● REC** (key **R**) opens the VOD Recorder in its own window (`/_recorder?deck=<deck>`). REC
  asks which tab to share (pick the slides tab), hides the bars, and records the canvas at its
  true size (1920x1080 by default) plus a `.timeline.txt` of every action. STOP saves both. Edit
  the timeline and REPLAY it to record again hands-off. Options: size, 30/60 fps, microphone, tab
  sound, keep existing ink. Chromium only (it uses `MediaStreamTrackProcessor`).

Gotchas:

- The recorder needs the `_recorder` route stub in your project (`cp -r
  node_modules/@geekpresent/core/routes/. src/routes/`). Same for the handout and the source
  editor.
- Record from a production build served locally, not from `vite dev`: dev loads hundreds of
  unbundled modules per page turn and shows a blank second between slides.
- A custom slide control that changes what is on screen without going through the deck's own
  navigation, Steps, AnimationBar, triggers or `setHighlight` will not appear in a recorded
  timeline, so REPLAY will not reproduce it.

## ANNOTATE (the speaker's pen)

Freehand ink on the live slide: pen, levelled highlighter, line, arrow, rectangle (small rounded
corners), text, eraser, freeze. Arm it from the **ANNOTATE** button in the top tool bar (Alt+. then
**a**).

- **Offer it:** `<SlideDeck {pages} annotate />`. The flag is deck-wide only; there is no per-slide
  `annotate` in `pages.ts`. Precedence: `vite dev` > sticky `?annotate` / `?annotate=off` > the
  `annotate` prop > off.
- **Ink persists per slide, across reloads** (localStorage, keyed by the slide's pathname). The
  audience window mirrors the speaker's strokes automatically through the `storage` event.
- **Stale ink:** a slide whose ink is older than `inkStaleAfter` hours (default `24`) says so on
  arrival and offers to clear it.
- **RESET** (this slide) and **RESET ALL** are on the pen's bar and in the presenter console
  (key **A**).
- The pen takes the pointer, never the keyboard: ←/→/Space keep paging while it is armed. **Esc**
  puts the pen down without navigating.
- **POINTER** (first on the pen's bar) hands the mouse back without closing the pen: the ink stays
  and the bar stays up, but clicks reach the slide — a link, a button, a video's controls. Pick a
  drawing tool to draw again — or POINTER again, which returns to the tool you had.
- **Keys while the pen is armed:** **1–9** pick the bar's modes left to right (1 POINTER, 2 pen, 3
  line, 4 arrow, 5 rectangle, 6 highlight, 7 text, 8 erase, 9 freeze — each button shows its
  digit), **Shift+1–9** the colour swatches. So 1 → click the slide → 1 is back to drawing.
- **One colour for every tool.** The picked swatch stays picked when you change tool; the theme
  swatch lets each tool use its own theme colour (pen orange, highlighter yellow).

Other props on `<SlideDeck>`:

| Prop | Default | Effect |
|---|---|---|
| `inkStaleAfter` | `24` | hours before ink counts as stale |
| `inkColors` | `[null, '#E5484D', '#3FA9F5', '#4BD07A', '#FFFFFF']` | swatches; `null` = the theme's colour (`--annot-*` role tokens) |
| `levelHighlight` | `true` | highlighter swipe stays level on the row you started on |
| `freehand` | `{}` | perfect-freehand options for the pen (size 12, thinning 0.7, streamline 0.6, smoothing 0.5); `false` = constant-width line |

Gotchas:

- Anything clickable you put over the canvas must sit above the ink surface (z-index 40) or the
  armed pen eats its clicks.
- CAPTURE keeps the ink: the ink surface is deliberately not marked as chrome.

## Spotlight

Dims the canvas and rings a **named** Block (`Block`, `ImageBlock`, `TextBlock`, `SvgBlock`, or a
part inside a `Group`). `SlideDeck` mounts it once; no slide places it. It looks the name up in the
same registry `Connector` uses, so it follows a Block dragged in ADJUST and needs no coordinates.

- **From notes:** give a `<Note>` line `data-highlight="api"`. In the presenter console, hovering
  that line lights the Block named `api` on the audience screen; leaving the line clears it.
- **From slide code:** call `setHighlight(name)` (a button, a build step). `null` or `''` clears.

```svelte
<script>
	import TextBlock from '@geekpresent/core/components/TextBlock.svelte';
	import { setHighlight } from '@geekpresent/core/stores/highlightTarget';
</script>

<TextBlock name="api" x={200} y={400} width={280} height={140}>API</TextBlock>
<button on:click={() => setHighlight('api')}>Show the API</button>
```

Gotchas:

- An unknown name renders nothing (no error). If nothing lights, check the spelling of `name`.
- The highlight is per window and transient; it does not persist across a page load.

## CAPTURE (slide to PNG)

Downloads the current slide as a PNG at the canvas's true size (1920x1080 for a stock deck), not
at the window's size. It re-renders the canvas; it does not screenshot the window. Ink is
included; chrome is not.

- **Offer it:** `<SlideDeck {pages} capture captureScale={2} />`. It then appears as **CAPTURE** in
  the top bar's ☰ menu (Alt+. then **c** once ☰ is open). Precedence: `vite dev` > sticky
  `?capture` / `?capture=off` > the `capture` prop > off.
- `captureScale` multiplies the output (`2` gives 3840x2160) and stays sharp, because it
  re-renders rather than upscales.
- What is stripped: every element with class `no-print` or `gp-chrome`. Mark your own overlay
  controls with `no-print` and CAPTURE and printing both leave them out.

Gotchas:

- A slide with an `<iframe>` (`WebSite`, `WebPage`, `YouTube`) cannot be captured: the browser
  forbids reading another document's pixels. CAPTURE answers **NOT ALLOWED** and names the embed.
  `<canvas>` and `<video>` are fine; they are snapshotted into the file.

## Live pointer (for screen recorders)

Some screen recorders leave the mouse cursor out of the video: GNOME's built-in screencast, and
any capture of a browser tab (the deck's own ● REC included). The live pointer is a glyph the
page draws where the mouse is, so the recording has a pointer anyway. The real cursor is hidden
while it is on, so you see one pointer, not two. A press flashes a ripple, so clicks show too.

- **Turn it on:** ☰ → **DRAW POINTER** (Alt+. then **i**), or open any slide with `?pointer`.
  `?pointer=off` (or the same menu row) turns it off. The choice is sticky across slides.
- **Deck default:** `<SlideDeck {pages} pointer pointerShape="arrow" pointerSize={40} />`.
  `pointerShape` is `arrow` / `dot` / `ring` (the same glyphs as `Cursor`); `pointerSize` is in
  screen px. The speaker's choice outranks the prop.
- Colours are role tokens: `--live-pointer-fill`, `--live-pointer-outline`, `--live-pointer-glow`,
  `--live-pointer-ripple` (a bright yellow by default, brighter than `Cursor`'s orange).
- It is not `Cursor`: that one is scripted and plays on the animation timeline. This one follows
  the real mouse and needs nothing on the slide.

Gotchas:

- Over an `<iframe>` (`YouTube`, `WebSite`, `WebPage`) the page gets no mouse events, so the drawn
  pointer stops at the iframe's edge until the mouse comes back.
- It is `no-print`: CAPTURE and printing leave it out. A screen recorder still sees it.
- ● REC timelines do not record the pointer, so a REPLAY shows it standing still.

## KIOSK (unattended auto-advance)

For a booth screen or lobby loop: the deck advances itself and loops.

- **Offer it:** `<SlideDeck {pages} kiosk kioskStepMs={2000} kioskPageMs={6000} />`. Precedence
  like CAPTURE: `vite dev`, sticky `?kiosk`, or the prop.
- **Start it:** ☰ → **KIOSK** opens a dialog (step pace, page pace, optional speaker notes) →
  **Start**. Or open any slide with `?kiosk` to auto-start with the current paces (use this for
  an unattended link). `?kiosk=off` stops it and revokes the sticky offer.
- **Order of advance** (Space semantics, not →): wait for finite CSS animations → reveal the next
  `<Steps>` build step → if notes are on, one `<Note>` child line at a time → next page → after
  the last visible slide, loop to the first.
- **Paces:** `kioskStepMs` (default 2000) for build steps, `kioskPageMs` (default 6000) after a
  slide finishes. With notes on, a long note line holds at least long enough to read at
  `kioskWpm` (default 150) words per minute.
- **The panel:** one floating panel (drag by its title bar) with pause, phase, note n/N,
  settings and stop. Hovering it freezes the countdown without changing play/pause.
- **Keys** (while a kiosk runs or is paused): Alt+. then **K** shows/hides the panel; Alt+. then
  **U** pauses/resumes.
- **Exit is explicit only:** pause, stop, or settings. Keys and clicks on the slide do not stop
  it.
- **Panel visibility:** the CSS token `--kiosk-idle` (default `0.6`) is the panel's idle opacity.
  Set it per slide or per deck with `:global(.kiosk-panel) { --kiosk-idle: 0; }` in a `<style>`.

## OVERVIEW (all-slides grid)

Press **O** (or ☰ → OVERVIEW) to see every slide as a grid of live tiles. Click a tile to jump;
**Esc** closes. `SlideDeck` mounts it in every deck; there is no prop. Hidden (appendix) slides
are left out. The presenter console has its own OVERVIEW; browsing it does not move the audience,
only picking a tile does.

**Deck-structure editing (dev only).** Under `vite dev`, **EDIT** (or **E**) in the grid arms
editing: **ADD** a slide, a **+** between tiles to insert one, and **x** on a tile to unlist it.
These write the slide's route folder and the deck's `pages.ts`. In a build they answer **NOT
ALLOWED**.

## Full-deck search

The Table of Contents flyout (bottom bar, or Alt+. then **t**) has a search box: type to filter.
It matches a slide's title, its file name (`intro.html`), its slide number, or its body text, and
shows a snippet of why it matched. ↑/↓ move the selection, Enter jumps. The presenter console's
TOC (key **T**) searches the same way.

- The index is built at build time from your slide sources: every
  `src/routes/**/*.html/+page.svelte`, with tags and script blocks stripped. Nothing to configure.
- Search covers exactly what the TOC lists; hidden appendix slides are not searched.
- Text that exists only in script variables or images is not found. Write readable prose in the
  markup if you want a slide to be findable.

## Handout and printing

`/_handout/<deck>.html` is every slide of a deck stacked into one printable document. Print it
with the browser (Ctrl+P → Save as PDF). It renders the real slide components, so there is
nothing to author and it cannot drift from the deck.

| URL | Layout |
|---|---|
| `/_handout/<deck>.html` | one slide per page |
| `/_handout/<deck>.html?notes` | each slide with its `<Note>` printed below |
| `/_handout/<deck>.html?grid` | landscape thumbnail contact sheet |
| `/_handout/<deck>.html?grid&notes` | portrait list, thumbnail left, note right |

- `<deck>` is the deck's folder under `src/routes/`. A nested deck joins its path with `-`
  (`src/routes/references/shell/` → `/_handout/references-shell.html`).
- **PRINT** in the ☰ menu has a flyout: current slide, current slide + notes, whole deck, whole
  deck + notes, thumbnail grid, notes grid.
- **Ctrl+P on a single slide** prints it at the same size it has in the handout. `?notes` on a
  slide URL prints it with its note on the same page.
- **A deck that is not a 1920x1080 dark canvas must declare its surface in `pages.ts`**, because
  the handout never mounts the deck's `+layout.svelte`:

```ts
// src/routes/<deck>/pages.ts
export const deck = { width: 1080, height: 1920, baseFontSize: '1.2em' };
export const pages = [ /* ... */ ];
```

  The fields are `width`, `height`, `baseFontSize`, `deckClass`, `background`, `font`, the same
  values you pass to `<SlideDeck>`. Have the layout read them from `pages.ts` too, so the two
  cannot disagree.

Gotchas:

- The handout is the only page that renders slides in the prerendered HTML. Every slide must
  survive a server render: guard `window`, `localStorage` and `url.searchParams` with `browser`
  (see *State*).
- The handout needs the `_handout` route stub copied into your project.
- A slide that cannot print (a live `<iframe>`) is named on the sheet instead.
- In a slide, anchor canvas-space overlays from the left/top, not `right`/`bottom`: Chrome
  measures those inside the scaled canvas without the transform and shrinks the printed page.

## State (remember a value)

Three places, not interchangeable: the URL (shareable), `localStorage` (private to one browser),
and a plain Svelte store (forgets on reload).

**Persist a value** with `persisted(key, initial, options)`. It handles the `browser` guard,
corrupt values, `setItem` throwing (private mode, full quota) and cross-tab sync. Do not hand-roll
`localStorage` in a store.

```ts
import { persisted } from '@geekpresent/core/stores/persisted';
import { numberCodec, booleanCodec } from '@geekpresent/core/utils/stateCore';

export const zoom = persisted('my-deck:zoom', 1, { codec: numberCodec({ min: 0.5, max: 3 }) });
export const seen = persisted('my-deck:seen', false, { codec: booleanCodec(), sync: false });
```

Options: `codec` (default JSON), `sync` (default `true`: mirror writes from other tabs/windows;
only for local storage), `storage` (`'local'` default, or `'session'` to survive page loads in one
tab only). On the server it is a plain in-memory store holding `initial`. `reset(store, initial)`
from the same module sets it back.

**Codecs** (`@geekpresent/core/utils/stateCore`): `numberCodec(bounds?)`, `textCodec()`,
`booleanCodec()`, `jsonCodec<T>()`. A codec's `read` returns `null` for "not mine", which is not
the same as a falsy value.

**Read a query parameter** with the total helpers, never `location.search`:

```svelte
<script>
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { readTextParam, readNumberParam } from '@geekpresent/core/utils/stateCore';

	$: who = browser ? readTextParam($page.url.searchParams, 'who', 'world') : 'world';
	$: n = browser ? readNumberParam($page.url.searchParams, 'n', 3, { min: 1, max: 10 }) : 3;
</script>
```

`readNumberParam(search, name, fallback, bounds?)` and `readTextParam(search, name, fallback)`
never return `NaN` or junk: an absent or bad value gives the fallback. Text is cleaned and capped
at 64 characters.

Gotchas:

- **SSR fails the build, not the page.** At prerender there is no `window`, no `localStorage`, and
  SvelteKit forbids reading `url.searchParams`. Guard every reach for them with `browser` from
  `$app/environment`. The prerendered HTML shows the default; the remembered value arrives on
  hydration.
- Use `booleanCodec()` for a flag, not `jsonCodec<boolean>()`: corrupt JSON can parse to a truthy
  object and turn the flag on.
- Decide on `sync`. The presenter console is another window of the same deck, so a synced store
  changes the audience's screen too. Use `sync: false` for anything the speaker changes privately.
- Do not use the class name `note` on slide elements: a global stylesheet for speaker notes
  reaches into any `.note` and paints alternate children grey. Pick another name.

## Progress

`getProgress()` returns a readable store describing where the current slide sits among the deck's
**visible** slides (hidden appendices are not counted).

```svelte
<script>
	import { getProgress } from '@geekpresent/core/presentation';
	const progress = getProgress();
</script>

{#if $progress.present}
	<span>{$progress.position} / {$progress.total}</span>
{/if}
```

Fields: `index` (0-based, `-1` when not a visible slide), `position` (1-based, `0` when not
visible), `total`, `fraction` (0..1), `present` (is the current route a visible slide).

`ProgressBar` is the ready-made thin bar. It takes no data props (only `style`, `id`, `class`).
Put it in the deck's `+layout.svelte` after `setPages`, marked as chrome so it stays out of
captures and printouts:

```svelte
<script>
	import ProgressBar from '@geekpresent/core/components/ProgressBar.svelte';
</script>

<SlideDeck {pages}>
	<slot />
</SlideDeck>
<ProgressBar class="gp-chrome no-print" />
```

`getProgress()` reads context set by `setPages()`, so call it in a component under a deck layout
that has called `setPages`.

### Step dots (progress inside a build)

A slide with a Space-driven build (a `Steps` run of Fragments, a `Terminal` with `keys="global"`,
a `Video` stepping its chapters) shows a faint row of dots near the bottom of the canvas: filled
for steps taken, the larger one for the step just taken, a ring for each step still to come. It
brightens on arrival and on each step, then settles back. When the last step is taken the row
fades out, which tells the speaker that the next Space pages the deck. A build of more than 12
steps gets one segmented bar instead of dots.

`SlideDeck` mounts it (`StepDots`); no slide places it. It is on by default:

- `<SlideDeck stepDots={false}>` turns it off for the whole deck.
- `stepDots: false` on a `pages.ts` entry turns it off for that slide.
- `<SlideDeck stepDotsAt="bottom-left">` moves it for the whole deck. The positions are the four
  edges (`top`, `bottom`, `left`, `right` — the middle of that edge) and the four corners
  (`top-left`, `top-right`, `bottom-left`, `bottom-right`). The default is `bottom`. On `left` and
  `right` the dots run down the edge.
- `stepDots: 'top-right'` (any position) on a `pages.ts` entry moves it for that slide only, when
  the deck's spot collides with something on it. In an untyped `pages` array write it
  `stepDots: 'top-right' as const`, or TypeScript widens it to `string` and `setPages` rejects it.
- It never shows under `?clean`, in a CAPTURE, a printout or a `?shot` PNG.
- Restyle with role tokens: `--stepdots-fg`, `--stepdots-idle` (resting opacity, default `0.3`),
  `--stepdots-size`, `--stepdots-gap`, `--stepdots-inset` (distance from the canvas edge).

## Keyboard shortcuts

**Paging (deck window):**

| Key | Action |
|---|---|
| → / PageDown | next slide |
| ← / PageUp | previous slide |
| Space / Shift+Space | next / previous build step, then page |
| Home / End (Mac: Fn+← / Fn+→, Cmd+↑ / Cmd+↓) | first / last slide |
| O | OVERVIEW grid |
| Backspace | RETURN from an appendix |

A presentation clicker sends PageUp/PageDown, so it pages like ←/→. Inside an appendix run,
Home/End are the run's own ends.

**Alt+. (Option+. on macOS) arms the chrome:** both bars rise for about 5 seconds for keyboard
use. While armed:

| Key | Action |
|---|---|
| a | ANNOTATE |
| j | ADJUST |
| z | DISPLAY zoom menu (↑/↓ presets, c custom %, Enter apply, Esc close) |
| p | PRESENT (open the console) |
| m | ☰ menu |
| t | Table of Contents |
| u | pause/resume a running kiosk |
| k | kiosk: setup dialog, or show/hide the panel while one runs |

With ☰ open (or chrome armed): **o** OVERVIEW, **k** KIOSK, **b** hide/show bars, **i** draw/hide the live pointer, **c** CAPTURE, **r** PRINT (flyout keys `c C w W t T`:
current slide, + notes, whole deck, + notes, thumbnail grid, notes grid), **s** SOURCE, **e**
EDIT. While the chrome is up, ←/→ walk the top bar, ↓ on ☰ opens it, ↑/↓ walk its rows, Enter
activates. **Esc** disarms. Letter keys never fire while the focus is in a text field.

Presenter console keys are listed under *Presenter console*.

## URL flags

Append to any slide URL. All are read in the browser only, so they never change the prerendered
HTML.

| Flag | Effect | Sticky? |
|---|---|---|
| `?present` | this window becomes the presenter console | no |
| `?clean` | hide all chrome (bars, TOC, copyright, minimap) | no |
| `?shot` | canvas at exactly 1:1, top-left, no chrome (implies `?clean`); for headless screenshots | no |
| `?notes` | print this slide with its note (also a handout flag) | no |
| `?bare` / `?bare=off` | hide both chrome bars / keep them even with a console live | yes |
| `?adjust` / `?adjust=off` | offer / withdraw ADJUST in a build | yes |
| `?annotate` / `?annotate=off` | offer / withdraw ANNOTATE | yes |
| `?capture` / `?capture=off` | offer / withdraw CAPTURE | yes |
| `?kiosk` / `?kiosk=off` | offer and auto-start KIOSK / stop and withdraw it | yes |
| `?pointer` / `?pointer=off` | draw a pointer where the mouse is (for screen recorders) / stop | yes |
| `?onboard` | show the first-visit hint now and clear its "seen" flag | no |

"Sticky" means saved in `localStorage` for the whole origin: once seen, it applies to every deck
on that site in that browser until the `=off` form is visited. The flag stays in the URL, so a
shared link passes it on. `?adjust`, `?annotate`, `?capture` and `?kiosk` also accept `=on` /
`=1` and `=false` / `=0`.

## Chrome bars: PIN, bare, opt-outs

The top tool bar (PRESENT / ANNOTATE / ADJUST / DISPLAY / ☰) and the bottom control bar (TOC and
pager) auto-hide to a thin strip at the window edge and slide open on hover or focus.

- **PIN:** the pushpin at the front of each bar keeps that bar open. Each bar has its own pin; the
  choice persists in this browser.
- **Bare (gone completely):** while a presenter console is live, the audience window hides both
  bars with no peek strip, pinned or not. `<SlideDeck hideChrome>` does the same on every slide
  without a console. Sticky `?bare` / `?bare=off` outranks both. The console's **B** key toggles
  it and the audience follows at once. Alt+. still raises the bars.
- **Drop a bar:** `<SlideDeck toolBar={false}>` removes the top bar; `controlBar={false}` removes
  the bottom bar (keyboard paging still works).
- **`fadeChrome`:** `<SlideDeck fadeChrome>` ghosts the controls to low opacity until the pointer
  reaches them. Separate from PIN; a pinned or open control stays lit.
- Both bars are hidden under `?clean`, `?shot` and `?present`.

## Onboarding hint

A first-visit hint, outside the canvas: a viewer who stays on the deck's first visible slide
without paging or opening a bar is told about →/Space/← and the two edge bars. It appears after
`onboardDelayMs` (default `8000`) of inactivity, or at once on a stray Enter/↑/↓, click or scroll.

- Any page turn, bar hover/focus, Alt+., "Got it", or reaching a later slide sets one per-origin
  flag and it never shows again.
- It never shows where an audience may be watching: `?clean`, `?present`, bare chrome, kiosk,
  recording/replay, embeds.
- On by default. Turn off with `<SlideDeck onboardHint={false}>`. Use `?onboard` to see it now.

## SEO and social cards

Automatic. `SlideDeck` (and the `TextPage` shell) render `<title>`, description, OpenGraph and
Twitter card tags and `canonical` into each slide's prerendered HTML. The `sitemap.xml` and
`robots.txt` route stubs list every deck found by its `pages.ts`.

- **Site settings** go in `geekpresent.config.ts` at the project root (all optional):
  `siteUrl`, `siteName`, `siteTitle` (default tab title; defaults to `siteName`), `siteDescription`, `ogImageAlt`, `copyright: { name, url }`, `textRoutes`.
- **Absolute tags need `siteUrl`.** `og:url`, `og:image`, `twitter:image`, `canonical` and the
  sitemap are built from it. `''` (the default) omits them. The env var `GEEKPRESENT_SITE_URL`
  overrides `siteUrl` for one build.
- **Per deck:** `title`, `description`, `image`, `imageAlt` props on `<SlideDeck>`.
- **Per slide:** `description`, `image`, `imageAlt` (and `favicon`) on the slide's `pages.ts`
  entry. `image` is an absolute URL or a site-relative path.
- **Standalone Text pages** are not in any `pages.ts`; add their routes to `textRoutes` so the
  sitemap lists them.
- **Served below the domain root** (e.g. a GitHub project page at `/<Repo>/`): set
  `kit.paths.base` in your `svelte.config.js`, conventionally from an env var:
  `base: process.env.GEEKPRESENT_BASE_PATH || ''`, and set `GEEKPRESENT_BASE_PATH=/<Repo>` in the
  deploy build. End `siteUrl` with the same path. Without the base path every page fetches its
  scripts from the domain root and loads blank.

Gotchas:

- Keep in-page asset references relative (`import img from './pic.png'`); only metadata URLs are
  absolute.
- `GEEKPRESENT_BASE_PATH` is read by your own `svelte.config.js`, not by the framework. If your
  config does not read it, setting it does nothing.
