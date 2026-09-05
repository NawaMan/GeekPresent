# Draw — Phase 4: The Hand-Drawn (Rough) Render Option

> Part 4. See [DRAW-1.md](./DRAW-1.md) (surface, Line, Rect, Ellipse), [DRAW-2.md](./DRAW-2.md) (curves, arcs, polylines, labels, draw-on) and [DRAW-3.md](./DRAW-3.md) (ADJUST-mode visual editing).

## Objective

An **option** that renders the whole Draw family by hand instead of by machine — the Excalidraw look: wobbled strokes drawn twice over, boxes whose corners overshoot, fills made of pen hatching rather than a flat wash, and hand-lettered labels. One word on the surface (`<Draw rough>`) flips a diagram; a shape overrides or opts out. Nothing else about the family changes.

## Hard Constraints (carried from Phase 1, plus two new ones)

- **Zero runtime dependencies.** No roughjs. The seeded PRNG, the perturbation, the hachure scanline are all ours, in `roughCore.ts`, pure and unit-tested — the same call the charts made in declining d3.
- **Determinism is not negotiable (new).** Shapes prerender on the server and hydrate in the browser. A single `Math.random` anywhere hands the two sides different `d` strings — a hydration mismatch, or a visible snap on load. Every wobble comes from a seeded PRNG (mulberry32) whose seed derives from the shape's own props, or from an explicit `seed`.
- **Roughening is render-only (new).** It rewrites the `d` string and nothing else. `pointAt`/`angleAt` (sprites riding a path), arrowhead tangents, label placement and every ADJUST handle keep reading the TRUE geometry — so a vehicle doesn't judder along a jittery road and handles don't drift off their stroke.
- SSR-safe, NaN-safe, TypeScript, pure geometry in a separate module — as Phase 1.

## Architectural Decisions (settled — do not revisit)

**1. Sample → perturb → re-emit, over the evaluators that already exist.** Every shape in the family already collapses to `pointAt(shape, t)`, and `drawCore` already samples any shape into a fixed-count polyline (built for arcs, whose flags don't interpolate). Roughening is that pipeline with a perturbation step, so **one function covers all seven shapes**. Nothing about the shape components' geometry had to change.

**2. Constant command structure.** Sample counts never depend on a shape's size (`samples: 8`, fixed). Two poses of the same shape therefore emit identical command sequences, which is what lets an animated rough shape still tween `d: path()` between stops.

**3. One seed per shape, never per stop.** The jitter is applied in a shape-LOCAL frame (offset along the normal at each sample) from a single seed. Re-seeding per keyframe would make a morphing shape **boil**; seeding from base props only means the wobble rides the geometry instead. This is the one genuinely subtle thing in the feature — `shapeIdentity`'s doc comment says so, and `DrawRoughSsr.ssr.test.ts` guards it.

**4. One `<path>` per pen pass, not one path with two subpaths.** A draw-on reveal normalizes with `pathLength=1`; two subpaths in one element would draw the first stroke and *then* the second. Separate elements reveal in parallel. Each pass gets its own `@keyframes …-p{k}` set when the shape is animating, and they share the one reveal track.

**5. Low sample count, bow-weighted amplitude.** Sample spacing sets the wobble's wavelength. Dense sampling gives high-frequency chatter that reads as a *noisy* line, not a drawn one; a hand draws long slow waves. The low-frequency `bowing` term carries most of the character and the per-sample jitter is the smaller term on top.

**6. A rectangle is four independent overshooting edges, not a closed loop.** The little crossed corners are the signature; a tidy closed polygon reads as a computer's rectangle however much you wobble it. Consequently `rounded` is ignored while rough (a hand-drawn box has no crisp radius), and an ortho `Connector`'s elbow loses its fillet.

**7. A solid fill is painted on the TRUE shape, under the rough outline.** The wobbly outline is a stroke — four disjoint edges for a Rect, an open-ish loop for an Ellipse — and has no fillable interior of its own.

**8. `rough` is geometry, so it cannot be a CSS custom property.** Unlike `--draw-stroke`/`--draw-thickness`, the wobble has to be computed into `d`. It inherits through the Draw **context** instead. (`--draw-font-family` *is* a custom property, because a typeface genuinely is paint.)

**9. `rough` and `seed` must round-trip through `sharedAttrs`.** ADJUST's Copy emits a whole opening tag which the author pastes over their own — anything the emitter forgets is deleted from their slide by the act of dragging. Note `rough={false}` is emitted too: it is meaningful (it opts a shape out of an inherited `<Draw rough>`), so dropping it would silently re-roughen the shape.

## Public API

```svelte
<Draw title="Sketch" rough>                        <!-- true, or an amount -->
  <Rect x={40} y={40} width={200} height={120} fill="#2b6cb0" />   <!-- hachure fill -->
  <Ellipse … fillStyle="cross-hatch" hachureGap={14} hachureAngle={30} />
  <Line from={…} to={…} arrow="end" rough={1.6} seed={7} />        <!-- sloppier, fixed draw -->
  <Line from={…} to={…} rough={false} />                           <!-- stays crisp -->
  <Connector from="app" to="db" route="ortho" arrow="end" />       <!-- follows the surface -->
</Draw>
```

- `rough?: boolean | number` — on `<Draw>` (the default for everything inside) and on every shape (overrides it). `true` = 1; `false`/`0` opts out; roughly 0.5 (barely) to 2 (drunk).
- `seed?: number` — fix the wobble. Omitted, it derives from the shape's own name + base geometry: stable across reloads and across SSR → hydration.
- Box shapes add `fillStyle` (`hachure` default / `cross-hatch` / `solid`), `hachureGap`, `hachureAngle`.
- `--draw-font-family` themes the hand-lettered label face (see below).

## The font

Half the Excalidraw look is the typeface, not the geometry. Labels on a rough shape get `class="hand"` and the family comes from `--draw-font-family`, defaulting to a stack of system handwriting faces ending in `cursive` — so *something* handwritten shows with no webfont installed.

**Excalifont is bundled** — the face Excalidraw itself uses, under the SIL Open Font License 1.1 (the licence and attribution are in `static/fonts/Excalifont-OFL.txt`, copied verbatim from the font's own name table). It is `@font-face`'d in `global.css` and sits first in the `.draw-label.hand` fallback stack, so rough labels pick it up with no configuration.

Two decisions worth keeping:

- **Only the Latin and Latin-Extended-A subsets ship** (25 KB + 12 KB). Upstream also has Cyrillic, Greek and combining-mark subsets; a deck's shape labels do not need them, and the repo should not carry them. The `unicode-range` descriptors are preserved, so an English deck fetches only the first file.
- **`font-display: swap`.** A slide must never block on a font. Labels paint immediately in the system-handwriting fallback and re-letter when Excalifont lands.

To use a different face instead, drop it in `static/fonts/`, `@font-face` it alongside, and set `--draw-font-family`. Virgil and Caveat are also OFL and suitable.

## Deliverables

1. `roughCore.ts` — seeded PRNG, perturbation, Catmull-Rom emitter, `roughShape`/`roughShapes`/`roughRect`/`roughEllipse`, `roughArrowHead`, `hachureSegments`/`hachurePath`, `resolveRoughness`. Pure; 69 unit tests.
2. `rough` on `<Draw>`, cascading through `DrawContext`; `rough`/`seed` on Line, Curve, Arc, Polyline, Path, Rect, Ellipse and Connector.
3. Hachure / cross-hatch / solid fills on the box shapes.
4. `rough`/`seed` round-tripped through `sharedAttrs`, so a dragged shape keeps its look.
5. The hand-lettered label face behind `--draw-font-family`, with Excalifont (OFL 1.1, Latin subsets) bundled as the default.
6. `ConnectorGeometry.shape` — the shaft as geometry rather than a `d` string, so a Connector can be re-rendered by hand.
7. Demo slide `slides/draw-rough.html`; reference card `references/draw/rough.html`.

## Acceptance Criteria

- A `<Draw rough>` slide prerenders its complete hand-drawn markup, and rendering it twice yields identical geometry (`DrawRoughSsr.ssr.test.ts`).
- `rough={false}` on a shape inside a rough surface emits the exact clean `d` it always did.
- An animated rough shape gets one `@keyframes …-p{k}` per pass and morphs without boiling.
- A filled rough box hatches; `fillStyle="solid"` paints a flat fill under the rough outline.
- Copy on a rough shape emits `rough` (and `seed`) so pasting the tag back keeps the look.
- Nothing in the deck changes when `rough` is absent: a clean surface still emits `<rect>`/`<ellipse>` and single-`L` lines, byte for byte.

## Non-Goals (settled)

- **No roughness on ANNOTATE's live pen.** That ink is drawn by a human hand already.
- **No per-shape fill textures beyond hachure / cross-hatch / solid** (no dots, zigzag, or image fills) until a real slide wants one.
- **No Cyrillic/Greek font subsets** — see *The font*.
- **`rounded` is not honoured while rough**, and neither is an ortho Connector's `radius`.

## Known consequence: riders follow the TRUE path

A `<Sprite path="road">` rides the shape's real geometry, not the wobbled render (decision: roughening is render-only). On a rough shape the visible stroke therefore wanders a few pixels either side of the flight path. At the default roughness the drift is within the stroke width and reads as a hand-drawn road under a steady vehicle, which is the right call — the alternative is a juddering sprite. Turn `rough` down on a shape a sprite rides if it ever shows.

## Cost to be aware of

Roughening multiplies path data: samples × passes per shape, and for an animated shape that again per stop, in generated `@keyframes` CSS. A rough animated `Path` with many stops is the expensive case. The defaults (8 samples, 2 passes) are chosen with that in mind.
