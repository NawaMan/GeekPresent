<!--
  Example: Sprite — staggered timing with `animate` + `delay`.
  File: src/routes/animation/sprite-delay.html/+page.svelte

  Every animation on a slide shares ONE AnimationBar timeline, whose length is
  the longest delay + duration on the page. Two knobs place a sprite's flight
  on it:
    · `animate` — how long the flight takes;
    · `delay`   — how long it HOLDS its start pose first (the sprite
      counterpart of a shape's `drawDelay`).

  Four chips race the same lanes, one for each corner of the vocabulary
  (timeline here is 10s). Each is labelled start--current→end (the slide
  renders an ASCII dash-arrow; spelled → in this comment, which it would end):
    0--…→10   animate={10}            the full ride
    3--…→10   animate={7}  delay={3}  starts late
    0--…→7    animate={7}             finishes early
    3--…→7    animate={4}  delay={3}  both

  THE LIVE NUMBER, WITHOUT JS: you can't read progress out of a CSS animation,
  but you can make the number BE an animation. --t is a registered custom
  property (@property, syntax '<integer>'), animated linearly by its own
  keyframes over the same window as the chip's flight, and rendered with
  counter() in ::after. To the AnimationBar it's just one more finite CSS
  animation, so playing and scrubbing move the digits with the chips — and it
  prerenders. (When you need the value IN CODE — physics, drawing — that's
  <Canvas>: its draw() gets {t, progress} each frame from the shared clock.)

  THE FORMATION: the lanes are one shared ruler (x = 330 + 126·t) — each
  chip's from/to sit at its window's start/end seconds — and every flight is
  ease="linear", so position IS time. Chips whose windows overlap ride exactly
  abreast: all four together from 3s to 7s, then 3+4 park at the 7s mark while
  1+2 walk on to 10s. A finished chip parks at its end pose (fill: both); a
  waiting one parks at its start. The scrubber passes through the waits like
  any other moment. (`ease` defaults to ease-in-out — cinematic for a lone
  flight, but eased chips would drift apart mid-window; linear is what makes
  "walking alongside" exact.)
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Sprite } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/sprite-delay.html/+page.svelte';
</script>

<ContentPage
	title="Sprite — Staggered Timing"
	subtitle="animate= is the flight, delay= holds the start — four chips, four corners of the timeline"
>
	<div style="line-height: 1.5em;">
		<p>
			All animations on a slide share <b>one</b> AnimationBar timeline — its
			length is the longest <code>delay + animate</code> on the page (here
			<b>10s</b>). <code>animate</code> sets how long a flight takes;
			<code>delay</code> holds the start pose first, like a shape's
			<Label>drawDelay</Label>. Each chip reads
			<code>start--current--&gt;end</code>, and the <b>current second is pure
			CSS</b>: a registered <code>@property</code> integer (<code>--t</code>)
			animated by its own <b>linear</b> keyframes over the same window, shown
			with <code>counter()</code> — one more CSS animation, so the bar plays
			<i>and scrubs</i> the digits with the chips, no JS. The chips ride
			<b>abreast</b> while their windows overlap because the lanes share one
			ruler (<code>x = 330 + 126·t</code>) and every flight is
			<code>ease="linear"</code> — position <i>is</i> time. (Need the value in
			code instead? That's <Label>Canvas</Label> — its <code>draw()</code> gets
			<code>{'{t, progress}'}</code> every frame.)
		</p>
		<QuickCode
			style="margin-top: 0.5em;"
			lang="svelte"
			code={`<Sprite path={…} animate={7} delay={3} ease="linear" …>3--<span class="now"></span>--&gt;10</Sprite>

@property --t { syntax: '<integer>'; initial-value: 0; inherits: false; }
.now        { counter-reset: t var(--t); }
.now::after { content: counter(t); }
.c2 .now    { animation: count2 7s linear 3s both; }
@keyframes count2 { from { --t: 3; } to { --t: 10; } }`}
		/>
	</div>
</ContentPage>

<Draw
	title="Four chips racing the same distance on staggered clocks"
	name="sprite-delay"
	description="Four labelled chips race identical lanes: one rides the full ten seconds, one starts three seconds late, one finishes three seconds early, and one does both — all scrubbed by a single bar."
>
	<!-- Each chip reads start--current→end. The current second is PURE CSS: a
	     registered custom property (--t, an <integer>) animated by its own
	     linear keyframes over the same window as the flight, displayed via
	     counter() — one more CSS animation, so the bar scrubs it too.

	     THE LANES ARE ONE SHARED RULER: x = 330 + 126·t, so a chip's from/to
	     sit at its window's start/end seconds (t 0→330, 3→708, 7→1212,
	     10→1590) and every flight is ease="linear" — position IS time. Chips
	     whose windows overlap therefore ride exactly alongside each other:
	     all four abreast from 3s to 7s. (The default ease-in-out would let
	     them drift apart mid-window and only meet at the ends.) -->
	<Sprite name="s1" path={{ kind: "line", from: [330, 800], to: [1590, 800] }} animate={10} ease="linear" size={[210, 58]} orient={false}>
		<span class="chip c1">0--<span class="now"></span>--&gt;10</span>
	</Sprite>

	<Sprite name="s2" path={{ kind: "line", from: [708, 880], to: [1590, 880] }} animate={7} delay={3} ease="linear" size={[210, 58]} orient={false}>
		<span class="chip c2">3--<span class="now"></span>--&gt;10</span>
	</Sprite>

	<Sprite name="s3" path={{ kind: "line", from: [330, 960], to: [1212, 960] }} animate={7} ease="linear" size={[210, 58]} orient={false}>
		<span class="chip c3">0--<span class="now"></span>--&gt;7</span>
	</Sprite>

	<Sprite name="s4" path={{ kind: "line", from: [708, 1040], to: [1212, 1040] }} animate={4} delay={3} ease="linear" size={[210, 58]} orient={false}>
		<span class="chip c4">3--<span class="now"></span>--&gt;7</span>
	</Sprite>
</Draw>

<AnimationBar highlight />

<ViewSource {source} {path} />

<style>
	.chip {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		border-radius: 999px;
		font-family: 'Fira Code', monospace;
		font-size: 24px;
		font-weight: 600;
		color: #101418;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
	}
	.c1 { background: #f39c12; }
	.c2 { background: #3fa7e0; }
	.c3 { background: #2ecc71; }
	.c4 { background: #e37fd2; }

	/* ── The live "current second", without a line of JS ─────────────────────
	   CSS can't put a number on screen from an animation — unless the number IS
	   the animation. --t is a REGISTERED custom property typed <integer>, so it
	   interpolates (an unregistered one would snap); each chip animates it
	   LINEARLY over the same window as its flight (same duration + delay,
	   fill both — parked at the start value while waiting, at the end value
	   when done). counter() turns the integer into ::after text. To the
	   AnimationBar this is just one more finite CSS animation to scrub. */
	/* Registers --t's TYPE for the page (an at-rule — Svelte passes it through
	   unscoped, like @font-face). Without browser support, counters fall back
	   to a static 0 — the chips still fly. */
	@property --t {
		syntax: '<integer>';
		initial-value: 0;
		inherits: false;
	}
	/* counter-reset must live ON .now — where --t animates. The property is
	   inherits:false, so ::after never sees the animated var() (it would read
	   the initial 0 forever); the COUNTER, though, does flow into the pseudo. */
	.now {
		counter-reset: t var(--t);
	}
	.now::after {
		content: counter(t);
	}
	.c1 .now { animation: count1 10s linear both; }
	.c2 .now { animation: count2 7s linear 3s both; }
	.c3 .now { animation: count3 7s linear both; }
	.c4 .now { animation: count4 4s linear 3s both; }
	@keyframes count1 { from { --t: 0; } to { --t: 10; } }
	@keyframes count2 { from { --t: 3; } to { --t: 10; } }
	@keyframes count3 { from { --t: 0; } to { --t: 7; } }
	@keyframes count4 { from { --t: 3; } to { --t: 7; } }
</style>
