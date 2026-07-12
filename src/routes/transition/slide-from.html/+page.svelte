<script>
	import TransitionFrom from '../TransitionFrom.svelte';
	import SourceView     from '$lib/components/SourceView.svelte';
	import EffectDemo     from '../EffectDemo.svelte';
	import source         from './+page.svelte?raw';

	const css = `@view-transition { navigation: auto; }

::view-transition-old(root) {
  animation: 700ms ease both slide-out-left;
}
::view-transition-new(root) {
  animation: 700ms ease both slide-in-right;
}

@keyframes slide-out-left {
  to { transform: translateX(-100%); }
}
@keyframes slide-in-right {
  from { transform: translateX(100%); }
}`;
</script>

<TransitionFrom
	title="Directional Slide (from)"
	subtitle="Old slide exits left, new enters from the right"
	code={css}
	action="slide to the next page"
	forward="this slide exits to the left while the next enters from the right."
	back="the next slide exits right while this one slides back in from the left."
>
	The deck pages like a filmstrip — and the direction follows the key you press.
</TransitionFrom>

<EffectDemo kind="slide" />

<SourceView {source} />
