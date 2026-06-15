<!--
  Closing slide: Thanks / try it out
  File: src/routes/unique/thank-you.html/+page.svelte
-->
<script>
	import TitlePage from '$lib/templates/TitlePage.svelte';
</script>

<TitlePage>
	<span slot="title">Thanks &mdash; now try it</span>
	<span slot="subtitle">Clone it, run <code>pnpm dev</code>, and make a slide your way</span>
	<span slot="subsubtitle">Built and run on <b>CodingBooth</b> &mdash; spin up your own and start building<br/>
		<a href="https://codingbooth.io/" target="_blank" rel="noopener" style="opacity: 0.85;">→ codingbooth.io</a>
		&nbsp;&middot;&nbsp;
		<a href="../" style="opacity: 0.85;">↑ back to the home page</a></span>
</TitlePage>
