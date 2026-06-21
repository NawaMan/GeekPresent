<!--
  Closing slide: now go try it — mirrors the title slide's "back to home" link.
  File: src/routes/transition/thank-you.html/+page.svelte
-->
<script>
	import TitlePage from '$lib/templates/TitlePage.svelte';
</script>

<TitlePage>
	<span slot="title">Now go animate your deck</span>
	<span slot="subtitle">It's one <code>goto</code> wrapped in <code>startViewTransition</code> &mdash; the CSS does the rest</span>
	<span slot="subsubtitle">Open <b>&lt;/&gt; Source</b> on any slide to steal the keyframes &mdash; built on <b>CodingBooth</b><br/>
		<a href="https://codingbooth.io/" target="_blank" rel="noopener" style="opacity: 0.85;">→ codingbooth.io</a>
		&nbsp;&middot;&nbsp;
		<a href="../" style="opacity: 0.85;">↑ back to the home page</a></span>
</TitlePage>
