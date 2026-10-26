# Code & terminal

Components for putting code on a slide: short highlighted snippets, full Monaco editors, before/after
diffs, a scripted fake console, and a "show this slide's source" panel. Two engines sit underneath:
**Shiki** (plain ESM, bundled, works offline, survives client-side navigation) and **Monaco** (loaded
from a CDN at runtime, full editor with folding and minimap, but fragile).

| You want to show…                                   | Use                         | Engine |
| --------------------------------------------------- | --------------------------- | ------ |
| A short hand-written snippet in the slide flow      | `QuickCode`                 | Shiki  |
| A fixed-width snippet in a bordered card (CSS demos) | `CssSnippet`                | Shiki  |
| A change: added / removed lines                     | `CodeDiff`                  | Shiki  |
| A typed command and its output                      | `Terminal`                  | CSS    |
| A long file, scrollable, with folding and minimap   | `Code` (inline) / `CodeBox` (pop-up panel) | Monaco |
| This slide's own source, via the ☰ menu             | `ViewSource` / `SourceView` | Monaco / Shiki |

**The rule that decides most choices.** Monaco-based components (`Code`, `CodeBox`, `ViewSource`)
load the editor from `cdnjs.cloudflare.com` when the slide mounts, so they **need internet**, and
Monaco's AMD loader does not re-initialise across a client-side `goto`, so they **render blank** on
any slide reached by client-side navigation. That means a View-Transition deck
(`setViewTransitions(true)`) and an `AppendixLink`/`AppendixPage` with `transition`. On those slides
use the Shiki ones: `QuickCode`, `CssSnippet`, `CodeDiff`, `SourceView`. A deck that pages with full
page loads (the default) can use either.

Shiki languages available: `css` (always loaded), plus `svelte`, `javascript`, `python`, `go`,
`bash` (loaded on demand). Any other `lang` value silently falls back to `css` highlighting.

All Shiki components render the plain text immediately, then swap in the coloured version once the
highlighter resolves; if highlighting fails, the plain text stays. They are SSR-safe.

## QuickCode

Small dark monospace box for short snippets. The default choice for code on a slide.

```svelte
<script>
  import QuickCode from '@geekpresent/core/components/QuickCode.svelte';
</script>

<QuickCode lang="javascript" code={`const total = items.reduce((a, b) => a + b, 0);`} />

<QuickCode lang="svelte" style="margin-top: 0.5em;" code={`<Note>
  <p>Remember to explain X.</p>
</Note>`} />
```

| Prop    | Default    | Notes |
| ------- | ---------- | ----- |
| `code`  | —          | The snippet as a string. Highlighted when set. |
| `lang`  | `'svelte'` | Shiki language id (see list above). |
| `style`, `id`, `class` | | Standard root-element props; `style` is appended last. |

Colours: `--quickcode-bg` (default `#111111`), `--quickcode-fg`.

Gotchas:
- Pass code through the `code` prop as a template literal. Writing code in the slot means Svelte
  parses it: `{` starts an expression and `<` starts a tag. The slot path is legacy (pre-escaped
  HTML with `<br/>` / `&nbsp;`) and is not highlighted.
- Inside the template literal, escape backticks and `${` (`\``, `\${`). A literal `</script>` inside
  the string must be written `<\/script>` or it closes the slide's script block.
- Font size is `0.85em` of the surrounding text, so it scales with where you put it.

## CssSnippet

A fixed-width, bordered, shadowed code card. Same Shiki path as `QuickCode`, styled as a panel to sit
beside a live demo. Defaults to CSS.

```svelte
<script>
  import CssSnippet from '@geekpresent/core/components/CssSnippet.svelte';
</script>

<CssSnippet code={`@view-transition { navigation: auto; }

::view-transition-old(root) { animation: fade-out 0.3s; }`} />
```

| Prop    | Default   | Notes |
| ------- | --------- | ----- |
| `code`  | `''`      | Source string. |
| `lang`  | `'css'`   | Shiki language id. |
| `width` | `'820px'` | CSS width of the card (capped at `max-width: 100%`). |
| `style`, `id`, `class` | | Standard. |

Font is a fixed `19px` in canvas pixels (unlike `QuickCode`'s `em`). Colours ride
`--code-title-bg` and `--code-title-border`.

## CodeDiff

A before/after block: each line gets a `+`/`−` gutter and a green/red wash, with optional old/new
line numbers. Shiki colours, its own row markup, no Monaco.

```svelte
<script>
  import CodeDiff from '@geekpresent/core/components/CodeDiff.svelte';

  const before = `function greet(who) {
  return "Hello " + who;
}`;
  const after = `function greet(who) {
  return \`Hello, \${who}!\`;
}`;
</script>

<!-- 1. Two versions: the diff is computed (LCS over lines). -->
<CodeDiff {before} {after} lang="javascript" summary />

<!-- 2. A git-style block: you say exactly what changed. -->
<CodeDiff lang="python" lineNumbers diff={` def greet(who):
-    return "Hello " + who
+    return f"Hello, {who}!"

 print(greet("world"))`} />
```

| Prop          | Default        | Notes |
| ------------- | -------------- | ----- |
| `before`, `after` | —          | Two versions of the file; the diff is computed. |
| `diff`        | —              | A `+` / `-` / space-prefixed block. Wins over `before`/`after`. |
| `code`        | —              | A plain snippet with no changes (every line is context). |
| `lang`        | `'javascript'` | Shiki language id. Note: `lang`, not `language`. |
| `gutter`      | `true`         | Show the `+`/`−` column. |
| `lineNumbers` | `false`        | Show old and new line-number columns. |
| `summary`     | `false`        | A "+A −R" header above the block. |
| `style`, `id`, `class` | | Standard. |

Precedence: `diff`, else `before`/`after`, else `code`.

Colours: `--codediff-bg`, `--codediff-fg`, `--codediff-add`, `--codediff-del`,
`--codediff-gutter-fg`.

Gotchas:
- In a `diff` block the FIRST character of each line is the marker: `+` added, `-` removed, a space
  is context (exactly one space is stripped, so keep the code's own indentation after it). Any other
  first character makes the whole line context, unstripped.
- Do not paste raw `git diff` output with its headers: `--- a/file` starts with `-` and
  `+++ b/file` with `+`, so they render as a removed and an added line. `@@ … @@` hunk headers become
  context lines. Strip the headers.
- To reveal a change step by step, wrap separate `CodeDiff`s (or the block) in `Steps` / `Fragment`;
  CodeDiff has no stepping of its own.

## Code

Monaco editor inline on the slide, read-only by default. For long listings that need scrolling,
folding and a minimap.

```svelte
<script>
  import Code from '@geekpresent/core/components/Code.svelte';
  import src from './example.ts?raw';
</script>

<Code code={src} language="typescript" width="1200px" height="600px" fontSize={18} />
```

| Prop             | Default    | Notes |
| ---------------- | ---------- | ----- |
| `code`           | `''`       | Buffer contents. A colocated file via `?raw` keeps it out of the slide. |
| `language`       | `'java'`   | Monaco language id (`javascript`, `typescript`, `python`, `html`, `css`, `java`, …). |
| `width`, `height`| `'1200px'`, `'600px'` | CSS lengths (strings). |
| `fontSize`       | `20`       | Monaco font in px; it ignores the slide's font size. |
| `readOnly`       | `true`     | |
| `foldAllAtStart` | `false`    | Fold everything, then unfold `revealLines`. |
| `revealLines`    | `[]`       | Line numbers to unfold (with `foldAllAtStart`) or scroll to (first entry). |
| `style`, `id`, `class` | | Standard (on the placeholder element). |

Gotchas:
- Needs internet: Monaco 0.21.2 is fetched from cdnjs on mount. Offline, the box stays empty.
- Blank after client-side navigation (View-Transition decks, appendices with `transition`). Use
  `QuickCode` / `CssSnippet` there.
- `language` defaults to `'java'`. Always pass it.
- Monaco has no `svelte` mode; use `'html'` for `.svelte` files.
- The real editor is portaled into an unscaled `position: fixed` layer on `<body>` and tracks the
  placeholder every frame (so clicks land on the right character under the canvas scale). It paints
  above the slide at z-index 30; do not try to layer slide content over a `Code`.
- Nothing appears during SSR or in a print/handout; the placeholder only reserves the space.

## CodeBox

`Code` inside an expandable `Box`: a modal panel (1500×975 canvas px, with an optional title bar)
that opens over the slide and closes on CLOSE, Escape or a click outside. Closed, it takes no space.

```svelte
<script>
  import CodeBox from '@geekpresent/core/components/CodeBox.svelte';
  import CtrlBtn from '@geekpresent/core/components/CtrlBtn.svelte';
  import src from './sum.js?raw';

  let show = false;
</script>

<CtrlBtn text="Reveal code" on:click={() => (show = true)} />
<CodeBox code={src} language="javascript" title="sum.js" bind:expanded={show} />
```

| Prop            | Default  | Notes |
| --------------- | -------- | ----- |
| `code`          | required | Buffer contents. |
| `language`      | `'java'` | Monaco language id. Always pass it. |
| `title`         | `''`     | Title-bar text (a file name). With no title and no actions there is no bar. |
| `expanded`      | `false`  | Open state. Use `bind:expanded` so CLOSE / Escape write back. |
| `revealedLines` | `[1]`    | Forwarded to `Code`'s `revealLines` (scrolls to the first entry). |
| `fontSize`      | `20`     | Monaco font px. |
| `readOnly`      | `true`   | |
| `style`, `id`, `class` | | Standard (on the Box root). |

`edit`, `save`, `saveLabel`, `saveRefused`, `saveTip` and the `on:edit` / `on:save` events exist for
`ViewSource`'s own use; a slide does not need them.

Gotchas:
- Same Monaco caveats as `Code`: needs internet, blank after client-side navigation.
- Size is fixed (1500×975); there are no `width`/`height` props.
- There is no built-in trigger. Something on the slide must set `expanded` to `true`.

## Terminal

A fake console: a command types itself out behind a prompt, the machine pauses, the output prints.
The typing is pure CSS `@keyframes` (not a timer), so the session is seekable: it opens held at
frame 0 behind a play button, with a transport bar and a tick per command.

```svelte
<script lang="ts">
  import Terminal from '@geekpresent/core/components/Terminal.svelte';
  import Block from '@geekpresent/core/components/Block.svelte';

  const session = [
    { cmd: 'pnpm build' },
    'vite v5.4.2  building SSR bundle...',                 // bare string = output line
    { out: '✓ 128 modules transformed', tone: 'ok' as const },
    { out: 'warning: 1 chunk is larger than 500 kB', tone: 'warn' as const },
    { out: '# then the static copy', tone: 'comment' as const },
    { cmd: 'scripts/build-static.sh \\' },
    { cmd: './dist', cont: true },                         // continues the line above
    { cmd: 'tree src' },
    { out: 'src', tone: 'dir' as const },
    { lead: '└── ', out: 'lib', tone: 'dir' as const },    // lead stays plain
    { out: ['GH_TOKEN <- [', { text: 'gh/token', tone: 'warn' as const }, ']'] },
  ];
</script>

<Block name="console" x={120} y={570} width={1680} height={400}>
  <Terminal title="zsh — demo" keys="global" lines={session} />
</Block>
```

### Lines

`lines` is an array. Each entry is a bare string (an output line) or an object:

| Field  | On      | Meaning |
| ------ | ------- | ------- |
| `cmd`  | command | Typed after the prompt, character by character. |
| `cont` | command | `true`: continues the command above (after a trailing `\`): no prompt, aligned under it. |
| `out`  | output  | Printed whole (fades in). A string, or a list of pieces to mix colours on one line: a bare string takes the line's `tone`, `{ text, tone }` its own. |
| `tone` | both    | `plain` (default), `ok`, `warn`, `error`, `muted`, `comment`, `dir`. Colours an output line whole; on a command it colours the typed text, not the prompt. |
| `lead` | output  | Text before `out` in the plain colour whatever the tone (a tree's `├── `). |

A shell comment is `tone: 'comment'` — typed after the prompt as `{ cmd: '# list them', tone: 'comment' }`, or printed whole as an `out` line; a folder as `ls` draws it is `tone: 'dir'`.
In TypeScript, write tones `as const` (or type the array as `TerminalInput[]` from
`@geekpresent/core/utils/terminalCore`), or the string widens and fails the type-check.

### Props

| Prop          | Default  | Notes |
| ------------- | -------- | ----- |
| `lines`       | `[]`     | The session (above). |
| `prompt`      | `'$'`    | Drawn before each command. `''` drops it. |
| `title`       | `''`     | Title-bar caption (only with `chrome`). |
| `chrome`      | `true`   | Fake window title bar with three dots. |
| `typing`      | `true`   | `false` prints the session whole, no animation. |
| `caret`       | `true`   | Blinking caret while typing and at rest. |
| `controls`    | `true`   | Own transport: play/pause, click-to-seek track, restart, command ticks. |
| `autoplay`    | `false`  | Run on load instead of waiting behind the play button. |
| `keys`        | `'off'`  | `'global'`: Space steps one command at a time (see below). |
| `continueKey` | `true`   | With `keys="global"`, also step on the presenter console's CONTINUE. |
| `charMs`      | `55`     | ms per typed character. |
| `startMs`     | `300`    | ms before the first line. |
| `pauseMs`     | `350`    | ms the console "thinks" after a command. |
| `outMs`       | `180`    | ms for an output line to fade in. |
| `style`, `id`, `class` | | Standard. |

### Stepping with Space (`keys="global"`)

Space plays forward to the end of the next command's output and stops. Shift+Space jumps back to the
previous stop. Once the last command is done, Space falls through and pages the deck, like a `Steps`
build (it registers with the same build store, so CONTINUE and kiosk drive it too).

Gotchas:
- **Do not put an `<AnimationBar />` on a Terminal slide.** The bar collects every finite CSS
  animation on the slide, including the Terminal's, and its Play runs straight past your command
  stops. If you want the bar to own the clock, pass `controls={false}` (and leave `keys` off).
- Only one build per slide may own Space. Do not combine `keys="global"` with a `Steps` run on the
  same slide, or two stepping Terminals.
- With `controls={false}` and `keys="off"` nothing could start the session, so it autoplays.
- In normal flow the console hugs its content. Wrap it in a `Block` to pin and size it; the screen
  then scrolls if the session is taller than the box.
- Under `prefers-reduced-motion` the animation is removed and the transcript shows whole, with no
  transport. In a Text artifact it also prints whole.
- Not a code viewer: no syntax highlighting. Use `QuickCode` / `Code` for source.

## ViewSource

Offers the slide's own source: registers it with the deck so ☰ → **SOURCE** opens it in a read-only
`CodeBox` (Monaco), titled with the file path, and ☰ → **EDIT** opens a separate unscaled editor
window (`/_source-edit`). On a Text (no tool bar) it shows a corner "</> Source" button instead.

```svelte
<script>
  import ViewSource from '@geekpresent/core/components/ViewSource.svelte';
  import source from './+page.svelte?raw';
</script>

<ViewSource {source} path="src/routes/talk/intro.html/+page.svelte" />
```

| Prop       | Default        | Notes |
| ---------- | -------------- | ----- |
| `source`   | required       | The file's text, from Vite's `?raw` import. |
| `path`     | `''`           | Shown in the title bar and used by EDIT. Not derived; pass it. |
| `language` | `'html'`       | Monaco language (`html` reads best for `.svelte`). |
| `text`     | `'</> Source'` | Corner-button label (Text mode only). |
| `chrome`   | `true`         | Corner button recedes like other chrome; `false` for the accent look. |
| `style`, `id`, `class` | | Standard. |

Gotchas:
- Monaco caveats apply: needs internet; blank after client-side navigation. On View-Transition
  decks and animated appendices use `SourceView`.
- SAVE in the edit window only works under the dev server; on a static host it answers NOT ALLOWED.
- Under the dev server, SOURCE / EDIT work deck-wide even without this component. Place it when the
  source must also be readable on the built, static site.
- Typing never happens in the in-slide panel (Monaco's caret drifts under the canvas scale); EDIT
  hands off to the popup. A blocked popup leaves the panel open and logs a warning.

## SourceView

The same control as `ViewSource`, with Shiki instead of Monaco for the in-slide panel. Use it on any
slide reached by client-side navigation. EDIT opens the same unscaled popup.

```svelte
<script>
  import SourceView from '@geekpresent/core/components/SourceView.svelte';
  import source from './+page.svelte?raw';
</script>

<SourceView {source} />
```

| Prop     | Default | Notes |
| -------- | ------- | ----- |
| `source` | required | The file's text, from `?raw`. |
| `path`   | `''`    | Override the title-bar path. Default derives `src/routes<route id>/+page.svelte`. |
| `chrome` | `true`  | Corner-button look (Text mode only). |
| `style`, `id`, `class` | | Standard. |

Gotchas:
- No `language` prop: the panel always highlights as `svelte`. For a non-Svelte file, it still shows
  the exact text, but with Svelte colouring.
- Highlighting runs the first time the panel opens; the plain source shows until then.
- The derived path assumes the route lives under `src/routes`. Pass `path` if it does not.

## JavaCode / JavaCodeBox (legacy)

Monaco viewers with a hand-written Java folding provider. Marked legacy and unverified; do not use
them for new slides. `Code` / `CodeBox` with `language="java"` cover Java with Monaco's built-in
folding.
