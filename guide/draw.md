# Drawing & animation

The Draw family draws vector shapes and flies HTML elements in canvas pixels, on one shared
timeline. Every animation is generated CSS `@keyframes`, so it is in the prerendered HTML and runs
without JS. One `<AnimationBar />` on the slide finds every finite animation and scrubs them all
together, backwards as well as forwards.

All Draw components come from one barrel:

```svelte
<script>
  import { Draw, Rect, Ellipse, Line, Curve, Arc, Path, Polyline, Sprite, Cursor, Canvas }
    from '@geekpresent/core/draw';
  import AnimationBar from '@geekpresent/core/components/AnimationBar.svelte';
</script>
```

Things that hold for the whole family:

- **Coordinates are canvas pixels.** `<Draw>` spans the whole canvas with
  `viewBox="0 0 1920 1080"`, so a shape's numbers are the same numbers a `Block` uses for `x`/`y`.
- **Geometry may lie off the canvas.** Points outside 0..1920 / 0..1080 are fine. ADJUST mode
  shows them; in a presentation the slide edge clips them. This is how you make fly-ins.
- **Every shape can be dragged in ADJUST mode.** In `pnpm dev` (or with `?adjust` on a build), turn
  on ADJUST and drag the handles. Then Copy the tag, or press SAVE in dev, to write the new
  geometry back to the source. A drag that you do not copy or save is lost on reload.
- **Write geometry as literal numbers** (`from={[300, 540]}`). SAVE finds a tag by its literal
  text. If the geometry is an expression (`from={curve.from}`), SAVE reports the tag as not found.
  Copy and paste the tag by hand once to make it literal again.
- **SAVE writes Draw shapes into the slide's own `+page.svelte` only.** It does not write them into
  a shared scene component, which `Block`s can do.
- **A `Group` does not map Draw shapes.** Put a Draw shape in a `Group` and the camera does not
  move it.

---

## Draw

The SVG surface that holds the shapes. Place it as a direct child of the slide, the same as a
`Block`.

```svelte
<Draw title="Request flow" description="A request goes from the client to the API.">
  <Line from={[300, 540]} to={[900, 540]} arrow="end" />
  <Rect x={860} y={480} width={400} height={120} rounded={12} />
  <circle cx="960" cy="540" r="8" fill="currentColor" />  <!-- raw SVG passes through -->
</Draw>
```

| Prop | Type / default | Notes |
|---|---|---|
| `title` | string | Accessible name (SVG `<title>`). Required unless `decorative`. |
| `description` | string | Longer text (SVG `<desc>`). |
| `decorative` | boolean, `false` | Sets `aria-hidden`. Then `title` is not required. |
| `name` | string | Title of the ADJUST toolbar, and the key that stores its position. Give two Draws on one slide different names. |
| `rough` | boolean or number | Hand-drawn look for every shape inside. See *Rough*. |
| `width` / `height` | `1920` / `1080` | The coordinate space. Set these for a portrait or custom-size deck. |
| `style` / `id` / `class` | | Standard root-element props. |

Theme tokens (CSS custom properties): `--draw-stroke` (default `currentColor`), `--draw-thickness`
(default 4), `--draw-fill` (default none), `--draw-font-size` (label size, default 32px),
`--draw-font-family` (font of hand-drawn labels).

Gotchas:

- The surface has `pointer-events: none`. A full-canvas Draw does not block clicks on content
  below it. Only the ADJUST handles take the pointer, and only in ADJUST mode.
- A shape that another component finds by name must come **later in the markup** than the shape it
  names. This applies to a `Sprite path="name"`, and to a `Connector` or `Cursor` that targets a
  `Block`. Names resolve in document order during prerender. An unknown name renders nothing; it
  never renders a broken arrow or flight.

---

## Shapes: Rect, Ellipse, Line, Curve, Arc, Path, Polyline

The shapes go inside `<Draw>`. They have two geometry models:

- **Box shapes** (`Rect`, `Ellipse`) use `x`/`y`/`width`/`height`, the same as a `Block`. In ADJUST
  mode, Draw puts a real `Block` on each box. You get move, resize, aspect lock, grid, bounds, undo
  and Copy, and Copy gives `<Rect …/>` or `<Ellipse …/>`.
- **Path shapes** (`Line`, `Curve`, `Arc`, `Path`, `Polyline`) use points (`[x, y]`). In ADJUST mode
  you get a handle on each endpoint and control point. Shift locks a drag to horizontal or vertical.

```svelte
<Draw title="Shapes">
  <Rect x={40} y={40} width={200} height={120} rounded={12} fill="#2b6cb0" />
  <Ellipse x={300} y={40} width={160} height={120} color="#e74c3c" />
  <Line from={[300, 540]} to={[900, 540]} arrow="end" thickness={6} labelText="request" />
  <Curve name="road" from={[200, 800]} to={[1200, 300]} c1={[700, 900]} c2={[900, 200]} dash />
  <Arc from={[400, 540]} to={[1500, 540]} bend={0.3} arrow="both" />
  <Polyline points={[[100, 900], [400, 700], [700, 950], [1100, 600]]} smooth />
  <Path start={[200, 780]} segments={[
    { to: [500, 780] },                                    // straight
    { to: [800, 620], c1: [650, 780] },                    // quadratic curve
    { to: [1150, 620], bend: 0.5 },                        // circular arc
    { to: [1450, 780], c1: [1300, 620], c2: [1350, 780] }  // cubic curve
  ]} arrow="end" />
</Draw>
```

### Common props (all shapes)

| Prop | Type / default | Notes |
|---|---|---|
| `color` | string | Stroke colour. Overrides `--draw-stroke`. |
| `thickness` | number | Stroke width in canvas px. Overrides `--draw-thickness` (default 4). |
| `dash` | `true` or a dasharray like `"12 6"` | `true` gives the default dash pattern. |
| `label` | string | `aria-label` only. It is not visible. |
| `name` | string | Shown in the ADJUST readout and in the copied tag. On `Line`/`Curve`/`Arc`/`Polyline` it also publishes the shape as a path that a `Sprite` can ride. |
| `grid` | number, `1` | Snap step (canvas px) while you drag in ADJUST. |
| `draw` | seconds | The shape draws itself on (see *Draw-on animation*). |
| `drawDelay` | seconds | Wait before the draw-on starts. |
| `rough` / `seed` | | Hand-drawn render (see *Rough*). |
| `style` / `id` / `class` | | Standard root-element props. |

### Per-shape geometry

| Shape | Geometry props | Extra props |
|---|---|---|
| `Rect` | `x`, `y`, `width`, `height` (required) | `rounded` (corner radius, ignored while rough), `fill`, `aspect`, `bounds` (`'canvas'` default, or `'none'`), `fillStyle`/`hachureGap`/`hachureAngle` |
| `Ellipse` | `x`, `y`, `width`, `height`: the box that holds the ellipse (not cx/cy/rx/ry) | `fill`, `aspect`, `bounds`, `fillStyle`/`hachureGap`/`hachureAngle` |
| `Line` | `from`, `to` | `arrow`, `arrowSize`, `labelText`/`labelAt`/`labelOffset`, `stops`/`animate` |
| `Curve` | `from`, `to`, `c1` (required); add `c2` for a cubic | same as Line |
| `Arc` | `from`, `to`, `bend` (default `0.25`) | same as Line |
| `Path` | `start`, `segments` (list of `{ to, from?, c1?, c2?, bend? }`) | same as Line |
| `Polyline` | `points` | `close` (join back to the first point), `smooth` (Catmull-Rom through every point) |

- `arrow`: `'none'` (default), `'start'`, `'end'`, `'both'`. The tip of the head is exactly on the
  endpoint. The head points along the curve's tangent at the end.
- `bend` (Arc, Path segment): how far the arc bulges, as a signed fraction of the chord. `0.5` is a
  semicircle, `0` is a straight line, a negative value bends to the other side, and the value is
  clamped to [-1, 1]. For an arc drawn from left to right, a positive value bulges up.
- `labelText` is a visible SVG `<text>` on the shape. `labelAt` is the position along the shape,
  0..1 (default 0.5). `labelOffset` is the distance from the stroke in px (default 20). A positive
  value puts the label to the left of the direction of travel; a negative value puts it on the
  other side.
- A `Path` segment's kind comes from its data: `bend` makes an arc, `c1` (and optionally `c2`) makes
  a Bezier curve, and neither makes a straight line. Each segment starts at the previous `to`. Give
  a segment its own `from` to lift the pen and start a separate sub-path. A Path is one `<path>`, so
  it has one draw-on reveal and one arrowhead, at the real end.

Gotchas:

- `Polyline` has no `arrow` and no `labelText`. Use `Path` with straight segments if you need them.
- `Path`'s `name` does **not** publish a path for a `Sprite` to ride. Only Line, Curve, Arc and
  Polyline publish one.
- The default arrowhead size scales with the `thickness` **prop**, not with `--draw-thickness`, because
  CSS variables cannot be read during SSR. If you set the thickness with the CSS variable on an
  arrowed shape, also set `thickness` or `arrowSize`.
- In ADJUST, a `Rect`/`Ellipse` uses `bounds="canvas"` by default, so a drag cannot move it off the
  canvas. Set `bounds="none"` on a box that must start off-stage.
- In ADJUST you can drag a Polyline's waypoints, but you cannot add or remove one there. To change
  the number of points, edit the tag.
- `fill` on a box shape is a flat fill. While `rough` is on, the fill becomes pen strokes (see below).

---

## Draw-on animation (`draw`, `drawDelay`)

Any stroked shape can draw itself in. The animation is `stroke-dashoffset` in pure CSS (easing
`ease-in-out`). Arrowheads and `labelText` fade in over the last fifth of the animation. To build a
diagram step by step on one timeline, give each shape a later `drawDelay`:

```svelte
<Draw title="Request lifecycle, drawn in sequence">
  <Line name="call"  from={[461, 755]}  to={[796, 755]}  arrow="end" labelText="request" draw={1} />
  <Line name="query" from={[1124, 757]} to={[1435, 753]} arrow="end" labelText="query" draw={1} drawDelay={1} />
  <Arc name="reply" from={[1580, 837]} to={[317, 836]} bend={0.094} arrow="end" dash
       labelText="response" labelOffset={-32} draw={1.2} drawDelay={2} />
  <Ellipse name="hot" x={717} y={662} width={492} height={185} color="#e74c3c" draw={0.8} drawDelay={3.4} />
</Draw>
<AnimationBar startExpanded />
```

The AnimationBar's timeline runs from 0 to the end of the latest delay + duration, so one bar scrubs
the whole sequence. While a shape draws on, the animation controls the dash pattern and `dash` has
no effect. In ADJUST, the selected shape's toolbar has fields to change `draw` and `drawDelay`.

## Keyframes on path shapes (`stops`, `animate`)

`Line`, `Curve`, `Arc` and `Path` accept geometry keyframes. Each stop has a `pct` (0-100) and any
geometry that changes at that moment. A stop can also have `drawn` (0..1, how much of the stroke
shows) and `ease` (the CSS timing function of the segment that starts at that stop). Geometry and
`drawn` are separate tracks on the same `animate` timeline.

```svelte
<Curve name="beam" from={[330, 812]} to={[1420, 932]} c1={[875, 760]}
  stops={[{ pct: 0, to: [1420, 932], c1: [875, 760], drawn: 0 },
          { pct: 100, to: [1420, 392], c1: [875, 470], drawn: 1 }]}
  animate={4} arrow="end" />
```

| Shape | Stop keys besides `pct` / `drawn` / `ease` |
|---|---|
| `Line` | `from`, `to` |
| `Curve` | `from`, `to`, `c1`, `c2` |
| `Arc` | `from`, `to`, `bend` |
| `Path` | `start`, `segments` (the whole list) |

Gotchas:

- You need at least 2 stops. When there are stops, `draw` is ignored.
- Make the base props (`from`/`to`/...) equal to the 0% stop. They are the static fallback, and they
  are the geometry that ADJUST edits.
- A Curve stays the same kind for the whole animation. If the base has `c2`, every pose is cubic.
- Arc and Path sample each pose into a polyline, because arc flags cannot be interpolated. For a
  smooth Path morph, keep the same number and kinds of segments in every stop.
- In ADJUST, the keyframe panel adds, removes and retimes stops. Copy the tag to keep the changes.

---

## Rough (hand-drawn mode)

A render option that makes the drawing look hand-drawn, as in Excalidraw: strokes wobble and are
doubled, box corners overshoot, and fills are hatched. Set it on `<Draw>` and every shape inside
inherits it. A shape can override it with its own `rough`.

```svelte
<Draw title="Sketch" rough>
  <Rect x={40} y={40} width={200} height={120} fill="#2b6cb0" />
  <Line from={[100, 300]} to={[400, 300]} arrow="end" rough={1.6} labelText="hand label" />
  <Ellipse x={500} y={40} width={200} height={140} fill="#e74c3c" fillStyle="cross-hatch" hachureGap={14} />
  <Line from={[100, 500]} to={[400, 500]} rough={false} />   <!-- stays crisp -->
</Draw>
```

| Prop | Notes |
|---|---|
| `rough` | `true` (same as `1`), or how rough: about `0.5` (a little) to `2` (very). `false` or `0` turns it off for one shape inside a rough Draw. |
| `seed` | Fixes the random wobble. If you omit it, the seed comes from the shape's geometry and name, so it is the same on every reload and from SSR to hydration. |
| `fillStyle` | Box shapes only: `hachure` (default when `fill` is set and rough is on), `cross-hatch`, `solid`. |
| `hachureGap` / `hachureAngle` | Box shapes only: space between fill strokes (default 10 px), and their angle (default -45 degrees). |

- **Hand labels:** while a shape is rough, its `labelText` uses a handwriting font instead of the
  deck font. The package bundles Excalifont for this, and the font list ends in `cursive`. Set
  `--draw-font-family` to use a different font.
- Rough changes only how the shape is painted. Sprites that ride the shape, arrow directions, label
  positions, ADJUST handles, Copy, draw-on and keyframes all use the true geometry.
- A `Rect`'s `rounded` has no effect while rough.

---

## Sprite

An HTML element that flies on the Draw timeline: an emoji, an icon, or any markup. It moves through
keyframe `stops`, or along a curve given as `path`. The motion is generated CSS, so it prerenders and
the AnimationBar scrubs it.

```svelte
<Draw title="Launch">
  <!-- stops: every stop has the full box (top-left x/y, w/h, optional rot) -->
  <Sprite name="rocket" animate={2.5} fontScale={0.84} stops={[
    { pct: 0,   x: 0,    y: 1025, w: 56,  h: 55,  rot: 20, ease: "ease-in" },
    { pct: 100, x: 1528, y: 432,  w: 228, h: 219, rot: -45 }
  ]}>🚀</Sprite>

  <!-- path: a literal curve; the CENTRE of the box rides it -->
  <Sprite name="tri" animate={4.5} size={60}
    path={{ kind: "cubic", from: [170, 1010], c1: [560, 770], c2: [1524, 739], to: [1089, 629] }}>▲</Sprite>

  <!-- path by name: ride a shape drawn EARLIER in the same Draw -->
  <Polyline name="route" points={[[1180, 1030], [1500, 800], [1800, 700]]} smooth dash />
  <Sprite name="truck" path="route" animate={4.5} size={64} upright fontScale={0.9}>🚚</Sprite>
</Draw>
<AnimationBar />
```

| Prop | Type / default | Notes |
|---|---|---|
| `stops` | `{ pct, x, y, w, h, rot?, ease? }[]` | Stops mode. Needs 2 or more to move; with 1 stop the element is static. Every stop needs the full box. |
| `path` | a path shape, or a shape name | Path mode. Has priority over `stops`. Kinds: `{kind:'line',from,to}`, `'quadratic'` (+`c1`), `'cubic'` (+`c1`,`c2`), `'arc'` (+`bend`), `'polyline'` (`points`, `close?`, `smooth?`). A string rides the named `Line`/`Curve`/`Arc`/`Polyline`. |
| `animate` | seconds | Length of one flight. There is no default. Without it, nothing moves. |
| `delay` | seconds, `0` | Keep the start pose this long before the flight starts. Use it to stagger objects, as `drawDelay` does for shapes. |
| `ease` | `'ease-in-out'` | Timing of the whole flight. Use `"linear"` to keep staggered objects in formation while their flights overlap. In stops mode, a stop's own `ease` overrides its segment. |
| `size` | `64` | Path mode: size of the box. A number makes a square; `[w, h]` sets both. |
| `orient` | `true` | Path mode: rotate the glyph to follow the tangent (the glyph's "up" points forward). |
| `upright` | `false` | Path mode: keep a side-view glyph (vehicle, runner) level and mirror it to face the direction of travel. Overrides `orient`. The glyph must face **left** at `rotate` 0. |
| `rotate` | `0` | Path mode: extra degrees on top of the tangent. Use it for art that does not point up (🚀 is about -45). |
| `samples` | `40` | How many keyframes the path is sampled into. Use more for long routes with many corners. |
| `fontScale` | `null` | Set `font-size` to `h * fontScale` on each frame, so a glyph grows with its box. |
| `origin` | `'50% 50%'` | Rotation pivot (`transform-origin`). |
| `lock` | `false` | Hide the sprite from ADJUST: no ghosts, no handles, cannot be selected. Use it for generated stops. |
| `paused` | `false` | Hold the flight at its current frame. |
| `group` | `false` | The children are a nested `<Draw>`. In ADJUST, double-click to edit them; Esc exits. |
| `name`, `grid`, `style`, `id`, `class` | | As for the shapes. |

- **Arc-length spacing:** in path mode, the samples are evenly spaced by distance along the curve,
  not by the curve parameter. Thus the speed is constant. A sprite and a shape with the same timing
  stay together: the shape uses `draw={N}`, the sprite rides it with `animate={N}`, and both use the
  default ease-in-out. The sprite then follows the tip of the stroke as it draws. For an exact
  pixel-perfect "rides the pen" effect, use `Canvas`.
- **Ride a named shape** when the path must be visible. Then the shape's tag is the only source of
  truth: in ADJUST you drag the shape's handles, the flight follows, and the Sprite has no editor of
  its own.
- **In ADJUST, stops mode** shows a ghost box for each stop, with move, resize and rotate handles,
  and a keyframe panel. **Path mode** shows handles on the curve itself.

Gotchas:

- The named shape must come **before** the Sprite in the markup. An unknown name renders no flight.
- On a polyline with sharp corners, the heading snaps at each corner. Add `smooth: true` (or
  `smooth` on the `Polyline`) to turn smoothly.
- A right-facing side glyph with `upright` travels backwards. Use a glyph that faces left.

---

## Cursor

A fake mouse pointer, to demonstrate a UI without a live app. It moves between named `Block`s or
literal points, and can show a click ripple when it arrives. Internally it is a locked `Sprite`, so
the AnimationBar scrubs it and the `<Cursor>` tag is the only thing to Copy.

```svelte
<Block name="menu-btn" x={1110} y={830} width={220} height={90}>Menu</Block>
<Block name="save-btn" x={1480} y={830} width={220} height={90}>Save</Block>

<Draw title="Click Menu, then Save">
  <Cursor path={[[860, 500], "menu-btn", { at: "save-btn", click: true }]} animate={1.4} />
</Draw>
```

| Prop | Type / default | Notes |
|---|---|---|
| `path` | list of `name`, `[x, y]` or `{ at, click?, size? }` | 2 or more entries: an evenly timed glide. 1 entry: a static cursor. |
| `script` | list of commands | A chain of moves, each with its own timing. Has priority over `path`. `animate` and `ease` are then ignored. |
| `animate` | `1.2` | Seconds for the whole `path` glide. |
| `delay` | `0` | Seconds to wait at the first point. |
| `ease` | `'ease-in-out'` | Timing of the whole `path` glide. |
| `size` | `40` | Glyph box in px. A waypoint's or command's `size` overrides it from that point on. |
| `rotate` | `0` | Extra degrees on the glyph. |
| `shape` | `'arrow'` | `'arrow'`, `'dot'` or `'ring'`. Slot content (an emoji, an SVG) replaces it. |
| `startOn` | string | Wait, still, until this named trigger fires (see *Triggers*). |

Script commands (each one can have `click` and `size`):

| Command | Fields | Effect |
|---|---|---|
| `{ kind: 'warpTo', at }` | | Move there instantly. |
| `{ kind: 'moveTo', at, times?, period? }` | `times` default 1, `period` default 3 s per leg | `times` one-way legs, in alternating directions. 1 arrives at `at`; 2 goes there and back. |
| `{ kind: 'around', at, rx, ry, times?, period? }` | `at` is the centre; default 1 lap of 3 s | Orbit an ellipse. |
| `{ kind: 'attention', times?, period?, scale? }` | defaults 1, 0.5 s, 1.4 | Grow and shrink the glyph where it is. |

```svelte
<Cursor startOn="fly" script={[
  { kind: 'warpTo', at: [860, 500], size: 60 },
  { kind: 'moveTo', at: 'menu-btn', times: 2, period: 0.8 },
  { kind: 'around', at: 'dial', rx: 90, ry: 90, times: 2, period: 1.8, click: true },
  { kind: 'attention', times: 2, period: 0.5, scale: 1.6, click: true }
]} />
```

Gotchas:

- If **one** name in the path is not a known Block, the **whole** flight is dropped. Put the
  target Blocks before the Draw, as the examples do.
- Block targets are read live. When you drag a target Block in ADJUST, the flight follows it.
- The first script command only sets the start pose. An `attention` as the first command pulses at
  the canvas origin, so put a `warpTo` or `moveTo` before it.
- The click ripple respects `prefers-reduced-motion`; the flight itself does not.

---

## Triggers (`fireTrigger`, `<Note data-trigger>`)

A trigger is a named pulse. `Cursor` and `Typewriter` with `startOn="name"` wait at their first
frame until the pulse arrives, then play once. A new pulse plays them again from the start.

Two ways to fire one:

```svelte
<script>
  import Note from '@geekpresent/core/components/Note.svelte';
  import { fireTrigger } from '@geekpresent/core/stores/triggers';
</script>

<!-- 1. The speaker checks this line in the presenter console. The pulse goes to the audience window. -->
<Note>
  <li data-trigger="fly">Now watch the cursor fly</li>
</Note>

<!-- 2. Directly, from the slide (no presenter window needed) -->
<button on:click={() => fireTrigger('fly')}>Fire</button>
```

Without `startOn`, the animation plays when the slide mounts, and the AnimationBar can scrub it.

---

## Canvas

A JS drawing surface (`CanvasRenderingContext2D`) on the same timeline as the CSS shapes. Canvas
has a hidden, finite CSS `@keyframes` clock. The AnimationBar finds and scrubs that clock, and
Canvas calls your `draw(ctx, frame)` on each frame with the clock's current time.

Place it in a `Block` (to set its position and size in canvas px), not inside `<Draw>`:

```svelte
<script>
  import { Canvas } from '@geekpresent/core/draw';
  import Block from '@geekpresent/core/components/Block.svelte';
  const keyframes = [
    { pct: 0, x: 100, y: 200, ease: 'ease-in' },
    { pct: 100, x: 700, y: 240 }
  ];
</script>

<Block x={200} y={300} width={800} height={480}>
  <Canvas duration={5} {keyframes} draw={(ctx, { progress, values }) => {
    ctx.beginPath();
    ctx.arc(values.x, values.y, 20 + progress * 90, 0, 2 * Math.PI);
    ctx.stroke();
  }} />
</Block>
<AnimationBar />
```

| Prop | Type / default | Notes |
|---|---|---|
| `draw` | `(ctx, frame) => void` | Required. Draw in logical px. The context is already scaled for the device pixel ratio. |
| `duration` | seconds | A finite clock that the AnimationBar can scrub. Without `duration` and without `loop`, Canvas draws once. |
| `loop` | `true` or seconds | Runs for ever (period = `duration` or 1 s, or the given number). The AnimationBar ignores it. Use it for idle backgrounds. |
| `keyframes` | `{ pct, ease?, ...numbers }[]` | Value tracks. `frame.values` contains each track, interpolated at the playhead. |
| `width` / `height` | | Logical size. If you omit them, Canvas measures its parent box. |
| `autoClear` | `true` | Clear before each draw. Set `false` to keep trails. |
| `background` | string | Fill painted before each draw. |
| `pixelRatio` | devicePixelRatio | Scale of the backing store. |
| `onclick`, `ondblclick`, `onpointerdown`, `onpointermove`, `onpointerup` | `(e) => void` | Any of these makes the canvas take pointer events. `e.x`/`e.y` are in canvas px; `e.frame` is the playhead; call `e.redraw()` after you change state. |
| `cursor` | `'default'` | CSS cursor while interactive. |

`frame` has `width`, `height`, `t` (seconds), `progress` (0..1), `pct` (0..100), `dt`, `values` and
`frame` (a counter).

Gotchas:

- To make scrubbing work, compute the drawing from `progress`, `t` or `values` only, not from a
  running total of `dt`. Then a backward scrub draws the earlier frames again exactly. Use `dt`
  only for loop-mode physics.
- The pixels exist only in the browser. The hidden clock is in the prerendered HTML, so the
  AnimationBar finds the timeline as soon as JS starts.

---

## AnimationBar

Controls for the slide's animations: play/pause, a progress rail that you can click or drag, and
restart. It controls every **finite** CSS `@keyframes` animation inside the slide (Draw shapes,
Sprites, Cursors, Canvas clocks, Typewriter, and your own CSS animations) as one group.

```svelte
<script>
  import AnimationBar from '@geekpresent/core/components/AnimationBar.svelte';
</script>
<AnimationBar />
```

| Prop | Default | Notes |
|---|---|---|
| `startExpanded` | `false` | Show the controls at once, not the ANIMATE button. |
| `startPaused` | `false` | Open the bar, paused at frame 0. The viewer presses Play. |
| `highlight` | `false` | Show the ANIMATE button in the accent colour, not as muted chrome. |
| `scope` | `'.content'` | CSS selector of the region to control. The nearest ancestor that matches is used. |
| `host` | `null` | An element to control. Has priority over `scope`. |
| `driven` | `false` | Something else controls the playhead (for example scroll). Play and restart are hidden. Call `seekFraction(f)` on a bound instance. |
| `barHosted` | auto | A plain bar (default scope, not driven, no host) moves into the deck's bottom control bar. `false` keeps it in the slide. |

Gotchas:

- It renders nothing (not even the button) on a slide without a finite animation. Thus it is safe
  in a shared template.
- It ignores CSS transitions and infinite animations, because they have no progress to scrub.
- When the controls are open, the bar stays open. There is no control to close it.
- Use one bar for each region. Do not put an AnimationBar on a slide with a `Terminal`, because
  both would control the same clock.

---

## AnimationScene

A wrapper whose contents are one timeline, with its own AnimationBar. Use it when one slide (or a
Text page) has several separate animated areas, each with its own controls.

```svelte
<script>
  import AnimationScene from '@geekpresent/core/components/AnimationScene.svelte';
</script>
<AnimationScene startPaused>
  <div class="obj1"></div>   <!-- elements with their own CSS @keyframes -->
  <div class="obj2"></div>
</AnimationScene>
```

Props: `startPaused`, `driven`, `highlight` (same meaning as on AnimationBar).

Gotchas:

- The wrapper is `position: relative` and sizes to its content. Style it where you use it.
- An outer scene also controls the animations of an inner scene. Keep scenes side by side unless
  you want that.

---

## SpriteStudio

A Sprite in a decorative Draw, plus its own AnimationBar, in one tag. Use it to put a single flying
element on any slide without writing the Draw and the bar.

```svelte
<script>
  import SpriteStudio from '@geekpresent/core/components/SpriteStudio.svelte';
</script>
<SpriteStudio name="fly" duration={2.5} fontScale={0.84} initialStops={[
  { pct: 0,   x: 0,    y: 1025, w: 56,  h: 55,  rot: 20 },
  { pct: 100, x: 1528, y: 432,  w: 228, h: 219, rot: -45 }
]}>🚀</SpriteStudio>
```

| Prop | Default | Notes |
|---|---|---|
| `initialStops` | required | The Sprite's `stops`. |
| `duration` | `2.5` | The Sprite's `animate`. |
| `name` | `''` | Name of the Sprite and of the Draw toolbar. |
| `fontScale` | `null` | As on Sprite. |
| `origin` | `'50% 50%'` | As on Sprite. |
| `highlight` | `false` | As on AnimationBar. |

It brings its own plain AnimationBar, which controls the whole slide (default scope). On a slide
that already has an AnimationBar, or with two SpriteStudios, two bars then control the same
animations. In that case, use `Draw` + `Sprite` + one `AnimationBar` by hand.

---

## Typewriter

Text that appears one character at a time, on the same scrubbable clock, with `startOn` support.
It is a content component; see `content.md`. It does not need a `<Draw>`, and an AnimationBar on
the same slide scrubs it.
