# Presenter View — Phase 1: A separate window for Notes + NAV (with next-slide preview)

> Part 1. A **presenter/console window** you launch from the deck: it shows the current
> slide's speaker **Notes**, large **NAV** buttons, a clock/timer, and a **preview of the
> next slide** — while the audience window shows the slides clean. The two windows stay
> in lock-step: pressing NEXT in either pages both.

## Objective

Let a presenter open a second browser window that acts as a speaker console. It renders the
**same route-per-slide document** as the audience window but with a `?present` flag, so it
reuses the existing `<Note>` content (notes never leave the slide file) and the existing
navigation math. The audience window and the presenter window mirror one shared "current
slide" through `localStorage` + `storage` events — the exact persistence channel the deck
already uses for `displayMode`/`displayFactor`.

The whole feature is **additive and query-param-gated** (like `?clean`/`?layout`): no new
routes, no changes to how slides or notes are authored, no change to the prerendered HTML.

## Why this shape (settled — do not revisit)

These follow directly from the codebase's existing design:

**1. The presenter window loads the real slide with `?present` — it does not read notes from a registry.**
Each slide is its own URL/document and its `<Note>` lives inside it (`Note.svelte`,
colocated per `speaker-notes.html`). So the presenter window opens
`/<deck>/<slide>.html?present`, the slide's own `<Note>` mounts, and we show *only* that.
Notes can never drift from the slide, and authoring is unchanged. (Rejected: extracting
notes into `pages.ts` — breaks colocation and re-authors every deck.)

**2. Cross-window state = `localStorage` + `storage` events, namespaced per deck.**
The deck already persists+subscribes `displayMode`/`displayFactor` this way
(`stores/displayMode.ts`). `storage` events fire only in *other* documents, which is exactly
a cross-window bus and gives a natural self-write guard. A newly opened presenter window can
also read the current value immediately (persistent, unlike a bare `BroadcastChannel`).
Key is namespaced by deck route prefix so two unrelated decks never cross-drive.

**3. Both windows are peers (driver **and** follower), not master/slave.**
Whoever navigates writes the new slide path; the other follows. This makes arrow keys work
from either window and needs no role negotiation. Convergence is guaranteed by an equality
guard (see Protocol).

**4. No new routes → no `+layout.js`/trailingSlash pitfall.**
Because `?present` is a flag on existing slide URLs, we sidestep the "every new slide dir
needs +layout.js" trap entirely. The presenter chrome is a runtime `browser &&` branch, so
prerender/SSR output is byte-identical (respects the SSR-gating the deck relies on).

**5. The next-slide preview is an `<iframe src="…?clean">`.**
Every slide is a real prerendered document with relative assets, so an iframe of the next
slide at `?clean` (chrome hidden — the existing capture mode) is a live, always-accurate
thumbnail. Scale it down with a CSS transform. No snapshotting, no second render path.

## How the two windows relate

```
 AUDIENCE window                          PRESENTER window  (opened with ?present)
 /slides/intro.html                       /slides/intro.html?present
 ┌───────────────────────────┐            ┌───────────────────────────────────────┐
 │  slide, FITTED, clean      │            │  NOTES (this slide)   │  NEXT ▸        │
 │                            │            │  ...                  │  ┌─────────┐  │
 │                            │            │                       │  │ iframe  │  │
 │                            │            │                       │  │ next    │  │
 │                            │            │                       │  │ ?clean  │  │
 │             [⧉ PRESENT]    │            │  [FIRST][PREV][NEXT][LAST]  └────────┘ │
 └───────────────────────────┘            │  ⏱ elapsed 03:21     🕑 12:04         │
        ▲   writes/reads                   └───────────────────────────────────────┘
        │   localStorage: geekpresent:current:/slides/  =  { path, ts }
        └───────────────── storage event ─────────────────────┘
```

- Click **⧉ PRESENT** in the audience window → `window.open(currentUrl + '?present',
  'gp-presenter:/slides/', 'popup,…')`. The fixed window name means re-clicking focuses the
  existing console instead of spawning duplicates.
- In `?present` mode the slide body is hidden; only its `<Note>` shows (styled as the notes
  panel), and the presenter chrome (NAV + timer + next preview) overlays.
- Navigating in **either** window publishes the new path; the other follows.

## Sync protocol (the one subtle part)

Shared value in `localStorage`, one key per deck prefix:

```
key:   `geekpresent:current:${deckKey}`      // deckKey = route prefix, e.g. "/slides/"
value: JSON.stringify({ path, ts })          // path = bare slide path ("intro"), ts = Date.now()
```

Rules:

- **Publish** whenever this window's current slide changes. Drive it off `$page.url` (a
  reactive `$:`), so it fires for *both* full-reload decks (on mount) and view-transition
  decks (on client-side `goto`). Publish the **bare** path (no `?present`).
- **Follow**: on a `storage` event for our key, parse `path`; if `path !== myCurrentPath`,
  navigate to it. `ts` (or a counter) lets us force an event even when re-selecting the same
  path; `path !== mine` is the loop guard.
- **No echo**: `storage` events never fire in the window that wrote them, so a publisher
  never reacts to itself. Ping-pong terminates because the follower, once arrived, publishes
  the same path the other window already holds → its guard rejects it.
- **Each window decorates its own navigation**: the audience follows to `/<deck>/<path>.html`;
  the presenter follows to `/<deck>/<path>.html?present`. So `?present` is sticky within the
  console and absent in the audience window.
- **View-transition decks**: the follower must navigate through the *same* `navigate()` the
  NavigationBar uses (respecting `getViewTransitions()`), not a raw `location` set — so
  followed navigations animate identically. This is why we extract `navigate()` (below).

## File structure / changes

```
src/lib/stores/presenter.ts            NEW — the cross-window channel + presenterMode store
src/lib/utils/deckNav.ts               NEW — shared navigate(href, {viewTransitions, kind, direction})
src/lib/components/PresenterView.svelte NEW — presenter chrome: NAV + clock/timer + next preview iframe
src/lib/components/Note.svelte          EDIT — also render (repositioned) in presenter mode
src/lib/components/NavigationBar.svelte EDIT — use shared navigate(); ?present-decorate; add ⧉ PRESENT button
src/lib/components/SlideDeck.svelte     EDIT — detect ?present; hide canvas + mount PresenterView; wire sync
tests/presenter.test.ts                 NEW — unit-test the sync channel (publish/subscribe/namespace/guard)
tests/NoteSsr.ssr.test.ts (+ host)      NEW — prove <Note> emits nothing at SSR (notes never leak; ?present inert)
```

> **Two refinements made during implementation (deviations from the draft above):**
>
> 1. **`deckNav.ts` (new) instead of editing `utils/navigate.ts`.** `navigate.ts` is
>    pure path math and is imported by `seo/routes.ts` (a server/prerender module);
>    keeping the `$app/navigation` dependency out of it avoids pulling client
>    navigation into the server graph. So the shared `navigate()` lives in its own file.
>
> 2. **Iframe sync guard (important, non-obvious).** The next-slide preview `<iframe>`
>    is a full deck instance, so on load it *published its own slide* to the shared
>    channel — dragging every window onto the preview slide. Fix: only the **top**
>    window syncs — SlideDeck gates both `publishCurrentSlide` and the follow
>    subscription on `window.self === window.top`, so an embedded preview deck never
>    drives (or follows) navigation.

### `stores/presenter.ts` (new — the heart of it)

Pure, DOM-light module (mirrors `displayMode.ts`'s shape). Public surface:

```ts
export function deckKeyFromPath(pathname: string): string;      // "/slides/intro.html" -> "/slides/"
export function publishCurrentSlide(deckKey: string, path: string): void;
export function subscribeCurrentSlide(deckKey: string, cb: (path: string) => void): () => void;
export function openPresenterWindow(currentHref: string, deckKey: string): void; // window.open, fixed name
export const presenterMode = writable<boolean>(false);          // set true when ?present; Note reads it
```

`subscribeCurrentSlide` attaches a `storage` listener (browser-guarded), filters to our key,
parses, and calls back with the path — leaving the *equality guard* and the actual navigate
to the caller (SlideDeck), which knows `myCurrentPath` and how to decorate the URL.

### `utils/navigate.ts` (edit — extract the navigate logic)

Lift the `navigate(href, direction)` body out of `NavigationBar.svelte` (currently lines
~42–67) into an exported `navigate(href, opts)` that takes `{ viewTransitions, kind }`. Both
the NavigationBar and the storage-follower call it, so a followed navigation animates exactly
like a clicked one. Keeps the fallback chain (view-transition → goto → full load) in one place.

### `Note.svelte` (edit — show in presenter mode too)

Today: `$: visible = $displayMode === 'SCALED'`. Change to
`$: visible = $displayMode === 'SCALED' || $presenterMode`. In presenter mode the note
renders into the presenter notes panel. Mechanism: SlideDeck hides the whole slide with
`visibility:hidden`; Note flips **itself** back to `visibility:visible` and `position:fixed`
into the panel region (visibility is inherited and individually overridable — clean, no
portal needed). A `.note.presenter` style makes it fill the panel (larger type, panel bg).

### `SlideDeck.svelte` (edit — the render branch + wiring)

- `$: present = browser && $page.url.searchParams.has('present');` (same guard style as
  `clean` on line 146). Set `presenterMode.set(present)`.
- When `present`: keep rendering the `<slot/>` (so `<Note>` mounts) but add `.present` to
  `.content` (which sets `visibility:hidden` on the slide body); mount `<PresenterView>` as a
  fixed overlay. Hide the audience chrome (ToC/Copyright/⧉ button) in present mode.
- Wire sync for **every** deck (present or not): a reactive `$: currentSlide` already exists
  (line 139) — call `publishCurrentSlide(deckKey, currentSlide)` when it changes, and
  `subscribeCurrentSlide(deckKey, follow)` in `onMount`. `follow(path)` guards
  `path !== currentSlide` then `navigate(decorate(path), …)`, decorating with `?present`
  when `present` is true.

### `PresenterView.svelte` (new — the console chrome)

Fixed-position layout, mounted only in present mode. Contains:
- **NAV**: FIRST/PREV/NEXT/LAST via `getPageNavigation(pages, current, './')` (same source as
  NavigationBar), each link decorated with `?present`. Arrow keys already handled by the
  NavigationBar that also renders in the slide; keep one keydown owner to avoid double-firing.
- **Next-slide preview**: `<iframe src={nextPath + '?clean'}>` under a CSS `transform:scale()`
  in an aspect-boxed frame. Empty state on the last slide.
- **Clock + timer**: wall clock (`toLocaleTimeString`) and an elapsed timer from first mount,
  with reset. Pure `setInterval`, client-only.

## Edge cases & decisions

- **Prerender**: `?present` is read only under `browser &&`, so it never affects SSR output —
  add an `.ssr.test.ts` asserting the built HTML for a slide is identical with/without the flag
  (per the SSR-gating memory: built deck HTML has no slide markup anyway; assert the shell).
- **Multiple decks / tabs**: key namespaced by `deckKey` (route prefix) → `/slides/` and
  `/portrait/` consoles never cross-drive. Two audience tabs of the *same* deck will mirror
  each other too; acceptable (last-write-wins).
- **Monaco / `?clean` iframe**: the preview reloads its `src` on each slide change (real iframe
  navigation, not SPA), so the "Monaco blanks after client-side goto" issue doesn't apply.
- **View-transition decks**: covered by routing all navigation (clicked *and* followed) through
  the shared `navigate()`.
- **Popup blockers**: `openPresenterWindow` runs in the ⧉ click handler (a user gesture), so
  the open is allowed. If it returns null, surface a hint.
- **Focus/`window.opener`**: not relied upon — the localStorage bus is the only channel, so it
  survives closing/reopening either window and full-page reloads.

## Testing & quality gates

- `tests/presenter.test.ts`: unit-test `publishCurrentSlide`/`subscribeCurrentSlide` against a
  fake `localStorage` + synthesized `StorageEvent`; assert publish writes the namespaced key,
  a foreign-key event is ignored, and a same-path event is delivered (guard lives in caller).
- `tests/*.ssr.test.ts`: render the deck shell server-side and assert `?present` produces the
  same output as no flag (prerender parity), using the existing `svelte/server` SSR project.
- Manual: build (`npm_config_verify_deps_before_run=false vite build` per the sandbox memory),
  open a slide, click ⧉, verify NEXT in either window pages both, notes track the slide, and the
  preview shows the upcoming slide.

## Phase 1.1 additions (built)

Layout + two more bottom-bar controls, on top of the Phase 1 console:

- **Stacked previews.** The right column now shows two scaled `?clean` iframes —
  **CURRENT** (top) and **NEXT** (bottom) — instead of a single next preview. Notes
  panel narrowed to 50vw to give the column room. `?clean` now also hides the in-slide
  `.anim-bar` so previews are pure slides.
- **TOC jump menu.** A `TOC ▴` button in the bar opens an upward list of every slide;
  clicking one navigates the console (with `?present`) and the audience follows via the
  slide channel. Built inline in `PresenterView` (the in-slide `TableOfContent` is
  positioned for the canvas, not a bottom bar).
- **ANIMATE drives the audience.** `PresenterAnim.svelte` is a compact play/scrub/restart
  control. It reads+steers the presenter's OWN local slide animations (they run invisibly
  under `visibility:hidden`, powering the rail) and relays `{playing, fraction}` on a
  **second channel** — `geekpresent:anim:<deckKey>` (`publishAnimCommand` /
  `subscribeAnimCommand`). The audience `SlideDeck` applies it to its live slide via
  `utils/slideAnim.applyState`. One-directional (presenter → audience); top-window-gated
  like the slide channel. Renders nothing on a slide with no seekable animation (the
  AnimationBar convention). WAAPI helpers factored into `utils/slideAnim.ts`, shared by
  the presenter control and the audience applier.

New/changed files: `utils/slideAnim.ts` (new), `components/PresenterAnim.svelte` (new),
`stores/presenter.ts` (+anim channel), `components/PresenterView.svelte` (previews + TOC +
ANIMATE), `components/SlideDeck.svelte` (audience anim applier; `?clean` hides `.anim-bar`),
`Note.svelte` (50vw), `tests/presenter.test.ts` (+3 anim-channel tests).

## Phase 1.2 additions (built)

- **Durable elapsed timer.** The console's elapsed clock persists its START time per deck
  (`geekpresent:timerStart:<deckKey>`), so it survives Ctrl+R *and* slide navigation
  (which pages the console with a full document load — previously reset the timer every
  advance). Only the explicit reset (click the timer) moves the start.
  `presenterTimerStart` / `resetPresenterTimer` in `stores/presenter.ts`.
- **Adjustable previews/notes divider.** A draggable splitter on the `--gp-split` line
  updates the shared var live (both sides read it) and persists a 0..1 fraction globally
  (`geekpresent:presenterSplit`), reapplied on load. Clamped to 0.2–0.8.
  `loadPresenterSplit` / `savePresenterSplit`; drag handled in `PresenterView`.
- **Sides swapped:** previews now LEFT (right-aligned to butt the notes), notes RIGHT.
- **Divider auto-fits the preview width by default.** When there's no persisted split,
  the divider sits flush against the (height-driven) preview boxes — `--gp-split` is set
  in px to `inset + previewHeight×aspect + gap/2`, refit on height resize. A drag pins an
  explicit position (persisted). Note `.presenter` also needs `width: auto` to beat the
  SCALED-mode `width: calc(100% - 30px)` that was pushing it off the right edge.
- **Timer set/reset popover.** Clicking the elapsed clock opens a small set/reset panel;
  "Set" back-dates the start so the clock reads an entered `hh:mm:ss`/`mm:ss`/minutes and
  counts up. `resetPresenterTimer(deckKey, startMs?)` — default now (reset), explicit
  start (set).
- **Pause/resume timer.** A pause button next to the clock freezes the elapsed value
  (amber); resume shifts the start so it stays continuous. Durable via a separate epoch
  key (`geekpresent:timerPaused:<deckKey>`, `load/savePresenterPause`), so a reload or
  slide advance resumes still paused at the same value.
- **Per-line note check-off.** The `checklist` action in `Note.svelte` prepends a checkbox
  to each note line (direct child) in the presenter panel. Plain click (or **double-click
  anywhere on the line**) toggles just that line; **Shift+**click/double-click checks it and
  everything above (a "covered up to here" marker). `:global` styles; inline-block checkbox
  so the checked line's strike-through doesn't cross the glyph; lines are `user-select:none`
  so a double-click doesn't select text.
- **Check-off persistence + reset.** Checks are persisted per deck+slide
  (`geekpresent:checks:<deckKey>:<slidePath>` = `boolean[]`, `load/saveChecks`), restored on
  mount, so they survive reload/navigation. The console's **☑ menu** offers "Reset this page"
  (`clearSlideChecks`) and "Start over (whole deck)" (`clearDeckChecks`), which wipe the
  relevant localStorage then fire a `gp:checks-clear` DOM event that `Note` uses to uncheck
  the visible lines. Needed a `$app/stores` stub in both vitest projects (Note now reads
  `$page`).

## Out of scope (later phases)

- "Blackout"/"freeze audience" toggle; laser-pointer / annotation relay.
- Per-slide timing plan / auto-advance.
- Presenter view for the **text** artifact (it has no slide paging).
- Using the Screen `Presentation`/`Window Management` APIs to auto-place on a second display.
