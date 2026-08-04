<script>
	import TitlePage from '$lib/templates/TitlePage.svelte';
</script>

<TitlePage>
	<svelte:fragment slot="title">Next steps</svelte:fragment>
	<svelte:fragment slot="subtitle">Pick a group · open a demo · print a handout</svelte:fragment>
	<svelte:fragment slot="subsubtitle">
		Handouts: /_handout/references.html · /_handout/references-slide-pages.html · …
	</svelte:fragment>
</TitlePage>
