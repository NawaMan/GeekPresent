<script>
	import TransitionTo from '../TransitionTo.svelte';
	import SourceView   from '$lib/components/SourceView.svelte';
	import source       from './+page.svelte?raw';
</script>

<TransitionTo
	title="Built-in Push (to)"
	effect="Push left"
	back="this slide goes off to the right and the previous one returns from the left."
>
	A kind names a direction of travel, so its reverse is another kind: <b>right</b> undoes
	<b>left</b>, <b>fall</b> undoes <b>rise</b>. A <code>transitionBack</code> in
	<code>pages.ts</code> still wins when a slide wants something else.
</TransitionTo>

<SourceView {source} />
