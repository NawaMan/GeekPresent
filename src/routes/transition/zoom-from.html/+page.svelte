<script>
	import TransitionFrom from '../TransitionFrom.svelte';
	import SourceView     from '$lib/components/SourceView.svelte';
	import EffectDemo     from '../EffectDemo.svelte';
	import source         from './+page.svelte?raw';

	const css = `@view-transition { navigation: auto; }

::view-transition-old(root) {
  animation: 700ms ease both zoom-out;
}
::view-transition-new(root) {
  animation: 700ms ease both zoom-in;
}

@keyframes zoom-out { to   { transform: scale(1.35); opacity: 0; } }
@keyframes zoom-in  { from { transform: scale(0.65); opacity: 0; } }`;
</script>

<TransitionFrom
	title="Zoom / Scale (from)"
	subtitle="Old slide blooms out; new punches in from small"
	code={css}
	action="zoom to the next page"
	forward="the next slide grows in from small while this one blooms outward past you."
	back="this slide shrinks away to small while the previous one settles in from large."
>
	Forward feels like moving <i>into</i> the content; back pulls you out of it.
</TransitionFrom>

<EffectDemo kind="zoom" />

<SourceView {source} />
