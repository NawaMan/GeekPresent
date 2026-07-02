<!--
  Example: Reading a timeline as keyframe percentages — "appear at 1s, move for 4s".
  File: src/routes/animation/timed-animation.html/+page.svelte

  CSS @keyframes have no seconds — only percentages. So you author timing by
  converting each MOMENT to a percentage of the TOTAL duration:

        percent = moment_seconds / total_seconds × 100

  Here the whole animation is 5s, so:

        0.0s →   0%        2.9s →  58%
        1.0s →  20%   ←    4.0s →  80%
        1.4s →  28%        5.0s → 100%

  Plan: keep the option HIDDEN and parked for the first second (0%–20%), POP it in
  just after 1s (20%→28%), then let it WANDER through a few spots until 5s (→100%).
  "Appear at 1s" is literally "flip opacity at 20%"; "move for the next 4s" is
  "spread the position keyframes from 20% to 100%". Scrub the bar to watch the clock.

  (The positions below were found with the LAYOUT → Keyframe helper slide; the time
  lives in the `animation:` shorthand, not in the @keyframes — that split is why the
  helper only ever copies positions.)
-->
<script>
	import ContentPage  from '$lib/templates/ContentPage.svelte';
	import AnimationBar  from '$lib/components/AnimationBar.svelte';
	import ViewSource    from '$lib/components/ViewSource.svelte';
	import source        from './+page.svelte?raw';

	const path = 'src/routes/animation/timed-animation.html/+page.svelte';

	// --- How you'd AUTHOR this slide's position stops with the live helper ----------
	// SpriteStudio drives positions only (left/top/width/height); the opacity + scale
	// pop-in stays a SEPARATE @keyframes track on the same element (the appear-move rule
	// below). The stops here are this slide's position MOMENTS — drag them live, then
	// Copy the @keyframes and fold them into appear-move. Uncomment to try (caveats in
	// the markup block lower down):
	//
	// import SpriteStudio from '$lib/components/SpriteStudio.svelte';
	// const stops = [
	//   { pct: 20,  x: 240,  y: 600, w: 360, h: 92 },  // 1.0s — parked start spot
	//   { pct: 58,  x: 1040, y: 320, w: 360, h: 92 },  // 2.9s
	//   { pct: 80,  x: 1500, y: 660, w: 360, h: 92 },  // 4.0s
	//   { pct: 100, x: 700,  y: 820, w: 360, h: 92 },  // 5.0s
	// ];
</script>

<ContentPage title="Timing → Percent" subtitle="The option appears at 1s, then moves for 4s (5s total)">
	<div style="line-height: 1.55em;">
		<p>
			CSS keyframes are <b>percentages</b>, not seconds. Pick a total time, then
			convert each moment: <code>percent = seconds ÷ total × 100</code>.
		</p>
		<ul style="margin: 0.3em 0 0; padding-left: 1.2em; opacity: 0.9;">
			<li>Total <code>5s</code> &mdash; set once on the <code>animation:</code> line.</li>
			<li>Appear at <code>1s</code> → flip opacity at <code>20%</code> (<code>1 ÷ 5</code>).</li>
			<li>Move for the next <code>4s</code> → spread position from <code>20%</code> to <code>100%</code>.</li>
		</ul>
		<p style="margin-top: 0.5em; opacity: 0.8;">
			Scrub the <b>ANIMATION</b> bar: nothing until ~1s, a pop-in, then it wanders.
		</p>
	</div>
</ContentPage>

<!-- The "option": a top-level absolute sibling (canvas pixels), so its keyframe
     left/top read straight from the LAYOUT helper. Time is on the shorthand. -->
<div class="option">🎬&nbsp; New Option</div>

<!--
  SKETCH — authoring the positions above with SpriteStudio (commented out; this
  slide ships the hand-tuned @keyframes below). To preview it: uncomment the import +
  `stops` in the script, then this block, and temporarily remove the static .option
  div + the standalone <AnimationBar/> (the studio renders its own bar, and it sets
  width/height — so style .option WITHOUT fixed sizing if you let the studio drive it):

  <SpriteStudio name="appear-move" initialStops={stops} duration={5}>
      🎬&nbsp; New Option
  </SpriteStudio>

  You'd still keep the opacity + scale pop-in as a separate @keyframes track on the
  same element — the studio only carries positions, by design.
-->

<!-- Lets the viewer pause / scrub / restart this finite @keyframes animation. -->
<AnimationBar />

<ViewSource {source} {path} />

<style>
	.option {
		position: absolute;
		/* Base = first frame (pre-JS / before the animation paints). */
		left: 240px;
		top: 600px;
		display: inline-flex;
		align-items: center;
		padding: 0.5em 1.1em;
		font-size: 2.4em;
		font-weight: bold;
		white-space: nowrap;
		color: var(--on-accent, #ffffff);
		background: var(--ctrl-strong-bg, #2980b9);
		border-radius: 12px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);

		/* ONE place sets the time + easing + fill. 5s total; `both` holds the hidden
		   first second at the start and the final pose at the end. */
		animation: appear-move 5s ease-in-out both;
	}

	/* Each stop is annotated with the second it lands on, so you can see the
	   seconds ⇄ percent mapping right in the source. */
	@keyframes appear-move {
		/* --- hidden & parked for the first second (0s–1s) --- */
		0%   { opacity: 0; left: 240px;  top: 600px; transform: translateY(14px) scale(0.6); }   /* 0.0s */
		20%  { opacity: 0; left: 240px;  top: 600px; transform: translateY(14px) scale(0.6); }   /* 1.0s — about to appear */

		/* --- pop in just after 1s (still parked at the start spot) --- */
		28%  { opacity: 1; left: 240px;  top: 600px; transform: translateY(0)    scale(1.12); }   /* 1.4s */
		34%  { opacity: 1; left: 240px;  top: 600px; transform: translateY(0)    scale(1);    }   /* 1.7s */

		/* --- wander for the rest (1.7s → 5s); these frames only move position --- */
		58%  { left: 1040px; top: 320px; }   /* 2.9s */
		80%  { left: 1500px; top: 660px; }   /* 4.0s */
		100% { left: 700px;  top: 820px; }   /* 5.0s */
	}
</style>
