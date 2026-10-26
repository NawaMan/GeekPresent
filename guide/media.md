# Media & embeds

Pictures, video files, YouTube cards, QR codes and live websites on a slide. Every media file
a slide uses lives next to that slide and is `import`ed, never referenced by a hard-coded path.
The embeds come in pairs: `WebSite` / `Video` fill the box they are given (usually a `Block`),
and `WebPage` / `VideoPage` fill the whole canvas and are a complete slide by themselves.

## Images on slides

Put the image file in the slide's own route folder and `import` it. Vite then bundles and hashes
it and resolves the URL. This URL keeps working when the site is deployed under a base path. A
root-absolute path like `/img/pic.png` does not, and `static/` is not the place for one slide's
files.

```svelte
<script>
  import ContentPage from '@geekpresent/core/templates/ContentPage.svelte';
  import diagram from './diagram.png';
</script>

<ContentPage title="Architecture">
  <img src={diagram} alt="Request flow" style="width: 900px;" />
</ContentPage>
```

- To place an image at exact canvas pixels (and drag or resize it in ADJUST mode), use
  `ImageBlock`. It is documented in [layout.md](layout.md).
- For an SVG whose colour must follow the theme (`currentColor`), use `SvgBlock` (also in
  layout.md), not `ImageBlock`.

## YouTube

A thumbnail card with the video id and a QR code over its corner. The card links to the video on
YouTube in a new tab.

```svelte
import YouTube from '@geekpresent/core/components/YouTube.svelte';
```

```svelte
<script>
  import YouTube   from '@geekpresent/core/components/YouTube.svelte';
  import thumbnail from './mytalk-TN.png';
</script>

<YouTube {thumbnail} youtubeId="dQw4w9WgXcQ" alt="My talk" width="600px" />
```

| Prop | Default | Notes |
|---|---|---|
| `youtubeId` | required | The video id. The link is `https://www.youtube.com/watch?v=<id>`. |
| `thumbnail` | required | An imported image (colocated next to the slide). |
| `alt` | `""` | Alt text for the thumbnail. The QR gets `"<alt> QR code"`. |
| `width` | `"900px"` | CSS width of the card. |
| `qr` | `null` | Optional imported QR image. Omit it: the QR is then encoded live from `youtubeId` with `QRCode`. |
| `style` / `id` / `class` | | Standard root-element props. |

Gotchas:

- `qr` is optional now, and omitting it is the better choice: the live code cannot drift from
  the video it points at. Pass an imported `-QR.png` only to keep an older slide pixel-identical.
- You must supply the thumbnail yourself (for example a screenshot or the video's
  `https://img.youtube.com/vi/<id>/maxresdefault.jpg`, downloaded into the slide folder). The
  component does not fetch it.
- This component is a link card (`<a>` + `<img>`), not a YouTube player `<iframe>`. The video
  does not play on the slide. Because there is no iframe, CAPTURE and the handout draw it
  normally.
- The frame colour around the thumbnail and the QR is the `--media-frame` role token.

## QRCode

A scannable QR symbol encoded on the slide and drawn as SVG. Nothing is fetched and no image is
committed, and it stays sharp under the canvas scaling. Use it for "slides are at this URL", or
next to any link the audience should open on a phone.

```svelte
import QRCode from '@geekpresent/core/components/QRCode.svelte';
```

```svelte
<QRCode value="https://example.com/talk" label="Slides" />

<Block x={1400} y={640} width={340} height={380}>
  <QRCode value="https://example.com/talk" size="100%" />
</Block>
```

| Prop | Default | Notes |
|---|---|---|
| `value` | `''` | What the symbol encodes. Empty, or too long to fit, renders nothing. |
| `size` | `220` | Side in canvas px (number) or a CSS length (`'100%'`). Never distorted. |
| `label` | `''` | Caption under the code. The default slot overrides it for rich markup. |
| `ecc` | `'M'` | `'L' \| 'M' \| 'Q' \| 'H'`. Use `'Q'`/`'H'` only if something overlaps the code. |
| `quiet` | `4` | Light margin in modules. 4 is the spec minimum; do not trim it. |
| `minVersion` | `1` | Floor the version (1-40) to keep the module size steady across slides. |
| `mask` | `null` | Pin the data mask (0-7). Default: the spec's penalty-scored choice. |
| `href` | `null` | Click target. Defaults to `value` when it is `http(s):`, `mailto:` or `tel:`. |
| `link` | `true` | `false` renders no anchor (needed inside another `<a>`). |
| `alt` | `''` | Accessible name. Defaults to the label, else the value. |
| `plate` | `true` | The light backing behind code and quiet zone. `false` hands contrast to the slide. |
| `style` / `id` | | Standard root-element props. |

Gotchas:

- Colours are `--qr-dark` / `--qr-light` / `--qr-caption-fg`. They deliberately default to
  literal black on white whatever the theme, because a scanner needs dark on light.

## WebSite

A live website in an `<iframe>`, bounded to its parent box. Wrap it in a `Block` to place and
size it in canvas pixels. It shows a fake browser bar (title, zoom, reload, "Open").

```svelte
import WebSite from '@geekpresent/core/components/WebSite.svelte';
```

```svelte
<script>
  import Block   from '@geekpresent/core/components/Block.svelte';
  import WebSite from '@geekpresent/core/components/WebSite.svelte';
</script>

<Block name="docs" x={120} y={260} width={760} height={520}>
  <WebSite src="https://svelte.dev" zoom={0.5} />
</Block>
```

| Prop | Default | Notes |
|---|---|---|
| `src` | `''` | The URL to embed (required in practice). |
| `title` | `null` | Bar label and iframe accessible name. `null` uses the URL's host. |
| `width` / `height` | `'100%'` | CSS lengths. `100%` fills a Block; in normal flow pass e.g. `height="540px"`. |
| `zoom` | `1` | Render scale. `0.5` shows the desktop layout at half size in a small box. |
| `zoomLevels` | browser ladder | Stops the bar's `-` / `+` walk. Clicking the percentage resets to `zoom`. |
| `chrome` | `true` | Show the fake browser bar. |
| `controls` | `true` | Zoom and reload buttons in the bar. Needs `chrome`. |
| `interactive` | `false` | Start armed, with no shield. |
| `lazy` | `true` | Create the iframe only when the box scrolls into view. |
| `sandbox` | `'allow-scripts allow-same-origin allow-popups allow-forms'` | `''` locks it down; `false` drops the attribute (only for content you control). |
| `allow` | `''` | Iframe permission policy, e.g. `'fullscreen; clipboard-write'`. |
| `style` / `id` / `class` | | Standard root-element props. |

Slot: `placeholder` replaces the default link shown before the iframe mounts.

How arm / release works (the shield):

- On a slide the frame is inert by default, behind an invisible shield. The deck keeps the
  pointer and the paging keys. Hovering shows a tooltip "Click to interact with ...".
- Click the frame to **arm** it: the site now gets pointer and keyboard input, so arrow keys
  and Space go to the site, not to the deck.
- To **release**, click anywhere outside the component, or press the **Release** pill that
  appears in the bar while armed. Then the deck owns the keys again.
- `interactive` starts armed and never shields. Use it only when the site is meant to be
  operated the whole time, because the deck's keys stop working while the pointer is over it.
- In a Text artifact (`text` mode) there is no shield; the frame is live from the start.

Gotchas:

- Many sites refuse to be framed (`X-Frame-Options` / `frame-ancestors`). The frame then renders
  empty. "Open" in the bar is the fallback. Test the target URL before the talk.
- With `chrome={false}` there is no Release pill and no zoom/reload; release is a click outside.
- An iframe is a separate document. In-app CAPTURE refuses the slide (NOT ALLOWED, naming the
  embed), and the printed handout prints the embed's name on the sheet in place of the blank
  frame. This is the same-origin policy, not a bug. If you need the pixels, take an ordinary
  browser screenshot.
- A reload re-creates the iframe; there is no other way to refresh a cross-origin page.
- Theme with `--embed-frame-bg`, `--embed-frame-border`, `--embed-chrome-bg`, `--embed-chrome-fg`,
  `--embed-accent`, `--embed-shield-bg`.

## WebPage

`WebSite` stretched over the whole slide canvas. Use it when the site is the slide; use
`WebSite` in a `Block` when it is one element of a slide. It is a complete slide by itself:
no template needed. Paging still works, because the pager lives in the deck's own bottom bar,
which paints above the frame.

```svelte
import WebPage from '@geekpresent/core/components/WebPage.svelte';
```

```svelte
<script>
  import WebPage from '@geekpresent/core/components/WebPage.svelte';
</script>

<WebPage src="https://svelte.dev" title="svelte.dev" />
```

| Prop | Default | Notes |
|---|---|---|
| `src`, `title`, `zoom`, `zoomLevels`, `chrome`, `controls`, `interactive`, `lazy`, `sandbox`, `allow` | as WebSite | Passed straight through to `WebSite`. |
| `height` | `'640px'` | Text mode only: the embed's height (a Text has no canvas). |
| `style` / `id` / `class` | | Standard root-element props. |

Gotchas:

- No `width` prop; on a slide it always fills the canvas (`position: absolute; inset: 0`).
- All the WebSite gotchas apply: framing refusal, arm/release, CAPTURE refusal, handout naming.

## Video

A `<video>` with its own themeable chrome (play/pause, restart, click-to-seek track, clock,
mute) and **time bookmarks**: a chapter list of buttons that seek, with the current chapter
highlighted and ticks on the track. It fills the box it is given; put it in a `Block`.

```svelte
import Video from '@geekpresent/core/components/Video.svelte';
```

```svelte
<script>
  import Block from '@geekpresent/core/components/Block.svelte';
  import Video from '@geekpresent/core/components/Video.svelte';
  import demo  from './demo.mp4';
  import still from './demo-poster.jpg';
</script>

<Block name="demo" x={120} y={260} width={1000} height={640}>
  <Video src={demo} poster={still} bookmarks={[
    { at: '0:03', tag: 'HOST',  label: 'No toolchain on the host.' },
    { at: '1:14', tag: 'BOOTH', label: 'Step in - it builds.' },
  ]} />
</Block>
```

| Prop | Default | Notes |
|---|---|---|
| `src` | `''` | The video URL. Import the file; do not hard-code a path. |
| `poster` | `''` | Still frame before playback (import it too). |
| `bookmarks` | `[]` | `{ at, label?, tag? }[]`. `at` is seconds (`74`) or a clock string (`'1:14'`, `'1:02:03'`). |
| `chapters` | `true` | Render the chapter list (when there are bookmarks). |
| `controls` | `true` | Render the component's own chrome bar. |
| `native` | `false` | Use the browser's controls instead, and drop ours. |
| `keys` | `'off'` | `'global'`: Space / Shift+Space step through the bookmarks, then page the deck. |
| `continueKey` | `true` | Also seek on the presenter console's CONTINUE pulse. Needs `keys`. |
| `start` | `null` | Seek here once metadata loads (seconds or clock string). |
| `autoplay` | `false` | `true` always; `false` never; `'kiosk'` only while a kiosk session runs. |
| `kioskHold` | `true` | In kiosk, hold auto-advance until the clip ends. `false` for decorative clips. |
| `muted` | `undefined` | `undefined` means muted when `autoplay` is `true` or `'kiosk'`. |
| `loop`, `playsinline` (`true`), `preload` (`'metadata'`) | | Plain `<video>` attributes. |
| `width` / `height` | `'100%'` | Fills a Block. In normal flow pass e.g. `height="540px"`. |
| `style` / `id` / `class` | | Standard root-element props. |

Gotchas:

- The bookmark key is `at`, not `t` or `time`. A time that cannot be parsed is dropped silently,
  so a wrong key gives you no chapters and no error. Order does not matter; the list is sorted.
- Import the video file (`import demo from './demo.mp4'`). A root-absolute `/media/x.mp4` breaks
  under a base path (for example GitHub Pages at `/<repo>/`).
- The player never binds left/right arrows; they always page the deck. Keyboard seeking is
  through the chapter buttons.
- `keys="global"` is opt-in because Space is the deck's advance key and only one build per
  slide may own it. Do not combine it with a `<Steps>` build on the same slide. Use it when the
  video is the content (typically on `VideoPage`).
- Browsers allow autoplay only while muted. Passing `muted={false}` with `autoplay` can leave the
  clip paused on its first frame.
- CAPTURE does include a `<video>`: its current frame is snapshotted into the PNG.
- Theme with `--video-bg` (stage, stays black), `--video-border`, `--video-chrome-bg`,
  `--video-chrome-fg`, `--video-accent` (progress fill and active chapter), `--video-track`.

## VideoPage

`Video` stretched over the whole slide canvas: same player, chrome and bookmarks. A complete
slide by itself. Use `Video` in a `Block` when the clip is one element among others.

```svelte
import VideoPage from '@geekpresent/core/components/VideoPage.svelte';
```

```svelte
<script>
  import VideoPage from '@geekpresent/core/components/VideoPage.svelte';
  import demo      from './demo.mp4';
</script>

<VideoPage src={demo} keys="global" bookmarks={[
  { at: '0:03', tag: 'HOST',  label: 'No toolchain on the host.' },
  { at: '1:14', tag: 'BOOTH', label: 'It builds.' },
]} />
```

| Prop | Default | Notes |
|---|---|---|
| `src`, `poster`, `bookmarks`, `chapters`, `controls`, `native`, `keys`, `continueKey`, `start`, `autoplay`, `kioskHold`, `loop`, `muted`, `playsinline`, `preload` | as Video | Passed straight through to `Video`. |
| `height` | `'640px'` | Text mode only: the player's height (a Text has no canvas). |
| `style` / `id` / `class` | | Standard root-element props. |

Gotchas:

- No `width` prop; on a slide it fills the canvas. The deck's chrome (pager, TOC, notes) paints
  above it and stays usable.
- `keys="global"` fits best here: Space walks chapter to chapter, then pages on. It is still
  opt-in.
- For a looping clip on an unattended kiosk deck: `autoplay="kiosk" loop`. With the default
  `kioskHold`, the kiosk waits for one full play of the clip before paging.
