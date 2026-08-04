<!--
  Closing slide: Thanks / try it out
  File: src/routes/unique/thank-you.html/+page.svelte
-->
<script>
	import TitlePage from '$lib/templates/TitlePage.svelte';
	import Link from '$lib/components/Link.svelte';
</script>

<TitlePage>
	<span slot="title">Thanks &mdash; now try it</span>
	<span slot="subtitle">Clone it, run <code>pnpm dev</code>, and make a slide your way</span>
	<span slot="subsubtitle">Built and run on <b>CodingBooth</b> &mdash; spin up your own and start building<br/>
		<Link href="https://codingbooth.io/" style="opacity: 0.85;">codingbooth.io</Link>
		&nbsp;&middot;&nbsp;
		<Link href="../" style="opacity: 0.85;">↑ back to the home page</Link></span>
</TitlePage>
