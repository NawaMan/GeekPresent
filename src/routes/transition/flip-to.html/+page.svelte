<script>
	import TransitionTo from '../TransitionTo.svelte';
	import SourceView   from '../SourceView.svelte';
	import source       from './+page.svelte?raw';
</script>

<TransitionTo
	title="3D Flip (to)"
	effect="3D flip"
	back="the card turns back the other way, unwinding the flip to the previous slide."
>
	The deck turned like a card: the old face swung away, then this face swung in.
</TransitionTo>

<SourceView {source} />
