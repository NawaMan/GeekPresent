# TODO — Proposed Components

Candidate components to add to GeekPresent, prioritized. Tiers reflect value vs. effort:
T1 closes real capability gaps; T2 is high-frequency tech-talk polish; T3 is nice-to-have.

Conventions to honor when building: each component is plain Svelte imported by path
(`$lib/components/…`), positions in the fixed 1920×1080 canvas via `Block`/`Draw` where
relevant, themes via `roles.css`, adapts to presentation/text/present modes via
`getMode()`, and ships a reference slide in `src/routes/slides/` (one `*-component.html`).

## Tier 1 — closes clear gaps

- [ ] **`Steps` / `Fragment`** — accumulating ←/→ reveal within a slide.
  - Biggest gap; the classic reveal.js/Slidev bullet-reveal, which the deck lacks.
  - Reuse `Carousel`'s keyboard stepping (note: `Carousel` *replaces* content; `Steps` *builds up*).
  - Coordinate ←/→ with `NavigationBar` so the last fragment hands off to the next slide.
- [ ] **`Connector` / `Arrow`** — auto-routed arrow between two named `Block`s.
  - Turns the `Block` system into a diagramming tool.
  - Reuse `Block` `name`-matching (same mechanism as LAYOUT-mode save) + `Draw` Line/Arc.
  - `<Connector from="api" to="db" label="query" />`
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
- [ ] **`Stat` / `StatGroup`** — big-number / KPI slide. Pure CSS; pairs with charts.
- [ ] **`Columns` / `Split`** — 2–3 column & media/text split layout. Thin grid wrapper; keep LAYOUT-mode compatible.

## Tier 3 — nice to have

- [ ] **`Quote`** — blockquote + attribution/avatar.
- [ ] **`Timeline`** — narrative event timeline (distinct from charts).
- [ ] **`Tabs`** — switch panels in one slide (e.g. same code in N languages).
- [ ] **`CodeDiff`** — added/removed line styling; extends `Code` `revealLines`.
- [ ] **`QRCode`** — live scannable link on any slide; generalizes `utils/prepare-youtube.sh`.
- [ ] **`StackedBarChart` / `Histogram`** (maybe **`Heatmap`**) — part-to-whole & distribution charts; fills chart-family gaps.

## Deliberately excluded

- **Math / LaTeX (KaTeX)** and **Mermaid-style diagrams** — both pull heavy deps, against the
  no-dep grain. `Connector` covers the common diagram case natively.

## Open design questions

- Should `Terminal` be a `Code` variant rather than a standalone component?
- Should `Stat` live inside `Callout`, or stay separate?
