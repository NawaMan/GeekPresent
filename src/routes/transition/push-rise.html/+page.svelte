<script>
	import TransitionFrom from '../TransitionFrom.svelte';
	import SourceView     from '$lib/components/SourceView.svelte';
	import source         from './+page.svelte?raw';

	// Nothing to write in the deck's stylesheet: the four push kinds ship with
	// GeekPresent. This is all a deck needs.
	const code = `// pages.ts
{ path: "one.html",   transition: "rise" },
{ path: "two.html",   transition: "left" },
{ path: "three.html" },

// built in:  rise  fall  left  right`;
</script>

<TransitionFrom
	title="Built-in Push: rise"
	subtitle="Four kinds that need no keyframes of your own"
	{code}
	action="push this slide up"
	forward="this slide is pushed up while the next one comes from below (rise)."
	back="the next slide is pushed back down and this one returns from above (fall)."
>
	A push has no fade: the two slides move as one strip. The other two kinds are on the next slide.
</TransitionFrom>

<SourceView {source} />
