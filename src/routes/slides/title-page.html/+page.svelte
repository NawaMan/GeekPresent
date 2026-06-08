<!--
  Example: How to use TitlePage template
  File: src/routes/slides/title-page.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="Using TitlePage" subtitle="The template for title and section divider slides">
	<div style="font-size: 0.8em;">
		<p>TitlePage has three named slots:</p>
		<div style="font-family: 'Fira Code', monospace; font-size: 0.85em; background: #111; padding: 0.5em 1em; border-radius: 5px; line-height: 1.8em;">
			&lt;TitlePage&gt;<br/>
			&nbsp;&nbsp;&lt;span slot="<b>title</b>"&gt;Big Title&lt;/span&gt;<br/>
			&nbsp;&nbsp;&lt;span slot="<b>subtitle</b>"&gt;Subtitle&lt;/span&gt;<br/>
			&nbsp;&nbsp;&lt;span slot="<b>subsubtitle</b>"&gt;Your Name&lt;/span&gt;<br/>
			&lt;/TitlePage&gt;
		</div>
		<p>Navigation is handled automatically based on <b>pages.ts</b>.</p>
	</div>
</ContentPage>
