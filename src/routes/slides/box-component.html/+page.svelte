<!--
  Example: Box component usage
  File: src/routes/slides/box-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Box from '$lib/components/Box.svelte';

	let showBox = false;
</script>

<ContentPage title="Box Component" subtitle="Expandable overlay with animation">
	<div style="font-size: 0.75em;">
		<p>Click the button below to see a Box in action:</p>
		<button
			style="padding: 0.5em 1em; font-size: 1em; cursor: pointer; background: #2980b9; color: white; border: none; border-radius: 4px;"
			on:click={() => showBox = true}>
			Open Box
		</button>
		<div style="font-family: 'Fira Code', monospace; font-size: 0.85em; background: #111; padding: 0.5em 1em; border-radius: 5px; line-height: 1.8em; margin-top: 0.5em;">
			&lt;Box expanded=&#123;showBox&#125; width=&#123;750&#125; height=&#123;450&#125;&gt;<br/>
			&nbsp;&nbsp;&lt;img src="image.png" alt="demo" /&gt;<br/>
			&lt;/Box&gt;
		</div>
	</div>
</ContentPage>

<Box bind:expanded={showBox} width={750} height={300}>
	<div style="padding: 2em; text-align: center; color: white; font-size: 1.5em;">
		This is inside a Box!<br/>
		Press any key or click CLOSE to dismiss.
	</div>
</Box>
