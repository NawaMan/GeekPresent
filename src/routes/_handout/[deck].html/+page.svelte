<!-- Framework route — the code lives in $lib/framework (shipped in @geekpresent/core).
     This stub only puts it at its URL; a project using the package has the same file. -->
<script lang="ts">
	import HandoutPage from '$lib/framework/HandoutPage.svelte';

	export let data: { deck: string };
</script>

<HandoutPage {data} />
