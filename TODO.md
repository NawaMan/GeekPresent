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

`src/lib/templates/ContentPage.svelte` hard-wires a left-aligned `<h1>`, a `.subtitle`
span, and a rule drawn as the subtitle's `::after`. All three are effectively mandatory:
an empty `title`/`subtitle` still renders its box, and the rule is welded to the subtitle,
so a slide with no subtitle keeps the subtitle's gap and the rule drops too low.

- [ ] **Center the title** — opt-in `align` (`left` default / `center`), applied to the
      title (and, when centered, presumably the subtitle and the rule with it).
- [ ] **Optional subtitle** — omitting it should pull the rule *up* to sit right under
      the title, not leave the empty span's margins behind. Needs the rule to stop being
      `.subtitle::after` and become its own element.
- [ ] **Every header part optional** — title, subtitle and rule each independently
      omittable (`title=""` / `subtitle=""` / `rule={false}`), with the survivors closing
      the gap. Header absent entirely → content starts at the top of the canvas.
- [ ] **Styling pass on the header** — sizes, spacing and the rule's weight/colour should
      come from `roles.css` role tokens (`--page-title-fg` and `--subtitle-rule` exist;
      the rest is hard-coded `em`s). Remember the fallbacks *are* the main deck's theme,
      so they must read as light-on-dark.
- [ ] **Styling pass on `Hint`** — verify the backdrop/hairline treatment (the `--hint-*`
      tokens added under *Chrome & legibility*) across themes and backdrops, and against
      the header above it.

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
- [ ] **`Kbd`** — render keyboard keys (`<Kbd>⌘</Kbd><Kbd>K</Kbd>`). Trivial, no-dep.
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
- [ ] **`Columns` / `Split`** — 2–3 column & media/text split layout. Thin grid wrapper; keep LAYOUT-mode compatible.

## Tier 3 — nice to have

- [ ] **`Quote`** — blockquote + attribution/avatar.
- [ ] **`Timeline`** — narrative event timeline (distinct from charts).
- [ ] **`Tabs`** — switch panels in one slide (e.g. same code in N languages).
- [ ] **`CodeDiff`** — added/removed line styling; extends `Code` `revealLines`.
- [ ] **`QRCode`** — live scannable link on any slide; generalizes `utils/prepare-youtube.sh`.
- [ ] **`StackedBarChart` / `Histogram`** (maybe **`Heatmap`**) — part-to-whole & distribution charts; fills chart-family gaps.

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
