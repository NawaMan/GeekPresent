# VOD Record — Phase 1: record a talk to a video file, with an editable timeline you can replay

> Record the deck as a video for YouTube while the speaker presents it by hand, and
> write down **when** every action happened in a plain text file. Edit the text
> (nudge a time, drop a slip) and **REPLAY** it: the deck plays itself on that
> timeline and records again, hands off.

## Objective

- A **Recorder** window, opened from the presenter console (**● REC**, key **R**).
- It captures the **slides window** (the audience tab) into a video file at the deck's
  canvas size — **1920×1080** for a stock deck, YouTube's default — whatever the
  window's actual size.
- Optional **microphone** (and optional tab audio) in the same file.
- Alongside it, a **timeline** text file: one action per line, with its time.
- **REPLAY** reads a timeline (edited or not) and drives the slides window through it
  while recording a fresh video.

## Why this shape (settled)

**1. The recorder lives in a THIRD window that never navigates.** Paging a deck is a
full page load (`deckNav.navigate` sets `window.location.href`), and the `?present`
console is the same slide document with a flag — it follows the audience and reloads
too (`PRESENTER-1.md`, "both windows are peers"). A `MediaRecorder`, a clock and a
timeline in either window would die at the first page turn. So the Recorder is its own
route, `/_recorder?deck=<deckKey>`, outside every deck layout (like `_source-edit`).

**2. It records the slides window with `getDisplayMedia`.** The user picks the slides
tab once. Tab capture keeps running across that tab's page loads. The Recorder is never
in the picture.

**3. The video is always the canvas size.** The captured tab is whatever size the window
is. Every frame is redrawn, letterboxed, onto a canvas of exactly the target size
(`MediaStreamTrackProcessor` → `OffscreenCanvas` → `MediaStreamTrackGenerator`), so the
file is 1920×1080 on any monitor. A 16:9 window gives an edge-to-edge picture; anything
else gets black bars, and the Recorder says so before you start. Where the browser lacks
those APIs (non-Chromium), the raw track is recorded and the Recorder warns.

**4. The timeline records ACTIONS, at the level the deck performed them.** Not keys, not
pixels. The slides window reports what it did; the Recorder stamps it with the video
clock:

| line | what happened | how it replays |
|---|---|---|
| `goto intro.html` | the deck paged (any cause: key, button, console, TOC) | `navigate()` |
| `goto title.html back end` | …backwards, landing with its build spent (PREV) | `navigate(…, {direction, arriveAtEnd})` |
| `step` / `step back` | a build (Steps / Terminal / Video chapters) moved | `activeSteps.next()` / `.prev()` |
| `continue` | the slide's own `onContinue` hook ran | `gp:slide-continue` |
| `anim play 0.250` / `anim pause 0.600` | animation state set (bar or console) | `applyState()` |
| `trigger demo` | a named trigger fired | `fireTrigger()` |
| `highlight api` / `highlight off` | the spotlight changed | `setHighlight()` |
| `ink intro.html draw 0.84 {…}` | a stroke was drawn over 0.84 s | redrawn over 0.84 s |
| `ink intro.html erase id …` / `ink intro.html clear` / `ink * clear` | ink removed | written to the ink book |
| `end` | the recording stopped | replay stops |

Recording outcomes rather than inputs is what makes replay faithful: a Space that
revealed a step is a `step`; a Space that paged is a `goto`. Replaying a `goto` cannot
turn into a reveal because the build state drifted.

**5. Replay drives the same code paths.** Each command lands in the slides window and
calls the very function the live action called. The console follows the slides window
as it always does.

**6. The Recorder owns ink.** Ink is a `persisted(sync: true)` store, so the Recorder
sees every change to the ink book through the `storage` event and diffs it — no hook in
`Annotate` beyond stamping how long a stroke took to draw (`Stroke.ms`). On replay the
Recorder writes the strokes back, point by point, and the slides window mirrors them.

**7. A clock that does not sleep.** The Recorder is usually behind the slides window.
Browsers throttle timers in background pages, so the replay scheduler and the heartbeat
tick from a dedicated Worker.

## The timeline file

```text
# GeekPresent timeline v1
# deck: /slides/
# canvas: 1920x1080
# recorded: 2026-10-22T10:00:00.000Z
00:00.000 goto title.html
00:04.250 goto intro.html
00:07.900 step
00:09.120 ink intro.html draw 0.84 {"id":"ink-1","tool":"pen","points":[[400,300],[520,310]]}
00:12.100 anim play 0.000
shift +2
00:15.000 trigger demo
01:02.500 end
```

- Times are `m:ss.mmm` / `mm:ss.mmm` / `h:mm:ss.mmm`, or plain seconds (`12.5`).
  Absolute, from the start of the video: editing one line moves one action.
- `shift +2` / `shift -0.5` moves **every following line** by that many seconds
  (cumulative) — insert a pause without retyping the rest.
- Lines need not be in order; replay sorts them (stable).
- `#` starts a comment, to end of line, except inside the JSON of an `ink … draw`.
- Header `# key: value` comments are informational.
- A line that does not parse is an **error with its line number**; replay refuses to
  start rather than skip it.
- Slides are named relative to the deck (`intro.html`, `appendix.html?return=intro.html`).

## Protocol (BroadcastChannel `geekpresent:recorder`)

All messages carry `deck` (the deck key); every party ignores other decks.

| from → to | message | meaning |
|---|---|---|
| recorder → all | `hello` | who is out there? |
| slides → recorder | `here {href, width, height, title}` | sent on every mount and in reply to `hello`; also the "ready" signal replay waits on after a `goto` |
| slides → recorder | `leaving` | sent just before a full page load during a take; the Recorder holds the video on its last frame until the next `here` (+150 ms, at most 8 s), so the blank page between slides never reaches the file |
| recorder → all | `status {state}` | `idle` / `armed` / `recording` / `replaying`; repeated every second |
| slides → recorder | `action {ev}` | an action, only while `recording` |
| recorder → slides | `cmd {ev}` | a replayed action |

The state is also written to `localStorage` (`geekpresent:recorder:<deck>`, with a
timestamp) so a slides window that just loaded knows at once; a state older than 5 s
reads `idle` (the Recorder closed).

While `recording` or `replaying`, the slides window: hides both bars (as bare chrome
does), shows the slide FITTED, and — only while `replaying` — ignores the keyboard, the
pointer, and every console relay, so a stray key cannot spoil the take.

## Starting and stopping

- **REC**: pick the slides tab → (optional mic) → the Recorder reloads the current slide
  (so live and replay start from the same state) → waits for `here` → the bars tuck away
  → recording starts and the timeline opens with `00:00.000 goto <slide>`.
- **REPLAY**: parse (refuse on errors) → pick the tab → clear this deck's ink → perform
  the opening `goto`, wait for `here` → record, scheduling every later line on its time.
  A command that falls due while the slides window is still loading waits for `here`,
  then fires at once (no accumulated drift).
- **STOP** (or `end` in replay): the video is finalized and saved; the timeline is
  shown in the editor and downloaded.
- Output: a **Save to…** file picked beforehand (streamed to disk as it records, so an
  hour is not held in memory), else a download at STOP. Prefers `video/mp4` (H.264/AAC),
  falls back to `video/webm`.

## Non-goals (phase 1)

- The mouse pointer, raw clicks, a Terminal's or Video's own transport scrubbing, typing
  in a slide.
- Editing the video.
- A headless "render the timeline offline" mode (TODO).
- More than one slides window of a deck at once (all of them would obey replay).
