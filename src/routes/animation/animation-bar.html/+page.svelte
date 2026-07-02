<!--
  Example: AnimationBar component usage
  File: src/routes/animation/animation-bar.html/+page.svelte

  The bars and the dot run finite @keyframes animations with staggered delays (a
  ~3.5s envelope). Dropping <AnimationBar/> in the slide is what turns those into
  something the viewer can pause, scrub and restart — page-to-page transitions are
  untouched.
-->
<script>
	import ContentPage  from '$lib/templates/ContentPage.svelte';
	import AnimationBar  from '$lib/components/AnimationBar.svelte';
	import ViewSource    from '$lib/components/ViewSource.svelte';
	import source        from './+page.svelte?raw';

	const path = 'src/routes/animation/animation-bar.html/+page.svelte';
</script>

<ContentPage title="AnimationBar Component" subtitle="Pause, scrub & restart in-slide animations">
	<p>Drop it in a slide that has finite <code>@keyframes</code> animations &mdash; it
		finds them and reveals the controls to pause, scrub and restart:</p>

	<div class="demo">
		<div class="bars">
			<span class="bar"></span>
			<span class="bar"></span>
			<span class="bar"></span>
			<span class="bar"></span>
			<span class="bar"></span>
		</div>
		<div class="rail"><span class="dot"></span></div>
	</div>

	<!-- Presence of this bar = "this slide has a finite keyframe animation". -->
	<AnimationBar />
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
		align-items: center;
		margin: 1em 0;
	}
	.bars {
		display: flex;
		gap: 0.6em;
		align-items: flex-end;
		height: 4.5em;
	}
	.bar {
		width: 2em;
		height: 100%;
		border-radius: 6px;
		background: var(--ctrl-strong-bg, #2980B9);
		/* Grow from nothing; `both` so a backward scrub shows the empty start. */
		transform: scaleY(0);
		transform-origin: bottom;
		animation: grow 1.2s ease both;
	}
	.bar:nth-child(1) { animation-delay: 0.2s; }
	.bar:nth-child(2) { animation-delay: 0.6s; }
	.bar:nth-child(3) { animation-delay: 1.0s; }
	.bar:nth-child(4) { animation-delay: 1.4s; }
	.bar:nth-child(5) { animation-delay: 1.8s; }

	.rail {
		position: relative;
		width: 22em;
		height: 0.5em;
		border-radius: 999px;
		background: var(--ctrl-track-bg, #333333);
	}
	.dot {
		position: absolute;
		top: 50%;
		width: 1.3em;
		height: 1.3em;
		border-radius: 50%;
		background: var(--page-title-fg, #F0A33E);
		/* The longest animation (3.5s) sets the whole slide's envelope. */
		animation: travel 3.5s ease-in-out both;
	}

	@keyframes grow {
		to { transform: scaleY(1); }
	}
	@keyframes travel {
		from { left: 0;    transform: translate(-50%, -50%); }
		to   { left: 100%; transform: translate(-50%, -50%); }
	}
</style>
