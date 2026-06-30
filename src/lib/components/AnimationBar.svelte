<!--
  AnimationBar — in-slide playback controls for a slide's keyframe animation.

  PLACING this component IN A SLIDE is the signal that "this slide has a finite,
  timeline-based keyframe (@keyframes) animation I want the viewer to control".
  It does NOT touch the slide-to-slide page transitions (those live on the
  ::view-transition tree and are left exactly as they are) — it only governs the
  CSS @keyframes animations playing on elements WITHIN this slide.

  It drives them through the Web Animations API (getAnimations): every CSS
  @keyframes animation is also a live Animation object whose clock we can read and
  write. From that one handle the bar offers:
    - a PROGRESS bar    — the playhead across the slide's whole animation envelope
    - PAUSE / PLAY      — detach the animation from wall-clock time, and reattach
    - click / drag      — scrub the progress bar to seek to any point
    - RESTART           — jump back to 0 and play from the top

  Scope: it controls the finite CSS animations found inside the nearest slide
  `.content` (its own controls are excluded; CSS *transitions* like Box/WideDiv and
  infinite-loop animations are ignored — neither has a meaningful "progress").

  By default it shows a low-profile "ANIMATION" chrome button (like MODE / the nav
  controls); clicking it reveals the full control bar. The reveal is one-way — the
  bar stays once shown (there is no control to fold it back to the button).

  Usage — drop it anywhere inside a slide that animates:
      <AnimationBar />
  It renders NOTHING — not even the ANIMATION button — on a slide with no finite,
  seekable @keyframes animation, so it is safe to leave in a shared template and
  cannot interfere with a static slide.
-->
<script lang="ts">
	import CtrlBtn                 from './CtrlBtn.svelte';
	import { browser }            from '$app/environment';
	import { afterNavigate }      from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';

	/* Selector for the element whose subtree is searched for animations. Defaults
	   to the slide canvas `.content`; an author can narrow it (e.g. ".page") to a
	   sub-region when one slide hosts several independent animated areas. */
	export let scope = '.content';
	/* Emphasise the collapsed ANIMATION button with the prominent (accent) look
	   instead of the muted chrome, when controlling the animation is meant to read
	   as part of the slide rather than incidental chrome. */
	export let highlight = false;
	/* Skip the ANIMATION button and show the controls straight away. With the
	   reveal being one-way anyway, this just means "always open". */
	export let startExpanded = false;
	/* "Driven" mode: an EXTERNAL source owns the playhead (e.g. a ScrollDiv wired
	   `onScroll={(t, p) => bar.seekFraction(p.progY)}`). We detach the animations
	   from the wall-clock on load and seek to 0, then let seekFraction() move them.
	   The bar shows the rail as a live read-out; the play/restart buttons are
	   hidden because re-attaching to the clock would fight the external driver. */
	export let driven = false;

	/* Seek the whole group to a 0..1 fraction of its envelope. The public hook for
	   scroll-/pointer-driven scrubbing from a parent — pair it with `driven`. */
	export function seekFraction(f: number) {
		if (!hasAnim || duration <= 0) return;
		seek(Math.max(0, Math.min(1, f)) * duration);
	}

	/* Re-read the slide's animations and recompute the envelope WITHOUT resetting
	   the bar's UI (unlike refresh(), which collapses it). Call after an external
	   change to the animation — e.g. an authoring tool that retimes it — so the
	   rail's time-scale tracks the new duration. */
	export function rescan() { collect(); }

	let root:  HTMLElement;          // this component's wrapper (used to self-exclude)
	let track: HTMLElement;          // the progress rail (its geometry maps x -> time)

	let anims: Animation[] = [];     // the finite CSS animations we govern
	let duration = 0;                // envelope length in ms (max end time of all)
	let playhead = 0;                // current position in ms
	let playing  = false;            // true while attached to the clock and advancing
	let hasAnim  = false;            // gate: render nothing until a real animation exists
	let expanded = startExpanded;    // false = just the ANIMATION button; true = full bar
	let dragging = false;            // a scrub is in progress (pointer held on the rail)
	let raf = 0;                     // the progress-sampling rAF handle (0 = idle)

	$: fraction = duration > 0 ? Math.max(0, Math.min(1, playhead / duration)) : 0;

	// The wall-clock end of an animation: delay + active duration (+ end delay).
	// 0 for anything without a finite, numeric end (we filter those out anyway).
	function endTimeOf(a: Animation): number {
		const e = a.effect?.getComputedTiming().endTime;
		return typeof e === 'number' && Number.isFinite(e) ? e : 0;
	}

	// Find every finite CSS @keyframes animation in `scope`, excluding our own
	// controls and CSS *transitions* (Box/WideDiv) and infinite loops.
	function collect() {
		if (!browser) return;
		const host = (root?.closest(scope) ?? document.querySelector(scope) ?? document) as
			Document | Element;
		const all = host.getAnimations({ subtree: true });
		anims = all.filter((a) => {
			// Skip the controls' own animations, if any.
			const target = (a.effect as KeyframeEffect | null)?.target as Element | null;
			if (target && root && root.contains(target)) return false;
			// CSS transitions (Box/WideDiv) are state-driven, not a playable timeline.
			if (typeof CSSTransition !== 'undefined' && a instanceof CSSTransition) return false;
			// Only animations with a finite, non-zero envelope are seekable.
			return endTimeOf(a) > 0;
		});
		duration = anims.reduce((m, a) => Math.max(m, endTimeOf(a)), 0);
		hasAnim  = anims.length > 0 && duration > 0;
		// They begin attached to the clock on first paint — reflect that.
		if (hasAnim) playing = anims.some((a) => a.playState === 'running');
	}

	// Read the live playhead as the furthest-advanced animation, each capped at its
	// own end so a short early animation can't peg the bar before the long one ends.
	function sample(): number {
		let t = 0;
		for (const a of anims) {
			const ct = typeof a.currentTime === 'number' ? a.currentTime : 0;
			t = Math.max(t, Math.min(ct, endTimeOf(a)));
		}
		return t;
	}

	function allFinished(): boolean {
		return anims.length > 0 && anims.every((a) => a.playState === 'finished');
	}

	function loop() {
		playhead = sample();
		if (playing && !allFinished()) {
			raf = requestAnimationFrame(loop);
		} else {
			if (allFinished()) { playing = false; playhead = duration; }
			raf = 0;
		}
	}
	function startLoop() { if (!raf && browser) raf = requestAnimationFrame(loop); }
	function stopLoop()  { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

	// Seek the whole group to time `t` (ms). Each animation is clamped to its own
	// end, so the group settles coherently even with staggered delays/durations.
	function seek(t: number) {
		const clamped = Math.max(0, Math.min(t, duration));
		for (const a of anims) a.currentTime = Math.min(clamped, endTimeOf(a));
		playhead = clamped;
	}

	function pause() { for (const a of anims) a.pause(); playing = false; stopLoop(); }

	function play() {
		if (allFinished()) seek(0);    // a finished animation replays from the top
		for (const a of anims) a.play();
		playing = true;
		startLoop();
	}

	function toggle() { playing ? pause() : play(); }

	function restart() { seek(0); play(); }

	// Reveal the bar (one-way). While collapsed the animation just plays as authored
	// (we never pause it) and the sampling loop is idle; expanding re-reads the live
	// playhead, so the rail snaps to wherever the animation currently is.
	function expand() {
		expanded = true;
		if (playing) startLoop();
	}

	// --- Scrubbing: pointer x on the rail -> a time, dragging detaches from clock.
	function timeAt(clientX: number): number {
		const r = track.getBoundingClientRect();
		return ((clientX - r.left) / r.width) * duration;
	}
	function onPointerDown(e: PointerEvent) {
		dragging = true;
		pause();                       // a scrub pauses: progress now follows the pointer
		seek(timeAt(e.clientX));
		track.setPointerCapture(e.pointerId);
	}
	function onPointerMove(e: PointerEvent) { if (dragging) seek(timeAt(e.clientX)); }
	function onPointerUp(e: PointerEvent) {
		dragging = false;
		track.releasePointerCapture?.(e.pointerId);
	}

	// Keyboard scrubbing for the focused rail: arrows nudge, Home/End jump.
	function onKeydown(e: KeyboardEvent) {
		const step = duration / 20;    // ~5% per arrow press
		if (e.key === 'ArrowLeft')      { pause(); seek(playhead - step); e.preventDefault(); }
		else if (e.key === 'ArrowRight') { pause(); seek(playhead + step); e.preventDefault(); }
		else if (e.key === 'Home')       { pause(); seek(0);               e.preventDefault(); }
		else if (e.key === 'End')        { pause(); seek(duration);        e.preventDefault(); }
		else if (e.key === ' ')          { toggle();                       e.preventDefault(); }
	}

	// (Re)detect this slide's animations and reset to the collapsed button. Runs on
	// mount AND after every client-side navigation, so a single AnimationBar mounted
	// in a persistent deck layout tracks whatever slide is now on screen — appearing
	// on slides that animate, vanishing on those that don't. CSS animations can
	// attach a frame after first paint, so look once more next frame if empty. (No
	// sampling loop here — it starts only when the bar is expanded.)
	function refresh() {
		if (!browser) return;
		// Driven bars are always open (rail-as-read-out); otherwise honour startExpanded.
		expanded = driven || startExpanded;
		stopLoop();
		const begin = () => {
			if (!hasAnim) return;
			if (driven) { pause(); seek(0); }            // external source owns the playhead
			else if (expanded && playing) startLoop();   // already-open: sample the live clock
		};
		collect();
		if (hasAnim) begin();
		else requestAnimationFrame(() => { collect(); begin(); });
	}

	onMount(refresh);
	afterNavigate(refresh);
	onDestroy(stopLoop);
</script>

{#if hasAnim}
<div class="anim-bar no-print" class:expanded bind:this={root}>
	{#if !expanded}
	<!-- Low-profile reveal button (chrome, like MODE / the nav controls). One-way:
	     pressing it shows the bar for good. -->
	<span class="toggle">
		<CtrlBtn chrome={!highlight} text="ANIMATION" on:click={expand} />
	</span>
	{:else}
	{#if !driven}
	<button class="icon-btn" aria-label={playing ? 'Pause' : 'Play'} on:click={toggle}>
		{#if playing}
			<!-- pause -->
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
		{:else}
			<!-- play -->
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
		{/if}
	</button>
	{/if}

	<div
		class="track"
		bind:this={track}
		role="slider"
		tabindex="0"
		aria-label="Animation progress"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={Math.round(fraction * 100)}
		on:pointerdown={onPointerDown}
		on:pointermove={onPointerMove}
		on:pointerup={onPointerUp}
		on:keydown={onKeydown}
	>
		<div class="fill" style="width:{fraction * 100}%"></div>
		<div class="knob" style="left:{fraction * 100}%"></div>
	</div>

	{#if !driven}
	<button class="icon-btn" aria-label="Restart" on:click={restart}>
		<!-- replay -->
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /></svg>
	</button>
	{/if}
	{/if}
</div>
{/if}

<style>
	.anim-bar {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.6em;
		font-size: 1.5em;          /* match the nav-bar chrome scale */
		/* Collapsed state: just the small ANIMATION button, only as wide as itself,
		   dropped onto the nav text row. (The reveal is one-way, so this never has to
		   share a vertical centre with the tall expanded row below.) */
		width: auto;
		bottom: 0.4em;
	}
	.anim-bar.expanded {
		/* Tuned so the tall icon row's vertical CENTRE lines up with the nav text. */
		bottom: 0.35em;
		min-height: 0.8em;
		width: 54%;
		max-width: 810px;
	}
	/* The ANIMATION button is rendered in this bar's enlarged (1.5em) context, so
	   scale it back down to read like the MODE / nav chrome buttons. */
	.toggle {
		flex: none;
		font-size: 0.62em;
	}
	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 2.8em;
		height: 2.8em;
		padding: 0;
		cursor: pointer;
		/* Recede like the nav-bar chrome, but stay legible on the dark canvas; the
		   accent fill on hover matches CtrlBtn's chrome hover. */
		color: var(--ctrl-icon-fg, #9aa7b0);
		background: var(--ctrl-bg, #181818);
		border: 0;
		border-radius: 6px;
	}
	.icon-btn:hover {
		color: var(--on-accent, #FFFFFF);
		background: var(--ctrl-hover-bg, #2980B9);
	}
	.icon-btn:active {
		box-shadow: 0 3px var(--ctrl-active-shadow, #0056B3);
		transform: translateY(2px);
	}
	.icon-btn svg {
		display: block;
		width: 2em;
		height: 2em;
		fill: currentColor;
	}
	.track {
		position: relative;
		flex: 1;
		height: 0.28em;
		border-radius: 999px;
		background: var(--ctrl-track-bg, #333333);
		cursor: pointer;
		touch-action: none;        /* let us own horizontal drag for scrubbing */
	}
	.track:focus-visible {
		outline: 2px solid var(--ctrl-hover-bg, #2980B9);
		outline-offset: 3px;
	}
	.fill {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		border-radius: 999px;
		background: var(--ctrl-strong-bg, #2980B9);
	}
	.knob {
		position: absolute;
		top: 50%;
		width: 0.62em;
		height: 0.62em;
		border-radius: 50%;
		background: var(--on-accent, #FFFFFF);
		border: 2px solid var(--ctrl-strong-bg, #2980B9);
		transform: translate(-50%, -50%);
		pointer-events: none;      /* the rail handles all pointer interaction */
	}
</style>
