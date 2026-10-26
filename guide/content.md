# Content components

The components you put *inside* a slide's body: admonitions, quotes, numbers, timelines, panels,
build steps, speaker notes, links and small cues. All live in `@geekpresent/core/components/`.
Every author-facing component below accepts `style` (inline CSS, applied last so it wins), `id`
and `class` on its root element; they are not repeated in the tables. A `class` defined in a
slide's own scoped `<style>` will NOT reach inside a component (Svelte scopes it); use global CSS
or a `:global(...)` block, or reach for `style`.

Colours come from role tokens (`--callout-*`, `--quote-*`, `--stat-*`, `--timeline-*`, `--kbd-*`,
`--link-fg`, `--qr-*`, `--progress-*`, `--hint-*` ...). Re-theme by moving the token, not by
hand-setting a colour on one slide. Most of these hug their content in normal flow; wrap one in a
`<Block>` to pin and size it (Block stretches its content to fill the box).

## Callout

An inline admonition box (info / tip / warn / danger): coloured left rule, tinted background, icon
badge and title.

```svelte
<script>
  import Callout from '@geekpresent/core/components/Callout.svelte';
</script>

<Callout kind="warn" title="Gotcha">
  Client-side navigation blanks Monaco. Use SourceView in a View-Transition deck.
</Callout>
```

| prop | type | default | meaning |
|---|---|---|---|
| `kind` | `'info' \| 'tip' \| 'warn' \| 'danger'` | `'info'` | picks accent colour, default title and glyph |
| `title` | `string \| null` | `null` | heading; `null` uses the kind's label ("Info", "Tip", "Warning", "Danger"); `""` hides it |
| `icon` | `string \| null` | `null` | override the badge glyph |

Gotchas:
- Each kind is one accent token (`--callout-<kind>-accent`); background and border are mixed from
  it. To reskin, move the accent.

## Quote

A pull-quote with a decorative quote mark, left accent rule, and a footer with avatar, author and
role.

```svelte
<script>
  import Quote from '@geekpresent/core/components/Quote.svelte';
  import avatar from './grace.jpg';
</script>

<Quote text="Premature optimization is the root of all evil."
       author="Donald Knuth" role="The Art of Computer Programming" />

<Quote author="Grace Hopper" role="Rear Admiral, US Navy" {avatar} border>
  The most dangerous phrase is: we've always done it this way.
</Quote>
```

| prop | type | default | meaning |
|---|---|---|---|
| `text` | `string` | `''` | the quotation; empty falls through to the default slot |
| `author` | `string` | `''` | footer name; also seeds the initials avatar |
| `role` | `string` | `''` | dim line under the author (title or source) |
| `avatar` | `string` | `''` | image URL (import it); empty gives an initials disc from `author` |
| `align` | `'left' \| 'center'` | `'left'` | `center` also drops the left rule |
| `mark` | `boolean` | `true` | big decorative opening-quote glyph |
| `rule` | `boolean` | `true` | left accent rule (ignored when centred) |
| `border` | `boolean` | `false` | draw a border: a padded "card" |
| `radius` | `string` | `'14px'` | corner radius of border/background |
| `background` | `string` | `''` | any CSS background; non-empty also makes it a card |

Gotchas:
- Import the avatar (`import avatar from './x.jpg'`), never hard-code `/x.jpg`; a hard-coded path
  breaks under a base-path deploy.

## Stat / StatGroup

`Stat` is one big-number KPI tile with a label and an optional trend chip. `StatGroup` lays several
in a wrapping row (or fixed grid) with hairline dividers, and shares its alignment with them.

```svelte
<script>
  import StatGroup from '@geekpresent/core/components/StatGroup.svelte';
  import Stat from '@geekpresent/core/components/Stat.svelte';
</script>

<StatGroup>
  <Stat value="99.9%" label="Uptime"  trend="up"   delta="+0.4%" />
  <Stat value="42ms"  label="p95"     trend="down" delta="-12%" tone="positive" />
  <Stat value="1.2M"  label="Req/day" accent />
</StatGroup>
```

`Stat`:

| prop | type | default | meaning |
|---|---|---|---|
| `value` | `string \| number` | `''` | the hero figure |
| `label` | `string` | `''` | what it measures, under the figure |
| `sub` | `string` | `''` | dim secondary caption under the label |
| `trend` | `'up' \| 'down' \| 'flat' \| null` | `null` | shows an arrow chip (▲ ▼ →) |
| `delta` | `string` | `''` | chip text; omit for arrow only |
| `tone` | `'auto' \| 'positive' \| 'negative' \| 'neutral'` | `'auto'` | chip colour; `auto` maps up/down/flat to positive/negative/neutral |
| `accent` | `boolean` | `false` | tint the figure with the accent instead of ink |
| `align` | `'center' \| 'start' \| null` | `null` | `null` inherits the StatGroup, else `center` |

`StatGroup`:

| prop | type | default | meaning |
|---|---|---|---|
| `align` | `'center' \| 'start'` | `'center'` | inherited by Stats that don't set their own |
| `dividers` | `boolean` | `true` | hairline rules between tiles (wrapping row only; skipped with `columns`) |
| `gap` | `string` | `'2.4em'` | space between tiles |
| `columns` | `number \| null` | `null` | fix the column count (grid); omit for a wrapping row |
| `card` | `boolean` | `false` | raised panel (background, border, padding) behind the row |

Gotchas:
- `tone="auto"` treats "down" as bad. For a metric where down is good (latency, cost), set
  `tone="positive"` explicitly.

## Timeline / TimelineItem

A narrative event spine, vertical or horizontal: each `TimelineItem` is a dot on the line with a
time label, title and body. Orientation and side are set once on the `Timeline`.

```svelte
<script>
  import Timeline from '@geekpresent/core/components/Timeline.svelte';
  import TimelineItem from '@geekpresent/core/components/TimelineItem.svelte';
</script>

<Timeline>
  <TimelineItem time="2019" title="Founded">Two people, one garage.</TimelineItem>
  <TimelineItem time="2021" title="Series A" icon="★" color="#f0a33e" />
  <TimelineItem time="Today" title="You are here" active text="Shipping daily." />
</Timeline>

<Timeline orientation="horizontal" side="alternate">
  <TimelineItem time="v1.0" title="Launch" />
  <TimelineItem time="v2.0" title="Plugins" />
</Timeline>
```

`Timeline`:

| prop | type | default | meaning |
|---|---|---|---|
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | spine direction |
| `side` | `'right' \| 'left' \| 'above' \| 'below' \| 'alternate'` | `'right'` | where content sits; vertical uses right/left/alternate, horizontal uses below/above/alternate (left aliases above, right aliases below; unknown falls back to the orientation's default) |
| `gap` | `string` | `'1.6em'` | space between events |
| `band` | `string` | `'9em'` | horizontal only: height of the event band; raise it for taller events |
| `itemWidth` | `string` | `'12em'` | horizontal only: fixed width of each event |

`TimelineItem`:

| prop | type | default | meaning |
|---|---|---|---|
| `time` | `string` | `''` | date / phase label (accent colour) |
| `title` | `string` | `''` | event heading |
| `text` | `string` | `''` | body; empty falls through to the default slot |
| `icon` | `string` | `''` | glyph inside the marker; enlarges the dot |
| `color` | `string` | `''` | retint just this event's dot and time label |
| `active` | `boolean` | `false` | halo ring ("we are here") |

Gotchas:
- A long horizontal timeline is as wide as `events x itemWidth`. Put it in a
  `<ScrollDiv axis="x">` to pan it rather than letting it overflow the canvas.
- Omitted parts collapse; an item with no title and no body leaves no empty box.

## Tabs / Tab

Switch between panels inside one slide ("the same thing in N languages", before/after). Nest `Tab`s
in document order; each carries its own strip label.

```svelte
<script>
  import Tabs from '@geekpresent/core/components/Tabs.svelte';
  import Tab from '@geekpresent/core/components/Tab.svelte';
  import QuickCode from '@geekpresent/core/components/QuickCode.svelte';
</script>

<Tabs align="stretch">
  <Tab label="JavaScript"><QuickCode lang="js" code={jsSrc} /></Tab>
  <Tab label="Python"><QuickCode lang="python" code={pySrc} /></Tab>
  <Tab label="Go" disabled>Coming soon</Tab>
</Tabs>
```

`Tabs`:

| prop | type | default | meaning |
|---|---|---|---|
| `start` | `number` | `0` | initially selected tab (clamped; nudged off a disabled tab) |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | `'start'` | strip alignment; `stretch` shares the width evenly |
| `transition` | `'fade' \| 'none'` | `'fade'` | crossfade or instant cut |
| `label` | `string` | `'Tabs'` | aria-label for the tablist |

Imperative API via `bind:this`: `goTo(i)`, `next()`, `prev()`.

`Tab`:

| prop | type | default | meaning |
|---|---|---|---|
| `label` | `string` | `''` | strip button text; empty becomes "Tab N" |
| `icon` | `string` | `''` | glyph before the label |
| `disabled` | `boolean` | `false` | greyed, skipped by the keyboard, panel never shows |

Gotchas:
- Keyboard: the strip claims ←/→/↑/↓/Home/End only while a tab button has focus. Otherwise the
  arrow keys page the deck as usual. Tabs claims no deck-global key, so it coexists with a
  `Steps` build on the same slide.
- Panels are grid-stacked: the container is as tall as the tallest panel, so switching never
  moves the strip.
- In a Text artifact the strip is dropped and every panel is shown in flow under its label.

## Carousel / CarouselItem

One-at-a-time stepper inside a fixed stage: images, cards, any markup. Arrows and dots by default.

```svelte
<script>
  import Carousel from '@geekpresent/core/components/Carousel.svelte';
  import CarouselItem from '@geekpresent/core/components/CarouselItem.svelte';
  import a from './a.png';
  let car;
</script>

<Carousel bind:this={car} width="1200px" height="600px" transition="slide">
  <CarouselItem><img src={a} alt="Before" /></CarouselItem>
  <CarouselItem><h2>Any markup</h2></CarouselItem>
</Carousel>
```

`Carousel` (`CarouselItem` has only style/id/class):

| prop | type | default | meaning |
|---|---|---|---|
| `width` / `height` | CSS length string | `'1200px'` / `'600px'` | stage size |
| `start` | `number` | `0` | initial item |
| `loop` | `boolean` | `true` | wrap past the ends; `false` clamps and disables arrows at the ends |
| `transition` | `'fade' \| 'slide' \| 'none'` | `'fade'` | item change effect |
| `duration` | `number` (s) | `0.4` | transition length |
| `arrows` / `dots` | `boolean` | `true` | show prev/next arrows / dot indicators |
| `advanceOnClick` | `boolean` | `false` | click (or Enter/Space on the focused stage) steps forward |
| `wheel` | `boolean` | `false` | step on mouse wheel / trackpad scroll over it |
| `keys` | `'global' \| 'focus' \| 'off'` | `'global'` | `,` / `<` back and `.` / `>` forward; `focus` only while focused |
| `label` | `string` | `'Carousel'` | aria-label for the region |

Imperative API via `bind:this`: `next()`, `prev()`, `goTo(i)`, `reset()`.

Gotchas:
- Keys are `,` `.` `<` `>`, not the arrows (the arrows page the deck). With more than one carousel
  on a slide, set `keys="focus"` on each, or one global listener drives them all.
- `CarouselItem` must be inside a `Carousel`; standalone it throws (no context).
- `width`/`height` are CSS strings (`"1200px"`), not numbers.

## Steps / Fragment

Build steps on one slide. Content outside a `Fragment` shows at once; each `Fragment` starts hidden
(keeping its layout space) and appears on the next Space. Shift+Space peels the last one back.

```svelte
<script>
  import Steps from '@geekpresent/core/components/Steps.svelte';
  import Fragment from '@geekpresent/core/components/Fragment.svelte';
</script>

<Steps>
  <p>Shown right away.</p>
  <ul>
    <Fragment tag="li">Appears on the first Space.</Fragment>
    <Fragment tag="li" transition="fly">Then this one.</Fragment>
  </ul>
</Steps>
```

`let:revealed` hands the slide the current step count, for anything a Fragment cannot express
(a Group camera, a moved part, a Toast):

```svelte
<Steps let:revealed>
  <MyScene focus={revealed >= 1 ? 'api' : null} zoom={revealed >= 1 ? 3 : 1} />
  <Fragment>Zoom in on the API</Fragment>
</Steps>
```

`Steps`:

| prop | type | default | meaning |
|---|---|---|---|
| `transition` | `'fade' \| 'fly' \| 'slide' \| 'scale' \| 'none'` | `'fade'` | default for every Fragment |
| `duration` | `number` (s) | `0.35` | default reveal length |
| `start` | `number` | `0` | Fragments showing on arrival |
| `keys` | `'global' \| 'off'` | `'global'` | Space/Shift+Space stepping; `off` to drive it with `bind:this` |
| `backTo` | `'end' \| 'start'` | `'end'` | state when reached by paging BACK (see below) |
| `continueKey` | `boolean` | `true` | also advance on the presenter console's CONTINUE pulse |

Imperative API via `bind:this`: `next()`, `prev()`, `goTo(n)`, `revealAll()`, `reset()`.

`Fragment`:

| prop | type | default | meaning |
|---|---|---|---|
| `tag` | `string` | `'div'` | element to render; match the markup (`li`, `p`, `span` ...) |
| `transition` | same as Steps, or `null` | `null` | `null` inherits the Steps default |
| `duration` | `number \| null` | `null` | `null` inherits the Steps default |

How Space behaves:
- While steps remain, Space reveals the next Fragment. Once the build is spent, Space falls
  through and pages to the next slide; Shift+Space likewise pages back once nothing is revealed.
  So Space alone walks the whole deck, builds included.
- →/← never step a build; they always page.
- The nav bar's CONTINUE button drives the keyboard-owning build and greys out when it is spent.
- Paging BACK into a slide (PREV, ←, Shift+Space off the next slide) opens its build spent, every
  Fragment showing, so the slide looks as it was left. FIRST, NEXT, the TOC, a reload and the
  browser Back button start at `start`. `backTo="start"` opts a build out of this.

Gotchas:
- Use ONE `Steps` with `keys="global"` per slide. Any extra instance needs `keys="off"` and a
  `bind:this` driver.
- A hidden Fragment uses `visibility`, not `display`, so nothing reflows; it still takes space.
- In a Text artifact every Fragment shows and stepping is off. A Fragment outside any Steps just
  renders visible.
- Steps itself is `display: contents`; it adds no box, so it does not affect layout.

## Typewriter

Ordinary slide text that types itself out one character at a time, in the deck's own font and
wrapping like prose. (`Terminal` is the console version.)

```svelte
<script>
  import Typewriter from '@geekpresent/core/components/Typewriter.svelte';
</script>

<Typewriter tag="h1" text="One character at a time." />
<Typewriter text={`Two lines,\nboth typed.`} charMs={40} startMs={1500} punctuationMs={400} />
<Typewriter text="Now it types." startOn="go" />
```

| prop | type | default | meaning |
|---|---|---|---|
| `text` | `string` | `''` | text to type; `\n` breaks the line; empty renders the slot untyped |
| `tag` | `string` | `'div'` | element to render (`h1`, `p`, `span` ...) |
| `charMs` | `number` | `55` | ms per character |
| `startMs` | `number` | `300` | ms before the first character; stagger several with it |
| `punctuationMs` | `number` | `0` | extra pause after `.` `,` `?` and similar |
| `caret` | `boolean` | `true` | show the caret |
| `typing` | `boolean` | `true` | `false` renders the finished text |
| `startOn` | `string` | `''` | hold at frame 0 until this named trigger pulses; `''` types on mount |

Gotchas:
- The typing is CSS animation, not a timer. An `<AnimationBar />` on the slide scrubs it
  (backwards too), and several Typewriters can share one bar. Do NOT pair a bar with a `Terminal`;
  pairing it with Typewriter is fine.
- The finished sentence is what prerenders, prints, and shows under `prefers-reduced-motion` or in
  a Text artifact. The line holds its full space from the first frame.
- A newline needs a real `\n` character: write `text={`a\nb`}` (a JS expression). In a plain
  attribute `text="a\nb"` the backslash-n is two literal characters.
- `startOn` is fired by a `<Note>` line with `data-trigger="name"` (see Note) or by
  `fireTrigger('name')` from `@geekpresent/core/stores/triggers`. A fresh pulse replays it.

## Box

An expandable modal overlay: a zero-size anchor that grows into a bordered panel over a dimmed
slide, for a detail image, long code or a digression. Closes on CLOSE, Escape, or a click outside.

```svelte
<script>
  import Box from '@geekpresent/core/components/Box.svelte';
  import diagram from './diagram.png';
  let open = false;
</script>

<button on:click={() => (open = true)}>Detail</button>
<Box bind:expanded={open} width={900} height={500}>
  <img src={diagram} alt="Full diagram" style="width: 100%;" />
</Box>
```

| prop | type | default | meaning |
|---|---|---|---|
| `width` / `height` | `number` (canvas px) | required | size of the opened panel |
| `expanded` | `boolean` | `false` | open state; bind it |
| `showClose` | `boolean` | `true` | show the CLOSE button |
| `scrollable` | `boolean` | `false` | let the panel scroll vertically |
| `top` / `left` / `bottom` / `right` | CSS length `\| null` | `null` | anchor position; defaults to the canvas centre (50% / 50%) |
| `linkUrl` | `string \| null` | `null` | adds a top-left button linking out (new tab) |
| `linkText` | `string` | `'LINK'` | that button's label |
| `shadowOpacity` | `number` | `0.8` | darkness of the backdrop dim |
| `onClick` | `() => void \| null` | `null` | called on a click inside the panel |

Gotchas:
- Box is `position: absolute` and collapsed to 0x0 until `expanded`. It is not an inline
  container; nothing in its slot is visible while closed.
- Not to be confused with `Callout` (inline admonition) or `Block` (positioned wrapper).

## Hint

A faint cue pinned to the bottom-centre of the slide ("press Space", "scan the code"). It has its
own translucent backdrop, rests semi-transparent, sharpens on hover, can be dragged by a grip and
dismissed with an (X). It is a viewer cue, not a speaker note.

```svelte
<script>
  import Hint from '@geekpresent/core/components/Hint.svelte';
</script>

<Hint text="Press Space to reveal the next step" />
```

| prop | type | default | meaning |
|---|---|---|---|
| `text` | `string` | `'-hint-'` | the cue |
| `isVisible` | `boolean` | `true` | `false` hides it entirely |
| `boxed` | `boolean` | `true` | translucent backdrop and rule; `false` is bare text |
| `movable` | `boolean` | `true` | show the drag grip (double-click the grip resets it) |
| `dim` | `number \| null` | `null` | resting opacity 0-1 (unset is 0.4); hover lifts to 1 |
| `dismissible` | `boolean` | `true` | show the (X) |

Event: `on:close` when dismissed via (X).

Gotchas:
- Hint has NO slot. `<Hint>Press Space</Hint>` renders the placeholder `-hint-`. Always pass `text`.
- A dragged position carries over to the next slide's Hint until the viewer dismisses one.

## Note

Speaker notes. Put it anywhere in a slide's `+page.svelte`. It shows in the presenter console
(`?present`) as a checklist, below the slide in SCALED display mode (when no console is live), in a
handout with `?notes`, and as kiosk captions when the kiosk uses notes. It is hidden otherwise.

```svelte
<script>
  import Note from '@geekpresent/core/components/Note.svelte';
</script>

<Note>
  <p>Remind them why static hosting rules out server routes.</p>
  <li data-highlight="db">Now the query hits the database.</li>
  <li data-trigger="fly">Now watch the cursor fly.</li>
</Note>
```

No props beyond style/id/class. Behaviour comes from the children:

- Each DIRECT child element is one "line". In the presenter console each line gets a checkbox
  (click, or double-click the line; Shift checks everything above too). Check state persists per
  slide.
- `data-trigger="name"` on a line fires the named trigger when the speaker checks it (plain
  check only, not Shift or uncheck). Elements with `startOn="name"` (`Typewriter`, `Cursor`) start
  then. It is relayed to the audience window.
- `data-highlight="name"` on a line spotlights the `Block` with that `name` while the speaker's
  pointer hovers the line, and clears on leave.
- The kiosk reads the same direct-child lines one at a time.

Gotchas:
- Wrap each line in its own element (`<p>`, `<li>`). Bare text, or one `<ul>` around everything, is
  a single line.
- `.note` is a RESERVED global class name. The global note stylesheet does
  `.note *:nth-child(even) { background-color: #e8e8e8 }`, so `<p class="note">` on ordinary slide
  copy paints light-grey boxes behind every second child. Scoped styles do not protect you. Use
  another name (`.cue`, `.caption`).

## Label

Inline emphasis for a term in running text: bold, accent colour (`--label-fg`), help cursor.

```svelte
<script>
  import Label from '@geekpresent/core/components/Label.svelte';
</script>

<p>Open the <Label title="Bottom bar, left">Table of Contents</Label> to jump.</p>
```

| prop | type | default | meaning |
|---|---|---|---|
| `isHovered` | `boolean` | `false` | output only: bind it (`bind:isHovered`) to react to hover |

Events `on:mouseover` / `on:mouseout` are forwarded. Any other attribute (`title`, `aria-*`) is
spread onto the `<span>`.

## Kbd

Keyboard shortcuts drawn as keycaps, sized in `em` so they track the surrounding text.

```svelte
<script>
  import Kbd from '@geekpresent/core/components/Kbd.svelte';
</script>

Press <Kbd keys="Mod+Shift+P" /> then <Kbd keys="Ctrl+K Ctrl+S" />, or <Kbd>Esc</Kbd>.
<Kbd keys="Mod+K" platform="mac" />
```

| prop | type | default | meaning |
|---|---|---|---|
| `keys` | `string` | `''` | spec: whitespace separates chords, `+` separates keys (`Ctrl++` is Ctrl and Plus); empty makes the slot a single cap |
| `platform` | `'pc' \| 'mac' \| 'auto'` | `'pc'` | what `Mod` means (Ctrl vs Cmd) and which legends show |
| `symbols` | `boolean` | `true` | Mac glyphs (⇧⌘P) instead of words; only matters on `mac` |
| `join` | `string \| null` | `null` | separator inside a chord; `null` is `+`, or nothing under Mac symbols |
| `then` | `string` | `'then'` | word between chords of a sequence; `''` leaves a gap |

Gotchas:
- Write `Mod`, not `Ctrl`, for the portable modifier.
- `platform="auto"` reads the viewer's machine and is client-only; the prerender and Text artifacts
  show `pc`. A deck about a Mac app should say `platform="mac"` outright.

## Link

The anchor every slide and Text should use instead of a bare `<a>`. Every link wears ONE colour
(`--link-fg`) and one thin dashed underline; a trailing glyph says what kind it is:

- no glyph: an ordinary move inside the site
- ↩: a detour you come back from (that is `AppendixLink`, a separate component)
- ↗: this leaves the site

```svelte
<script>
  import Link from '@geekpresent/core/components/Link.svelte';
</script>

<Link href="./architecture.html">See the architecture</Link>
<Link href="https://svelte.dev">svelte.dev</Link>
<Link href="mailto:me@example.com">email me</Link>
```

| prop | type | default | meaning |
|---|---|---|---|
| `href` | `string` | `''` | destination, as an `<a>` takes it |
| `kind` | `'auto' \| 'internal' \| 'external'` | `'auto'` | `auto` classifies from the href; override when the URL lies |
| `newTab` | `boolean \| null` | `null` | force the window; `null` follows the kind. `true` also earns the ↗ |
| `glyph` | `boolean` | `true` | show the trailing kind glyph |
| `icon` | `string \| null` | `null` | replace the glyph; `''` hides it |
| `origin` | `string \| null` | `null` | treat absolute http(s) URLs on this origin as internal |

`on:click` is forwarded.

Gotchas:
- An absolute URL, `mailto:` or `tel:` classifies itself as external: ↗, `target="_blank"` and
  `rel="noopener noreferrer"` are added for you. Don't add them by hand.
- Never hand-set a link colour on a slide. With one shared colour, the glyph is the ONLY visible
  difference between internal and external; `glyph={false}` removes that distinction.
- `href` is not base-path aware. Relative hrefs (`./x.html`, `../`) are fine; a root-relative
  `/x` needs `{base}` from `$app/paths` in front under a subpath deploy.

## Toast

A transient banner over the live slide: fades in, holds `duration` ms, fades out. With
`highlight` it also dims the slide around a named `Block` at the same moment.

```svelte
<script>
  import Toast from '@geekpresent/core/components/Toast.svelte';
  import Block from '@geekpresent/core/components/Block.svelte';
  let deployed = false;
</script>

<Block name="deploy" x={760} y={420} width={400} height={240}>Deploy</Block>
<button on:click={() => (deployed = true)}>Ship it</button>
<Toast open={deployed} highlight="deploy" text="Deployed!"
       onclose={() => (deployed = false)} />
```

| prop | type | default | meaning |
|---|---|---|---|
| `text` | `string` | `''` | message; empty uses the default slot |
| `open` | `boolean` | `false` | show it now; `false` renders nothing |
| `highlight` | `string` | `''` | name of a `Block` to spotlight; empty is a plain banner |
| `duration` | `number` (ms) | `2600` | hold before auto-dismiss; `0` or negative is sticky |
| `placement` | `'top' \| 'center' \| 'bottom'` | `'bottom'` | where the banner sits |
| `dim` | `number` | `0.4` | darkness of the surround when highlighting (0-1) |
| `pad` / `radius` | `number` (canvas px) | `14` / `16` | punch-out padding and corner radius |
| `icon` | `string` | `''` | leading glyph |
| `onclose` | `() => void` | none | called when it auto-dismisses (not when `open` goes false) |
| `canvasWidth` / `canvasHeight` | `number` | `1920` / `1080` | match a non-standard deck canvas |

Gotchas:
- Toast is a Svelte 5 runes component: the dismiss hook is the `onclose` callback prop, not
  `on:close`.
- Reset your flag in `onclose`, or the next `open = true` is no change and nothing fires.
- `highlight` resolves by `Block` name, like `Connector`; an unknown name gives the banner only.
- Nothing renders at prerender; it lights up on the client only.

## QRCode

A scannable QR code encoded on the slide (no image file, no network), drawn as SVG so it stays sharp
at any scale. Prefer it over a committed `-QR.png`.

```svelte
<script>
  import QRCode from '@geekpresent/core/components/QRCode.svelte';
  import Block from '@geekpresent/core/components/Block.svelte';
</script>

<QRCode value="https://example.com/slides" label="Slides" />
<Block x={1400} y={640} width={340} height={380}><QRCode value={url} size="100%" /></Block>
```

| prop | type | default | meaning |
|---|---|---|---|
| `value` | `string` | `''` | what to encode; empty (or too long) renders nothing |
| `ecc` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | error correction; Q/H only if something overlaps it |
| `size` | `number \| string` | `220` | side in canvas px, or a CSS length; aspect is never distorted |
| `quiet` | `number` | `4` | light margin in modules (4 is the spec minimum; do not trim) |
| `minVersion` | `number` | `1` | floor the version (1-40) to keep module size steady across slides |
| `mask` | `number \| null` | `null` | pin the data mask (0-7) |
| `label` | `string` | `''` | caption under the code; the default slot overrides it |
| `href` | `string \| null` | `null` | click target; `null` uses `value` if it is http(s)/mailto/tel |
| `link` | `boolean` | `true` | `false` makes it not clickable |
| `alt` | `string` | `''` | accessible name; falls back to label, then value |
| `plate` | `boolean` | `true` | white backing under the code |

Gotchas:
- It is always dark on light (`--qr-*`, black on white by default), whatever the deck's theme,
  because scanners need that. `plate={false}` hands contrast back to you.

## ProgressBar

A thin "how far through the deck" bar fixed to the bottom of the window. It reads `getProgress()`,
so it needs no props. It counts visible slides only and renders nothing on a hidden appendix.

```svelte
<!-- the deck's +layout.svelte -->
<script>
  import SlideDeck from '@geekpresent/core/components/SlideDeck.svelte';
  import ProgressBar from '@geekpresent/core/components/ProgressBar.svelte';
  import { setPages } from '@geekpresent/core/presentation';
  import { pages } from './pages';
  setPages(pages);
</script>

<SlideDeck {pages}><slot /></SlideDeck>
<ProgressBar class="gp-chrome no-print" />
```

No props beyond style/id/class. Reskin with `--progress-fill`, `--progress-track` and
`--progress-height`.

Gotchas:
- Put it in the deck's `+layout.svelte`, after `setPages(pages)`. `SlideDeck` does not call
  `setPages` for you; without it the bar renders nothing.
- Add `class="gp-chrome no-print"` so CAPTURE and printouts leave it out.

## Highlight

Points at something with a coloured glow (following the content's real shape) and an arrow that
comes from one side, with a gentle pulse.

```svelte
<script>
  import Highlight from '@geekpresent/core/components/Highlight.svelte';
  import diagram from './diagram.png';
  let step = 0;
</script>

<!-- WRAP mode: the glow follows the wrapped content -->
<Highlight from="bottom-left" color="gold">
  <img src={diagram} alt="Architecture" />
</Highlight>

<!-- REMOTE mode: point at an existing element by selector, no restructuring -->
<span id="hero">the hot path</span>
<Highlight target="#hero" from="left" show={step >= 1} />
```

| prop | type | default | meaning |
|---|---|---|---|
| `from` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom'` | side the arrow comes from |
| `target` | `string \| Element \| null` | `null` | REMOTE mode: CSS selector or element; the slot is then ignored |
| `color` | `string` | `'red'` | glow and arrow colour |
| `glow` | `number` (canvas px) | `30` | glow blur radius |
| `opacity` | `number` | `0.6` | glow alpha |
| `gap` | `number` (canvas px) | `16` | distance from arrow tip to target |
| `arrowSize` | `number` (canvas px) | `150` | arrow box size |
| `arrow` | `boolean` | `true` | show the arrow (glow alone otherwise) |
| `pulse` | `boolean` | `true` | breathing glow / bobbing arrow; honours reduced motion |
| `duration` | `number` (s) | `1.8` | one pulse cycle |
| `show` | `boolean` | `true` | master toggle; `false` keeps the content but drops the cue (bindable) |
| `onClick` | `(event) => void \| null` | `null` | makes the arrow clickable |
| `label` | `string` | `'Highlight'` | accessible label for a clickable arrow |

Imperative API via `bind:this`: `toggle()`, `reveal()`, `hide()`.

Gotchas:
- `target` is a CSS selector (`"#hero"`), NOT a `Block` name. To dim the canvas around a named
  `Block`, use a `Note` line with `data-highlight="name"` (speaker-driven) or `Toast` with
  `highlight="name"`.
- REMOTE mode measures in the browser, so the arrow appears only after hydration.
