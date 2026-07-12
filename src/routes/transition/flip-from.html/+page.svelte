<script>
	import TransitionFrom from '../TransitionFrom.svelte';
	import SourceView     from '$lib/components/SourceView.svelte';
	import EffectDemo     from '../EffectDemo.svelte';
	import source         from './+page.svelte?raw';

	const css = `@view-transition { navigation: auto; }

/* Staged so the faces never overlap: the old
   face swings out first, then the new swings
   in (delayed, held edge-on until its turn). */
::view-transition-old(root) {
  animation: 600ms ease both flip-out;
}
::view-transition-new(root) {
  animation: 600ms ease both flip-in;
  animation-delay: 600ms;
}

@keyframes flip-out {
  to { transform: perspective(1800px) rotateY(-90deg); }
}
@keyframes flip-in {
  from { transform: perspective(1800px) rotateY(90deg); }
}`;
</script>

<TransitionFrom
	title="3D Flip (from)"
	subtitle="The deck turns like a card — one face out, then the next in"
	code={css}
	action="flip to the next page"
	forward="the deck turns like a card — this face swings away, then the next swings in."
	back="it turns back the other way, unwinding the flip."
>
	Two beats, so you never see both faces at once.
</TransitionFrom>

<EffectDemo kind="flip" />

<SourceView {source} />
