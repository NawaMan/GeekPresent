# Layout & diagrams

A slide is a fixed canvas, 1920×1080 px unless the deck sets another `width`/`height`. The
components here put things at exact canvas pixels, group them so they move and zoom as one, connect
them with arrows, and split or pan content. All of them can be dragged in ADJUST mode, so the author
does not have to guess the numbers.

Shared conventions:

- Every component takes `style`, `id` and `class` on its root element (see [README.md](README.md)).
- `x`, `y`, `width`, `height` are canvas pixels, top-left origin. Inside a `Group` they are the
  group's own units (see `Group`).
- A `name` on a Block-family component makes it something other components can find:
  `Connector`, `Group` cameras, `hide`/`move`, and the speaker's `Spotlight`.

## ADJUST mode (how authors place things)

Not a component; a mode of the deck. Wrap an element in a `Block` (or `ImageBlock`, `TextBlock`,
`SvgBlock`), turn ADJUST on, drag it into place, then write the numbers back into the source.

**Who offers the ADJUST button**, highest authority first:

1. The dev server (`pnpm dev`): always offered.
2. `?adjust` on a slide URL turns it on for a built site; `?adjust=off` turns it off. This choice is
   saved in `localStorage` and applies to **every deck on that origin** until `?adjust=off`.
3. `adjust: true` on the slide's `pages.ts` entry (or `adjust` on `<SlideDeck>` for the whole deck):
   for a slide that teaches layout. There the button is shown featured (a pulsing pill).
4. Otherwise off. A published slide has no ADJUST button.

Offered is not active: the mode always starts off. The author turns it on with the **ADJUST** word in
the top-centre tool bar (or Alt+. then **j**). A dashed outline appears round each Block.

**Gestures** (tell the author; you cannot drag for them):

| Gesture | Effect |
| --- | --- |
| drag the body | move |
| drag the bottom-right grip | resize |
| Shift while dragging | lock the move to one axis |
| Alt while resizing | break an aspect lock |
| Esc | cancel the gesture in progress (or clear the selection) |
| Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z or Ctrl+Y | undo, redo (page-wide, across all Blocks) |
| Delete / Backspace | delete the selected Block (pending until SAVE) |
| Ctrl/Cmd+C, Ctrl/Cmd+V | copy and paste the selected Block (pending until SAVE) |
| Front / Back buttons | change the Block's `z` |
| Copy button | put the Block's current opening tag, with live numbers, on the clipboard |

**Writing it back.**

- **SAVE** (dev server only) writes every moved tag straight into the source file. It rewrites only
  the opening tag; children and the closing tag stay. A Block written inside a component under
  `src/routes/` (a shared scene) is saved into that component, so every slide using it follows. A
  tag inside a package component is never saved (it belongs to whoever uses it).
- On a built site SAVE is not greyed out; pressing it answers **NOT ALLOWED**. There is no source
  tree on a static host. **Copy** works everywhere: paste the copied tag over the original.
  `ImageBlock`'s copied tag carries a `src={…}` placeholder; keep the real imported `src`.
- SAVE can land **partly**, and then shows a tally such as **`1 OF 2`** with a tooltip naming what did
  not land. The patcher never guesses. Two causes:
  - **not-found**: the tag is not in the source in literal form, for example geometry written as
    expressions (`x={pos.x}`) or a tag reformatted across lines in a way the patcher cannot match.
    Fix: Copy and paste by hand once; after that the tag is literal and SAVE lands.
  - **ambiguous**: the same tag appears twice in the file, usually because a code sample on the
    slide (a `QuickCode` string) spells out the same `name` and `x`/`y`/`width`/`height`. Fix: elide
    geometry in samples, `<Block name="api" …>`.
- After the author has been dragging with SAVE, **re-read the file before you edit it**.

**The style guard.** On a draggable, the geometry props own the box. In `style`, the declarations
`left`, `top`, `width`, `height`, `position`, `x`, `y` and every `inset*` are **removed** before the
style is applied (otherwise `style="left: 40px"` would cancel `x={200}` and a drag could not move
the box). Your source is not changed; ADJUST shows a badge on the dead declaration so you can delete
it. Everything else in `style` (colour, border, `rotate()`, margin) still applies and still wins. A
`transform: translate(...)` is kept but reported, because it moves the pixels away from where
`Connector` and `Spotlight` think the box is.

## Block

An absolutely-positioned wrapper that pins any content at exact canvas pixels and can be dragged in
ADJUST mode.

```svelte
<script>
	import Block from '@geekpresent/core/components/Block.svelte';
</script>

<Block name="hero" x={120} y={240} width={800} height={300}>
	<h2>Pinned content</h2>
	<p>The content stretches to the box.</p>
</Block>
```

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `x`, `y` | number | `0` | top-left corner, canvas px |
| `width`, `height` | number | `200`, `120` | box size, canvas px |
| `name` | string | `''` | label in ADJUST; the anchor name `Connector` / `Group` / `Spotlight` resolve |
| `z` | number | `0` | stacking order for overlapping Blocks; `0` emits no z-index; negative puts it behind the slide's text |
| `fill` | boolean | `true` | stretch the content to the box; `false` keeps the content's natural size |
| `grid` | number | `1` | snap step in px while dragging and resizing |
| `aspect` | number, boolean, null | `null` | lock the ratio while resizing: a number (`16/9`), `true` (current shape), `false`/`null` free |
| `bounds` | `'canvas'`, `'none'` | `'canvas'` | `'canvas'` keeps it inside the canvas when dragged; `'none'` lets it go off-stage |
| `minSize` | number | `24` | smallest size a resize may reach |
| `canvasWidth`, `canvasHeight` | number | `1920`, `1080` | drag clamp; match a deck with another canvas size |

Gotchas:

- **Write geometry as literal numbers** (`x={620}`), never expressions, or SAVE cannot find the tag.
- Content fills the box by default. If something inside looks stretched, set `fill={false}` rather
  than fighting it with CSS.
- `bounds` only limits dragging; it does not clip. Off-canvas content is clipped by the slide edge
  when presenting.
- Geometry in `style` is ignored (see the style guard above).

## ImageBlock

A Block whose content is an image that fills the panel and reshapes with it.

```svelte
<script>
	import ImageBlock from '@geekpresent/core/components/ImageBlock.svelte';
	import photo from './photo.jpg';
	import sketch from './sketch.svg';
</script>

<ImageBlock name="photo" src={photo} alt="The team at the booth" x={760} y={560} width={320} height={320} />
<ImageBlock name="sketch" src={sketch} alt="Request flow" live x={100} y={100} width={900} height={500} fit="contain" />
```

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `src` | string | required | the image URL; always an `import`ed asset |
| `alt` | string | `''` | alternative text |
| `fit` | `'fill'`, `'cover'`, `'contain'` | `'fill'` | `fill` stretches to the panel; `cover` crops; `contain` letterboxes |
| `live` | boolean, `'after-transition'` | `false` | SVG only: inline the SVG in the browser so an animated GIF inside it plays |
| `aspect` | number, boolean, null | `true` | the ratio is locked by default (Alt breaks it); `false` for free resizing |
| `x`, `y`, `width`, `height`, `name`, `z`, `grid`, `bounds`, `minSize`, `canvasWidth`, `canvasHeight` | | as Block | passed through to Block |

`live` explained: through `<img>` a browser draws an SVG as a static picture, so a GIF embedded in it
(an Excalidraw export, for example) is frozen on its first frame. `live` fetches the SVG and puts it
in the page inline once the slide is in the browser. `live="after-transition"` waits until the view
transition that brought the slide in has finished, so the GIF starts on the settled slide; with no
transition it behaves like `live`. The prerendered HTML is always the plain `<img>`.

Gotchas:

- Copy emits `src={…}`; keep your imported variable when you paste.
- `fill` is not a prop here (the image always sizes to the panel); use `fit`.

## TextBlock

A Block that is a diagram box: bordered, rounded, its label centred. The usual node in a
boxes-and-arrows diagram.

```svelte
<script>
	import TextBlock from '@geekpresent/core/components/TextBlock.svelte';
</script>

<TextBlock name="api" x={200} y={400} width={280} height={140}>API</TextBlock>
<TextBlock name="db" x={900} y={400} width={280} height={140}>
	<div>DB<br /><small>orders, users</small></div>
</TextBlock>
```

Props: exactly Block's (`x`, `y`, `width`, `height`, `name`, `z`, `fill`, `grid`, `aspect`, `bounds`,
`minSize`, `canvasWidth`, `canvasHeight`). The label is the slot, so richer markup works.

Look: role tokens `--textblock-fg`, `--textblock-bg`, `--textblock-border`,
`--textblock-border-width` (default `2px`), `--textblock-radius` (default `10px`). Set them on a
container (or a `Group`'s `style`) to restyle many nodes at once instead of styling each box.

## SvgBlock

A Block whose content is an SVG drawn inline, so `currentColor` in it follows the slide's colours
(the `--svgblock-fg` token, the canvas ink by default). An `ImageBlock` of the same file cannot do
this: an `<img>` is a sealed document the page's CSS never reaches.

```svelte
<script>
	import SvgBlock from '@geekpresent/core/components/SvgBlock.svelte';
	import logo from './logo.svg?raw';
</script>

<!-- (a) a file, imported as TEXT with ?raw -->
<SvgBlock name="logo" svg={logo} title="Company logo" x={80} y={60} width={240} height={120} />

<!-- (b) shapes written in place, in the drawing's own coordinates -->
<SvgBlock name="mark" viewBox="0 0 100 100" x={1500} y={60} width={200} height={200}>
	<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="6" />
</SvgBlock>
```

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `svg` | string | `''` | SVG markup, typically `import x from './x.svg?raw'`; wins over the slot |
| `viewBox` | string | `''` | coordinate system for shapes written in the slot |
| `fit` | `'contain'`, `'cover'`, `'fill'` | `'contain'` | how the drawing's proportions meet the box |
| `title` | string | `''` | accessible name; leave empty for decoration |
| `x`, `y`, `width`, `height`, `name`, `z`, `grid`, `aspect`, `bounds`, `minSize`, `canvasWidth`, `canvasHeight` | | as Block | passed through to Block |

Gotchas:

- Without `?raw` the import is a URL, not markup, and nothing draws.
- The SVG is not sanitised; it is trusted like the slide's own source.
- Only parts drawn in `currentColor` follow the theme. Hard-coded fills stay as they are.

## Connector

An arrow auto-routed between two named Blocks. Diagrams are written in names, not coordinates, and
every arrow follows its boxes when they are dragged.

```svelte
<script>
	import TextBlock from '@geekpresent/core/components/TextBlock.svelte';
	import Connector from '@geekpresent/core/components/Connector.svelte';
</script>

<TextBlock name="api" x={200} y={400} width={280} height={140}>API</TextBlock>
<TextBlock name="db" x={900} y={400} width={280} height={140}>DB</TextBlock>

<!-- AFTER the Blocks it links -->
<Connector from="api" to="db" label="query" />
<Connector from="db" to="api" route="curve" fromSide="bottom" toSide="bottom" dash />
```

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `from`, `to` | string, `[x, y]`, `{x, y, width, height}` | required | a Block `name`, a canvas point, or a literal box |
| `route` | `'straight'`, `'ortho'`, `'curve'` | `'straight'` | straight line, right-angled elbows, or an S-bend |
| `fromSide`, `toSide` | `'top'`, `'right'`, `'bottom'`, `'left'`, `'auto'` | `'auto'` | pin an end to one edge |
| `radius` | number | `12` | corner radius of `ortho` elbows |
| `arrow` | `'none'`, `'start'`, `'end'`, `'both'` | `'end'` | which arrowheads |
| `arrowSize` | number | scales with thickness | arrowhead length, px |
| `gap` | number | `8` | clearance between box edge and arrow tip, px |
| `label` | string | none | visible text on the shaft |
| `labelAt` | number | `0.5` | label position along the shaft, 0 to 1 |
| `labelOffset` | number | `20` | label distance off the shaft, px (positive = left of travel) |
| `color` | string | `--draw-stroke` | stroke colour |
| `thickness` | number | `--draw-thickness` (4) | stroke width, px |
| `dash` | boolean, string | `false` | `true` for the default dash, or an SVG dasharray (`"12 6"`) |
| `draw`, `drawDelay` | number | none | seconds to draw itself in, and the wait before; scrubbed by `AnimationBar` |
| `rough`, `seed` | boolean or number, number | none | hand-drawn look (follows an enclosing `<Draw rough>`) |
| `ariaLabel` | string | the label, else `"<from> to <to>"` | accessible name |

Gotchas:

- **Put Connectors after the Blocks they link.** Names resolve during prerendering and Blocks
  register in document order, so a Connector placed first ships without its arrow.
- **An unknown name draws nothing**, never a broken arrow. A missing arrow means a typo in a name or
  a Connector placed too early.
- Standalone, a Connector is a canvas-wide overlay that never takes clicks. Inside a `<Draw>` it draws
  into that surface's `<svg>`, sharing its z-order with hand-placed shapes.
- Build a diagram arrow by arrow by staggering `drawDelay` across Connectors on one `AnimationBar`.
- It resolves a name inside a `Group` at the part's zoomed position. While a `glide` runs, the arrow
  jumps to the final position instead of following.

## Group

A set of Blocks that moves, zooms and pans as one: a camera on a drawing. Members (`Block`,
`ImageBlock`, `TextBlock`, `SvgBlock`, nested `Group`s) are written in the group's own coordinates.

```svelte
<script>
	import Group from '@geekpresent/core/components/Group.svelte';
	import TextBlock from '@geekpresent/core/components/TextBlock.svelte';
</script>

<Group name="scene" focus="api" zoom={3}>
	<TextBlock name="api" x={620} y={380} width={340} height={220}>API</TextBlock>
	<TextBlock name="db" x={1160} y={420} width={340} height={220}>DB</TextBlock>
</Group>
```

**Placing it.** Four ways, highest precedence first. A camera name that is not a member falls through
to the next way, so a typo shows the drawing unzoomed rather than nothing.

| props | effect |
| --- | --- |
| `view={{ x, y, width, height }}` | that rectangle of the drawing fills the canvas (centred, aspect kept) |
| `fit="name"` `pad={0.1}` | that member (or nested group) fills the canvas, with a margin as a fraction of its size |
| `focus="name"` or `focus={[x, y]}`, `zoom={3}` | that member's centre (or that point) sits at the canvas centre, zoomed |
| `x`, `y`, `scale` | plain placement: the group's origin at (x, y), everything `scale` times |

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `name` | string | `''` | ADJUST label; a named nested group can be `fit`, hidden or moved as one |
| `x`, `y`, `scale` | number | `0`, `0`, `1` | placement |
| `view` | `{x, y, width, height}` or null | `null` | camera: this rectangle fills the canvas |
| `fit` | string or null | `null` | camera: this member fills the canvas |
| `pad` | number | `0` | margin round a `fit` target, fraction of its size |
| `focus` | string, `[x, y]`, null | `null` | camera: this member's centre or this point at the canvas centre |
| `zoom` | number | `1` | zoom for `focus` |
| `hide` | string[] | `[]` | members hidden on this slide, by name (a nested group's name hides all of it) |
| `move` | `{ [name]: { x?, y?, scale? } }` | `{}` | members shown somewhere else on this slide, in drawing units; `scale` about the part's centre |
| `glide` | number | `0` | seconds to animate a change of camera, placement, `hide` or `move` within the slide |
| `morph` | string or null | `null` | names every member `view-transition-name: <morph>-<name>` for a glide between slides |
| `morphOn` | string, string[], null | `null` | only apply those names during these transition kinds |
| `canvasWidth`, `canvasHeight` | number | `1920`, `1080` | the canvas a camera fills |

How it behaves:

- **Crisp at any zoom.** A Group is not a CSS transform on a wrapper. Each member is redrawn at its
  true canvas box and only its content is scaled, so text and borders stay sharp, and `Connector` /
  `Spotlight` find a member by name at its zoomed position.
- **`hide`** is `visibility: hidden`: the part keeps its box, so it fades as it glides instead of
  popping. In ADJUST it shows faint and is still draggable.
- **`move`** is per slide. The part's source `x`/`y` stay where it is drawn; a drag in ADJUST changes
  those (every slide follows) and the slide's `move` still applies on top. A camera aims at the moved
  spot. Inner groups inherit `hide`, `move`, `morph` and `glide`; an inner group's own entry wins.
- **`glide`** uses ordinary CSS transitions. It is off while ADJUST is on and under
  `prefers-reduced-motion`. Drive it from a build with `<Steps let:revealed>`:

```svelte
<script>
	import Steps from '@geekpresent/core/components/Steps.svelte';
	import Fragment from '@geekpresent/core/components/Fragment.svelte';
	const shots = [{}, { focus: 'api', zoom: 3 }, { focus: 'db', zoom: 3 }];
</script>

<Steps let:revealed>
	{@const shot = shots[Math.min(revealed, shots.length - 1)]}
	<Group name="scene" glide={0.9} focus={shot.focus ?? null} zoom={shot.zoom ?? 1}>
		<TextBlock name="api" …>API</TextBlock>
		<TextBlock name="db" …>DB</TextBlock>
	</Group>
	<Fragment>Zoom in on the API.</Fragment>
	<Fragment>Pan to the database.</Fragment>
</Steps>
```

- **`morph`** works across slides in a View-Transition deck (`setViewTransitions(true)` from
  `@geekpresent/core/presentation` in the deck's layout). Each part glides from its box on one slide
  to its box on the next. `morphOn="camera"` limits that to pages whose `transition` in `pages.ts` is
  `camera` (a kind the deck's own view-transition CSS defines), so a plain `slide` to a neighbour
  leaves the parts alone.
- Paging **back** into a slide with a `<Steps>` build opens it spent (all fragments shown, the part
  where it was left), so a moved part does not jump back.

**The scene pattern: one drawing, many slides.** Write the drawing once as a component next to the
deck's `pages.ts`, and render it on each slide with that slide's shot:

```svelte
<!-- src/routes/talk/Scene.svelte -->
<script>
	import Group from '@geekpresent/core/components/Group.svelte';
	import TextBlock from '@geekpresent/core/components/TextBlock.svelte';
	export let focus = null, zoom = 1, hide = [], move = {};
</script>

<Group name="scene" morph="sc" {focus} {zoom} {hide} {move}>
	<TextBlock name="api" x={620} y={380} width={340} height={220}>API</TextBlock>
	<TextBlock name="db" x={1160} y={420} width={340} height={220}>DB</TextBlock>
	<slot />
</Group>

<!-- src/routes/talk/zoom-api.html/+page.svelte -->
<Scene focus="api" zoom={3} />

<!-- a later slide, after the database was moved -->
<Scene move={{ db: { x: 480 } }} />
```

- Extras in the slot ride the camera, in scene coordinates. Something that must stay put on screen
  (a caption) goes outside the scene.
- Each slide states where things are; nothing carries over. If a slide moves a part, every slide
  after it passes the same `move` so paging forward shows no jump.
- A drag on any slide that shows the scene is SAVEd into `Scene.svelte`, so every slide follows. At
  `zoom={21}` one drawing unit is about 21 screen px, so drags are coarse.

Gotchas:

- **Geometry inside a scene must stay literal numbers.** Per-slide differences go through `hide`,
  `move` or the camera; `src`, `style` and `class` may be expressions.
- `bounds="none"` on members is common in a scene: a member dragged while zoomed may legitimately
  sit off the canvas.
- A named camera (`fit`, `focus="name"`) resolves after its target mounts. In a server render (the
  handout before hydration) the placement is drawn instead; `view` and a `focus` point are exact
  everywhere.
- The Group element is `display: contents` and draws no box, so `style` only carries inherited custom
  properties (for example `--textblock-fg` for every node).
- Draw shapes inside a Group are not mapped.

## Columns and Column

A thin CSS grid for two- and three-column layouts. A media/text split is the same component with
unequal `widths`.

```svelte
<script>
	import Columns from '@geekpresent/core/components/Columns.svelte';
	import Column from '@geekpresent/core/components/Column.svelte';
	import shot from './shot.png';
</script>

<Columns widths={[3, 2]} align="center" divider>
	<Column><img src={shot} alt="The dashboard" style="width: 100%" /></Column>
	<Column>The prose beside the picture.</Column>
</Columns>
```

`Columns` props:

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `columns` | number | `2` | even track count; ignored when `widths` yields tracks |
| `widths` | number[], mixed array, string | `null` | `[3, 2]` → `3fr 2fr`; `['360px', 1]`; or a raw `grid-template-columns` string |
| `gap` | string | `''` | gutter (any CSS length); empty takes `--columns-gap` (default `2em`) |
| `align` | string | `'stretch'` | `'stretch'`, `'start'`, `'center'`, `'end'`, `'baseline'` |
| `divider` | boolean | `false` | hairline rules in the gutters (needs `<Column>` children) |
| `stack` | boolean | `false` | collapse to one column |
| `resizable` | boolean | `false` | let a viewer drag the gutters during the talk |
| `minTrack` | number | `40` | narrowest a dragged track may get, canvas px |
| `name` | string | `''` | tells several Columns on one slide apart for SAVE |

`Column` props: `span` (number, default `1`, clamped to the track count) and `align` (overrides the
group's `align` for this column). A plain element also works as a cell; `Column` adds `span` and the
divider rule.

Gotchas:

- It sits in normal flow and hugs its content. To pin and size it, wrap it in a `Block`; the grid then
  stretches with the box.
- In ADJUST mode the gutters are always draggable. A drag is a ratio editor: SAVE writes the result
  back as `widths={[…]}` (a fixed `'360px'` track comes back as a proportion). Double-click a divider
  to reset it to the authored widths.
- `divider` assumes one row; more children than tracks wrap, and the wrapped row gets a stray rule.
- The narrow-window collapse happens only in a Text page (under 720px). On a slide the canvas is
  always 1920 px wide, so use `stack` when you want stacking.

## ScrollDiv and WideDiv

A clipped viewport whose larger content is panned with the mouse wheel (by a CSS transform, not native
scrolling, so it stays correct at any deck zoom). `WideDiv` is the older horizontal-only form.

```svelte
<script>
	import ScrollDiv from '@geekpresent/core/components/ScrollDiv.svelte';
</script>

<ScrollDiv axis="x" outerWidth="520" outerHeight="320" innerWidth="1300" scrollbar>
	<!-- a 1300 px wide timeline -->
</ScrollDiv>
```

| prop | type | default | meaning |
| --- | --- | --- | --- |
| `axis` | `'x'`, `'y'`, `'both'` | `'x'` | scroll direction; with `both`, Shift+wheel pans X |
| `outerWidth`, `outerHeight` | string | required | the visible window, canvas px, **as a bare number string** |
| `innerWidth`, `innerHeight` | string | the outer size | the content box, px; set the one on the scrolling axis |
| `scrollable` | boolean | `true` | `false` freezes it |
| `startX`, `startY` | number | `0` | initial offset, px |
| `minX`, `maxX`, `minY`, `maxY` | number | -25% .. +75% of the content | pan bounds, px |
| `scrollbar` | boolean | `false` | draw a draggable scrollbar on each overflowing axis |
| `onScroll` | `(target, { x, y, progX, progY }) => void` | no-op | called on every pan; `progX`/`progY` are 0..1, ready for `AnimationBar`'s `seekFraction` |

A `slot="foreground"` overlay stays pinned (does not pan) and can read the CSS variables `--scroll-x`,
`--scroll-y`, `--prog-x`, `--prog-y` to move at a ratio of the scroll.

`WideDiv` props: `outerWidth`, `innerWidth`, `height`, `scrollable`, `startScrollPosition`,
`minScrollPosition`, `maxScrollPosition`, `onScroll(target, x)`. Prefer `ScrollDiv axis="x"` in new
slides.

Gotchas:

- **Sizes are numbers without a unit.** The component appends `px`: `outerWidth="520"` is right,
  `outerWidth="520px"` produces invalid CSS.
- While the pointer is over it, it takes the wheel on its axis, so in SCALED zoom the deck does not pan
  on that axis until the pointer leaves.
