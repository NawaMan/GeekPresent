<!--
  Example: Scroll-driven animation — ScrollDiv scroll position drives a foreground
  object across the viewport while the background pans.
  File: src/routes/animation/scroll-anim.html/+page.svelte

  Two ways to do the SAME "foreground crosses left->right at the ratio of the
  scroll", shown together for contrast:

    * 🚀  JS / Web Animations API — a finite @keyframes animation seeked by
          AnimationBar.seekFraction(progY). ScrollDiv.onScroll feeds the 0..1
          progress to the bar; the bar's rail doubles as a live read-out.

    * ⭐  Pure CSS — no JS, no animation object. ScrollDiv publishes the scroll
          progress as the custom property --prog-y on its (un-panned) viewport,
          so a foreground element just positions itself with calc(var(--prog-y) …).

  Native `animation-timeline: scroll()` is NOT an option here: ScrollDiv pans with
  a transform (so the deck's scaled canvas stays crisp), not real overflow scroll,
  so there is no scroll for a CSS scroll-timeline to bind to — hence these two.
-->
<script>
	import ContentPage  from '$lib/templates/ContentPage.svelte';
	import ScrollDiv     from '$lib/components/ScrollDiv.svelte';
	import AnimationBar   from '$lib/components/AnimationBar.svelte';
	import ViewSource     from '$lib/components/ViewSource.svelte';
	import source         from './+page.svelte?raw';

	const path = 'src/routes/animation/scroll-anim.html/+page.svelte';

	let bar;   // the AnimationBar instance — scroll seeks it by fraction
</script>

<ContentPage title="Scroll-driven Animation" subtitle="ScrollDiv scroll → keyframe seek (JS) and --prog-y (pure CSS)">
	<p>Scroll the panel (wheel, or drag the scrollbar). The <b>background</b> pans;
		both <b>foreground</b> markers cross left&rarr;right in step &mdash; one driven by
		<code>AnimationBar.seekFraction</code>, one by pure CSS off <code>--prog-y</code>:</p>

	<ScrollDiv
		axis="y"
		outerWidth="980"
		outerHeight="380"
		innerHeight="1500"
		scrollbar
		onScroll={(_t, p) => bar?.seekFraction(p.progY)}
		style="border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);"
	>
		<!-- background: a tall stack that pans as you scroll -->
		<div class="bg">
			{#each Array.from({ length: 8 }) as _, i}
				<div class="band" style="background: hsl({i * 28 + 200}, 45%, {22 + i * 3}%);">
					background&nbsp;{i + 1}
				</div>
			{/each}
		</div>

		<!-- foreground: pinned over the viewport, does NOT pan with the background -->
		<div slot="foreground" class="fg">
			<!-- JS path: a @keyframes animation AnimationBar finds & seeks by fraction -->
			<span class="marker js">🚀</span>
			<!-- CSS path: positioned straight off the published scroll progress -->
			<span class="marker css">⭐</span>
		</div>
	</ScrollDiv>

	<!-- driven: an external source (the ScrollDiv above) owns the playhead; the bar
	     detaches from the clock and just reflects where the scroll has seeked to. -->
	<AnimationBar bind:this={bar} driven />
</ContentPage>

<ViewSource {source} {path} />

<style>
	.bg {
		display: flex;
		flex-direction: column;
	}
	.band {
		height: 150px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		color: rgba(255, 255, 255, 0.85);
		letter-spacing: 0.1em;
	}

	/* The slotted foreground fills ScrollDiv's pinned overlay layer. */
	.fg {
		position: relative;
		width: 100%;
		height: 100%;
	}
	.marker {
		position: absolute;
		font-size: 3em;
		line-height: 1;
		/* leave room so the right edge lands the marker fully inside the panel */
	}
	/* JS / WAAPI: a finite animation whose currentTime AnimationBar seeks. `both`
	   so frame 0 sits at the left and the final frame holds at the right. */
	.js {
		top: 0.6em;
		animation: cross 1s linear both;
	}
	@keyframes cross {
		from { left: 0.4em; }
		to   { left: calc(100% - 2.4em); }
	}
	/* Pure CSS: no animation at all — just read the scroll progress var. */
	.css {
		bottom: 0.6em;
		left: calc(0.4em + var(--prog-y, 0) * (100% - 2.8em));
	}
</style>
