<!--
  Unique #1: One slide = one route = one folder
  File: src/routes/unique/route-per-slide.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
</script>

<ContentPage title="One slide = one route = one folder" subtitle="Not sections of a giant doc, not fenced blocks in one markdown file">
	<p>
		Each slide is its own SvelteKit route folder &mdash; <b>this very slide</b> is:
	</p>
	<QuickCode>
		src/routes/unique/<b>route-per-slide.html/</b><br/>
		&nbsp;&nbsp;+page.svelte&nbsp;&nbsp;<span style="opacity:0.6;"># the slide content</span><br/>
		&nbsp;&nbsp;+layout.js&nbsp;&nbsp;&nbsp;&nbsp;<span style="opacity:0.6;"># prerender = true</span><br/>
		&nbsp;&nbsp;diagram.png&nbsp;&nbsp;&nbsp;<span style="opacity:0.6;"># assets live RIGHT HERE, colocated</span>
	</QuickCode>
	<p style="margin-top: 0.6em;">
		That folder <b>is</b> the URL: <code>src/routes/unique/route-per-slide.html/</code>
		is served at <code>/unique/route-per-slide.html</code> &mdash; the very page
		you're reading now.
	</p>
	<ul style="margin-top: 0.6em;">
		<li>Slides <b>diff cleanly</b> &mdash; a change touches one file.</li>
		<li>Each slide <b>colocates its own assets</b> and <code>import</code>s them.</li>
		<li>Every slide is <b>URL-addressable</b> and prerenders to its own HTML.</li>
	</ul>
</ContentPage>
