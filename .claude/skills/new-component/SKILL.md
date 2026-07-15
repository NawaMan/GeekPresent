---
name: new-component
description: Add a reusable author-facing component to $lib/components — the style/id/class contract, the pure *Core.ts for its logic, role tokens for its colours, plus the demo slide and DOM/SSR tests that make it done. Use when the user asks for a new component, a new chart/diagram/visual, or wants an existing one generalised.
---

# Add a reusable component

Lives at `src/lib/components/<Name>.svelte`, imported as `$lib/components/<Name>.svelte`.

**No new dependencies.** Charts, diagrams and QR symbols here are own-math Svelte, deliberately. A
proposal whose approach is "pull in library Y" is the wrong proposal. (KaTeX and Mermaid are
*deliberately excluded* — `Connector` covers the common diagram case natively.)

## 1. The three props every author-facing component takes

`style`, `id` and `class` — all three. A Svelte component forwards **nothing** it hasn't declared, so a
component that omits them doesn't error when a slide reaches for one; the attribute silently *vanishes*,
which is far more confusing. On the root element:

```svelte
<script lang="ts">
	/** Inline style for the root element, applied last so it wins. */
	export let style: string = '';
	/** DOM id for the root element. */
	export let id: string = '';
	/** Extra class(es) for the root element. */
	let klass: string = '';
	export { klass as class };   // `class` is a reserved word, hence the rename
</script>

<div class="thing {klass}" id={id || undefined} style="width: {width}px; {style}">
```

- **`style` goes LAST.** That is the whole point: a plain declaration outranks any class selector, so the
  author's `style` beats the component's own rules with no `!important` anywhere.
- **`id={id || undefined}`** so an unset id emits no attribute at all.
- **`class` has a catch.** A slide's `<style>` is *scoped*, so a class defined there will **not** match an
  element inside a child component (Svelte hashes the selector; the child's element has no hash — you get
  an "unused CSS selector" warning). `class` is for **global** CSS (`global.css`, `roles.css`, a
  `:global(...)` block) or as a hook for scripts and tests. For a one-off tweak from a slide, `style` is
  the answer.
- **On a draggable, the props own the geometry — `style` does not.** The one carve-out to "style wins".
  See the `adjust-mode` skill; reuse `guardStyle()` from `src/lib/adjust/styleGuardCore.ts` rather than
  re-deriving the reserved list.

## 2. Put the logic in a pure core module

Geometry, parsing and any non-trivial computation go in `src/lib/utils/<name>Core.ts` (or
`src/lib/draw/`, `src/lib/chart/` where those already own the area), leaving the component with nothing
but markup. Follow the house discipline of `drawCore.ts`, `connectorCore.ts`, `spotlightCore.ts`,
`kbdCore.ts`:

- **Pure and DOM-free** — testable without a browser.
- **Total** — every function returns something drawable. Garbage input yields an empty list, or the token
  as typed; **never a throw and never `NaNpx`**. A slide must not collapse because someone wrote
  `keys="+++"`. Input from a URL param or `localStorage` is *untrusted*: another tab, an older deck, a
  hand-typed URL.
- **Unit-tested directly** — `tests/<name>Core.test.ts`, where the interesting cases are the bad ones.

## 3. Colours and metrics are role tokens

Three tiers: a theme redefines a **base palette** (`src/lib/themes/themes.css`); **role tokens**
(`src/lib/themes/roles.css`) map those bases to semantic names, once, shared by every deck; components
read the **role tokens**, never the base palette.

A new visual gets its own `--thing-*` role tokens. The critical rule:

> **The `var()` fallbacks ARE the theme.** The main `slides` deck sets no theme class, so every role must
> resolve, unthemed, to the original **dark** look (light-on-dark). Write the dark literal as the
> fallback — `var(--callout-info-accent, #2980B9)` — and duplicate that same dark fallback inside the
> component too, so it is safe even rendered with neither file present. `--INK-DIM` is a *dark* ink, not
> a muted-light one.

## 4. Reveals and animations are opt-in and SSR-inert

An animation renders **nothing** at prerender and lights up on the client. `Canvas` and the charts'
`animate` prop ride the `AnimationBar`'s CSS-keyframe clock (a hidden `@keyframes` head the bar scrubs),
which is what makes them seekable rather than fire-and-forget. Reuse that shape; don't invent a second
clock. Never put an `<AnimationBar />` on a `Terminal` slide — both would drive the same clock.

## 5. Anchor to other components through the store, not the DOM

Anything that points *at* another component (`Connector`, `Spotlight`) resolves through
`src/lib/stores/blockAnchors.ts`, which publishes each named `Block`'s live box. That is why arrows track
their boxes through a ADJUST-mode drag. Reuse it rather than reading the DOM.

## Definition of done

A component is not done because the `.svelte` file exists. It is done when all four landed:

1. **The component** — `src/lib/components/<Name>.svelte`, with `style`/`id`/`class`.
2. **A demo slide, which IS the documentation** — `src/routes/slides/<name>-component.html/`. The house
   shape (see `src/routes/slides/callout-component.html/+page.svelte`): a `ContentPage` with a short prose
   explanation, a `QuickCode` showing the tag an author would type, a props line, live examples wrapped in
   named `Block`s so they can be dragged, a `Hint`, and a `ViewSource` at the end. **Elide geometry in the
   `QuickCode` sample** (`<Block name="api" …>`) — a sample that spells out `x`/`y`/`width`/`height` is
   indistinguishable from the real tag to ADJUST's source patcher, and neither can then be saved.
   Register it in `src/routes/slides/pages.ts` and give it a `+layout.js`; see the `new-slide` skill.
3. **A DOM test** — `tests/<Name>.test.ts`.
4. **An SSR test** — `tests/<Name>Ssr.ssr.test.ts`. Not optional: built deck HTML never contains slide
   markup, so prerender has to be proven through `svelte/server`. See the `deck-tests` skill.

Then verify:

```bash
npm_config_verify_deps_before_run=false pnpm exec vite build
pnpm test
```

The user runs the dev server, not you — ask them to eyeball the demo slide.
