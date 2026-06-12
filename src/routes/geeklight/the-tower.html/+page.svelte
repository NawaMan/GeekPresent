<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Box         from '$lib/components/Box.svelte';
	import brittle     from './brittle.png';

	let showBox = false;
</script>

<ContentPage title="The tower" subtitle="A house of cards balanced on a chip">
	<div style="font-size: 0.85em;">
		<p>
			This is what an un-isolated setup really looks like: a tower of cards perched on the
			hardware, every layer depending on the one below, the whole thing trembling at the
			slightest nudge. A virtual environment doesn't make the cards stronger — it gives each
			project its <i>own</i> table, so one falling tower never knocks over the rest.
		</p>
		<button
			style="padding: 0.5em 1em; font-size: 1em; cursor: pointer; background: #2980b9; color: white; border: none; border-radius: 4px;"
			on:click={() => showBox = true}>
			See the tower
		</button>
	</div>
</ContentPage>

<Box bind:expanded={showBox} width={480} height={480}>
	<img src={brittle} alt="A tower of playing cards balanced on a computer chip" style="width: 100%; height: 100%; object-fit: contain;" />
</Box>
