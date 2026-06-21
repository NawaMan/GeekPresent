<script>
	import TransitionTo from '../TransitionTo.svelte';
	import SourceView   from '../SourceView.svelte';
	import source       from './+page.svelte?raw';
</script>

<TransitionTo
	title="Directional Slide (to)"
	effect="Directional slide"
	back="this slide exits to the right while the previous one slides back in from the left."
>
	The previous slide swept off to the left and this one slid in from the right.
</TransitionTo>

<SourceView {source} />
