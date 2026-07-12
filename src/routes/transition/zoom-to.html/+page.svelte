<script>
	import TransitionTo from '../TransitionTo.svelte';
	import SourceView   from '$lib/components/SourceView.svelte';
	import source       from './+page.svelte?raw';
</script>

<TransitionTo
	title="Zoom / Scale (to)"
	effect="Zoom"
	back="this slide shrinks away to small while the previous one settles back in from large — a zoom OUT."
>
	The last slide bloomed outward and this one punched in from the centre.
</TransitionTo>

<SourceView {source} />
