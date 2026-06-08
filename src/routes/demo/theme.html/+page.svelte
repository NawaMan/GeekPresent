<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="Its own theme" subtitle="Per-presentation look &amp; feel">
	<div style="font-size: 0.9em;">
		<p>This presentation is themed entirely in its own <b>+layout.svelte</b> — the main <b>slides/</b> presentation
			is untouched:</p>
		<ul>
			<li><b>Font</b> — a custom web font (<i>Merriweather</i>), loaded in <code>&lt;svelte:head&gt;</code>.</li>
			<li><b>Default text colour</b> — warm cream instead of the main presentation's cool cyan.</li>
			<li><b>Background image</b> — a colocated <code>bg.png</code>, referenced from the layout's CSS.</li>
			<li><b>Favicon</b> — its own <code>favicon.png</code> (look at the browser tab 🙂).</li>
		</ul>
		<p style="opacity: 0.85;">Everything here is colocated in <b>src/routes/demo/</b>.</p>
	</div>
</ContentPage>
