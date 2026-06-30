<!--
  Example: AnimationScene component usage
  File: src/routes/slides/animation-scene.html/+page.svelte

  Where <AnimationBar/> governs whatever animates in the slide, <AnimationScene>
  draws a box around a SET of objects and makes them ONE timeline: the square
  glides (2.5s) while the circle drifts in and grows (3.5s), and the bundled bar
  scrubs BOTH on a single shared playhead. The 3.5s circle sets the envelope, so
  at the midpoint the square has already arrived while the circle is still moving
  — they share wall-clock time, not normalised progress.
-->
<script>
	import ContentPage    from '$lib/templates/ContentPage.svelte';
	import AnimationScene  from '$lib/components/AnimationScene.svelte';
	import ViewSource      from '$lib/components/ViewSource.svelte';
	import source          from './+page.svelte?raw';

	const path = 'src/routes/slides/animation-scene.html/+page.svelte';
</script>

<ContentPage title="AnimationScene Component" subtitle="One playhead, many objects moving together">
	<p>A single <code>@keyframes</code> animates one object. Wrap several in an
		<code>&lt;AnimationScene&gt;</code> and they become a <em>scene</em> &mdash; one
		shared playhead the viewer can pause, scrub and restart as a whole:</p>

	<!-- Two objects, two different @keyframes, one scene. `startPaused` opens the
	     controls and holds on frame 0 so the audience presses Play. -->
	<AnimationScene startPaused>
		<div class="stage">
			<span class="square"></span>
			<span class="circle"></span>
		</div>
	</AnimationScene>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.stage {
		position: relative;
		width: 24em;
		height: 11em;
		margin: 1.2em auto 0;     /* the scene bar occupies the strip below the stage */
	}
	.square, .circle {
		position: absolute;
		left: 0;
		width: 3em;
		height: 3em;
	}
	.square {
		top: 1em;
		border-radius: 8px;
		background: var(--ctrl-strong-bg, #2980B9);
		/* glide left -> right; `both` so a backward scrub shows the empty start. */
		animation: glide 2.5s ease-in-out both;
	}
	.circle {
		top: 5.5em;
		border-radius: 50%;
		background: var(--page-title-fg, #F0A33E);
		/* drift in from the right and grow over the FULL envelope (3.5s). */
		animation: drift 3.5s ease both;
	}

	@keyframes glide {
		from { transform: translateX(0); }
		to   { transform: translateX(21em); }
	}
	@keyframes drift {
		from { transform: translateX(21em) scale(0.4); opacity: 0.25; }
		to   { transform: translateX(0)    scale(1);   opacity: 1; }
	}
</style>
