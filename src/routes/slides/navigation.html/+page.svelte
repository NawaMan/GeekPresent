<!--
  Example: Navigation system
  File: src/routes/slides/navigation.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="Navigation" subtitle="How slides are connected">
	<div style="font-size: 0.8em;">
		<p>Slides are ordered by the presentation's <b>pages.ts</b> (here, <b>src/routes/slides/pages.ts</b>):</p>
		<div style="font-family: 'Fira Code', monospace; font-size: 0.85em; background: #111; padding: 0.5em 1em; border-radius: 5px; line-height: 1.8em;">
			export const pages = [<br/>
			&nbsp;&nbsp;&#123; path: "title.html", &nbsp;&nbsp;&nbsp;title: "Title" &#125;,<br/>
			&nbsp;&nbsp;&#123; path: "slide-1.html", title: "First Slide" &#125;,<br/>
			&nbsp;&nbsp;&#123; path: "ending.html", &nbsp;title: "The End" &#125;,<br/>
			];
		</div>
		<p style="margin-top: 0.5em;">Each entry needs a matching folder:<br/>
		<code style="font-size: 0.9em;">src/routes/slides/<b>slide-1.html</b>/+page.svelte</code></p>
		<p>FIRST / PREV / NEXT / LAST buttons and arrow keys are automatic.</p>
	</div>
</ContentPage>
