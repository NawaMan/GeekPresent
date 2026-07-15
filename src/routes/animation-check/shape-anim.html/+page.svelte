<!--
  Step 2b — animate the Shape.
  File: src/routes/animation-check/shape-anim.html/+page.svelte

  A shape animates by keyframing its OWN geometry: the Curve's endpoint carries
  `stops`, sweeping from B0 up to B100 while its control point whips the bend
  over. Pure CSS @keyframes — one AnimationBar scrubs it, the Draw toolbar's
  keyframes panel edits it. (Same stops/animate shape as the Sprite's.)
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Curve } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation-check/shape-anim.html/+page.svelte';
</script>

<ContentPage title="Shape — animated" subtitle="Its geometry keyframes between stops — one bar, one editor.">
	<p class="hint">
		A shape animates by keyframing its <i>own geometry</i>. This <Label>Curve</Label>'s
		endpoint carries <Label>stops</Label> &mdash; it sweeps from <b>B₀</b> up to
		<b>B₁₀₀</b> while the bend whips over. Same <code>stops</code> / <code>animate</code>
		shape the Sprite uses. Press <b>ANIMATE</b> to scrub; in <b>ADJUST</b> each stop has
		a handle and the toolbar's keyframes panel retimes them.
	</p>
</ContentPage>

<Draw
	title="A beam sweeping between two targets"
	name="shape-anim"
	description="A curved beam pinned at one end whose other endpoint animates from a low target up to a high one while its control point whips the bend over, scrubbed by one AnimationBar."
>
	<Curve
		name="beam"
		from={[300, 820]}
		to={[1450, 900]}
		c1={[880, 760]}
		stops={[
			{ pct: 0,   to: [1450, 900], c1: [880, 760] },
			{ pct: 100, to: [1450, 420], c1: [991, 749] }
		]}
		animate={4}
		thickness={6}
		color="#f39c12"
	/>
</Draw>

<AnimationBar highlight />

<ViewSource {source} {path} />

<style>
	.hint {
		line-height: 1.4em;
	}
</style>
