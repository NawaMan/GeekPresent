<!--
  Title slide for the "Page Transitions" presentation.
  File: src/routes/transition/title.html/+page.svelte
-->
<script>
	import TitlePage  from '$lib/templates/TitlePage.svelte';
	import SourceView from '../SourceView.svelte';
	import source     from './+page.svelte?raw';
</script>

<TitlePage>
	<span slot="title">Page Transitions</span>
	<span slot="subtitle">Animating one slide into the next &mdash; with the View Transitions API</span>
	<span slot="subsubtitle">This very deck pages client-side with the API &mdash; press <b>→</b> to feel each slide animate in<br/>
		<a href="../" style="opacity: 0.85;">↑ back to the home page</a></span>
</TitlePage>

<SourceView {source} />
