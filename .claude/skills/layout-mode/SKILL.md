---
name: layout-mode
description: Place elements at exact canvas pixels with Block/ImageBlock and LAYOUT mode, connect them with Connector, and understand who may offer LAYOUT, why SAVE can refuse or land only partly, and the style guard. Use when a slide needs precise positioning, a boxes-and-arrows diagram, or the user asks about LAYOUT/dragging/SAVE.
---

# Place things visually (LAYOUT mode)

When a slide positions things at exact canvas pixels, **don't guess the numbers**. Wrap the element in a
`Block` (or `ImageBlock` for a picture), drag it in the browser, and copy the resulting tag back into the
source.

```svelte
<script>
	import Block from '$lib/components/Block.svelte';
</script>

<Block name="logo" x={760} y={420} width={400} height={240}>
	<!-- content -->
</Block>
```

Key props: `x`/`y`/`width`/`height` (canvas px, 1920×1080 by default), `name` (label + snippet comment,
and the anchor other components resolve against), `grid` (snap step), `aspect` (`true`/number/`false`),
`bounds` (`'canvas'` clamps inside, `'none'` lets it bleed off-stage), `minSize`.

- `Block` **fills its content to the box** by default (`fill={false}` opts out) — so whatever you wrap
  stretches to the shape you drag. Don't add per-component fill props.
- `ImageBlock` for pictures: the image fills the panel and reshapes with the box, aspect locked by default
  (Alt breaks it).

## Who may offer LAYOUT

**LAYOUT is an authoring aid, not a viewer feature. In production it is OFF.** Three things can offer the
control, highest authority first — precedence lives in `src/lib/layout/layoutAccessCore.ts` (pure,
unit-tested):

1. **`pnpm dev`** — always, and nothing can take it away.
2. **`?layout` on any slide URL** — the escape hatch on a built site; `?layout=off` disables it. The
   speaker asked, so this outranks the content.
3. **`layout: true` on the slide's `pages.ts` entry** — a *per-slide* opt-in, so a slide that **teaches**
   layout offers the button in the build while the rest of the deck ships LAYOUT-free. There the button
   renders **featured** (a filled warm pill with a halo that pulses until used) and is exempt from
   `fadeChrome` — which otherwise holds chrome at `opacity: 0.12` until pointed at, and would defeat any
   amount of restyling.

**Offered is not active** — the mode still starts off.

> **Gotcha: `?layout` is sticky and global, not per-deck.** Once seen on a built site it is saved to
> `localStorage` and the control then shows on **every deck on that origin** until `?layout=off`. "I
> enabled it on one slide and now it's everywhere" is expected. See `src/lib/stores/layoutMode.ts`.

## SAVE, and why it refuses

**SAVE cannot follow LAYOUT into a build.** It POSTs to `/__geekpresent/layout-save`, an endpoint that
exists only inside the vite dev server — a static host has no source tree to rewrite. The button is
deliberately **not** greyed out there: it looks ordinary and **refuses on click** (`NOT ALLOWED`, with a
tooltip). That ordering is the point — a button disabled from the start reads as broken; a button that
answers when pressed teaches that saving is *forbidden here*. **Copy** is the write-back path that works
everywhere.

**SAVE can land only PARTLY, and says so.** The patcher (`src/lib/layout/patchSource.ts`) never guesses: a
tag it cannot confidently place comes back `unmatched` rather than risking a rewrite of the wrong one. So
the button has a fourth outcome beside `SAVED` / `NONE` / `NOT ALLOWED` — the tally **`1 OF 2`**, naming
what didn't land. A partial write that claimed `SAVED` would quietly lose the author's drag on the next
reload.

> **The usual cause is a tag with a twin.** A slide documenting a component often shows the tag in a
> `<QuickCode>` sample *in the same file*, and the patcher scans raw source — so a sample spelling out both
> `name` and `x/y/width/height` is indistinguishable from the real tag, and **neither** can be placed.
> **Elide the geometry in code samples** (`<Block name="api" …>`), as every sample in this deck does.

## Dragging (what to tell the user)

Ask the user to open the slide in *their* dev server — you never run it. The **SizeMode** control
(top-right) shows a LAYOUT toggle; a dashed outline appears around each `Block`.

- **Drag** the body to move, **drag the bottom-right grip** to resize.
- **Alt** breaks an aspect lock; **Esc** cancels the gesture; **Ctrl/Cmd+Z** undoes and
  **Ctrl/Cmd+Shift+Z** / **Ctrl+Y** redoes, globally across every `Block` on the page.
- **Copy** puts the current tag, with live coordinates, on the clipboard — paste it over the original tag.
  `ImageBlock` emits a `src={…}` placeholder; keep your real imported `src`.

## Diagrams: name the boxes, let Connector route

Don't compute arrow coordinates. Give each box a `name`; `Connector` resolves it through
`src/lib/stores/blockAnchors.ts` (which publishes each named `Block`'s live box), which is why a drag moves
the box *and* its arrows together.

```svelte
<Block name="api" x={200} y={400} width={280} height={140}>API</Block>
<Block name="db"  x={900} y={400} width={280} height={140}>DB</Block>

<!-- AFTER the Blocks -->
<Connector from="api" to="db" label="query" />
<Connector from="db" to="api" route="curve" fromSide="bottom" toSide="bottom" dash />
```

- **Connectors must come after the Blocks they link.** Names resolve during prerendering and Blocks
  register in document order — a connector placed first ships an **empty diagram**. An unknown name renders
  nothing (never a broken arrow), so a missing arrow means a typo or a connector that jumped the queue.
- `route`: `straight` (default), `ortho` (`radius` rounds the corners), or `curve`. Sides auto-pick;
  override with `fromSide`/`toSide`.
- Either end also takes a raw canvas point (`from={[300, 540]}`) or a literal `{ x, y, width, height }`.
- `label` is the visible shaft text (`labelAt` 0–1 along it, `labelOffset` px off it); `ariaLabel` is the
  accessible name, defaulting to `"<from> to <to>"`.
- Stagger `drawDelay` to build a diagram arrow by arrow — they share one `AnimationBar` timeline.
- Styling rides `--draw-*` custom properties; `color`/`thickness`/`dash` override per connector.

Worked example: `src/routes/slides/connector-component.html/+page.svelte` — five arrows, zero coordinates.

## The style guard: on a draggable, props own the geometry

The one exception to "author's `style` wins". A `Block` (and Draw's `Rect`/`Ellipse`) writes its own box,
so `left`, `top`, `width`, `height`, `inset*` and `position` are **reserved**: a declaration for one of
them in `style` is **stripped** before the style is applied. Otherwise it would land in the same
declaration block as the box's own geometry, where the last declaration simply wins — and
`style="left: 40px"` would cancel `x={200}` outright, leaving LAYOUT dragging a box that cannot move.

`style` is still for **cosmetics** (stroke, dash, colour, a decorative `rotate()`); those pass through and
still win. Reserving changes what *renders*, never what you *wrote* — your source `style` is echoed back
verbatim by Copy/Save, and LAYOUT chrome badges the dead declaration so you know to delete it.

The rule lives in `src/lib/layout/styleGuardCore.ts` (pure, unit-tested). **A new draggable reuses
`guardStyle()`** rather than re-deriving the list.
