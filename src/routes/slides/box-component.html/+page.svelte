<!--
  Example: Box component usage
  File: src/routes/slides/box-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Box from '$lib/components/Box.svelte';
	import CtrlBtn from '$lib/components/CtrlBtn.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';

	let showBox = false;
</script>

<ContentPage title="Box Component" subtitle="Expandable overlay with animation">
	<p>Click the button below to see a Box in action:</p>
	<CtrlBtn text="Open Box" on:click={() => (showBox = true)} />
	<QuickCode style="margin-top: 0.5em;" lang="svelte" code={`<Box expanded={showBox} width={750} height={450}>
  <img src="image.png" alt="demo" />
</Box>`} />
</ContentPage>

<Box bind:expanded={showBox} width={750} height={300}>
	<div style="padding: 2em; text-align: center; color: white;">
		This is inside a Box!<br/>
		Press any key or click CLOSE to dismiss.
	</div>
</Box>
