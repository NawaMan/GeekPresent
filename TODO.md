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

- [ ] **`WebPage`** — show a live website full-page: an `<iframe>` filling the whole slide canvas.
  - Sandbox the frame; lazy-load (only mount when the slide is active) to avoid background network.
  - Iframe scales fine inside the fixed 1920×1080 transform; verify pointer/scroll interaction.
- [ ] **`WebSite`** — show a website as a component in limited space: an `<iframe>` sized to a `Block` region.
  - Same engine as `WebPage`, just bounded; optional "open full" affordance to hand off to a `WebPage`/new tab.
- [ ] **`Video` (a.k.a. `VDO`)** — `<video>` with custom chrome + **time bookmarks**.
  - Controls: play/pause, restart, click-to-seek progress bar, `currentTime / duration` readout.
  - Bookmarks: `data-seek`-style chapter buttons that seek the video, with the active chapter
    auto-highlighted on `timeupdate` (last bookmark whose time ≤ currentTime).
  - Inspiration: CodingBooth `../CodingBooth/site/index.html` demo-player (markup ~L1107–1146,
    JS ~L1411–1500 — `data-seek`, progress bar, active-point highlighting).
- [ ] **`VDOPage`** — page/template shell that shows a `Video` in full-page canvas space
  (sibling to `TitlePage`/`ContentPage`).

## Tier 2 — on-brand tech-talk polish

- [ ] **`Terminal`** — fake console: typed command + output. Can ride the `AnimationBar` keyframe clock.
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

- Should `Terminal` be a `Code` variant rather than a standalone component?
- Should `Stat` live inside `Callout`, or stay separate?
