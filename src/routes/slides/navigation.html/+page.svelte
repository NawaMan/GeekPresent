<!--
  Example: Navigation system
  File: src/routes/slides/navigation.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
</script>

<ContentPage title="Navigation" subtitle="How slides are connected">
	<p>Slides are ordered by the presentation's <b>pages.ts</b> (here, <b>src/routes/slides/pages.ts</b>):</p>
	<QuickCode lang="javascript" code={`export const pages = [
  { path: "title.html",    title: "Title" },
  { path: "slide-1.html", title: "First Slide" },
  { path: "ending.html",  title: "The End" },
];`} />
	<p style="margin-top: 0.5em;">Each entry needs a matching folder:<br/>
	<code>src/routes/slides/<b>slide-1.html</b>/+page.svelte</code></p>
	<p>FIRST / PREV / NEXT / LAST buttons and arrow keys are automatic.</p>
</ContentPage>
