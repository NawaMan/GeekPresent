<!--
  Unique #3: Slides are their own documentation (ViewSource)
  File: src/routes/unique/self-documenting.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/unique/self-documenting.html/+page.svelte';
</script>

<ContentPage title="Slides are their own documentation" subtitle="The deck shows you exactly the text that made it">
	<p>
		See the <b>&lt;/&gt; Source</b> button in the bottom-right corner? Click it.
	</p>
	<ul style="margin-top: 0.4em;">
		<li>It pops <b>this slide's own source</b> into a Monaco viewer, titled with its file path.</li>
		<li>
			The source comes from Vite's <code>?raw</code> import &mdash; so what you read
			<b>can never drift</b> from the real file.
		</li>
		<li>One import plus one line per slide turns the whole deck into accurate, live documentation.</li>
	</ul>
	<p style="margin-top: 0.6em; opacity: 0.8;">
		You're reading a slide that documents how a slide documents itself. &#x21bb;
	</p>
</ContentPage>

<ViewSource {source} {path} />
