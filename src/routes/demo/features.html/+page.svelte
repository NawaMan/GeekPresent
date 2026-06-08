<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Box         from '$lib/components/Box.svelte';

	let show = false;
</script>

<ContentPage title="Components work here too" subtitle="The same building blocks, a different presentation">
	<div style="font-size: 0.9em;">
		<p>Every component from the main presentation is available here — for example, a <b>Box</b>:</p>
		<button
			style="padding: 0.5em 1em; font-size: 1em; cursor: pointer; background: #2980b9; color: white; border: none; border-radius: 4px;"
			on:click={() => show = true}>
			Open a Box
		</button>
	</div>
</ContentPage>

<Box bind:expanded={show} width={520} height={200}>
	<div style="padding: 2em; text-align: center; color: white; font-size: 1.4em;">
		This Box lives in the <b>demo</b> presentation.<br/>
		Click CLOSE, click outside, or press Escape.
	</div>
</Box>
