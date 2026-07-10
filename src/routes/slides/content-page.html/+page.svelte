<!--
  Example: How to use ContentPage template
  File: src/routes/slides/content-page.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import CodeBox     from '$lib/components/CodeBox.svelte';
	import CtrlBtn     from '$lib/components/CtrlBtn.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import source      from './+page.svelte?raw';

	let showCode = false;

	const path = 'src/routes/slides/content-page.html/+page.svelte';
</script>

<ContentPage title="Using ContentPage" subtitle="The template for most of your slides">
	<p>ContentPage takes <b>title</b> and <b>subtitle</b> props, with a default slot for content:</p>
	<QuickCode lang="svelte" code={`<ContentPage title="My Title" subtitle="Optional">
  <p>Any HTML or Svelte components here.</p>
  <ul><li>Bullet points</li></ul>
</ContentPage>`} />
	<p>The content area is styled with justified text, straight from the template default &mdash; no per-slide font tuning.</p>
	<p>Both header lines are optional, and so is the rule under them &mdash; see the next slide.</p>
	<p>
		Prefer to read it in the editor? <CtrlBtn text="Show code" on:click={() => (showCode = true)} />
	</p>
</ContentPage>

<CodeBox code={source} language="html" title={path} bind:expanded={showCode} />
