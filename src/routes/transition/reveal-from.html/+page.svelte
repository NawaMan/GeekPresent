<script>
	import TransitionFrom from '../TransitionFrom.svelte';
	import SourceView     from '../SourceView.svelte';
	import EffectDemo     from '../EffectDemo.svelte';
	import source         from './+page.svelte?raw';

	const css = `@view-transition { navigation: auto; }

/* New slide irises in over the old through an
   expanding circle; the old just holds beneath. */
::view-transition-new(root) {
  animation: 900ms ease both circle-reveal;
}
::view-transition-old(root) {
  animation: 900ms ease both hold;
}

@keyframes circle-reveal {
  from { clip-path: circle(0%   at 50% 50%); }
  to   { clip-path: circle(150% at 50% 50%); }
}
@keyframes hold { from { opacity: 1; } to { opacity: 1; } }`;
</script>

<TransitionFrom
	title="Circular Reveal (from)"
	subtitle="The next slide irises open from the centre, over this one"
	code={css}
	action="iris-reveal the next page"
	forward="the next slide irises in over this one through an expanding circle."
	back="this slide irises out — a shrinking circle — uncovering the one beneath."
>
	On the way back the circle runs the other way, so the leaving slide closes over.
</TransitionFrom>

<EffectDemo kind="reveal" />

<SourceView {source} />
