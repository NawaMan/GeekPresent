<script>
	import TransitionFrom from '../TransitionFrom.svelte';
	import SourceView     from '$lib/components/SourceView.svelte';
	import source         from './+page.svelte?raw';

	// No `transitionBack` anywhere: going back undoes the turn that led in.
	const code = `// going back, with no transitionBack:
//
//   led in by   goes back with
//   rise        fall
//   fall        rise
//   left        right
//   right       left
//   any other   the same kind`;
</script>

<TransitionFrom
	title="Built-in Push: left"
	subtitle="Going back undoes the turn that led in"
	{code}
	action="push this slide off to the left"
	forward="this slide goes off to the left while the next one comes from the right (left)."
	back="the next slide goes off to the right and this one returns from the left (right)."
>
	You arrived here by <b>rise</b>, so <kbd>←</kbd> from this slide plays <b>fall</b>. Neither slide says so.
</TransitionFrom>

<SourceView {source} />
