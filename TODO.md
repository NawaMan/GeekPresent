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
- [ ] **`Tabs`** — switch panels in one slide (e.g. same code in N languages).
- [ ] **`CodeDiff`** — added/removed line styling; extends `Code` `revealLines`.
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
- [ ] **`StackedBarChart` / `Histogram`** (maybe **`Heatmap`**) — part-to-whole & distribution charts; fills chart-family gaps.
- [ ] **Multi-segment path** — one `Draw` shape whose geometry chains several segments
      (line + curve + arc) instead of composing separate `Line` / `Curve` / `Arc` elements.
  - Gives a single continuous stroke: one `draw`/`drawDelay` reveal, one arrowhead at the
    real end, joins that meet cleanly instead of butting stroke caps together.

## Authoring / LAYOUT mode

- [ ] **`Block` z-index control** — author-controlled stacking order for overlapping `Block`s.
  - Problem: overlapping Blocks paint in DOM order, so in LAYOUT mode a lower Block's
    resize grip/body can sit beneath another Block and become unselectable.
  - Add a `z` prop (emitted by Copy + persisted via the LAYOUT Save path, like x/y/w/h),
    plus bring-to-front / send-to-back affordances in the edit toolbar.
  - Stopgap already in place (`Block.svelte` editing-only stacking, `selectedBlock` store):
    grips + Copy float above other blocks' bodies, and **selecting** a Block (grabbing it)
    floats it to the top temporarily (transient, not persisted; Escape deselects). This
    keeps overlapping Blocks grabbable, but true author-controlled *persistent* ordering
    (`z` prop + front/back) is still the fix.

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
