---
name: adjust-mode
description: Place elements at exact canvas pixels with Block/ImageBlock and ADJUST mode, connect them with Connector, and understand who may offer ADJUST, why SAVE can refuse or land only partly, and the style guard. Use when a slide needs precise positioning, a boxes-and-arrows diagram, or the user asks about ADJUST/dragging/SAVE.
---

# Place things visually (ADJUST mode)

**Proposal before code** (see `AGENTS.md` → *Proposal before code* / Rule 0; **Rule 0b** — feature work in a linked worktree, not on main) when this skill leads to
**edits** (wiring `Block`s, changing SAVE/access, new draggable behaviour). Read-only teaching —
"how does ADJUST work?" — skips the gate. When editing: research, post **Problem · Diagnostic ·
Approach**, wait.

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

## Who may offer ADJUST

**ADJUST is an authoring aid, not a viewer feature. In production it is OFF.** Three things can offer the
control, highest authority first — precedence lives in `src/lib/adjust/adjustAccessCore.ts` (pure,
unit-tested):

1. **`pnpm dev`** — always, and nothing can take it away.
2. **`?adjust` on any slide URL** — the escape hatch on a built site; `?adjust=off` disables it. The
   speaker asked, so this outranks the content.
3. **`adjust: true` on the slide's `pages.ts` entry** — a *per-slide* opt-in, so a slide that **teaches**
   layout offers the button in the build while the rest of the deck ships ADJUST-free. There the button
   renders **featured** (a filled warm pill with a halo that pulses until used) and is exempt from
   `fadeChrome` — which otherwise holds chrome at `opacity: 0.12` until pointed at, and would defeat any
   amount of restyling.

**Offered is not active** — the mode still starts off.

> **Gotcha: `?adjust` is sticky and global, not per-deck.** Once seen on a built site it is saved to
> `localStorage` and the control then shows on **every deck on that origin** until `?adjust=off`. "I
> enabled it on one slide and now it's everywhere" is expected. See `src/lib/stores/adjustMode.ts`.

## SAVE, and why it refuses

**SAVE cannot follow ADJUST into a build.** It POSTs to `/__geekpresent/adjust-save`, an endpoint that
exists only inside the vite dev server — a static host has no source tree to rewrite. The button is
deliberately **not** greyed out there: it looks ordinary and **refuses on click** (`NOT ALLOWED`, with a
tooltip). That ordering is the point — a button disabled from the start reads as broken; a button that
answers when pressed teaches that saving is *forbidden here*. **Copy** is the write-back path that works
everywhere.

**SAVE can land only PARTLY, and says so.** The patcher (`src/lib/adjust/patchSource.ts`) never guesses: a
tag it cannot confidently place comes back `unmatched` rather than risking a rewrite of the wrong one. So
the button has a fourth outcome beside `SAVED` / `NONE` / `NOT ALLOWED` — the tally **`1 OF 2`**, naming
what didn't land. A partial write that claimed `SAVED` would quietly lose the author's drag on the next
reload.

**There are two distinct causes, and the tooltip names the one that actually happened** (each unmatched
tag carries a `reason` from the patcher — `'not-found'` vs `'ambiguous'`):

> **`not-found` — the tag isn't in the source in its literal form.** Draw shapes save by a literal
> old→new tag swap, so a tag whose geometry is EXPRESSIONS (`from={curve.from}` pointing at a shared
> const), or one reformatted/multi-line, has no bytes for the patcher to find. Nothing to rewrite —
> Copy it and paste by hand (one paste makes the tag canonical, after which SAVE lands).

> **`ambiguous` — a tag with a twin.** A slide documenting a component often shows the tag in a
> `<QuickCode>` sample *in the same file*, and the patcher scans raw source — so a sample spelling out both
> `name` and `x/y/width/height` is indistinguishable from the real tag, and **neither** can be placed.
> **Elide the geometry in code samples** (`<Block name="api" …>`), as every sample in this deck does.

**The patcher has a third mode, and only ANNOTATE's FREEZE uses it.** Everything above *rewrites* a tag
that is already in the file. A change carrying `insert` instead **adds** markup the slide has never had —
a frozen ink stroke becoming a `<Polyline>`/`<Line>`/`<Rect>` (`src/lib/annotate/freezeCore.ts` does the
mapping, `patchSource.ts`'s insert mode places it). It has no `oldTag` to find, so the question is *where
a new shape goes*, and the answers stay as conservative as the matcher: into the slide's `<Draw>` when it
has exactly one, into a fresh top-level `<Draw>` when it has none, and **`ambiguous`** when it has several
— never a guess. The needed `$lib/draw` import is merged in at the same time, because an inserted
`<Polyline>` without it is a build error rather than a shape.

## Dragging (what to tell the user)

Ask the user to open the slide in *their* dev server — you never run it. The top-centre tool bar
(`PRESENT │ ANNOTATE │ ADJUST │ DISPLAY │ ☰`) shows an **ADJUST** toggle — turn it on; a dashed
outline appears around each `Block`.

- **Drag** the body to move, **drag the bottom-right grip** to resize.
- **Shift** while dragging locks the move to one axis — X or Y, whichever the pointer has moved
  further along, measured from the grab point (re-evaluated live, so swinging past the diagonal
  flips it). This holds for a `Block`, a Draw box (`Rect`/`Ellipse`), and a point-shape handle
  (`Line`/`Arc`/`Curve`/`Path` endpoint) alike. No diagonal detent.
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
`style="left: 40px"` would cancel `x={200}` outright, leaving ADJUST dragging a box that cannot move.

`style` is still for **cosmetics** (stroke, dash, colour, a decorative `rotate()`); those pass through and
still win. Reserving changes what *renders*, never what you *wrote* — your source `style` is echoed back
verbatim by Copy/Save, and ADJUST chrome badges the dead declaration so you know to delete it.

The rule lives in `src/lib/adjust/styleGuardCore.ts` (pure, unit-tested). **A new draggable reuses
`guardStyle()`** rather than re-deriving the list.
