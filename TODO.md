# TODO — Proposed Components

Candidate components to add to GeekPresent, prioritized. Tiers reflect value vs. effort:
T1 closes real capability gaps; T2 is high-frequency tech-talk polish; T3 is nice-to-have.

Conventions to honor when building: each component is plain Svelte imported by path
(`$lib/components/…`), positions in the fixed 1920×1080 canvas via `Block`/`Draw` where
relevant, themes via `roles.css`, adapts to presentation/text/present modes via
`getMode()`, and ships a reference slide in `src/routes/slides/` (one `*-component.html`).

## Tier 1 — closes clear gaps

- [x] **`Steps` / `Fragment`** — accumulating ←/→ reveal within a slide.
  - Biggest gap; the classic reveal.js/Slidev bullet-reveal, which the deck lacks.
  - Reuse `Carousel`'s keyboard stepping (note: `Carousel` *replaces* content; `Steps` *builds up*).
  - Coordinate ←/→ with `NavigationBar` so the last fragment hands off to the next slide.
  - Done: `src/lib/components/Steps.svelte` (context coordinator, like Carousel) +
    `Fragment.svelte` (one build step). Fragments start hidden but keep their box
    (`visibility`, no reflow) and fade in on **Space**; **Shift+Space** peels the
    last back off. Space (not the arrows) drives the build so →/← stay free to page
    at any time. Once the build is spent Space **falls through and pages to the next
    slide** (symmetrically, Shift+Space pages back once nothing is revealed), so
    tapping Space walks the whole deck — a build just inserts sub-steps. That
    decision lives in `utils/stepKeys.ts` (`spaceIntent`), which both the `Steps`
    listener and `NavigationBar`'s consult against the same build state, making the
    two window listeners order-independent. Space is
    ignored while a form field/button has focus (native Space preserved). The
    keyboard-owning Steps publishes itself to the `activeSteps` store (module-level,
    like `selectedBlock` — Steps and `NavigationBar` are siblings, so context can't
    bridge them), which drives the nav bar's **CONTINUE** button: it reveals the next
    Fragment and disables once the build is spent (it never pages — that's NEXT's job).
    Also advances on the presenter console's `gp:continue` pulse. Text mode shows every
    Fragment and disables stepping. Per-Fragment `transition` (fade/fly/slide/
    scale/none) via the shared context defaults; `tag` (via `<svelte:element>`)
    keeps markup semantic (`li`/`p`/…). One Steps per slide with `keys='global'`
    (default); `keys='off'` + `bind:this` (`next`/`prev`/`goTo`/`revealAll`/`reset`)
    for extras. Demo `steps-component.html`, DOM test `tests/Steps.test.ts` (Space
    build/peel + arrows left free), SSR test `tests/StepsSsr.ssr.test.ts`
    (prerender-visible markup). No new role tokens (reveal is pure opacity/transform).
- [ ] **Note-driven highlight** — let a `Note` line call attention to a component on the
      slide as the speaker covers it.
  - A note line references an on-slide target by name (reuse `Block` `name`-matching + the
    `stores/blockAnchors.ts` live-box registry that `Connector` already resolves against),
    e.g. `<li data-highlight="db">Now the query hits the database</li>`.
  - Activating the line spotlights the named component — a ring/glow/dim-the-rest overlay
    positioned from the registered box, so it tracks the component even in LAYOUT mode.
  - Tie the trigger into the existing presenter check-off: covering a line (or a dedicated
    click/keystroke) fires the highlight; leaving it clears it. Reuse the `checklist`
    action's per-line plumbing rather than a second line-scanning pass.
  - Open question: is the highlight **audience-visible** (drawn on the live slide, like a
    laser pointer) or **presenter-only** (an aid in the console preview)? Likely want both,
    author-selectable — decide before building.

- [x] **`Connector` / `Arrow`** — auto-routed arrow between two named `Block`s.
  - Turns the `Block` system into a diagramming tool.
  - Reuse `Block` `name`-matching (same mechanism as LAYOUT-mode save) + `Draw` Line/Arc.
  - `<Connector from="api" to="db" label="query" />`
  - Done: `src/lib/components/Connector.svelte` + all the geometry in
    `src/lib/draw/connectorCore.ts` (pure, NaN-safe — `drawCore`'s discipline).
    A named `Block` publishes its live box to `stores/blockAnchors.ts`; a
    `Connector` resolves both ends by name, so **a diagram is authored in names,
    not coordinates, and every arrow follows its boxes** as you drag them in
    LAYOUT mode. Either end also takes a raw point (`from={[300, 540]}`) or a
    literal box.
  - Three routes: `straight` (attaches wherever the line crosses each border, at
    whatever angle it arrives), `ortho` (right angles, corners rounded by
    `radius`), `curve` (leaves/enters square to each side). Sides auto-pick the
    edge the center-to-center ray actually crosses — `facingSide` weighs the
    direction against the box's **diagonal**, not the raw axes, so it always
    agrees with where `borderPoint` lands. `fromSide`/`toSide` pin one.
  - Also: `arrow` (defaults to `end` — a Connector exists to say "A → B"),
    `gap`, visible `label` + `labelAt`/`labelOffset`, `color`/`thickness`/`dash`,
    and the Draw family's `draw`/`drawDelay` CSS reveal (prerenders, and
    `AnimationBar` scrubs it — stagger `drawDelay` to build a diagram arrow by
    arrow on one timeline).
  - Standalone it renders its own canvas-spanning, pointer-transparent `<svg>`;
    dropped inside a `<Draw>` it detects the surface via context and renders a
    bare `<g>` into it, sharing one svg and one z-order.
  - **Ordering constraint** (the one gotcha): endpoints resolve during **SSR**
    too, and Blocks register in document order — so a `Connector` must come
    *after* the Blocks it links, or the prerendered slide ships the boxes with
    no arrows. An unresolved name renders nothing at all, never a broken arrow.
    `Block`'s `track={false}` wrappers (Draw's hosted Rect/Ellipse blocks,
    KeyframeStudio ghosts) opt out of anchoring — they only exist in LAYOUT
    mode, so an anchor on them would blink with the toggle.
  - Demo `connector-component.html` (five arrows, zero coordinates), unit test
    `tests/connectorCore.test.ts`, DOM test `tests/Connector.test.ts`
    (re-routes on move, withdraws on unmount), SSR test
    `tests/ConnectorSsr.ssr.test.ts` (prerender-visible shaft). No new role
    tokens — it reuses the `--draw-*` family.
- [x] **`Callout`** — semantic admonition box (info / tip / warn / danger).
  - Distinct from `Hint`/`Box`; themeable via `roles.css`.
  - `<Callout kind="warn" title="Gotcha">…</Callout>`
  - Done: `src/lib/components/Callout.svelte`, demo `callout-component.html`,
    `--callout-*-accent` role tokens + `--DANGER` base, SSR test `tests/CalloutSsr.ssr.test.ts`.
  - Wrapping in a `Block` sizes it (resize rubber-bands both axes): `Block` now
    fills its content by default (`fill={false}` to opt out), so no per-component
    fill prop is needed. Demo parks a `<Block><Callout/></Block>` and flips LAYOUT.

## Web & video embeds (requested)

- [x] **`WebSite`** — a live website as a component, bounded to the space you give it.
  - Done: `src/lib/components/WebSite.svelte` — the engine behind both embeds. Fills its
    parent, so a `<Block>` places and sizes it in canvas pixels.
  - Three things a slide needs that a bare `<iframe>` does not:
    - **Shield.** An iframe swallows every click, scroll and key it is given, so it would
      eat the presenter's paging keys the moment the pointer strayed over it. The frame is
      `pointer-events: none` behind an **invisible** shield — the embed should look like the
      site, not like a site wearing a badge. Clicking arms it (accent ring + **Release**
      pill), and a `pointerdown` **anywhere outside** the component disarms it — interaction
      is always deliberate and always escapable without the keyboard. A click *inside* the
      iframe never reaches that listener, which is the point. What advertises the shield is
      a **tooltip** on hover, plus a faint wash and a `:focus-visible` ring (the tooltip
      never fires for a keyboard user). `interactive` starts armed and drops it for good.
    - **Lazy mount.** `lazy` (default) creates the iframe only once the box scrolls into
      view (IntersectionObserver, `rootMargin: 200px`), so a server render costs no
      third-party request and a `text` page with many embeds loads them as the reader
      arrives. Until then the box shows a placeholder carrying a plain `<a href>`. Where
      IntersectionObserver is absent it mounts on `onMount` — degrade to eager, never blank.
      `lazy={false}` renders the iframe during SSR too, already shielded (no first-paint
      window in which the frame is live).
    - **Zoom.** `zoom={0.6}` renders the frame at `100/zoom` % and scales it down, so the
      *desktop* layout shrinks instead of tripping the site's phone breakpoints. A zero/NaN
      zoom falls back to 1:1 rather than an infinite frame; at 1:1 no transform is emitted.
  - Also: fake browser bar (`chrome`) with the URL + an **Open ↗** escape hatch that stays
    clickable while the frame is inert; `sandbox` (defaults to scripts/same-origin/popups/
    forms — `''` locks it down, `false` drops the attribute), `allow`, `title`,
    `width`/`height`, `style`, and a `placeholder` slot.
  - The bar also carries a live **zoom** (`− 100% +`) and a **reload** (`⟳`) — `controls`,
    default on. Both work *without arming the frame*, since the bar sits outside the shield.
    Reload works by **re-keying the iframe**: a cross-origin frame's `contentWindow.location`
    is walled off, and re-assigning the same `src` is a no-op navigation, so destroying and
    rebuilding the element is the only refresh a third-party embed allows. Zoom seeds from
    the `zoom` prop and re-seeds only when that prop *changes* (an unrelated re-render must
    not stomp the viewer's zoom), and clicking the percentage snaps back to the author's
    setting.
  - `zoomLevels` — the stops the − / + walk, a browser's own ladder by default, overridable
    per embed (`zoomLevels={[0.4, 0.6, 1]}`). Sorted, de-duped, junk-filtered, with a
    fallback to the default if nothing survives; the ladder's ends *are* the clamp, and the
    spent button disables. An explicit list beats a multiplier on two counts: the author
    picks stops that suit the site, and it cannot drift — repeated ×1.25 / ÷1.25 lands on
    0.9999… and would render a transform while displaying "100%". Stepping goes to the
    nearest stop *strictly* past the current zoom, so an off-ladder authored `zoom` (0.6)
    moves to its neighbours instead of snapping to one it already sits between. The handlers
    read the plain state, not the reactive mirror, or two clicks in one frame both step from
    the same stop.
  - **The one gotcha:** many sites refuse to be framed (`X-Frame-Options` /
    `frame-ancestors`). That is the site's call, not ours — the frame renders empty and
    "Open ↗" is the way out. Check the target before the talk. Demos use `example.com`,
    which frames.
  - Demo `website-component.html`, DOM test `tests/WebSite.test.ts` (lazy gate + shield
    arm/disarm/release + unmount cleanup), SSR test `tests/WebSiteSsr.ssr.test.ts`.
    `--embed-*` role tokens. New `tests/stubs/app-navigation.ts` (aliased in both vitest
    projects) so any component pulling in `NavigationBar` can be rendered under test.
- [x] **`WebPage`** — the same site filling the whole slide canvas.
  - Done: `src/lib/components/WebPage.svelte` — `WebSite` stretched over the fixed
    1920×1080 canvas (`position: absolute; inset: 0` against SlideDeck's `.container`, the
    only positioned ancestor — the same space `Block` authors in). Every `WebSite` prop
    passes through.
  - It renders **its own `NavigationBar`** (like `TitlePage`/`ContentPage`), so
    `<WebPage src="…" />` *is* a complete slide and paging still works with the site on
    screen. Nesting it in a page template would double the nav bar — pass `nav={false}`.
  - **Layering:** no `z-index`, so it paints in DOM order. The deck's chrome (TOC, Notes)
    and its own nav bar are later siblings and stay above it, and stay clickable — the site
    behind them is inert until shielded-clicked anyway.
  - `text` mode has no canvas to fill, so it drops out of the absolute layer into normal
    flow at `height` (default 640px), with no nav bar.
  - Demo `webpage-component.html`.
- [x] **`Video` (a.k.a. `VDO`)** — `<video>` with custom chrome + **time bookmarks**.
  - Controls: play/pause, restart, click-to-seek progress bar, `currentTime / duration` readout,
    mute. Bookmarks: chapter buttons that seek, the active one (last whose time ≤ `currentTime`)
    highlighted in the list *and* as a tick on the track.
  - Done: `src/lib/components/Video.svelte`, with all the arithmetic in
    `src/lib/utils/videoCore.ts` (pure, total — `drawCore`/`connectorCore` discipline:
    bad input yields NaN/-1/0/`'0:00'`, never a throw, so a slide can't blow up over
    a typo'd time or a duration that is still NaN).
  - **Bookmarks are the component.** `at` takes seconds (`74`) or a clock string
    (`'1:14'`, `'1:02:03'`); the list is parsed and **sorted**, so chapters may be
    written in any order, and an unparseable time is *dropped* rather than shipped as
    a button that seeks nowhere. Plus optional `tag` badge (`HOST` / `BOOTH`).
  - **The keyboard belongs to the deck** (the one design constraint): `NavigationBar`'s
    window listener claims →/← unconditionally, so a scrub bar can never own them. The
    progress track is therefore a *pointer* affordance — `tabindex="-1"`,
    `aria-hidden`, and it ignores a coordinate-less (`detail === 0`) activation, which
    would otherwise rewind the video to 0:00 on Enter. **The chapter buttons are the
    keyboard's seek**, and they say where they go, which a scrub bar never can.
  - Media state rides Svelte's own `bind:paused`/`currentTime`/`duration`/`muted`
    rather than hand-wired `timeupdate` listeners. `autoplay` defaults `muted` to true —
    the only way a browser will honour it.
  - **Space steps the bookmarks** (`keys="global"`, opt-in). Not a second stepping
    mechanism: the Video registers with the very same `activeSteps` store a `Steps`
    build uses, so `spaceIntent` arbitrates the handoff for both — Space seeks to the
    next chapter, and once the last is behind the playhead it falls through and pages
    the deck (Shift+Space walks back, then pages back). NavigationBar's **CONTINUE**
    and the presenter console's `gp:continue` pulse seek the next chapter for free.
    `hasPrev` is `active > 0`, not `>= 0`: from the first chapter there is no earlier
    one, which also stops a mark at `0:00` from trapping the presenter on it.
    Opt-in because Space is the deck's advance key and **only one build per slide may
    own it** — a Steps run exists to be stepped, a video exists to be played, and a
    presenter tapping Space to leave a slide shouldn't sit through every chapter.
  - Also: `start` (seek on `loadedmetadata`), `poster`, `loop`, `playsinline`,
    `preload`, `chapters={false}` (bar only), `controls={false}` (element only), and
    `native` (hand the bar to the browser, keep our chapters).
  - Demo `video-component.html` with a locally generated 29 KB `demo.mp4` — **imported
    as an asset**, not written as `/media/demo.mp4`, so it survives a Pages base path
    (the same reason `YouTube` takes imported images). Unit test `tests/videoCore.test.ts`,
    DOM test `tests/Video.test.ts` (bookmarks, transport, track clamp + keyboard
    inertness; jsdom's `play`/`pause` are `notImplemented` stubs, so they are faked
    closely enough that Svelte's media bindings sync off the *events*), SSR test
    `tests/VideoSsr.ssr.test.ts` (chapter list prerenders; no `NaN` reaches the markup).
    New `--video-*` role tokens (the stage stays black in every theme — that's the
    letterbox behind the footage, not a surface).
- [x] **`VDOPage`** — page/template shell that shows a `Video` in full-page canvas space
  (sibling to `TitlePage`/`ContentPage`).
  - Done as **`src/lib/components/VideoPage.svelte`** — named for the `Video` it wraps,
    as `WebPage` is for `WebSite`. `<VideoPage src={demo} />` *is* a complete slide.
  - Follows `WebPage` exactly: absolute over SlideDeck's `.container` (no `z-index`, so
    the deck's chrome and its own nav bar stay above it and stay clickable), its own
    `NavigationBar` (`nav={false}` when nesting in a template, or you get two), and a
    `text`-mode fallback out of the absolute layer into normal flow at `height`.
  - Every `Video` prop passes through. `keys="global"` earns its keep here: when the
    video IS the slide, Space walking chapter to chapter and then paging on is just
    the deck's forward march. Demo `videopage-component.html` does exactly that.
  - SSR test in `tests/VideoSsr.ssr.test.ts` (nav bar present, `nav={false}` drops it,
    props reach the player). Both demo slides import the same `demo.mp4`, which Vite
    de-dupes to one hashed asset.

## Chrome & legibility

- [x] **`SlideDeck fadeChrome`** — fade the deck's own controls until pointed at.
  - Opt-in prop. NAV, TOC, DISPLAY, the minimap and the LAYOUT toggle drop to 12% opacity
    and lift to full on `:hover` / `:focus-within`. Wanted most where chrome sits over
    someone else's pixels (a full-canvas `WebPage`); a deck that says nothing is unchanged.
  - Covers NAV, TOC, DISPLAY, the minimap, LAYOUT and **ViewSource** (`</> Source`).
  - Each control tags its own root `.gp-chrome`; `SlideDeck` owns the one rule, written
    against the two hosts that can contain one — `.container` (NAV/TOC/LAYOUT) and
    `.overlay` (DISPLAY/minimap) — via `:global()`, since those roots belong to sibling
    components with their own scoped styles.
  - **Opacity, never `visibility`/`display`:** a ghosted control keeps its full hit area, so
    the pointer finds it exactly where it always was. Anything OPEN (`.expanded`, which TOC
    and SizeMode already flip) or PINNED (`.layout-ctrl` while LAYOUT is on) stays lit — you
    can't hunt for a menu you're already using, or lose SAVE between drags.
  - `@media (hover: none)` disables the fade outright: a ghosted control a touch reader
    cannot summon is just a lost control.
  - On in the main `slides` deck.
- [x] **`Hint` legibility** — the cue floats over arbitrary pixels (an image, a chart, a live
  website), so bare text vanishes whenever the backdrop matches its colour. It now carries its
  own translucent backdrop + hairline rule (`--hint-*` role tokens, mixed toward `transparent`
  so neither needs to know the surface colour — they just deepen it). `boxed={false}` restores
  the bare text for slides that know what sits behind them.

## Page templates (`ContentPage` header)

`src/lib/templates/ContentPage.svelte` used to hard-wire a left-aligned `<h1>`, a
`.subtitle` span, and a rule drawn as the subtitle's `::after`. All three were effectively
mandatory: an empty `title`/`subtitle` still rendered its box, and the rule was welded to
the subtitle, so a slide with no subtitle kept the subtitle's gap and the rule dropped too
low. **All of that is now fixed** (the four boxes below); only the `Hint` check remains.

- [x] **Center the title** — opt-in `align` (`left` default / `center`).
  - Done: `align="center"` centers the title *and* the subtitle (one `text-align` on the
    header, which they inherit). The **rule needs no alignment** — it spans the header's
    full width either way, so centering it is a no-op. `align` moves the *header only*:
    the content box stays justified, because a centered title is a design choice about
    the heading, not about the paragraph under it. An unrecognized value falls back to
    left rather than emitting a class that matches nothing.
- [x] **Optional subtitle** — omitting it pulls the rule *up* under the title.
- [x] **Every header part optional** — `title=""` / `subtitle=""` / `rule={false}`, each
      independently, with the survivors closing the gap; all three gone → no `<header>`
      element at all and the content starts at the top of the canvas.
  - Done together, since they are one change: **the rule is now its own element**
    (`<div class="rule">`), not `.subtitle::after`, so it no longer dies with the subtitle
    or drags the empty span's margins along. Each part is an `{#if}`, so an omitted part
    leaves *no box* — which is the whole complaint being fixed.
  - **The gaps close by margin collapsing, not by conditional CSS.** The rule carries
    `margin-top: var(--page-rule-gap)` and every part above it has no bottom margin, so
    adjacent-sibling collapse yields the *same* gap whether the rule follows the subtitle,
    the title, or nothing. That is why the default render is **pixel-identical** to the
    old `::after`: an `::after` block inside a `display: block` span occupied exactly the
    same flow position the sibling `<div>` now does. All 76 existing `ContentPage` slides
    pass both `title` and `subtitle`, so nothing in the repo moves.
  - `rule` defaults to **true**, so a bare `<ContentPage>` still draws a divider — a rule
    with nothing above it is a legitimate slide, and dropping the rule by default would
    have silently restyled every deck. A headerless slide asks for it: `rule={false}`.
- [x] **Styling pass on the header** — sizes, spacing and the rule's weight now come from
      role tokens.
  - Done: `--page-title-size`, `--page-subtitle-size`, `--page-title-gap`, `--page-rule-gap`,
    `--page-rule-weight`, `--page-content-gap`, plus a new `--page-subtitle-fg` colour.
    The rule's colour keeps its existing name (`--subtitle-rule`) — themes already set it.
  - These are the file's **first non-colour tokens**, so `roles.css` grows a labelled
    `METRICS` group at the end and its header comment now says "all *colour* values are
    hex". The alternative — leaving metrics as component-only `var()` fallbacks — would
    have made them un-discoverable in the one file a theme author reads.
  - Fallbacks reproduce today's look exactly (`2.5em` / `1.2em` / `15px` / `4.5px` /
    `#F0F8FF`), because `.gp-deck` is **opt-in per deck** and the main `slides` deck sets
    no theme class — the fallbacks *are* its theme.
  - Demo `content-header.html` (the slide *is* the demo: centered, subtitle-less, so the
    rule rides up under the title), SSR test `tests/ContentPageSsr.ssr.test.ts` (each part
    independently omittable, absent header leaves no element, `align` reaches the markup).
- [x] **Styling pass on `Hint`** — verified the backdrop/hairline treatment (the `--hint-*`
      tokens added under *Chrome & legibility*) across themes and backdrops. **It holds.**
  - Verified by *rendering*, not by reading: the exact CSS (`Hint.svelte` + `roles.css` +
    `themes.css`) over a 4-theme × 6-backdrop matrix — deck surface, `Video`'s black
    letterbox, `Terminal`'s `#0C0C0C` screen, a white site / QR plate, a busy chart, and
    the bare `boxed={false}` control — plus the WCAG arithmetic on the composited pixels.
  - **`opacity` here is a GROUP opacity**, and that is the thing a token audit misses. It
    multiplies the fill's 62% down to **55.8%** and the rule's 28% to **25.2%** *before*
    either lands on the backdrop, so the numbers worth judging are never the ones written
    in the stylesheet. Measured on the composite, text-on-pill is **≥ 3.63:1 everywhere**
    (worst: `theme-light` over `Video`'s letterbox; then `3.84` over `Terminal`, `4.11` for
    the dark themes over a white site). The cue renders at **36px bold** — 1.5em of
    `.content`'s 24px `--base-font` — so 3:1 is the bar, and every combination clears it.
    Nothing reaches the 4.5:1 normal-text bar, which is the correct trade for a *cue*.
  - **On the deck surface the fill is invisible** (~1.1:1 against it) and the hairline alone
    (1.6–2.1:1) draws the pill. That is the design working, not failing: quiet at home,
    opaque enough to rescue the text abroad.
  - **`theme-light` inverts the pill.** `--hint-bg` is `--BACKDROP`, which is light beige
    there, so the box *lightens* its backdrop instead of deepening it — and dark `--hint-fg`
    stays legible on it. The component's comment claimed the fill "just deepens" whatever is
    behind it, which was only ever true of the dark themes. Corrected.
  - **Dead code found and removed.** `.text` carried `margin-left/right: auto`, which never
    applied: per CSS 2.1 §10.3.7, when `left`, `width` and `right` are all `auto` the auto
    margins are first set to 0. The pill is centred by its **static position** — its flow
    parent is `SlideDeck`'s `.content`, a flex container with `justify-content: center`
    (and transform-scaled, which is also what makes it the containing block). Proven both
    ways: deleting the margins renders **pixel-identical** (same md5), while changing
    `justify-content` moves the pill. The mechanism is now written down where it lives.
  - **The two paths nobody was exercising**, which is why this needed a look at all: no
    themed deck uses a `Hint` (`geeklight` is `theme-light`, `transition` is `theme-green`;
    both are Hint-free), and `boxed={false}` is used nowhere in the repo. Added
    `tests/HintSsr.ssr.test.ts` — `Hint`'s **first test of any kind** — pinning the class
    contract the stylesheet reads (boxed by default, `boxed={false}` bare, `isVisible`).
    The `--hint-*` tokens themselves can't be asserted from a server render: the scoped
    `<style>` never reaches `body`. They are verified by rendering, as above.
  - "**Against the header above it**" turned out to be a non-question: a `Hint` is pinned to
    the bottom of the canvas and `ContentPage`'s header sits at the top. They never meet.

## Tier 2 — on-brand tech-talk polish

- [x] **`Terminal`** — fake console: typed command + output, riding the `AnimationBar` keyframe clock.
  - Done: `src/lib/components/Terminal.svelte`, with the schedule in
    `src/lib/utils/terminalCore.ts` (pure, total — `drawCore`/`videoCore` discipline:
    junk timing falls back to the defaults, a malformed entry is dropped rather than
    rendered as a blank row, and nothing ever yields NaN).
  - **Settles the open design question: NOT a `Code` variant.** `Code`/`CodeBox` are
    CDN-loaded Monaco (which renders blank after a client-side `goto` anyway), and a
    console needs none of what Monaco is: it wants a prompt, a caret, per-line timing
    and a scrubbable clock, not a language service. `Terminal` is `QuickCode`-family —
    plain DOM and CSS.
  - **The typing is CSS, not a timer**, and that is the whole design. A finite
    `@keyframes` animation is also a Web Animations object, so the session can be held,
    seeked and replayed by moving one clock, and a scrub backwards puts every character
    back where it was. A timer-driven typewriter could do none of it. The caret's blink
    is deliberately **infinite**, so it is excluded from that clock and keeps blinking
    while the session is paused — as a real prompt does.
  - **A Terminal is a video of a session**, so it wears `Video`'s clothes: a centre
    **play button** (it opens held at frame 0 unless `autoplay`), a **transport** —
    play/pause, restart, and a rail you **click to seek and drag to scrub** — and a
    **tick per command**. No chapter *list*, though: unlike a video's, a terminal's
    chapters are already on screen, and printing them again would be noise.
  - **A tick marks a STOP, not a command.** It is drawn at the checkpoint — the end of a
    command's output, where Space parks — never at the command's start. Drawn at the
    starts (the first cut) the rail lied: the first Space halts at the first command's
    *end*, which sits under the *second* tick, so stepping looked like it skipped tick
    one and jumped to tick two, then to the end. `checkpointsOf` is what the ticks, the
    snapping and `nextCheckpoint` all read, so the marks and the ladder cannot drift
    apart again. The last tick is therefore the end of the session, and a tick lights
    once the playhead has passed it (`reachedCount`).
  - **The rail is the only thing on the rail.** The knob is `pointer-events: none` over
    an invisible grab strip taller than itself, so pressing the white circle lands on the
    track and drags. Which means nothing else may sit there and swallow the press — and
    the ticks are therefore inert **marks**, exactly as `Video`'s are, not buttons. (They
    were buttons first, and that was a bug: Space parks the playhead *on* a tick, so a
    clickable tick sat under the knob at precisely the moment you reached for it, and the
    knob could not be grabbed where stepping leaves it.) A click near a tick still lands
    on that stop, because `snapTime` makes the marks magnetic within 1.5% of the
    envelope — the visible marks mean what they look like they mean, without being
    targets. A scrub pauses (the playhead is following the pointer now), and the rail
    ignores a secondary button and a second finger.
  - **Do not copy `Video`'s `detail === 0` guard onto a pointer handler.** That guard is
    right where it lives — on a `click`, `detail` is the click count and 0 means a
    keyboard activation carrying no coordinates. But on a **pointer** event `detail` is
    *always* 0, so the same line rejects every real press: click and drag both died in
    the browser while a DOM test forging `detail: 1` passed. Enter never fires
    `pointerdown`, so there was nothing to guard against anyway. The test fakes now
    default to `detail: 0`, which is what a browser actually sends.
  - **`keys="global"` makes it a build.** Space plays *forward* to the end of the next
    command's output and stops dead there — you watch it type, it halts, you talk.
    Shift+Space jumps back a stop, and from the first one to the beginning. Once the last
    is behind the playhead, Space stops claiming the key and **pages the deck**, the same
    handoff a `Steps` run makes, through the same `activeSteps` store and `spaceIntent` —
    so CONTINUE and the presenter console's `gp:continue` pulse drive it for free.
    Opt-in, because only one build per slide may own Space.
    - Space *plays to* the checkpoint rather than seeking to it — the deliberate
      departure from `Video`, which jumps. Footage is worth jumping through; a
      typewriter you would never see type. Backwards *is* a jump: re-watching a command
      type on the way back is nobody's idea of stepping back.
    - **Both directions walk one set of stops:** `0` (a blank console) and every
      checkpoint. Shift+Space exists to undo Space, so it cannot step to a command's
      *start* — that is a state no forward step ever produces. Stepping back to marker
      starts was the first cut and it was wrong twice over: it landed on states the
      presenter had never seen, and from the first command's start there was nothing
      earlier, so `hasPrev` went false and **Shift+Space paged the deck away instead of
      rewinding**. `prevCheckpoint` (not `prevMarkerStart`) is the fix; the invariant is
      that `prevCheckpoint` and `nextCheckpoint` enumerate the same ladder.
  - **One owner per clock.** `AnimationBar` collects every finite CSS animation in the
    slide's `.content`, this one included, so with `controls` on the two would fight
    over the playhead (the bar's Play would run straight past the markers).
    `controls={false}` renders a bare console and hands the clock back to a bar — the
    only supported way to combine them. The demo slide therefore ships no `AnimationBar`.
  - **Never bare-`play()` a group of staggered animations.** Per the Web Animations spec,
    `play()` on an animation whose `currentTime` has reached its end **auto-rewinds it to
    0**. Every line of the session is its own animation with its own end, so resuming at a
    checkpoint replayed every command already typed — command 1 re-typing alongside
    command 2. (The DOM test's fake `play()` models the auto-rewind, or it could not see
    this.) A finished animation is left where it is: its fill-mode holds its final frame
    whether or not it is attached to a clock.
    - Now `slideAnim.playGroup()` / `pauseGroup()`, **one implementation shared by
      `Terminal`, `AnimationBar` and the presenter console** (`PresenterAnim` +
      `applyState`, the audience-relay path). All three had the same bare loop: pausing a
      staggered `Draw`/`Connector` reveal (`drawDelay`) partway and hitting Play redrew
      the shapes that had already finished, and the presenter's Play relayed that same
      restart to the audience window. Fixed with `tests/slideAnim.test.ts`,
      `tests/AnimationBar.test.ts` and `tests/PresenterAnim.test.ts` — none of the three
      had any test before. The presenter harness drives the console and then replays each
      emitted command onto an *independent* group of animations, which is the relay
      contract itself: what the presenter emits must land the audience in the presenter's
      state.
    - Also, `PresenterAnim` called `setPointerCapture` **unguarded** while guarding its
      matching `releasePointerCapture`. jsdom implements neither, and it swallows an
      exception thrown inside an event listener (reporting a window `error` instead of
      failing the dispatch) — so the scrub tests passed either way. Now optional-called,
      like `Terminal`'s and `AnimationBar`'s, and pinned by a test that listens for that
      window `error`.
    - Fixing that surfaced a **second bug** in the same two `play()`s: "is it spent?" was
      judged on `playState === 'finished'`. But scrubbing to the end leaves every
      animation *paused* at its end, never `'finished'` — and `playGroup` rightly refuses
      to restart a finished animation, so Play became a no-op there. "Spent" is now judged
      on the **playhead** (`sample() >= duration`), which is what the question actually
      means.
  - **Degrade, never blank.** With no transport, no stepping *and* no autoplay nothing
    could ever start the session, so it starts itself. Where `getAnimations` is absent
    there is no clock: the chrome that could not drive anything never renders, and
    Space stops claiming the key rather than trapping the presenter on the slide.
    Reduced motion removes the animations outright, which empties the clock and hides
    the transport by the same rule — no `matchMedia` needed.
  - The reveal is the **width** of the typed span, clipped to a whole number of `ch`
    and walked by `steps(n, end)` — monospace is a console's premise anyway. Every
    reveal keyframe declares only a `from`: the implicit `to` is the property's own
    cascaded value, so one rule serves every line length *and* every tone (a `muted`
    line fades 0 → 0.6, not 0 → 1) without generating per-line keyframes. An empty
    command still gets `steps(1)` — `steps(0)` is invalid CSS and would drop the
    animation entirely.
  - The caret rides the end of the typed text for free (the growing inline-block
    carries it). Its gate is a **window**: `visibility: visible` under fill-mode
    `none`, so the caret exists exactly between its command's start and end. The
    resting caret fills `forwards` instead — it opens at the end of the envelope and
    stays. The blink runs on `opacity`, a *different property*, so the two animations
    never fight over one declaration. One layout trap: `overflow: hidden` moves an
    inline-block's baseline to its bottom margin edge, so the typed span is pinned to
    one row height and aligned `top` — otherwise the command sinks below its prompt.
  - `lines` takes `{ cmd }` (typed), `{ out, tone }` (printed), or a bare string
    (shorthand for output — the common case). Tones `ok`/`warn`/`error`/`muted`, all
    `--terminal-*` role tokens: the screen stays dark in every theme (like `Video`'s
    letterbox — it's a terminal being shown, not a surface being themed), while
    everything that carries *meaning* — prompt, caret, tones, transport accent — comes
    from the palette. Also `prompt`, `title`, `chrome`, `caret`, `typing`, `controls`,
    `autoplay`, `keys`, `continueKey`, and the timing knobs
    `charMs` / `startMs` / `pauseMs` / `outMs`.
  - The track is a **pointer** affordance (`tabindex="-1"`, `aria-hidden`) —
    `NavigationBar` claims →/← unconditionally, so a scrub bar can never own them. Same
    call `Video` made. The play/pause and restart buttons are the keyboard's transport;
    Space is the keyboard's seek.
  - `text` mode prints the session whole (a reader can't wait for a typewriter, and
    there's nothing to scrub), as do `typing={false}` and `prefers-reduced-motion`.
  - **The one gotcha:** a slide's markup never reaches the static build — `SlideDeck`
    gates its content behind `initialized` — so "the transcript prerenders" is a
    *Text-artifact* benefit, not a slide one. What SSR-safety buys a slide is the
    absence of a mount-time flash and a component that cannot desynchronise from the
    scrub bar. Asserted in `tests/TerminalSsr.ssr.test.ts` against `svelte/server`,
    never against a built page.
  - Demo `terminal-component.html` (`keys="global"` — Space runs it command by command,
    then pages on), unit test `tests/terminalCore.test.ts` (schedule + marker/checkpoint
    arithmetic), DOM test `tests/Terminal.test.ts` (jsdom has no Web Animations, so the
    clock is faked closely enough to exercise the real seek/sample/pause logic: hold at
    frame 0, play-to-checkpoint with the overshoot snapped back, the spent-build handoff,
    the no-clock degradation, and the caret left blinking), SSR test
    `tests/TerminalSsr.ssr.test.ts` (transcript prerenders; the transport does *not* —
    a server-rendered play button would be a control that controls nothing). New
    `--terminal-*` role tokens.
- [x] **`Kbd`** — render keyboard keys (`<Kbd>⌘</Kbd><Kbd>K</Kbd>`). Trivial, no-dep.
  - Done: `src/lib/components/Kbd.svelte`, with the parsing in
    `src/lib/utils/kbdCore.ts` (pure, total — `drawCore`/`videoCore`/`columnsCore`
    discipline: a lone `+`, a chord of nothing but separators, a key nobody has an
    alias for, all yield a legend or no chord at all, never a throw).
  - **The spec is one string, not a pile of tags.** Whitespace separates *chords*
    (press, release, press again), `+` separates the keys within one — so
    `keys="Ctrl+K Ctrl+S"` is the whole shortcut. The stated usage
    (`<Kbd>⌘</Kbd><Kbd>K</Kbd>`) makes the author typeset the shortcut *and* pick
    the glyphs; `keys` makes them name it. The bare slot survives as the escape
    hatch: no `keys` → the slot is one cap, rendered as written.
  - **`Mod` is why the component is not trivial.** It's the portable modifier —
    Ctrl on a PC, ⌘ on a Mac — so a deck writes `Mod+Shift+P` once and says it
    correctly to whichever audience is looking. `platform` is `pc` (default),
    `mac`, or `auto`. **`auto` is client-only by nature**: there is no navigator
    during SSR, so a server render (and every Text artifact built from one) resolves
    `pc` — deterministic, never a Mac's ⌘ baked into a PC's prerendered page. A deck
    demoing a Mac app should just say `platform="mac"`. `detectPlatform` takes the
    navigator as an *argument* rather than reading the global, so it stays pure and
    a test can be a Mac without being one; it reads `userAgentData` first, since
    `navigator.platform` is exactly what that deprecated.
  - **`+` is a separator AND a key**, so the split cannot be `String.split('+')`: a
    `+` with nothing to its left is the plus cap (`Ctrl++` → Ctrl and Plus), a run
    of them collapses to one (`++` is the plus key, not two), and a trailing `+` has
    already spent itself as a separator. That's `tokenizeChord`, and it's the one
    piece of the parser that earns a test each way.
  - **The Mac symbol set carries the chord joiner with it.** A Mac shortcut is
    written `⇧⌘P`, glyphs run together; a PC one is written `Ctrl+Shift+P`. So
    `chordJoiner` is empty exactly when the glyphs are in play — turn `symbols` off
    and the `+` comes back, because `Shift Cmd P` would not read as a chord.
    `symbols` is a no-op on a PC, whose keyboard prints words on its caps.
  - **Arrows are glyphs on every platform** and live outside the symbol set: `↑` is
    not shorthand for the Up key, it is the legend engraved on the cap. Conversely
    `win`/`super` never maps to `⌘` — there is no Windows key on a Mac, so it falls
    through to its word.
  - **Glyph caps are decorative, so the root speaks instead.** A screen reader
    announcing "⌘" helps nobody: under Mac symbols the wrapper carries the
    spelled-out shortcut as its `aria-label` and the caps go `aria-hidden`. Word caps
    read correctly on their own and keep their `<kbd>` semantics — an `aria-label`
    there would only mute the elements a reader wants announced. The markup is the
    HTML spec's own nesting: an outer `<kbd>` per chord, an inner one per key.
  - Sized in `em` and coloured from `--kbd-*` role tokens, so a cap tracks whatever
    text it sits in (a heading, a paragraph, `<small>`) and a theme reskins every
    key. The cap's raised "lip" is an **inset box-shadow, not a blurred drop shadow**
    — it must stay crisp at whatever scale `SlideDeck` transforms the canvas to. The
    border and lip are `color-mix`ed from one token, `Callout`'s trick, so neither
    needs to know the surface colour.
  - Also: `join` (override the in-chord separator), `then` (the word between chords
    of a sequence, `''` for a bare gap), and `style`.
  - Demo `kbd-component.html` (the same four shortcuts rendered side by side on both
    keyboards — same `keys`, only `platform` differs), unit test `tests/kbdCore.test.ts`
    (aliases, the `+`-as-a-key cases, platform/symbol matrix, the SSR-safe
    `detectPlatform` fallback), SSR test `tests/KbdSsr.ssr.test.ts` (the nested `<kbd>`
    contract, `auto` prerendering as `pc`, and that an empty spec renders *no element*
    rather than a blank cap). New `--kbd-*` role tokens.
- [x] **`Stat` / `StatGroup`** — big-number / KPI slide. Pure CSS; pairs with charts.
  - Done: `src/lib/components/Stat.svelte` (hero figure + label + optional trend chip;
    `up`→positive / `down`→negative / `flat`→neutral, override via `tone`; `accent`
    tints the figure) and `StatGroup.svelte` (even, divider-separated wrapping row;
    `columns` for a grid; `card` wraps the row in a raised panel). Demo
    `stat-component.html`, `--stat-*` role tokens, SSR test `tests/StatSsr.ssr.test.ts`.
  - Note: theme base tokens (`--INK` etc.) are only defined by `.theme-*` classes; the
    main deck runs with `deckClass=''`, so the roles.css *fallbacks* render — they must
    be the dark-default (light-on-dark) values like `--surface-fg`, not light-theme
    darks. Label/dividers derive from the figure ink (dimmed) to stay legible in any theme.
- [x] **`Columns` / `Split`** — 2–3 column & media/text split layout. Thin grid wrapper; keep LAYOUT-mode compatible.
  - Done: `src/lib/components/Columns.svelte` (the grid) + `Column.svelte` (one cell),
    with the track arithmetic in `src/lib/utils/columnsCore.ts` (pure, total —
    `drawCore`/`videoCore`/`terminalCore` discipline: a negative width, `columns={0}`,
    a `';'` smuggled into a template all fall back to the default, and the result is
    never the empty string, so a slide can't lose its layout to a typo).
  - **`Split` is not a second component.** A media/text split IS a `Columns` with
    unequal tracks, and the only prop that tells them apart is `widths` — a number
    array (`[3, 2]` → `3fr 2fr`), a mixed one (`['360px', 1]`), or the author's own
    `grid-template-columns` string. Shipping a `Split` whose entire body was
    `<Columns widths={[3,2]}>` would have been a default wearing a component's name.
    (Same call `Connector`/`Arrow` made.)
  - **Even tracks are `minmax(0, 1fr)`, never a bare `1fr`** — and children get
    `min-width: 0`. This is the one thing a naive grid gets wrong: a grid item's
    automatic minimum size is its *min-content* width, so a single unbreakable token
    (a URL, a wide `<pre>` line) makes its track exceed its share and pushes the whole
    grid off the 1920px canvas. Applied to every child, not just `<Column>`, because a
    bare `<div>` is a perfectly good grid item.
  - **`span` is clamped to the tracks that exist.** Over-spanning is the trap: grid
    quietly *adds* an implicit column to fit it, so `span={3}` in a two-column group
    silently makes it three, rather than erroring. `Columns` publishes its track count
    over context (a store, since the props are reactive) and `Column` clamps against
    it. A raw `grid-template-columns` string can't be counted (`repeat(3, 1fr)` is
    three tracks and `1fr 1fr` is two — that's a CSS parser), so it reports `null` and
    the author's `span` is trusted as written.
  - **The divider is the column's own leading edge**, a `::before` centred in the
    gutter by `calc(var(--columns-gap) / -2)` — so it is drawn once per gutter and
    never at the grid's outer edges, and `Columns` needs no `:global()` selector
    reaching into `Column`'s markup. Its `display` rides an *inherited custom
    property* (`--columns-rule`) rather than a rule in the parent, because
    inheritance ignores specificity: Svelte hashes the child's own selector to
    (0,4,1), which a parent's `:global(.gp-column)::before` could never outrank. Same
    single-row caveat `StatGroup`'s dividers carry — more children than tracks wraps
    them, and pure CSS can't see the row break.
  - **The narrow-window collapse is `text` mode ONLY**, and that is the design point.
    A presentation is authored on a fixed 1920×1080 canvas that `SlideDeck`
    *transform-scales* to the window, so the canvas is 1920px wide no matter how small
    the window gets — a width media query would fire on the *window* and collapse a
    slide that never actually narrowed. A Text artifact has no canvas (its width really
    is the window's), so there, and only there, the columns stack under 720px. The
    collapse must undo what the columns did: the tracks, the rules (via
    `--columns-rule: none`), and the inline `--column-span` — hence the one
    `!important`, since a stylesheet rule may beat an inline declaration where an
    inherited custom property may not.
  - **The divider drags** (`resizable` for a viewer; LAYOUT mode always, `resizable`
    or not). `trackPointer`'s fifth consumer, so the gutter tracks the cursor in
    FITTED and in SCALED at any zoom.
    - **You cannot drag the authored widths — only the ones the browser resolved.**
      `1fr` is a share of the space left over, so the component *measures*
      (`getComputedStyle(...).gridTemplateColumns` returns the used px) and does its
      arithmetic on that. Which is why the handles are client-only and **never
      prerender**: a server-rendered grip would sit at x=0 and drag nothing — the
      same rule `Terminal`'s transport follows.
    - A drag redistributes only the two tracks its gutter separates. Their **sum is
      invariant**, so the grid never resizes and no other divider moves — that is
      what makes the gesture feel local.
    - It re-emits them as **`fr` weights taken from the measured px**, which is exact
      rather than an approximation: an `fr` track gets `free space × (w / Σw)`, and
      the measured widths already sum to the free space. So nothing jumps on the
      first frame, and the grid stays fluid (raw `px` tracks would refuse to reflow
      when the `Block` around them is resized). The cost: a track authored as a fixed
      `'360px'` rail comes out proportional. **A drag is a ratio editor.** Still
      `minmax(0, Nfr)`, or a wide child's min-content would overrule the drag.
    - **Nothing is saved** — each slide is its own page load, so a live drag is gone
      when you page away. LAYOUT mode adds a `widths` chip that copies
      `widths={[1.17, 0.83]}` to the clipboard to paste back into source; double-click
      any divider to reset it. The same bargain every LAYOUT gesture makes.
    - **A focused handle owns ←/→** (Shift for a bigger step), and it is the *only*
      control in the deck that may. `NavigationBar` claims the arrows on `window` with
      no focus guard — but in the **bubble** phase, so a `stopPropagation()` at a
      focused handle is both sufficient and scoped: the arrows page the deck again the
      instant focus leaves. Pinned by a test that watches a window listener see
      nothing. (`Video` and `Terminal` both concluded "a scrub bar can never own the
      arrows"; the missing half of that sentence was *while unfocused*.)
    - **It must not be a `<button>`.** A focused button swallows Space — `spaceIntent`
      stands down for one — and Space is how the presenter advances. So it is the ARIA
      window-splitter: `div[role="separator"][tabindex="0"]` with `aria-valuenow`,
      which Svelte's a11y lint doesn't recognise as interactive (hence the two
      `svelte-ignore`s, the only ones outside `draw/`).
    - The grab strip is **14px wide and invisible**; the 1px line inside it is the
      whole visual, because nobody can press a 1px target. `pointerdown` is stopped so
      a `Block` wrapping the grid doesn't read the grab as the start of a move. With
      `divider` off there is no resting rule — the handle advertises itself on hover
      and focus, the bargain `WebSite`'s invisible shield makes — and `@media (hover:
      none)` draws it outright, since a touch reader has no hover to reveal it with.
    - `minTrack` (canvas px, default 40) floors both sides. A pair already too narrow
      to honour it is left **untouched** rather than jumping to a size nobody asked
      for — `resizeTracks` is total, like everything else in the core.
  - Also: `columns` (even count), `gap` (omit it and the theme's `--columns-gap`
    keeps its say), `align` + per-`Column` `align` (unknown values fall back rather
    than emitting a value the stylesheet doesn't know — `ContentPage`'s rule), `stack`
    (collapse on demand), and `style`. A `Column` used outside a `Columns` is an
    ordinary block: no span, no rule, no complaint.
  - LAYOUT-mode compatible for free: `Block` fills its content, so a
    `<Block><Columns>…</Columns></Block>` stretches the grid to the box and a resize
    rubber-bands the columns. The demo parks both bands that way.
  - Demo `columns-component.html` (the lower band is `resizable` — drag it), unit test
    `tests/columnsCore.test.ts` (template / count / clamp / alignment / the drag
    geometry, all the bad inputs), SSR test `tests/ColumnsSsr.ssr.test.ts` (the static
    contract the stylesheet reads, and that no handle prerenders), DOM test
    `tests/Columns.test.ts` and drag test `tests/ColumnsDrag.test.ts` — all sharing
    `tests/ColumnsHost.svelte`, since what a `Column` knows it learns from its parent,
    so neither can be rendered alone.
    - jsdom has no grid engine, so `getComputedStyle` never resolves a track to px —
      the one input the drag reads. It is stubbed to a known grid and everything
      downstream is the real code. `Columns.test.ts` pins what a server render can't
      see: the track count travels by **store**, so a `Column` re-clamps its `span`
      when the group's shape changes under it (a plain context snapshot would be right
      once and stale after).
    - New `--columns-divider` and `--columns-handle` role tokens, and a `--columns-gap`
      metric.

## Tier 3 — nice to have

- [x] **`Quote`** — blockquote + attribution/avatar.
  - Done: `src/lib/components/Quote.svelte`, the Tier-3 companion to `Stat`/`Callout`
    on a testimonial / "what people say" slide. Pure CSS, no deps, purely
    declarative (no `onMount`, no browser APIs), so its full markup comes from
    props and it prerenders.
  - A `<figure>` with a decorative opening-quote glyph, a left accent rule, a
    `<blockquote>` body, and a `<figcaption>` footer carrying the speaker. `text`
    prop or the default slot (same escape hatch as `Hint`/`Callout`); `author` +
    `role` (a dim second line, the author's ink at reduced opacity — tracks the
    theme without a fragile muted token, `Stat`'s label trick).
  - **The avatar needs no image.** Pass `avatar` (import it, so a Pages base path
    survives — the reason `YouTube`/`Video` take imported assets) for an `<img>`;
    omit it and the component draws an **initials disc** from `author` (first
    letters of up to two words, accent-tinted), so a quote looks finished without a
    picture. An empty/space-only author yields no initials and the disc is dropped
    rather than shipped as a blank circle. The image ring and disc tints are
    `color-mix`ed from one token each (`Callout`/`Kbd` discipline).
  - `align` (`left` default / `center`) — center centres text + footer and **drops
    the left rule** (a centred bar reads as a divider, not a quote). Unknown value
    falls back to left rather than emitting a class that matches nothing
    (`ContentPage`'s rule). `mark` / `rule` each opt out independently; footer
    absent entirely when there's no author/role/avatar.
  - **Optional card: `border` + `radius` + `background`.** A border and/or a
    background turns the quote into a padded card (`radius` any CSS length); the
    mark then sits **fully inside the top of the frame** (line-height 1, in flow),
    not the tucked-above-text watermark the bare variant uses. (A first cut had it
    *straddle* the top border fieldset-legend style with a cut swatch behind the
    glyph — it read as awkward, so the mark just lives inside the frame now.)
    `--quote-border` token, softened via `color-mix` like the avatar ring. Verified
    by rendering the framed variants to a PNG, not just by test.
  - Sized in `em` so a quote tracks whatever text it sits in; `--quote-*` role
    tokens (fg / author-fg / cite-fg / mark / rule / avatar-ring), fallbacks the
    dark default (light-on-dark) like `--surface-fg`. LAYOUT-compatible for free —
    `Block` fills its content, so `<Block><Quote/></Block>` sizes it.
  - Demo `quote-component.html` (left w/ image avatar + centred w/ initials disc,
    self-contained `grace.svg`), SSR test `tests/QuoteSsr.ssr.test.ts` (text/slot,
    footer parts, image-vs-initials choice, the align/mark/rule class contract the
    stylesheet reads, the bad-`align` fallback). New `--quote-*` role tokens.
- [x] **`Timeline`** — narrative event timeline (distinct from charts).
  - Done: `src/lib/components/Timeline.svelte` (the spine) + `TimelineItem.svelte`
    (one event: marker dot, `time`/phase kicker, `title`, and a body — `text` prop
    or the default slot, the Quote/Callout escape hatch). Pure CSS, purely
    declarative (no `onMount`, no browser APIs), so it prerenders. The Tier-3
    container/item pair, the same shape as `StatGroup`/`Stat` and `Columns`/`Column`.
  - **`side` is the only thing the container owns, and it travels by context.** A
    `TimelineItem` learns which edge of the spine to sit on from its `Timeline`
    (`'right'` default / `'left'` / `'alternate'`), the same "what a Column knows it
    learns from its parent" plumbing — a store, since `side` is reactive, read by
    every item. Standalone (no parent) an item falls to `'right'`. An unknown `side`
    falls back to `'right'` rather than emitting a class that matches nothing
    (ContentPage/Quote discipline).
  - **The spine is one continuous line, trimmed to run dot-to-dot.** Each item is a
    grid; the marker column is fixed-width so the dots align across events whatever
    their content, and its `::before` draws a thin rule extended past the bottom by
    the list `gap` so segments bridge into one line. `:first-child` starts it at the
    first dot, `:last-child` stops it at the last, and a lone event draws no line at
    all — so the spine never floats above the first event or past the last.
  - **The dot is pinned by its centre, not its box.** Absolute + `translate(-50%,-50%)`
    at `--tl-dot-center`, so an `icon`-enlarged dot (a glyph inside a bigger disc)
    grows around the same point and never shifts the spine or breaks the end-trim
    math — one number keeps the whole line consistent. Per-event `color` retints just
    that dot + its kicker (a `--tl-color` override); `active` adds a soft halo ring
    ("you are here"), static so it survives SSR and reduced motion.
  - **`alternate` zig-zags by `:nth-child`, no per-item index needed.** Three-track
    grid (`1fr auto 1fr`), spine centred; odd events' content in the right track,
    `:nth-child(even)` flips it to the left and right-aligns it. The items are direct
    `<li>` children of the `<ol>`, so structural `:nth-child` counts them correctly
    (the same reason first/last trim works).
  - Colours from `--timeline-*` role tokens (spine dim-ink softened via color-mix;
    dots/kicker pull the accent; titles ink, bodies ink dimmed via opacity — the
    Stat/Quote no-muted-token trick; icon glyph takes the on-accent ink), fallbacks
    the dark default (light-on-dark). `--timeline-gap` metric. Sized in `em`, and
    LAYOUT-compatible for free — `Block` fills its content, so `<Block><Timeline>…`
    sizes it (the demo parks both bands that way).
  - **Also horizontal** (`orientation="horizontal"`): events in a row on a
    fixed-height `band`, `side` = `below` (default) / `above` / `alternate`. The two
    orientations use *different* layout engines and that is deliberate: vertical is a
    per-event grid (height is the content's own, so events flow naturally), but
    horizontal is a **fixed band with the spine at a constant y and the dot + content
    absolutely placed off it** — because a per-item grid would let a taller
    above/below event push its dot out of line and bow the spine. Absolute placement
    keeps the row's spine dead straight whatever the content. `orientation` travels
    over the same context as `side`; the two `side` naming sets alias across
    orientations (`left`≈`above`, `right`≈`below`) with the orientation's default as
    the fallback.
  - **A long horizontal timeline pans in a `ScrollDiv axis="x"`.** Each event is a
    fixed `itemWidth` and the list is `width: max-content`, so an over-long history
    is just wider than its viewport — give ScrollDiv an `innerWidth` of about
    `events × (itemWidth + gap)` and it wheels/drags cleanly, spine continuous across
    the pan. `band` and `itemWidth` are horizontal-only props (ignored when vertical).
  - Demo `timeline-component.html` (vertical: default `side` left + `side="alternate"`
    right — icon dots, a `color` override, `active` halos) and
    `timeline-horizontal.html` (a `side="alternate"` band + a 14-event history panned
    in a `ScrollDiv`). SSR test `tests/TimelineSsr.ssr.test.ts` +
    `tests/TimelineHost.svelte` (the orient/side classes, each event's parts, the
    slot-vs-`text` body, icon/active/colour markers, the horizontal side aliases +
    bad-input fallback, and both orientation AND side reaching the items over
    context). Verified by rendering both slides to PNGs — including a seeded-scroll
    frame proving the pan reveals the later years — not just by test. New
    `--timeline-*` role tokens.
- [x] **`Tabs`** — switch panels in one slide (e.g. same code in N languages).
  - Done: `src/lib/components/Tabs.svelte` (the strip) + `Tab.svelte` (one panel),
    with the index arithmetic in `src/lib/utils/tabsCore.ts` (pure, total —
    `drawCore`/`videoCore`/`columnsCore` discipline: an empty list, a NaN `start`, a
    strip of nothing but disabled tabs all yield a sane index, never a throw or an
    out-of-range read). The container/item pair, the same shape as
    `Carousel`/`CarouselItem` and `Timeline`/`TimelineItem`.
  - **The Tab owns its label; the strip is drawn from it.** Each `<Tab label="…">`
    registers its label (and optional `icon`, `disabled`) UP to the `Tabs` over
    context — the content stays in the Tab. So a diagram-in-N-languages is authored as
    labelled panels, not as a strip plus a parallel array of bodies to keep in sync.
  - **The one ordering subtlety (SSR):** the strip's `{#each $tabs}` sits *after*
    `<slot/>` in the template, so a Tab registering during slot render is visible to
    the strip in a single server pass — the same ordering `Carousel`'s dot row relies
    on. It is floated back above the panels with `order: -1`. Put the strip first and
    the prerendered markup would ship an empty strip.
  - **Panels are grid-stacked**, so the container is as tall as the *tallest* panel and
    switching a tab never resizes it — the strip stays put. Inactive panels keep their
    box (`visibility`, not `display`) so they still size the stack, and go `inert`.
  - **Keyboard is the ARIA tablist, and it claims nothing global.** Roving tabindex
    (one tab-stop); ←/→ (and ↑/↓), Home/End move selection, skipping disabled tabs and
    wrapping. It owns the arrows ONLY while a tab is focused, by `stopPropagation` in
    the **bubble** phase — so `NavigationBar`'s window paging resumes the instant focus
    leaves (the exact scoped ownership `Columns`' resize handle takes). Deliberately
    **no `keys='global'`** and no Space claim: a Tabs never contends with a
    `Steps`/`Video`/`Terminal` build on the same slide. Clicking is the primary path.
  - `text` mode has no canvas and nothing to click, so it drops the strip and shows
    every panel in flow under its own label heading (the Steps "text shows all" rule).
  - `start` (clamped, nudged off a disabled tab), `align`
    (`start`/`center`/`end`/`stretch`, unknown → `start` — the ContentPage/Timeline
    fallback), `transition` (`fade`/`none`), and a `bind:this` API (`goTo`/`next`/`prev`).
  - Sized in `em`, `--tabs-*` role tokens (inactive label ink dimmed in-component like
    Stat/Timeline — no fragile muted token; active label full ink; accent indicator +
    baseline rule + hover wash), fallbacks the dark default (light-on-dark).
    LAYOUT-compatible for free — `Block` fills its content, so `<Block><Tabs>…` sizes it.
  - Demo `tabs-component.html` (one greeting in JS/Python/Go + a disabled "soon" tab),
    unit test `tests/tabsCore.test.ts` (clamp/skip/wrap/align, all the bad inputs), DOM
    test `tests/Tabs.test.ts` (click switch, roving keyboard skip+wrap, disabled inert,
    arrows owned only while focused), SSR test `tests/TabsSsr.ssr.test.ts` +
    `tests/TabsHost.svelte` (the strip reflects the registered tabs, one panel per Tab,
    the initial selection off a disabled `start`, the align/transition contract). New
    `--tabs-*` role tokens.
  - **The one gotcha** (as with Terminal/QRCode): a slide's markup never reaches the
    static build (`SlideDeck` gates its content behind `initialized`), so the strip
    prerendering is a *Text-artifact* benefit, not a slide one. What SSR-safety buys a
    slide is no mount-time flash. Asserted against `svelte/server`, never a built page.
- [x] **`CodeDiff`** — added/removed line styling; a before/after code block.
  - Done: `src/lib/components/CodeDiff.svelte`, with all the diff arithmetic in
    `src/lib/utils/codeDiffCore.ts` (pure, total — `drawCore`/`videoCore`/`tabsCore`/
    `qrCore` discipline: a null source, a lone `+`/`-` marker, two versions that share
    nothing, a 10 000-line paste all yield a sane `DiffLine[]`, never a throw and never
    an out-of-range read).
  - **The gap it closes: a slide could show a snippet (`QuickCode`) or a file
    (`Code`/`CodeBox`), but not a *change*** — the line you added, the line you took
    out, which a tech talk lives on. Each line gets a `+`/`−` gutter, a green/red wash +
    accent bar, and optional old/new line numbers.
  - **NOT a `Code`/Monaco variant — the same call `Terminal` made** (and the reason the
    TODO's "extends `Code` `revealLines`" was the wrong frame). Monaco is a CDN-loaded
    language service that re-bootstraps per mount and renders blank after this deck's
    client-side `goto` (memory `monaco-breaks-on-spa-nav`); a diff wants per-line control
    and token colours, not a language service. So it is **`QuickCode`-family**: it owns
    its own row markup and borrows only Shiki's colours — plain DOM + CSS, no deps.
  - **Two authoring paths, one `DiffLine[]`.** `before`/`after` → the diff is *computed*
    (`diffLines`, an LCS over lines with a shared head/tail trim so the quadratic core is
    usually empty, and an `LCS_MAX` guard that degrades a pathological paste to a coarse
    block-replace rather than allocating a huge matrix — totality never depends on size).
    Or a git-style `+`/`-`/space-prefixed `diff` string → `parseDiff` (exact control;
    the marker set is `git diff`'s, minus `@@` hunk headers). A bare `code` prop degrades
    to an all-context block. **Line numbering is load-bearing** (a wrong old/new number is
    a lie the audience reads): context advances both counters, an add only the new, a del
    only the old — asserted on every shape in the unit test.
  - **Reveal is deferred to `Steps`/`Fragment`, not reinvented.** A CodeDiff is a static
    block, so the deck's existing reveal machinery drives it; it grows no stepping logic
    of its own (the `revealLines` idea, done the composable way).
  - **Shiki by line, not by blob.** New `highlightToLines` in `utils/highlight.ts`
    (alongside `highlightToHtml`) returns Shiki's tokens grouped *per line* via
    `codeToTokens`, so the component colours each line's text while wrapping the line in
    its own diff row. The whole block is highlighted at once (not line-by-line) to keep
    multi-line grammar context, then zipped back onto the rows under a
    `tokens.length === lines.length` guard — a mismatch keeps plain text. Like QuickCode
    it renders **plain text first, then swaps in the colours on mount**, so it is SSR-safe
    and never flashes.
    - **The one gotcha, worth recording:** the swap paints through a template that
      references `tokenLines` **directly** (`{#if tokenLines && tokenLines[i]}`), *not*
      through a `tokensFor(i)` helper. A function call in the markup hides its reactive
      dependency from Svelte — the colours computed but never repainted. Caught by the DOM
      test, which is exactly why it exists.
  - Sized in `em`, `--codediff-*` role tokens (`add` green / `del` red, mixed toward
    transparent in-component for the wash + bar so neither needs the surface colour — the
    `Callout`/`Hint` trick; the screen is a dark code surface like QuickCode; numbers +
    context sign dimmed from the gutter ink), fallbacks the dark default (light-on-dark).
    Add/del stay green/red **whatever the theme's ink** — a diff's colours carry meaning,
    not decoration. LAYOUT-compatible for free — `Block` fills its content, so
    `<Block><CodeDiff/></Block>` sizes it (the demo parks both bands that way).
  - Demo `codediff-component.html` (left: `before`/`after` computed, with a `summary`
    chip; right: an explicit git-style `diff` with line numbers), unit test
    `tests/codeDiffCore.test.ts` (LCS shapes, numbering, the git-marker convention, all
    the bad inputs), SSR test `tests/CodeDiffSsr.ssr.test.ts` (the row/class/gutter/number
    structure the stylesheet reads, and that **no** token colours reach the server), DOM
    test `tests/CodeDiff.test.ts` (the mount-time plain→colour swap, aligned per line).
    New `--codediff-*` role tokens.
  - **The one gotcha** (as with Terminal/Tabs/QRCode): a slide's markup never reaches the
    static build (`SlideDeck` gates its content behind `initialized`), so the block
    prerendering is a *Text-artifact* benefit, not a slide one. What SSR-safety buys a
    slide is no mount-time flash. Asserted against `svelte/server`, never a built page.
- [x] **`QRCode`** — live scannable link on any slide; generalizes `utils/prepare-youtube.sh`.
  - Done: `src/lib/components/QRCode.svelte`, a thin `<svg>` over
    `src/lib/utils/qrCore.ts` — **a QR encoder written from the spec** (ISO/IEC 18004),
    pure and total (`drawCore`/`videoCore`/`kbdCore` discipline: an empty value, a junk
    mask, a 3000-character URL all yield `null` or a clamped default, never a throw).
  - **The point is that a QR becomes a pure function of its text.** Today the code is a
    PNG that `utils/prepare-youtube.sh` shells out to the `qrencode` *binary* to make, and
    commits next to the slide, where it goes stale the moment the URL changes. Now nothing
    is fetched and nothing is generated ahead of time — no npm package, no binary. Change
    the URL, the code changes. It draws as **SVG**, so it stays crisp through SlideDeck's
    canvas transform; a raster QR softens with the projector, and a soft QR is one that
    takes three tries to scan from row twelve.
  - **`YouTube`'s `qr` prop is now optional**, and omitting it is the better answer: the
    component encodes the watch URL from `youtubeId`, so the code cannot drift from the
    video it points at. Slides that pass the PNG render exactly as before.
    `tests/YouTubeSsr.ssr.test.ts` pins both paths — and that the auto-linked code does not
    nest an `<a>` inside the card's own anchor.
  - **Byte mode only, and that is a decision.** The spec's alphanumeric mode packs denser
    but excludes lowercase, so a real URL falls out of it on the first lowercase letter and
    lands back in byte mode anyway. One mode encodes anything, in UTF-8, and needs no
    segmentation pass. Lone surrogates encode as U+FFFD rather than as invalid UTF-8 that no
    scanner could decode. Versions 1–40, all four ECC levels, 2953 bytes at the ceiling.
  - **Dark-on-light, whatever the theme.** The one place `roles.css` does *not* follow the
    deck's ink: a dark theme's ink is light, and an inverted QR is something scanners may
    refuse. `--qr-dark` / `--qr-light` default to literal black on literal white — the same
    call `Video`'s letterbox and `Terminal`'s screen make. The quiet zone (4 modules) is
    *part of the symbol*, not padding: a scanner finds the finders by their outer light
    edge, so the plate paints under it. `shape-rendering: crispEdges`, because a blurred
    module boundary is exactly what a scanner cannot resolve — and the svg's default
    `preserveAspectRatio` means a `Block` that stretches the box **letterboxes** the code
    instead of skewing it. A skewed QR is an unreadable one.
  - Also: `ecc`, `size` (canvas px or any CSS length), `quiet`, `minVersion` (hold a module
    size steady across URLs of differing length), `mask`, `label` (or the default slot),
    `plate`, `alt`, and auto-`href` — a QR is scanned by the room *and* clicked by whoever
    reads the deck as a page, so an `http`/`mailto`/`tel` value links itself (`link={false}`
    opts out; a `WIFI:` payload is not a destination and never links). The dark modules are
    emitted as **one `<path>` with horizontal runs merged**, not one `<rect>` per module.
  - **Verified against `qrencode`, not against itself.** `tests/fixtures/qr-golden.json` holds
    reference grids for readable payloads plus sha256 digests for **all 160 (version × ECC)
    combinations, twice each** — once packed to exactly full capacity (no padding, every block
    used) and once below it (terminator + `0xEC`/`0x11` pad codewords in play). 329 symbols,
    matched module for module. One wrong entry in the ECC block tables moves exactly one
    digest and nothing else, which is what makes the fixture worth its 60 KB. The capacity
    table was not transcribed from a book either: it was *probed* out of `qrencode` by
    binary search, and `byteCapacity` is asserted against all 160 of its answers.
  - **The mask is pinned, not compared** — the one real subtlety. Mask selection is a
    heuristic scored by the spec's four penalty rules, and the rules admit more than one
    honest reading (is a finder-alike counted once per occurrence, or once per satisfied
    side? does the quiet zone beyond the edge count as the light margin?). Conforming
    encoders differ on ~7% of payloads. Since the chosen mask is *written into the symbol's
    own format bits*, a decoder reads whichever we picked and never has to agree with us. So
    the golden test encodes at the mask it decoded out of the reference symbol, and
    everything downstream of that choice must match exactly. `penaltyScore` is then tested
    directly against the spec's rules on hand-built grids (a checkerboard scores 0; an
    all-light 5×5 scores exactly 30 + 48 + 100), and auto-selection is tested to be a true
    argmin. Rule 3 matches the finder's 1:1:3:1:1 **ratio at any scale**, not the 11-module
    window — a scanner reads ratios, so 2:2:6:2:2 is just as misleading.
  - Three things the tests caught, all worth recording: the alignment-pattern step is
    `⌊(4v + 2·numAlign + 1) / (2·numAlign − 2)⌋ × 2` and **version 32 is a published
    irregularity** (26, where the formula yields 28); the positions must be filled from the
    far edge inward, so the slack falls in the *first* gap rather than smearing across all of
    them; and `qrencode` never once picks mask 5 across the 329 fixtures, so the eight mask
    formulas are pinned separately against an independent transcription of Table 10, inside a
    window of the v10 symbol proven clear of every function pattern.
  - Demo `qrcode-component.html` (one URL at all four ECC levels — the symbol grows as the
    redundancy does), unit test `tests/qrCore.test.ts` (362 cases), SSR test
    `tests/QRCodeSsr.ssr.test.ts`. New `--qr-*` role tokens.
  - **The one gotcha:** as with `Terminal`, a slide's markup never reaches the static build
    (`SlideDeck` gates its content behind `initialized`), so "the symbol prerenders" is a
    **Text-artifact** benefit, not a slide one. What SSR-safety buys a slide is no mount-time
    flash, and a symbol that cannot differ between the server's idea of it and the browser's.
    Asserted against `svelte/server`, never against a built page.
- [x] **`StackedBarChart` / `Histogram`** (and **`Heatmap`**) — part-to-whole & distribution charts; fills chart-family gaps.
  - **`StackedBarChart` was already covered** — a stacked bar is `<BarChart stacked>`
    (Phase 2), the same call `Split`/`Arrow` made: a layout of an existing component is a
    prop, not a second component. Shipping a `StackedBarChart` whose body was
    `<BarChart stacked>` would have been a default wearing a component's name. Demoed on
    `chart-bar.html` (grouped vs stacked side by side).
  - [x] **`Histogram`** — the DISTRIBUTION chart, the real gap: a BarChart plots one bar
    per *pre-made* category, so nothing in the family turned a flat column of raw numbers
    into a *shape*. Done: `src/lib/chart/Histogram.svelte` over pure `histogramBins` in
    `chartCore.ts` (the family's discipline — junk in yields `[]` or empty bins, never a
    throw or a NaN edge).
    - **The categories ARE the bins, computed from the data**, so the x scale is
      **linear** (not band): bars are contiguous (a small `gap` only insets each rect so
      neighbours read apart) and the axis ticks are round values, not one label per bar.
      The counterpart decision to BarChart's band x.
    - **Edges reuse `niceTicks`**, the axes' own machinery, so bins fall on human numbers
      (…, 40, 60, 80, …) rather than 8.33-wide raw slices. Three authoring paths, one
      `HistogramBin[]`: a `bins` count (snapped to nice edges; **Sturges' rule**
      ⌈log₂n⌉+1 as the default), a `domain` clamp (values outside dropped), or explicit
      `edges` (sanitised — sorted, de-duped, finite; an unusable set falls back to
      computed). Intervals are half-open `[x0, x1)` with a **closed final bin**, so the
      maximum value is never dropped off the end.
    - **Blanks are dropped, not zeroed** (the family's blank rule): a missing measurement
      is "no data point", not a 0-valued one, so it never invents a count. An empty bin
      draws **no rect** (a gap), never a zero-height stub — BarChart's rule for a blank.
    - **SSR-safe** exactly as the other charts: the full `<svg>` renders from props alone;
      the hover tooltip (snaps to the nearest bin centre via `nearestIndex`, every bin
      hoverable so a gap still reports its "0") and the `animate` clip-wipe are client-only
      and never reach the prerender. `role="img"` + required `title`, one aria-label per
      bar (`"40–60: 7"`). Reuses the whole `--chart-*` token family — no new tokens.
    - Demo `histogram-component.html` (one latency sample: auto bins with `animate` vs a
      fixed `bins={6}` with a tooltip; two dropped requests carry `null` and vanish),
      unit tests in `tests/chartCore.test.ts` (binning/edges/boundary/blank/domain/degenerate),
      SSR assertion + host in `tests/ChartSsr(.ssr).test.ts` (bins prerender with predictable
      aria-labels), DOM smoke tests in `tests/Charts.test.ts` (bar count, labels, empty-bin
      gap, zero baseline, no reveal clip by default).
  - [x] **`Heatmap`** — the 2-D distribution / matrix, the remaining chart-family gap: a
    BarChart plots one bar per category and a Histogram bins one variable, but nothing
    turned a *two-key* table (weekday × time-of-day, service × region) into a shape. Done:
    `src/lib/chart/Heatmap.svelte` over pure `heatmapMatrix` in `chartCore.ts` (the family's
    discipline — junk in yields empty `xs`/`ys`/`cells` and `NaN` min/max, never a throw).
    - **Both axes are categorical bands; the third dimension is the cell's COLOUR** — the
      counterpart decision to the Histogram's linear x. Two `bandScale`s (padding 0 so the
      cells tile the plot edge-to-edge; `gap` insets each rect so neighbours read apart), and
      the value rides a sequential ramp.
    - **The pivot is pure and total.** `heatmapMatrix` buckets rows into the distinct x/y
      categories (first-seen order, the same keying `bandScale`/`groupRows` use) and emits the
      **FULL grid** row-major — so a missing (x, y) combination is an *explicit blank cell*,
      never a hole the component has to infer. Rows sharing a cell are **averaged**, blanks
      excluded from both the sum and the divisor (the `avgOf` discipline), so a missing
      measurement never drags a cell's mean toward 0. A cell with no finite value is `null`.
    - **Colour is a `color-mix`, not a baked palette.** Each cell's value is normalised to
      `t ∈ [0,1]` across the colour-scale domain (a flat matrix maps to `t = 0.5`; a `domain`
      override lets several heatmaps share one scale, clamping `t`), and the component fills
      it as `color-mix(in oklab, var(--chart-heat-high) t%, var(--chart-heat-low))`. So the
      ramp is themeable per deck via two tokens, the steps stay perceptually even (oklab), and
      no continuous palette is baked in. **A blank cell is drawn EMPTY** (`--chart-heat-empty`,
      a faint neutral), never the ramp's low end — the same call the Histogram makes dropping a
      blank rather than counting it 0. The value ink (when `showValues` prints numbers in the
      cells) flips light/dark past the ramp's midpoint so it stays legible on any fill.
    - **SSR-safe** exactly as the rest of the family: the full `<svg>` — every cell rect with
      its `color-mix` fill, both band axes, and a **static colour-ramp legend** (a
      `linear-gradient(in oklab …)` bar with the scale ends) — renders from props alone. The
      hover tooltip (2-D pointer snap to the nearest cell centre via `nearestPoint`, a cell
      outline + `ChartTooltip`) and the `animate` clip-wipe are client-only and never reach the
      prerender. `role="img"` + required `title`, one aria-label per cell (`"Mon × AM: 42"` /
      `"Tue × PM: no data"`). Reuses the whole `--chart-*` family plus new `--chart-heat-low`/
      `-high`/`-empty` tokens (with in-component ColorBrewer-"Blues" fallbacks, so it reads
      even on a deck that sets no vars — the `seriesColor` pattern).
    - Demo `heatmap-component.html` (one weekday × time-of-day request-load table drives two
      heatmaps: auto-scaled with `animate` + legend vs. `showValues` printing each number with a
      tooltip; two monitoring-gap slots carry `null` and draw empty). Unit tests in
      `tests/chartCore.test.ts` (`heatmapMatrix`: pivot/first-seen order, mean-aggregation with
      blanks excluded, full-grid blank cells, `t` normalisation + clamp, flat/domain/empty),
      SSR assertion + host in `tests/ChartSsr(.ssr).test.ts` (the 2×2 grid prerenders with
      per-cell aria-labels, the blank drawn empty, `color-mix` fills, the legend), DOM tests in
      `tests/Charts.test.ts` (cell count, labels, empty-cell class, `showValues`, no reveal clip
      by default). New `--chart-heat-*` role tokens.
- [x] **Multi-segment path** — one `Draw` shape whose geometry chains several segments
      (line + curve + arc) instead of composing separate `Line` / `Curve` / `Arc` elements.
  - Gives a single continuous stroke: one `draw`/`drawDelay` reveal, one arrowhead at the
    real end, joins that meet cleanly instead of butting stroke caps together.
  - Done: `src/lib/draw/Path.svelte`, with the chaining/geometry in `drawCore.ts`
    (`pathShapes`/`multiPath` + the `pointAtMulti`/`angleAtMulti`/`labelPosMulti`
    evaluators — pure, total, the family's `drawCore` discipline: junk in yields `[]`
    or `''`, never a throw or a `NaN` in the `d`).
  - **The route is authored as a `start` point + a `segments` list**, each segment's
    start defaulting to the previous one's `to` — so a whole path is a start plus a
    list of destinations, not a pile of `<Line>/<Curve>/<Arc>` tags whose endpoints
    must be kept in sync by hand. **The KIND is inferred from the control data**
    present: `bend` → arc, `c1`(/`c2`) → curve (quadratic/cubic), neither → line
    (`bend` wins if both are given). An explicit per-segment `from` lifts the pen for
    a disjoint sub-path.
  - **It is ONE `<path>`, which is the whole point.** `multiPath` concatenates each
    segment's builder and **drops the redundant leading `M`** wherever a segment
    starts exactly where the previous ended (the pen is already there) — so the chain
    is a single sub-path with `stroke-linejoin: round`, joins that MEET instead of
    butting stroke caps. A segment whose `from` differs keeps its `M` (a genuine
    gap), so disjoint runs render as gaps, never a spurious connector. That single
    path gets **one `draw`/`drawDelay` reveal** for the whole route (`pathLength=1`,
    CSS-only — prerenders, `AnimationBar` scrubs it) and **one arrowhead at the real
    end**: only the last shape's tail (and, for `arrow="start"`, the first shape's
    start) is trimmed behind its head via `shortenShape`, the middle joins untouched
    — Arc's shaft trick applied to the ends of a chain. The head's tip and tangent
    come from the ORIGINAL end shape (`angleAt(shape, 1)`), so it lands exactly on
    `to`.
  - Renders geometry + reveal + arrowheads + a `labelText` (placed by `labelPosMulti`,
    the arc-length twin of `labelPos`).
  - **Geometry keyframes (`stops` + `animate`), now shipped** — the whole chain morphs
    between poses on the AnimationBar timeline, the same model as `Line`/`Curve`/`Arc`
    (heads/label ride transform keyframes; an independent `drawn` reveal track; the
    toolbar's per-stop **keyframes** panel; per-stop on-canvas handles). The one real
    difference: a single Line/Curve/Arc tweens `d: path()` exactly, but a Path's command
    structure varies across segments (and arc flags don't interpolate), so the geometry
    track **samples each pose into a fixed-count polyline** (`sampleMultiPath` over
    `pointAtMulti`) — constant command count at every stop ⇒ a smooth morph regardless of
    segment mix. The static (no-CSS) render still uses the exact `multiPath` and
    prerenders. New `PathStop` type (`{ pct, start?, segments?, drawn?, ease? }` — a full
    pose per stop, like `SpriteStop`). Tests: `sampleMultiPath` unit (constant L-count
    across kinds), DOM keyframes (sampled `d:path` frames, head/label transforms, reveal
    track, `stops` beats `draw`, <2 stops = no anim), SSR (morph keyframes prerender),
    and animated-stop editing (per-stop handle set, stop-drag → Copy round-trips
    `stops`/`animate`, undo restores).
  - **LAYOUT-editable like `Line`/`Curve`/`Arc`** (the follow-on, now shipped): with
    the deck's LAYOUT control on, every vertex grows a handle — the `start` point, each
    segment's `to`, a hollow control handle per Bézier control point (with the guide
    line), an explicit-`from` handle for a disjoint sub-path, and an accent **bend
    handle at each arc's apex** (dragging across the chord flips the sign via
    `bendFromApex`, the same inverse `Arc` uses). It registers a `ShapeEditor` so the
    Draw toolbar's **Copy** emits the whole `<Path start=… segments=[…]>` tag with the
    live geometry — attribute order matches Copy, so a drag → Copy → paste is a
    numbers-only diff. Edits are finder state (reset on reload; Copy → paste is the
    only persistence) and every completed drag records to the LAYOUT undo/redo.
    Generalizing `Curve`/`Arc`'s per-endpoint editing over a *list*, the one new
    wrinkle is index alignment: `pathShapes` drops a malformed (no-`to`) segment, so
    per-segment handles gate on `shapes.length === segments.length` (they'd otherwise
    mis-map onto the wrong segment) — the hit stroke + start handle stay live either
    way. Tests in `tests/DrawEditing.test.ts` + `DrawEditHost.svelte` (handle-per-vertex
    count, guides, start-drag re-chains the stroke, the arc bend handle rides the apex
    and flips to −0.1 across the chord, Copy emits the live tag, undo restores).
  - Demo `path-component.html` (a headline `Path` chaining line → curve → arc → cubic
    into one end arrow, plus a serpentine of alternating arcs drawing itself on as one
    stroke), unit tests in `tests/drawCore.test.ts` (chaining/kind-inference/`bend`
    precedence/gap/dropped-`M`/the evaluators/all the bad inputs), SSR assertion +
    host in `tests/DrawSsr(.ssr).test.ts`/`DrawSsrHost.svelte` (the continuous `d`
    prerenders, the head tip lands on the last `to`), DOM tests in `tests/Draw.test.ts`
    (one path, one head, round joins, the single draw-on reveal, the empty-list
    no-render). No new role tokens — it reuses the `--draw-*` family.

## Authoring / LAYOUT mode

- [x] **`Block` z-index control** — author-controlled stacking order for overlapping `Block`s.
  - Problem: overlapping Blocks paint in DOM order, so a lower Block sits beneath a
    later one with no way to say otherwise (and in LAYOUT mode its grip/body can hide).
  - Done: a `z` prop on `Block.svelte` (default 0), with the ordering math in
    `src/lib/utils/stackingCore.ts` (pure, total — `drawCore`/`connectorCore`
    discipline: junk siblings and a NaN self are ignored, and a Block that is already
    the extreme is left where it is, so Front/Back never churn the source or the undo
    history). Bring-to-front / send-to-back buttons (**⤒ / ⤓**) sit in the edit toolbar
    beside **Copy**; each reads its siblings' live z's from a new
    `stores/blockOrder.ts` registry (module-level, like `selectedBlock`/`blockAnchors`
    — the Blocks it orders are siblings, so no context bridges them) and sets `z` one
    past the highest/lowest. A move is `record`ed for global undo/redo, exactly like a
    drag.
  - **The order shows LIVE in LAYOUT.** A first cut applied `z` only in presentation
    (so an inline value couldn't fight the class-based selection stopgap on
    specificity) — but then a reorder was invisible until you left LAYOUT, which was
    confusing. Fixed by folding the author z and the transient editing lift into ONE
    computed inline z-index (`displayZ`): the Block you're touching floats to the top
    (dragging > selected > hovered, a band under the in-canvas KeyframeStudio panel at
    z 50), and every OTHER editing Block sits at its authored z — clamped just below
    that lift band so the grabbed Block always wins. `z=0` stays `z-index: auto` (no
    stacking context), so a grip can still float across a neighbour and the common
    all-default slide is byte-for-byte unchanged. The only stacking value left in CSS
    is the grip/toolbar layer (z 35).
  - **Send-to-back is floored at 0.** A Block shares one stacking context with the
    slide's in-flow content (text, a code box), so a *negative* z-index paints it
    behind that content, not just behind sibling Blocks — sending a Block "to back"
    against the default z=0 Blocks would otherwise drop it behind the slide body
    (found in testing: the demo's card vanished under the code box). The button
    floors at 0 (a z=0 positioned Block already sits above in-flow content); a
    deliberate backdrop-behind-text is still one hand-authored `z={-1}` away, which
    the applied z-index honours.
  - **Persisted both ways, like x/y/w/h.** Copy emits ` z={n}` in the opening tag
    (only when non-zero — a default-layer Block stays clean), and the dev **Save** path
    writes it through `patchSource.ts`: z is rewritten in place when the tag already
    carries one (including back down to 0) and inserted only when the new value is
    non-zero, so a plain x/y drag never litters the source with `z={0}`. The structured
    `before`/`after` geometry (`layoutChanges.ts` `Geometry`) grew an optional `z`.
  - No new role tokens — the two glyph buttons reuse the `--ctrl-*` family the Copy
    button and resize grip already do (dev-only LAYOUT chrome, not themeable surface).
  - Demo: `block-component.html` now parks an overlapping pair where `front` comes
    FIRST in the markup yet sits on top via `z={1}` (z overriding DOM order — the whole
    point), reorderable with ⤒ / ⤓. Unit test `tests/stackingCore.test.ts` (front/back
    math, the no-op/tie/empty/non-finite cases), DOM test `tests/BlockZ.test.ts` +
    `BlockZHost.svelte` (z-index applied in presentation AND live in LAYOUT, the
    selected-Block lift over a huge authored z, the z=0-stays-auto case, negative,
    the registry, and Front/Back ordering a Block against its sibling), SSR test
    `tests/BlockZSsr.ssr.test.ts` (a non-zero z prerenders as `z-index`, z=0 stays
    clean), and four new `tests/layoutPatch.test.ts` cases pinning the insert-only-when-
    non-zero / rewrite-in-place / never-`z={0}` Save contract.

- [ ] **Select-to-front for Draw path shapes** — extend the Block "select → float to top"
      to `Line` / `Arc` / `Curve` / `Sprite`.
  - `Rect` / `Ellipse` already get it: they render as real `<Block>`s, so the `selectedBlock`
    stopgap covers them for free. Path shapes do NOT.
  - Why it's not trivial: a Draw is ONE `<svg>` and SVG has no z-index — paint order *is*
    DOM order *is* the **visible** overlap. So naïvely re-appending the selected shape's `<g>`
    to raise it also reorders what's drawn on top (not just what's clickable), and breaks the
    stable-shape-order assumption (e.g. `DrawEditing.test.ts` indexes `g.draw-line[1]`).
  - Proper fix: hoist the selected shape's **editing chrome only** (hit-stroke + handles) into
    a dedicated top `<g>` layer that `Draw` renders last — raises *interaction* to the front
    without touching the visible shape order. Refactor spans `Draw.svelte` + the 4 shapes.
  - Milder today than the Block case: unselected shapes already show quiet, half-size handles
    and wide hit-strokes, so only the exact band where two strokes cross is hard to hit.

## Adoption / distribution

- [ ] **Skeleton project** — publish an empty GeekPresent starter (no example deck) so a new
      project can begin from a clean slate instead of deleting the demo slides.
  - Today `adopt-geekpresent.sh` bootstraps GeekPresent into an existing host project; the
    skeleton is the greenfield counterpart.
  - Decide what the skeleton keeps (theme, `roles.css`, nav/deck shell, build scripts) vs.
    what it drops (`*-component.html` demo slides, sample content, narration assets).
- [ ] **Versioning** — give GeekPresent itself a version so an adopted project can say which
      release it is on and what upgrading means.
- [ ] **Component versioning, installation, and repository** — a way to fetch/update individual
      components after adoption, rather than copying the whole tree once.
  - Open questions: registry format, per-component version pinning, upgrade/diff story for
    components a project has locally edited.
- [ ] **AGENT skills** — ship skills (à la `.claude/skills/`) that teach an agent the GeekPresent
      conventions: authoring a slide, adding a component, LAYOUT mode, the SSR/test contract.
  - Complements `AGENT.md`/`AGENTS.md`, which are prose-only today.

## Deliberately excluded

- **Math / LaTeX (KaTeX)** and **Mermaid-style diagrams** — both pull heavy deps, against the
  no-dep grain. `Connector` covers the common diagram case natively.

## Open design questions

- ~~Should `Terminal` be a `Code` variant rather than a standalone component?~~ **No** —
  standalone, `QuickCode`-family. `Code` is CDN-loaded Monaco; a console needs a caret and a
  scrubbable CSS clock, not a language service. See the `Terminal` entry above.
- Should `Stat` live inside `Callout`, or stay separate?
