<!--
  Example: How to use ContentPage template
  File: src/routes/slides/content-page.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="Using ContentPage" subtitle="The template for most of your slides">
	<div style="font-size: 0.8em;">
		<p>ContentPage takes <b>title</b> and <b>subtitle</b> props, with a default slot for content:</p>
		<div style="font-family: 'Fira Code', monospace; font-size: 0.85em; background: #111; padding: 0.5em 1em; border-radius: 5px; line-height: 1.8em;">
			&lt;ContentPage title="My Title" subtitle="Optional"&gt;<br/>
			&nbsp;&nbsp;&lt;p&gt;Any HTML or Svelte components here.&lt;/p&gt;<br/>
			&nbsp;&nbsp;&lt;ul&gt;&lt;li&gt;Bullet points&lt;/li&gt;&lt;/ul&gt;<br/>
			&lt;/ContentPage&gt;
		</div>
		<p>The content area is styled with justified text at 1.5em font size.</p>
	</div>
</ContentPage>
