<script>
	import TransitionTo from '../TransitionTo.svelte';
	import SourceView   from '$lib/components/SourceView.svelte';
	import source       from './+page.svelte?raw';
</script>

<TransitionTo
	title="Circular Reveal (to)"
	effect="Circular reveal"
	back="this slide irises out — a shrinking circle — uncovering the previous slide held beneath."
>
	This slide irised open from the centre, right over the one you were reading.
</TransitionTo>

<SourceView {source} />
