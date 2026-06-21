<script>
	import TransitionTo from '../TransitionTo.svelte';
	import SourceView   from '../SourceView.svelte';
	import source       from './+page.svelte?raw';
</script>

<TransitionTo
	title="Cross-Fade (to)"
	effect="Cross-fade"
	back="this slide dissolves back out while the previous one dissolves in."
>
	The whole frame dissolved from the previous slide into this one.
</TransitionTo>

<SourceView {source} />
