<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="This is just a demo" subtitle="A separate presentation living at /demo">
	<ul>
		<li>This presentation lives at <b>src/routes/demo/</b>, right alongside the main <b>slides/</b> presentation.</li>
		<li>It has its <b>own</b> <code>pages.ts</code>, so its navigation and Table of Contents are
			completely independent from the other presentation.</li>
		<li>Nothing special — it's just another route folder using the same templates and components.</li>
	</ul>
</ContentPage>
