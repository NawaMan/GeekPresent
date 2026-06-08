<script>
	import TitlePage from '$lib/templates/TitlePage.svelte';
</script>

<TitlePage>
	<span slot="title">Demo</span>
	<span slot="subtitle">A second, standalone presentation</span>
	<span slot="subsubtitle">Just a demo — proving multiple presentations can coexist<br/>
		<a href="../slides/title.html" style="font-size: 0.55em; opacity: 0.85; color: inherit;">→ go to the main presentation</a></span>
</TitlePage>
